import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './Login.css';

const Login = ({url}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Log frontend attempt
    console.log('=== FRONTEND LOGIN ATTEMPT ===');
    console.log('URL:', `${url}/api/admin/login`);
    console.log('Username:', username);
    console.log('Password:', password ? '***' : 'MISSING');
    
    try {
      const response = await axios.post(`${url}/api/admin/login`, { username, password });
      console.log('Response status:', response.status);
      console.log('Response data:', { 
        success: response.data.success, 
        hasToken: !!response.data.token,
        message: response.data.message 
      });
      
      if (response.data.success) {
        console.log('✅ Login successful, saving token');
        login(response.data.token);
      } else {
        console.log('❌ Login failed:', response.data.message);
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('=== FRONTEND LOGIN ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('=== END ERROR ===');
      
      const errorMessage = err.response?.data?.message || err.message || 'Server error';
      setError(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
