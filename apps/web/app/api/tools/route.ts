import { ensureSchema } from '@/db';
import { getOptionalPilotUser } from '@/app/lib/auth';
import { ensureToolsSeeded } from '@/app/lib/tool-catalog';

function json(data:unknown,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}

export async function GET(request:Request){
  try{
    const user=await getOptionalPilotUser(request);const db=await ensureSchema();await ensureToolsSeeded(db);
    const rows=await db.prepare(`SELECT t.id,t.name,t.category,t.platform,t.ownership,t.maintainer,t.source,t.repository_status AS repositoryStatus,t.license,t.huhy_role AS huhyRole,t.lifecycle,t.maintenance,t.website,t.github,t.note,t.evidence_as_of AS evidenceAsOf,ROUND(AVG(r.stars),1) AS ratingAverage,COUNT(r.stars) AS ratingCount,MAX(CASE WHEN r.user_id=? THEN r.stars END) AS userRating FROM tools t LEFT JOIN tool_ratings r ON r.tool_id=t.id GROUP BY t.id ORDER BY t.name`).bind(user?.userId??'anonymous').all();
    return json({tools:rows.results,signedIn:Boolean(user)});
  }catch(error){if(error instanceof Response)return error;return json({error:'Unable to load the tool directory.'},500)}
}
