import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUSES, formatDateTime } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/api/dashboard').then(setData).catch(setError);
  }, []);

  if (error) return <ErrorMessage error={error} />;
  if (!data) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link to="/applications" className="btn primary">Manage applications</Link>
      </div>

      <div className="stats">
        <div className="card stat">
          <div className="stat-num">{data.total}</div>
          <div className="muted">Total</div>
        </div>
        {STATUSES.map((s) => (
          <div className="card stat" key={s.value}>
            <div className="stat-num">{data.byStatus[s.value]}</div>
            <StatusBadge status={s.value} />
          </div>
        ))}
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Upcoming interviews</h2>
          {data.upcomingInterviews.length === 0 ? (
            <p className="muted">Nothing scheduled.</p>
          ) : (
            <ul className="list">
              {data.upcomingInterviews.map((a) => (
                <li key={a.id}>
                  <div><strong>{a.company}</strong> · {a.role}</div>
                  <div className="muted small">{formatDateTime(a.interview_date)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Recent activity</h2>
          {data.recent.length === 0 ? (
            <p className="muted">No applications yet. Add your first one!</p>
          ) : (
            <ul className="list">
              {data.recent.map((a) => (
                <li key={a.id}>
                  <div><strong>{a.company}</strong> · {a.role}</div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
