import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['ADMIN', 'ANALYST', 'VIEWER'];

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/admin/users').then((r) => setUsers(r.data)).catch(() => setError('Could not load users'));
  }, []);

  const changeRole = async (id, role) => {
    try {
      const res = await api.patch(`/api/admin/users/${id}/role`, { role });
      setUsers((list) => list.map((u) => (u.id === id ? res.data : u)));
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not change role');
    }
  };

  if (!users) return <p>{error || 'Loading...'}</p>;

  return (
    <>
      <h2>Users</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role} disabled={u.email === user.email}
                        onChange={(e) => changeRole(u.id, e.target.value)}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}