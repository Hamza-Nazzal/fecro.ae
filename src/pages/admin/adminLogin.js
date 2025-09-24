// src/pages/admin/adminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authenticateUser(formData.email, formData.password);
      
      if (response.success && response.user.role === 'SuperAdmin') {
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('token', response.token);
          
          setLoginSuccess(true);
          
          // Redirect after 2 seconds using React Router
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 500);
      } else if (response.success && response.user.role !== 'SuperAdmin') {
        setError('Access denied. SuperAdmin privileges required.');
      } else {
        setError(response.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const authenticateUser = async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'h@a.com' && password === '443') {
      return {
        success: true,
        user: {
          id: '1',
          email: email,
          username: 'HNazzal',
          role: 'SuperAdmin'
        },
        token: 'mock-jwt-token-123'
      };
    }
    
    if (email === 'user@test.com' && password === 'password') {
      return {
        success: true,
        user: {
          id: '2',
          email: email,
          username: 'RegularUser',
          role: 'User'
        },
        token: 'mock-jwt-token-456'
      };
    }
    
    return {
      success: false,
      message: 'Invalid email or password'
    };
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h2>
            <p className="text-gray-600 mb-4">Welcome back, SuperAdmin</p>
            <p className="text-sm text-blue-600">Redirecting to Admin Dashboard...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white text-xl">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
          <p className="text-gray-600">Sign in to access the marketplace dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-red-400 mr-2">⚠️</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Your input fields here */}
            <button
              type="submit"
               disabled={loading || !formData.email || !formData.password}
                 className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
            </form>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>SuperAdmin:</strong> h@a.com / 443</p>
              <p><strong>Regular User:</strong> user@test.com / password</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>MarketPlace Admin Panel © 2024</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;