import React from 'react';
import { categoryLabels } from '../data/portfolioDefaults';
import { getPublicFileUrl } from '../lib/portfolioStore';
import AboutSection from './AboutSection';

const sectionOrder = [
  ['education', 'education'],
  ['skill', 'skills'],
  ['project', 'projects'],
  ['hackathon', 'hackathons'],
  ['achievement', 'achievements'],
  ['certificate', 'certificates'],
  ['team', 'team'],
  ['contact', 'contact'],
];

function RecordCard({ record }) {
  const hasFile = Boolean(record.filePath || record.fileData);
  const fileUrl = getPublicFileUrl(record);

  return (
    <article className="record-card">
      <div className="record-card-heading">
        <h3>{record.title}</h3>
        <span className={`visibility-badge ${record.isPublic ? '' : 'is-private'}`}>
          {record.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
      {record.description && <p>{record.description}</p>}
      {record.details && <p className="record-details">{record.details}</p>}
      {hasFile &&
        (fileUrl ? (
          <a className="file-link" href={fileUrl} target="_blank" rel="noreferrer">
            Open {record.fileName || 'attachment'}
          </a>
        ) : (
          <span className="file-note">Private attachment (owner access only)</span>
        ))}
    </article>
  );
}

function ContactForm({ contactEmail }) {
  const [state, setState] = React.useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    if (!contactEmail) {
      setState('A contact email has not been published yet. Please check back later.');
      return;
    }

    const subject = encodeURIComponent(`Portfolio collaboration message from ${name}`);
    const body = encodeURIComponent(`${message}\n\nReply to: ${email}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setState('Your email app should open with the message ready to send.');
    event.currentTarget.reset();
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        Your name
        <input name="name" autoComplete="name" required maxLength="100" />
      </label>
      <label>
        Your email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength="254"
        />
      </label>
      <label>
        Message
        <textarea name="message" required rows="4" maxLength="3000" />
      </label>
      <button className="button button-primary" type="submit">
        Prepare collaboration email
      </button>
      {state && <p className="form-message" role="status">{state}</p>}
    </form>
  );
}

export default function PortfolioSections({ records }) {
  const publicRecords = records.filter((record) => record.isPublic);
  const contactCandidate = publicRecords.find(
    (record) => record.category === 'contact' && record.details
  )?.details;
  const contactEmail =
    contactCandidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactCandidate)
      ? contactCandidate
      : '';

  return (
    <>
      <div className="portfolio-main">
        <AboutSection
          name="Dinesh M."
          records={publicRecords.filter((record) => record.category === 'about')}
          imageSrc="/profile.jpg"
        />
        {sectionOrder.map(([category, sectionId]) => {
          const entries = publicRecords.filter(
            (record) => record.category === category
          );
          return (
            <section
              className={`content-section section-${sectionId}`}
              id={sectionId}
              key={sectionId}
              aria-labelledby={`${sectionId}-heading`}
            >
              <div className="section-heading">
                <p className="eyebrow">{categoryLabels[category]}</p>
                <h2 id={`${sectionId}-heading`}>
                  {category === 'contact'
                    ? 'Let’s collaborate'
                    : category === 'skill'
                      ? 'Skills & tools'
                      : category === 'team'
                        ? 'People I’ve worked with'
                        : categoryLabels[category]}
                </h2>
              </div>
              {category === 'contact' ? (
                <div className="contact-layout">
                  <div className="contact-copy">
                    <p>
                      Have a project, idea, or opportunity to discuss? Send a
                      collaboration message.
                    </p>
                    {entries.map((record) => (
                      <RecordCard
                        key={record.id}
                        record={record}
                      />
                    ))}
                    {!contactEmail && (
                      <p className="placeholder-note">
                        A contact email has not been shared yet.
                      </p>
                    )}
                  </div>
                  <ContactForm contactEmail={contactEmail} />
                </div>
              ) : entries.length ? (
                <div className="record-grid">
                  {entries.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                    />
                  ))}
                </div>
              ) : (
                <p className="placeholder-note">
                  No entries have been shared in{' '}
                  {categoryLabels[category].toLowerCase()} yet.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
