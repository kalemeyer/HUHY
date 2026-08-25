import type { Metadata } from 'next';
import { LiveProjectDirectory } from '../components/LiveProjectDirectory';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';

export const metadata: Metadata = { title:'Maintainers Needed · HUHY', description:'Review live HUHY projects that need ongoing maintenance ownership.', openGraph:{title:'Maintainers Needed · HUHY',description:'Review projects that need ongoing owners.',images:[]}, twitter:{title:'Maintainers Needed · HUHY',description:'Review projects that need ongoing owners.',images:[]} };

export default function MaintainersPage(){return <main><SiteHeader/><section className="page-hero maintainer-hero"><p className="eyebrow">MAINTENANCE OWNERSHIP</p><h1>Projects that need long-term owners</h1><p>GitHub-backed projects without complete ownership appear here with their real review cadence and source status.</p></section><section className="maintainers-page-content"><LiveProjectDirectory mode="maintainers"/><div className="page-cta"><p>Maintenance ownership should be defined before release.</p><a className="button" href="/build">Review contributor roles</a></div></section><SiteFooter/></main>}
