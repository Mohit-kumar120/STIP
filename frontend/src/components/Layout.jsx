import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLive } from '../context/LiveContext';
import Badge from './Badge';

const LABEL = { live: 'Live', connecting: 'Connecting...', offline: 'Offline' };

export default function Layout() {
  const { user, logout } = useAuth();
  const { status, toasts, dismiss } = useLive();

  return (
    <>
      <nav className="nav">
        <strong>STIP</strong>
        <NavLink to="/" end>Overview</NavLink>
        <NavLink to="/indicators">Indicators</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
        {user.role === 'ADMIN' && <NavLink to="/users">Users</NavLink>}
        <span className="spacer" />
        <span className={`live live-${status}`}>● {LABEL[status]}</span>
        <span className="who">{user.username} · {user.role}</span>
        <button className="ghost" onClick={logout}>Log out</button>
      </nav>
      <main className="page"><Outlet /></main>

      <div className="toasts">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <Badge value={t.severity} />
            <Link to="/alerts" onClick={() => dismiss(t.id)}>{t.title}</Link>
            <button className="x" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}