import { useState } from 'react';
import { categoryLabels, editableCategories } from '../data/portfolioDefaults';
import {
  deleteRecord,
  getRecordFileUrl,
  isCloudMode,
  saveRecord,
  supabase,
} from '../lib/portfolioStore';

const blankForm = {
  category: 'about',
  title: '',
  description: '',
  details: '',
  isPublic: true,
};

function RecordEditor({ record, onCancel, onSave }) {
  const [form, setForm] = useState(record || blankForm);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave(form, file);
    } catch (saveError) {
      setError(saveError.message || 'Could not save this record.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="record-editor" onSubmit={submit}>
      <label>
        Section
        <select
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value })
          }
        >
          {editableCategories.map((category) => (
            <option value={category} key={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
          maxLength="160"
        />
      </label>
      <label>
        Summary
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows="3"
          maxLength="1200"
        />
      </label>
      <label>
        Extra details
        <textarea
          value={form.details}
          onChange={(event) =>
            setForm({ ...form, details: event.target.value })
          }
          rows="3"
          maxLength="4000"
        />
      </label>
      <label className="upload-field">
        Image or document
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.doc,.docx"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        {record?.fileName && !file && (
          <span className="field-hint">Current file: {record.fileName}</span>
        )}
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={Boolean(form.isPublic)}
          onChange={(event) =>
            setForm({ ...form, isPublic: event.target.checked })
          }
        />
        Show this record publicly
      </label>
      {!isCloudMode && (
        <p className="inline-notice">
          Local preview uploads are limited to 1 MB and stay in this browser.
        </p>
      )}
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="editor-actions">
        <button className="button button-primary" disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Save record'}
        </button>
        <button
          className="button button-secondary"
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function OwnerDashboard({
  records,
  session,
  refreshRecords,
  onSessionChange,
  isOwner,
  loadError,
  authError,
  loading,
}) {
  const [editing, setEditing] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw new Error(`Sign in failed: ${authError.message}`);
      onSessionChange(data.session);
    } catch (authError) {
      setError(authError.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw new Error(`Sign out failed: ${authError.message}`);
      onSessionChange(null);
    } catch (authError) {
      setError(authError.message || 'Could not sign out.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(form, file) {
    setMessage('');
    await saveRecord(form, file);
    await refreshRecords();
    setEditing(null);
    setMessage('Record saved.');
  }

  async function handleDelete(record) {
    if (!window.confirm(`Delete "${record.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await deleteRecord(record);
      await refreshRecords();
      setMessage('Record deleted.');
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete this record.');
    } finally {
      setBusy(false);
    }
  }

  async function openFile(record) {
    setError('');
    try {
      const url = await getRecordFileUrl(record);
      if (!url) throw new Error('No file is attached to this record.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (fileError) {
      setError(fileError.message || 'Could not open the attachment.');
    }
  }

  return (
    <section className="content-section dashboard-section" id="manage">
      <div className="section-heading">
        <p className="eyebrow">Owner tools</p>
        <h2>Portfolio dashboard</h2>
      </div>
      {!isCloudMode ? (
        <p className="inline-notice">
          Local preview mode: changes are saved only in this browser. There is
          no owner authentication here, so this is not secure for private
          online data. Configure Supabase to enable authenticated editing and
          server-enforced privacy.
        </p>
      ) : !session ? (
        <form className="sign-in-form" onSubmit={signIn}>
          <p>
            Sign in with the owner account created in your Supabase project.
            Public visitors cannot edit records or access private records.
          </p>
          <label>
            Owner email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="button button-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : isOwner ? (
        <div className="dashboard-owner">
          <p>
            Signed in as <strong>{session.user.email}</strong>. Owner changes
            are protected by Supabase Row Level Security.
          </p>
          <button
            className="button button-secondary"
            disabled={busy}
            onClick={signOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      ) : (
        <p className="error-message" role="alert">
          This authenticated account is not registered as the portfolio owner.
          Ask the project owner to grant access in the Supabase setup.
        </p>
      )}

      {isCloudMode && session && isOwner && (
        <>
          <div className="dashboard-toolbar">
            <p>
              {loading
                ? 'Loading records…'
                : `${records.length} record${records.length === 1 ? '' : 's'} · ${
                    records.filter((record) => record.isPublic).length
                  } public`}
            </p>
            {!editing && (
              <button
                className="button button-primary"
                onClick={() => setEditing({ ...blankForm })}
                type="button"
              >
                Add record
              </button>
            )}
          </div>
          {editing && (
            <RecordEditor
              record={editing.id ? editing : null}
              onCancel={() => setEditing(null)}
              onSave={handleSave}
            />
          )}
          {records.length ? (
            <div className="dashboard-list">
              {records.map((record) => (
                <article className="dashboard-record" key={record.id}>
                  <div>
                    <span className="record-category">
                      {categoryLabels[record.category] || record.category}
                    </span>
                    <h3>{record.title}</h3>
                    <p>{record.description}</p>
                    <span
                      className={`visibility-badge ${
                        record.isPublic ? '' : 'is-private'
                      }`}
                    >
                      {record.isPublic ? 'Public' : 'Private'}
                    </span>
                    {record.fileName && (
                      <button
                        className="text-button"
                        onClick={() => openFile(record)}
                        type="button"
                      >
                        Open {record.fileName}
                      </button>
                    )}
                  </div>
                  <div className="dashboard-record-actions">
                    <button
                      className="button button-secondary"
                      disabled={busy}
                      onClick={() => setEditing({ ...record })}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-danger"
                      disabled={busy}
                      onClick={() => handleDelete(record)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="placeholder-note">No portfolio records yet.</p>
          )}
        </>
      )}
      {(loadError || authError || error) && (
        <p className="error-message" role="alert">
          {[loadError, authError, error].filter(Boolean).join(' ')}
        </p>
      )}
      {message && <p className="success-message" role="status">{message}</p>}
    </section>
  );
}
