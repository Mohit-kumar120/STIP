import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError(err.response.data?.message || 'Already registered');
      else if (status === 400) setError('Check your input: username 3+ chars, valid email, password 8+ chars');
      else setError('Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Username" value={form.username} onChange={update('username')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        <input type="password" placeholder="Password (8+ chars)" value={form.password}
               onChange={update('password')} required />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Creating...' : 'Register'}</button>
      </form>
      <p>Have an account? <Link to="/login">Sign in</Link></p>
    </div>
  );
}