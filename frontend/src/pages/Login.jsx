import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setIsAuthenticated(true);
        toast.success('Giriş başarılı!');
        navigate('/');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 fade-in">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="h-9 w-9 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Süperadmin Girişi</h2>
          <p className="mt-2 text-sm text-gray-600">Bina yönetim sistemine hoş geldiniz</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit} data-testid="login-form">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-posta Adresi
              </Label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="email-input"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Şifre
              </Label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  data-testid="password-input"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="ml-2">Giriş yapılıyor...</span>
                </div>
              ) : (
                'Giriş Yap'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Test Kullanıcı: admin@test.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
