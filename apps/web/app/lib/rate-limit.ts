import { env } from 'cloudflare:workers';

const encoder=new TextEncoder();

async function digest(value:string):Promise<string>{
  const bytes=await crypto.subtle.digest('SHA-256',encoder.encode(value));
  return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
}

export async function enforceWriteRateLimit(db:D1Database,request:Request,userId:string|null,action:string,limit:number):Promise<Response|null>{
  const url=new URL(request.url);const clientIp=request.headers.get('cf-connecting-ip')?.trim();const local=url.hostname==='localhost';
  const salt=env.ABUSE_HASH_SALT?.trim()||(local?'local-development-only':null);
  if(!userId&&(!clientIp||!salt))return Response.json({error:'Public intake protection is temporarily unavailable. Try again later.'},{status:503});
  const bucket=userId?`user:${userId}`:`network:${await digest(`${salt}:${clientIp}`)}`;
  const windowStart=Math.floor(Date.now()/3_600_000);const oldestWindow=windowStart-24;
  await db.batch([
    db.prepare(`DELETE FROM write_rate_limits WHERE window_start < ?`).bind(oldestWindow),
    db.prepare(`INSERT INTO write_rate_limits (bucket,action,window_start,count) VALUES (?,?,?,1) ON CONFLICT(bucket,action,window_start) DO UPDATE SET count=count+1,updated_at=CURRENT_TIMESTAMP`).bind(bucket,action,windowStart),
  ]);
  const record=await db.prepare(`SELECT count FROM write_rate_limits WHERE bucket=? AND action=? AND window_start=?`).bind(bucket,action,windowStart).first<{count:number}>();
  if(Number(record?.count||0)>limit)return Response.json({error:'Submission limit reached. Try again after the current hourly window.'},{status:429,headers:{'retry-after':'3600'}});
  return null;
}
