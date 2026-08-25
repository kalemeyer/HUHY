export function RiskPill({ value }: { value:string }) { return <span className={`risk risk-${value.toLowerCase()}`}>{value} RISK</span>; }
