import OwnerDashboard from '../components/OwnerDashboard';
import { supabase } from '../lib/portfolioStore';

export default function DashboardPage({
  records,
  session,
  refreshRecords,
  onSessionChange,
  isOwner,
  loadError,
  authError,
  loading,
}) {
  return (
    <main className="dashboard-page">
      <header className="dashboard-page-header">
        <a className="brand" href="/" aria-label="Dinesh M. portfolio home">
          <span className="brand-mark">D</span>
          <span>Dinesh M.</span>
        </a>
        <a className="button button-secondary" href="/">
          View portfolio
        </a>
      </header>
      {supabase ? (
        <OwnerDashboard
          records={records}
          session={session}
          refreshRecords={refreshRecords}
          onSessionChange={onSessionChange}
          isOwner={isOwner}
          loadError={loadError}
          authError={authError}
          loading={loading}
        />
      ) : (
        <section className="dashboard-setup content-section">
          <p className="eyebrow">Owner access</p>
          <h1>Dashboard setup required</h1>
          <p>
            Secure sign-in and editing are not enabled yet. Configure your
            Supabase project to protect this dashboard. Local preview mode
            does not allow dashboard access or editing.
          </p>
          <ol>
            <li>Create a Supabase project and an owner account.</li>
            <li>
              Follow the setup instructions in the project README and run the
              supplied SQL setup.
            </li>
            <li>
              Add <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>,
              then restart the development server.
            </li>
          </ol>
          <a className="button button-primary" href="/">
            Return to portfolio
          </a>
        </section>
      )}
    </main>
  );
}
