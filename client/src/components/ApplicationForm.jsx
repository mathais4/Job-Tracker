import { useState } from 'react';
import { api } from '../api.js';
import { STATUSES, toLocalInput } from '../constants.js';
import ErrorMessage from './ErrorMessage.jsx';

// Used for both create (no `application`) and edit.
export default function ApplicationForm({ application, onSaved, onCancel }) {
  const [form, setForm] = useState({
    company: application?.company ?? '',
    role: application?.role ?? '',
    status: application?.status ?? 'applied',
    interview_date: toLocalInput(application?.interview_date),
    notes: application?.notes ?? '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const body = {
      company: form.company,
      role: form.role,
      status: form.status,
      interview_date: form.interview_date ? new Date(form.interview_date).toISOString() : null,
      notes: form.notes.trim() || null,
    };
    try {
      const saved = application
        ? await api(`/api/applications/${application.id}`, { method: 'PATCH', body })
        : await api('/api/applications', { method: 'POST', body });
      onSaved(saved);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{application ? 'Edit application' : 'New application'}</h2>
        <div className="row">
          <label>
            Company
            <input value={form.company} onChange={set('company')} required maxLength={200} autoFocus />
          </label>
          <label>
            Role
            <input value={form.role} onChange={set('role')} required maxLength={200} />
          </label>
        </div>
        <div className="row">
          <label>
            Status
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label>
            Interview date
            <input type="datetime-local" value={form.interview_date} onChange={set('interview_date')} />
          </label>
        </div>
        <label>
          Notes
          <textarea rows={4} value={form.notes} onChange={set('notes')} maxLength={5000} />
        </label>
        <ErrorMessage error={error} />
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
