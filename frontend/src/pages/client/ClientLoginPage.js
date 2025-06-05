import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginClient } from '../../utils/authClient';
import '../../App.css'; // Reuse some global styles

function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginClient(email, password);
      navigate('/dashboard'); // Navigate to client dashboard
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials or contact support.');
      console.error('Client login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className='form-container client-login-container' style={{marginTop: '100px'}}>
      <h2>Client Login</h2>
      <p>Welcome to the PhonesCanada Auction Platform</p>
      <form onSubmit={handleSubmit}>
        {error && <p className='error-message'>{error}</p>}
        <div>
          <input
            type='email'
            placeholder='Company Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type='submit' disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <p style={{marginTop: '20px', fontSize: '0.9em'}}>
        Admin access? <Link to='/admin/login'>Admin Login</Link>
      </p>
    </div>
  );
}

export default ClientLoginPage;
