/* eslint-disable @next/next/no-html-link-for-pages -- Vinext's client router currently fails on deployed Sites; full-page links are intentional. */
export function SiteHeader() {
  return <>
    <div className="prototype-bar"><span>PUBLIC BETA</span><p>Independent · Unofficial · Public information only</p></div>
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="HUHY home"><span className="wordmark-mark">H</span><span>HUHY</span><small>AIRMAN BUILDER COMMUNITY</small></a>
      <nav aria-label="Primary navigation"><a href="/problems">Problem board</a><a href="/tools">Find a tool</a><a href="/build">Build with us</a><a href="/community">Community</a></nav>
      <a className="button button-small" href="/suggest">Suggest a problem</a>
    </header>
    <nav className="mobile-nav" aria-label="Mobile navigation"><a href="/problems">Board</a><a href="/tools">Tools</a><a href="/build">Build</a><a href="/projects">Projects</a><a href="/maintainers">Maintainers</a><a href="/community">Rules</a></nav>
  </>;
}
