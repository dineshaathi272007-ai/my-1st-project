import { getPublicFileUrl } from '../lib/portfolioStore';

export default function AboutSection({ name, records, imageSrc }) {
  return (
    <section
      className="content-section section-about"
      id="about"
      aria-labelledby="about-heading"
    >
      <div className="section-heading">
        <p className="eyebrow">About</p>
        <h2 id="about-heading">About {name}</h2>
      </div>
      <div className="about-layout">
        <img
          className="about-portrait"
          src={imageSrc}
          alt={name}
          width="768"
          height="768"
        />
        {records.length ? (
          <div className="record-grid">
            {records.map((record) => {
              const fileUrl = getPublicFileUrl(record);
              return (
                <article className="record-card" key={record.id}>
                  <h3>{record.title}</h3>
                  {record.description && <p>{record.description}</p>}
                  {record.details && (
                    <p className="record-details">{record.details}</p>
                  )}
                  {fileUrl && (
                    <a
                      className="file-link"
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open {record.fileName || 'attachment'}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="placeholder-note">
            More information about Dinesh M. will be shared here.
          </p>
        )}
      </div>
    </section>
  );
}
