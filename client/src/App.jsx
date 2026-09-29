import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Applications from './pages/Applications.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <>
      {user && (
        <header className="topbar">
          <strong className="brand">Job Tracker</strong>
          <nav>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/applications">Applications</NavLink>
          </nav>
          <div className="spacer" />
          <span className="muted small">{user.email}</span>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </header>
      )}
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/applications" element={<Protected><Applications /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
