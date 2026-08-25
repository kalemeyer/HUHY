import type { Metadata } from 'next';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { ToolDirectory } from './ToolDirectory';

export const metadata: Metadata = {
  title: 'Find a Tool · HUHY',
  description: 'Search the HUHY research catalog for tools supporting Air Force life.',
  openGraph: { title:'Find a Tool · HUHY', description:'Search the HUHY research catalog for tools supporting Air Force life.', images:[] },
  twitter: { title:'Find a Tool · HUHY', description:'Search the HUHY research catalog for tools supporting Air Force life.', images:[] },
};

export default function ToolsPage() {
  return <main><SiteHeader/><section className="page-hero"><p className="eyebrow">RESEARCH-BACKED TOOL DIRECTORY</p><h1>Check existing tools first</h1><p>Find useful work wherever it lives. HUHY can point to independent, community, and official projects without taking ownership of them.</p></section><section className="tools-page-content"><aside className="directory-policy"><div><strong>External projects stay with their owners.</strong><a className="button button-small" href="/tools/recommend">Recommend a tool</a></div><p>Every listing identifies who owns or maintains it, whether public source is available, the observed license, and HUHY&apos;s limited role. Repository links go to the owner&apos;s GitHub—not a HUHY copy.</p></aside><ToolDirectory/><p className="catalog-note">A listing or usefulness rating is not an endorsement, security review, Air Force approval, or permission to reuse code. Verify current status, licensing, and acceptable use with the project owner.</p></section><SiteFooter/></main>;
}
