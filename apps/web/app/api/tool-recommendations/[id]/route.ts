import { ensureSchema } from '@/db';
import { isTriageRole, requirePilotUser } from '@/app/lib/auth';
import { requireSameOrigin } from '@/app/lib/http';

const statuses=new Set(['Pending review','Duplicate','Referred to owner','Not listed','Listed']);
function json(data:unknown,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}
function text(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const originError=requireSameOrigin(request);if(originError)return originError;
    const user=await requirePilotUser(request);if(!isTriageRole(user.role))return json({error:'Steward or triager access is required.'},403);
    const {id}=await params;const body=await request.json() as Record<string,unknown>;const status=text(body.status,40),decisionNote=text(body.decisionNote,500);
    if(!statuses.has(status))return json({error:'Choose a valid recommendation disposition.'},422);
    if(status!=='Pending review'&&decisionNote.length<5)return json({error:'Add a short reason for the disposition.'},422);
    const db=await ensureSchema();const record=await db.prepare(`SELECT id,name,website,repository,category,relationship,use_case AS useCase,maintainer,license,status,listed_tool_id AS listedToolId FROM tool_recommendations WHERE id=?`).bind(id).first<{id:string;name:string;website:string;repository:string|null;category:string;relationship:string;useCase:string;maintainer:string|null;license:string|null;status:string;listedToolId:string|null}>();
    if(!record)return json({error:'Recommendation not found.'},404);
    if(record.status==='Listed')return json({error:'This recommendation is already listed. Directory removal requires a separate review.'},409);
    let listedToolId:string|null=null;
    const statements=[];
    if(status==='Listed'){
      listedToolId=`EXT-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      const ownership=record.relationship==='I maintain this tool'?'External submitter-maintained project':record.relationship==='I contribute to this tool'?'External contributor-recommended project':'External community-recommended project';
      statements.push(db.prepare(`INSERT INTO tools (id,name,category,platform,ownership,maintainer,source,repository_status,license,huhy_role,lifecycle,maintenance,website,github,note,evidence_as_of) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(listedToolId,record.name,record.category,'Web or linked platform',ownership,record.maintainer||'Not identified','Public project materials supplied in recommendation',record.repository?'Public repository supplied; not independently verified':'No public repository identified',record.license||'Not identified','Discovery listing only','Newly listed','Status needs verification',record.website,record.repository,record.useCase,new Date().toISOString().slice(0,10)));
    }
    statements.push(db.prepare(`UPDATE tool_recommendations SET status=?,reviewer_user_id=?,decision_note=?,listed_tool_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,user.userId,decisionNote||null,listedToolId,id));
    statements.push(db.prepare(`INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,detail) VALUES (?,'tool_recommendation.disposition','tool_recommendation',?,?)`).bind(user.userId,id,`Status set to ${status}; recommendation body omitted`));
    await db.batch(statements);
    return json({id,status,listedToolId,message:status==='Listed'?'The external tool is now listed with provisional ownership and verification labels.':`Recommendation marked ${status}.`});
  }catch(error){if(error instanceof Response)return error;return json({error:'Unable to update the recommendation.'},500)}
}
