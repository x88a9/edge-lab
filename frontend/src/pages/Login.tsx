import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      const token: string = (data && (data.access_token || data.token)) as string;
      if (!token) throw new Error('Missing token in response');
      login(token);
      navigate('/runs', { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <div className="page-title mb-4">Login</div>
      {error ? <div className="meta text-danger mb-3">{error}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="meta">Email</label>
          <input className="input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="meta">Password</label>
          <input className="input w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}