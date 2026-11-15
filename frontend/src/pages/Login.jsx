import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Sign in</h2>
      <form onSubmit={onSubmit}>
        <input type="email" placeholder="Email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}