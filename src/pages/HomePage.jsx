import { useEffect, useState } from 'react';
import PortfolioSections from '../components/PortfolioSections';
import SiteHeader from '../components/SiteHeader';
import WelcomeScreen from '../components/WelcomeScreen';

const welcomeStorageKey = 'dinesh-portfolio-welcome-closed';

function shouldShowWelcome() {
  if (window.location.hash.length > 0) {
    return false;
  }

  try {
    return localStorage.getItem(welcomeStorageKey) !== 'true';
  } catch {
    return true;
  }
}

export default function HomePage({ records }) {
  const [showWelcome, setShowWelcome] = useState(() => shouldShowWelcome());

  useEffect(() => {
    function skipWelcome(event) {
      if (event.key === 'Escape') {
        setShowWelcome(false);
        try {
          localStorage.setItem(welcomeStorageKey, 'true');
        } catch {
          // Storage may be unavailable; keep the welcome fallback unchanged.
        }
      }
    }
    window.addEventListener('keydown', skipWelcome);
    return () => window.removeEventListener('keydown', skipWelcome);
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    try {
      localStorage.setItem(welcomeStorageKey, 'true');
    } catch {
      // Storage may be unavailable; keep the welcome fallback unchanged.
    }
  }

  if (showWelcome) {
    return <WelcomeScreen onEnter={dismissWelcome} />;
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero-section" id="home" aria-labelledby="home-heading">
          <div className="hero-copy">
            <p className="eyebrow">Portfolio · Chennai</p>
            <h1 id="home-heading">
              Hello, I’m <span>Dinesh M.</span>
            </h1>
            <p>
              A student portfolio for learning, projects, and collaboration.
              Explore the sections below to see what I’ve shared so far.
            </p>
            <a className="button button-primary" href="#projects">
              Explore portfolio <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-photo-frame">
            <img src="/profile.jpg" alt="Dinesh M." width="768" height="768" />
          </div>
        </section>
        <PortfolioSections records={records} />
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Dinesh M.</span>
        <a href="#home">Back to top ↑</a>
      </footer>
    </>
  );
}
