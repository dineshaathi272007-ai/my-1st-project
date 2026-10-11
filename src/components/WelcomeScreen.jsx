import ProfileCard from './ProfileCard';

export default function WelcomeScreen({ onEnter }) {
  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-grid" aria-hidden="true" />
      <div className="welcome-particles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="welcome-panel">
        <div className="welcome-visual" aria-hidden="true">
          <span className="welcome-orbit welcome-orbit-one" />
          <span className="welcome-orbit welcome-orbit-two" />
          <span className="welcome-orbit welcome-orbit-three" />
          <ProfileCard
            name="Dinesh M."
            imageSrc="/profile.jpg"
            className="welcome-portrait"
            width={112}
            height={112}
          />
        </div>
        <p className="eyebrow">A portfolio of learning and building</p>
        <h1 id="welcome-title">Welcome to My Portfolio</h1>
        <p className="welcome-name">Dinesh M.</p>
        <p className="welcome-intro">
          Explore my education, projects, and experience. This portfolio shares
          my current work and achievements.
        </p>
        <button className="button button-primary welcome-enter" onClick={onEnter}>
          Enter Portfolio <span aria-hidden="true">→</span>
        </button>
        <button className="skip-welcome" onClick={onEnter}>
          Skip welcome
        </button>
      </div>
    </section>
  );
}
