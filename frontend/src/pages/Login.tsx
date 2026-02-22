import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';

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
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="meta text-center uppercase mb-2">Systematic Research Platform</div>
        <div className="card p-4 border-neutral-700">
          {error ? <div className="meta text-danger mb-3">{error}</div> : null}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="meta">Email</label>
              <input className="input w-full focus:ring-[#344558]" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="meta">Password</label>
              <input className="input w-full focus:ring-[#344558]" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" type="submit" disabled={loading} className="brightness-95 hover:brightness-100">
                {loading ? 'Signing in…' : 'Login'}
              </Button>
            </div>
          </form>
        </div>
        <div className="meta text-center mt-2 opacity-60">Systematic Research Platform</div>
      </div>
    </div>
  );
}
