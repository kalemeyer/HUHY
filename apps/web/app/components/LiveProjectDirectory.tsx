'use client';

import { useEffect, useMemo, useState } from 'react';
import { RiskPill } from './RiskPill';

type Project = {
  id:string; problem:string; better:string; status:string; sourceStatus:string; risk:string;
  maintainer:string; contributorNeeds:string; maintenanceStatus:string; reviewCadence:string;
  githubUrl:string|null; actionLabel?:string;
};

const huhyWebsiteProject: Project = {
  id:'huhy-website',
  problem:'HUHY website and community platform',
  better:'Improve the public front door, GitHub workflow, contributor experience, accessibility, and safety guidance that support HUHY.',
  status:'Building',
  sourceStatus:'Public source available · MIT',
  risk:'Medium',
  maintainer:'HUHY Steward',
  contributorNeeds:'Front-end, accessibility, UX writing, public-source review, security review',
  maintenanceStatus:'Maintained',
  reviewCadence:'Pull-request review · monthly project check',
  githubUrl:'https://github.com/kalemeyer/HUHY',
  actionLabel:'Open the HUHY repository',
};

export function LiveProjectDirectory({mode}:{mode:'projects'|'maintainers'|'build'}) {
  const [records,setRecords]=useState<Project[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{fetch('/api/submissions?scope=board',{cache:'no-store'}).then(async(response)=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error);setRecords(payload.submissions??[])}).catch((cause)=>setError(cause instanceof Error?cause.message:'Unable to load projects.')).finally(()=>setLoading(false))},[]);
  const projects=useMemo(()=>[huhyWebsiteProject,...records.filter((record)=>record.id!==huhyWebsiteProject.id&&['Approved for Incubation','Building','Released'].includes(record.status)&&record.githubUrl)],[records]);
  const shown=mode==='maintainers'?projects.filter((project)=>project.maintenanceStatus!=='Maintained'):projects;
  if(loading)return <p className="empty-state">Loading live GitHub-backed projects…</p>;
  if(error)return <p className="empty-state">{error}</p>;
  if(!shown.length)return <div className="empty-state"><strong>No live opportunities yet.</strong><p>Projects appear here after safety review, incubation approval, and GitHub publication.</p><a className="button button-small" href="/problems">View the problem board</a></div>;
  if(mode==='maintainers')return <div className="maintainer-list">{shown.map((project)=><article key={project.id}><div className="maintainer-status">{project.maintenanceStatus.toUpperCase()}</div><h2>{project.problem}</h2><p>{project.better}</p><dl><div><dt>Current owner</dt><dd>{project.maintainer}</dd></div><div><dt>Review cadence</dt><dd>{project.reviewCadence}</dd></div><div><dt>Helpful skills</dt><dd>{project.contributorNeeds}</dd></div><div><dt>Source status</dt><dd>{project.sourceStatus}</dd></div></dl><a className="button button-small" href={project.githubUrl!} target="_blank" rel="noreferrer">Discuss ownership on GitHub ↗</a></article>)}</div>;
  return <div className="project-grid">{shown.map((project)=><article className="project-card accent-orange" key={project.id}><div><span>{project.status.toUpperCase()}</span><RiskPill value={project.risk}/></div><h2>{project.problem}</h2><p>{project.better}</p><dl><dt>Contributors needed</dt><dd>{project.contributorNeeds}</dd><dt>Source status</dt><dd>{project.sourceStatus}</dd><dt>Maintenance</dt><dd>{project.maintenanceStatus} · {project.maintainer}</dd><dt>Review cadence</dt><dd>{project.reviewCadence}</dd></dl><a className="project-action" href={project.githubUrl!} target="_blank" rel="noreferrer">{project.actionLabel??(mode==='build'?'Join the GitHub discussion':'Open project issue')} <span aria-hidden="true">↗</span></a></article>)}</div>;
}
