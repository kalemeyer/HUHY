import type { Metadata } from 'next';
import { LiveProjectDirectory } from '../components/LiveProjectDirectory';
import { ExternalProjectDirectory } from '../components/ExternalProjectDirectory';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';

export const metadata: Metadata = { title:'Projects Seeking Contributors · HUHY', description:'Review live HUHY project roles, sources, risks, and contribution needs.', openGraph:{title:'Projects Seeking Contributors · HUHY',description:'Review projects that need specific help.',images:[]}, twitter:{title:'Projects Seeking Contributors · HUHY',description:'Review projects that need specific help.',images:[]} };

export default function ProjectsPage(){return <main><SiteHeader/><section className="page-hero"><p className="eyebrow">PROJECTS AND UPSTREAM LEADS</p><h1>Useful work that needs the right people</h1><p>HUHY-owned projects appear with confirmed roles and ownership. Separately labeled external leads help contributors find public projects that already exist.</p></section><section className="projects-page-content"><div className="section-heading"><div><p className="eyebrow">HUHY-OWNED PROJECTS</p><h2>Built and maintained through HUHY</h2></div><p>Founding infrastructure appears here alongside projects approved through the HUHY board. Each project shows its source, risk, and maintenance state.</p></div><LiveProjectDirectory mode="projects"/><ExternalProjectDirectory/><div className="page-cta"><p>Review the contribution process before selecting a role or contacting an external owner.</p><a className="button" href="/build">Review the build process</a></div></section><SiteFooter/></main>}
