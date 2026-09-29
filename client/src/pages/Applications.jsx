import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { STATUSES, formatDateTime } from '../constants.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ApplicationForm from '../components/ApplicationForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Applications() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState(''); // debounced value actually sent to the API
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | application

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page, limit: 8 });
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    try {
      setResult(await api(`/api/applications?${params}`));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [q, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(app) {
    if (!window.confirm(`Delete ${app.company} — ${app.role}?`)) return;
    try {
      await api(`/api/applications/${app.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Applications</h1>
        <button className="btn primary" onClick={() => setEditing('new')}>+ New application</button>
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search company, role or notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <ErrorMessage error={error} />

      {!result ? (
        <p className="muted">Loading…</p>
      ) : result.data.length === 0 ? (
        <div className="card center muted">No applications found.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Interview</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.data.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.company}</strong></td>
                  <td>{a.role}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="nowrap">{formatDateTime(a.interview_date)}</td>
                  <td className="notes">{a.notes}</td>
                  <td className="nowrap">
                    <button className="btn ghost small" onClick={() => setEditing(a)}>Edit</button>
                    <button className="btn ghost small danger" onClick={() => remove(a)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div className="pager">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted small">Page {result.page} of {result.totalPages} · {result.total} total</span>
          <button className="btn ghost" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {editing && (
        <ApplicationForm
          application={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
