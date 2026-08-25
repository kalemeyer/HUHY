import type { Metadata } from 'next';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StewardConsole } from './StewardConsole';
import { ToolRecommendationQueue } from './ToolRecommendationQueue';

export const metadata:Metadata={title:'Steward queue · HUHY',description:'Private HUHY safety review and disposition workspace.'};
export default function StewardPage(){return <main><SiteHeader/><section className="page-hero page-hero-dark"><p className="eyebrow">PRIVATE STEWARD WORKSPACE</p><h1>Review before anything becomes visible</h1><p>Check the public-information boundary, clarify the need, and publish only reviewed records.</p></section><section className="steward-page-content"><StewardConsole/><ToolRecommendationQueue/></section><SiteFooter/></main>}
