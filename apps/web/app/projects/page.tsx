import type { Metadata } from 'next';
import { LiveProjectDirectory } from '../components/LiveProjectDirectory';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';

export const metadata: Metadata = { title:'Projects Seeking Contributors · HUHY', description:'Review live HUHY project roles, sources, risks, and contribution needs.', openGraph:{title:'Projects Seeking Contributors · HUHY',description:'Review projects that need specific help.',images:[]}, twitter:{title:'Projects Seeking Contributors · HUHY',description:'Review projects that need specific help.',images:[]} };

export default function ProjectsPage(){return <main><SiteHeader/><section className="page-hero"><p className="eyebrow">LIVE PROJECTS</p><h1>Projects that need specific help</h1><p>Approved GitHub-backed projects show the roles, source basis, risk, maintenance state, and review cadence they actually need.</p></section><section className="projects-page-content"><LiveProjectDirectory mode="projects"/><div className="page-cta"><p>Review the contribution process before selecting a role.</p><a className="button" href="/build">Review the build process</a></div></section><SiteFooter/></main>}
