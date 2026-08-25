import type { Metadata } from 'next';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { ProblemBoard } from './ProblemBoard';

export const metadata: Metadata = { title:'HUHY Problem Board', description:'Review safety-screened Airman problems and their current disposition.', openGraph:{title:'HUHY Problem Board',description:'Review safety-screened Airman problems and their current disposition.',images:[]}, twitter:{title:'HUHY Problem Board',description:'Review safety-screened Airman problems and their current disposition.',images:[]} };

export default function ProblemsPage(){return <main><SiteHeader/><section className="page-hero page-hero-dark"><p className="eyebrow">PROBLEM INTAKE AND DISPOSITION</p><h1>Track proposed work</h1><p>Records appear after private safety review and show their status, source basis, risk, maintainer need, and GitHub publishing state.</p></section><section className="board-section board-page"><ProblemBoard/></section><SiteFooter/></main>}
