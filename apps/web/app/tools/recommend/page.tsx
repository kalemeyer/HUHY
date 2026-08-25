import type { Metadata } from 'next';
import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { RecommendToolForm } from './RecommendToolForm';

export const metadata: Metadata = {
  title: 'Recommend a Tool · HUHY',
  description: 'Recommend a public Air Force-related tool for review in the HUHY directory.',
  openGraph: { title:'Recommend a Tool · HUHY', description:'Recommend a public Air Force-related tool for review in the HUHY directory.', images:[] },
  twitter: { title:'Recommend a Tool · HUHY', description:'Recommend a public Air Force-related tool for review in the HUHY directory.', images:[] },
};

export default function RecommendToolPage(){
  return <main><SiteHeader/><section className="page-hero"><p className="eyebrow">TOOL RECOMMENDATION</p><h1>Found something useful?</h1><p>Send us the public link. HUHY will check who owns it, what it handles, and whether it belongs in the directory.</p></section><section className="recommend-page-content"><div className="recommend-guidance"><h2>Keep the recommendation public and verifiable.</h2><p>Do not paste account information, internal screenshots, unit details, readiness data, credentials, or anything from a restricted system. We only need enough information to review a public tool.</p><ul><li>The tool does not need to belong to you.</li><li>A repository is helpful, but not required.</li><li>Recommendation does not guarantee listing or endorsement.</li></ul></div><RecommendToolForm/></section><SiteFooter/></main>;
}
