const navigation = [
  ['Home', '#home'],
  ['About', '#about'],
  ['Education', '#education'],
  ['Skills', '#skills'],
  ['Projects', '#projects'],
  ['Hackathons', '#hackathons'],
  ['Achievements', '#achievements'],
  ['Certificates', '#certificates'],
  ['Team History', '#team'],
  ['Contact', '#contact'],
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Dinesh M. home">
        <span className="brand-mark">D</span>
        <span>Dinesh M.</span>
      </a>
      <nav className="site-nav" aria-label="Main navigation">
        {navigation.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
