'use client';

import { FormEvent, useState } from 'react';

export function RecommendToolForm(){
  const [saving,setSaving]=useState(false);
  const [result,setResult]=useState<{id?:string;status?:string;message?:string;error?:string}|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setResult(null);const form=event.currentTarget;const data=new FormData(form);try{const response=await fetch('/api/tool-recommendations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:data.get('name'),website:data.get('website'),repository:data.get('repository'),category:data.get('category'),relationship:data.get('relationship'),useCase:data.get('useCase'),maintainer:data.get('maintainer'),license:data.get('license'),reviewNotes:data.get('reviewNotes'),companyWebsite:data.get('companyWebsite'),safetyConfirmed:data.get('safetyConfirmed')==='on'})});const payload=await response.json();setResult(payload);if(response.ok)form.reset()}catch{setResult({error:'The recommendation service is unavailable. Nothing was saved.'})}finally{setSaving(false)}}
  return <><form className="intake-form" onSubmit={submit}>
    <div className="demo-label">RECOMMENDATIONS ARE REVIEWED BEFORE LISTING</div>
    <label>Tool name<input name="name" required maxLength={120} placeholder="Example: AFI Explorer"/></label>
    <label>Public tool URL<input name="website" type="url" required maxLength={500} placeholder="https://…"/></label>
    <label>Public repository URL <span className="optional-label">Optional</span><input name="repository" type="url" maxLength={500} placeholder="https://github.com/owner/repository"/></label>
    <div className="form-row"><label>Air Force life area<input name="category" required maxLength={80} placeholder="PCS, fitness, publications…"/></label><label>Your relationship<select name="relationship" defaultValue="Community recommendation"><option>Community recommendation</option><option>I maintain this tool</option><option>I contribute to this tool</option></select></label></div>
    <label>What does it help with?<textarea name="useCase" required minLength={20} maxLength={500} placeholder="Describe the public problem it helps solve and who may find it useful."/></label>
    <label>Owner or maintainer <span className="optional-label">If publicly known</span><input name="maintainer" maxLength={160} placeholder="Person, team, or organization named by the project"/></label>
    <label>License <span className="optional-label">If publicly stated</span><input name="license" maxLength={120} placeholder="MIT, Apache-2.0, proprietary, not identified…"/></label>
    <label>Anything reviewers should check? <span className="optional-label">Optional</span><textarea name="reviewNotes" maxLength={400} placeholder="Accuracy, stale data, account permissions, maintenance status, or similar concerns."/></label>
    <label className="honeypot-field" aria-hidden="true">Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off"/></label>
    <label className="check-label"><input name="safetyConfirmed" type="checkbox" required/><span>I confirm this recommendation contains only publicly released, non-sensitive information and public links.</span></label>
    <button className="button" type="submit" disabled={saving}>{saving?'Checking…':'Send for review'}</button>
    <p className="form-note">This enters a private review queue. It does not publish the tool automatically.</p>
  </form>{result&&<div className={`submission-result ${result.error?'submission-error':''}`} role="status"><strong>{result.error?'Nothing was saved':`${result.id} · ${result.status}`}</strong><p>{result.error??result.message}</p></div>}</>;
}
