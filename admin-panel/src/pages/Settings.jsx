import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Lock, Building2, Save, Loader2, Check, Eye, EyeOff, Video, ExternalLink, Unlink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});
  const [error, setError] = useState({});
  
  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    email: ''
  });
  
  // Building state
  const [building, setBuilding] = useState({
    name: '',
    address: '',
    city: '',
    district: ''
  });
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: true
  });
  
  // Google Calendar settings
  const [googleCalendar, setGoogleCalendar] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: `${API_URL}/api/google-calendar/callback`
  });
  const [googleStatus, setGoogleStatus] = useState({
    is_configured: false,
    is_connected: false
  });

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch profile
      const profileRes = await fetch(`${API_URL}/api/building-manager/profile`, { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || ''
        });
      }

      // Fetch building info
      const buildingRes = await fetch(`${API_URL}/api/building-manager/my-building`, { headers });
      if (buildingRes.ok) {
        const buildingData = await buildingRes.json();
        setBuilding({
          name: buildingData.name || '',
          address: buildingData.address || '',
          city: buildingData.city || '',
          district: buildingData.district || ''
        });
      }

      // Fetch notification settings
      const notifRes = await fetch(`${API_URL}/api/building-manager/notification-settings`, { headers });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications({
          email_notifications: notifData.email_notifications ?? true,
          sms_notifications: notifData.sms_notifications ?? true
        });
      }

      // Fetch Google Calendar status
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData?.building_id) {
        const googleRes = await fetch(`${API_URL}/api/google-calendar/config/${userData.building_id}`, { headers });
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          setGoogleStatus({
            is_configured: googleData.is_configured,
            is_connected: googleData.is_connected
          });
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (section) => {
    setSuccess(prev => ({ ...prev, [section]: true }));
    setTimeout(() => setSuccess(prev => ({ ...prev, [section]: false })), 3000);
  };

  const showErrorMessage = (section, message) => {
    setError(prev => ({ ...prev, [section]: message }));
    setTimeout(() => setError(prev => ({ ...prev, [section]: null })), 5000);
  };

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(prev => ({ ...prev, profile: true }));
    setError(prev => ({ ...prev, profile: null }));
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/building-manager/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('profile');
      } else {
        showErrorMessage('profile', data.detail || 'Profil güncellenemedi');
      }
    } catch (err) {
      showErrorMessage('profile', 'Bağlantı hatası');
    } finally {
      setSaving(prev => ({ ...prev, profile: false }));
    }
  };

  // Save building
  const handleSaveBuilding = async () => {
    setSaving(prev => ({ ...prev, building: true }));
    setError(prev => ({ ...prev, building: null }));
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/building-manager/building`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(building)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('building');
      } else {
        showErrorMessage('building', data.detail || 'Bina bilgileri güncellenemedi');
      }
    } catch (err) {
      showErrorMessage('building', 'Bağlantı hatası');
    } finally {
      setSaving(prev => ({ ...prev, building: false }));
    }
  };

  // Change password
  const handleChangePassword = async () => {
    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      showErrorMessage('password', 'Yeni şifreler eşleşmiyor');
      return;
    }
    if (passwordData.new_password.length < 6) {
      showErrorMessage('password', 'Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    setSaving(prev => ({ ...prev, password: true }));
    setError(prev => ({ ...prev, password: null }));
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/building-manager/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('password');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        showErrorMessage('password', data.detail || 'Şifre değiştirilemedi');
      }
    } catch (err) {
      showErrorMessage('password', 'Bağlantı hatası');
    } finally {
      setSaving(prev => ({ ...prev, password: false }));
    }
  };

  // Save notification settings
  const handleSaveNotifications = async () => {
    setSaving(prev => ({ ...prev, notifications: true }));
    setError(prev => ({ ...prev, notifications: null }));
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/building-manager/notification-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notifications)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('notifications');
      } else {
        showErrorMessage('notifications', data.detail || 'Bildirim ayarları güncellenemedi');
      }
    } catch (err) {
      showErrorMessage('notifications', 'Bağlantı hatası');
    } finally {
      setSaving(prev => ({ ...prev, notifications: false }));
    }
  };

  // Save Google Calendar config
  const handleSaveGoogleCalendar = async () => {
    setSaving(prev => ({ ...prev, google: true }));
    setError(prev => ({ ...prev, google: null }));
    
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    
    try {
      const res = await fetch(`${API_URL}/api/google-calendar/config/${userData.building_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(googleCalendar)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessMessage('google');
        setGoogleStatus(prev => ({ ...prev, is_configured: true }));
      } else {
        showErrorMessage('google', data.detail || 'Google Calendar ayarları kaydedilemedi');
      }
    } catch (err) {
      showErrorMessage('google', 'Bağlantı hatası');
    } finally {
      setSaving(prev => ({ ...prev, google: false }));
    }
  };

  // Connect Google Account
  const handleConnectGoogle = async () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    
    try {
      const res = await fetch(`${API_URL}/api/google-calendar/auth/${userData.building_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        showErrorMessage('google', data.detail || 'Yetkilendirme URL alınamadı');
      }
    } catch (err) {
      showErrorMessage('google', 'Bağlantı hatası');
    }
  };

  // Disconnect Google Account
  const handleDisconnectGoogle = async () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    
    try {
      await fetch(`${API_URL}/api/google-calendar/config/${userData.building_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setGoogleStatus(prev => ({ ...prev, is_connected: false }));
      showSuccessMessage('google');
    } catch (err) {
      showErrorMessage('google', 'Bağlantı kesilemedi');
    }
  };

  // Check for Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_connected') === 'true') {
      setGoogleStatus(prev => ({ ...prev, is_connected: true }));
      window.history.replaceState({}, document.title, '/settings');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="mt-1 text-sm text-gray-600">Hesap ve sistem ayarlarınızı yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil Bilgileri */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Profil Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="ornek@email.com"
              />
            </div>
            
            {error.profile && (
              <p className="text-sm text-red-600">{error.profile}</p>
            )}
            
            <Button 
              onClick={handleSaveProfile} 
              disabled={saving.profile}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {saving.profile ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : success.profile ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {success.profile ? 'Kaydedildi!' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>

        {/* Bina Bilgileri */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <Building2 className="h-5 w-5 mr-2 text-purple-600" />
              Bina Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="building_name">Bina Adı</Label>
              <Input
                id="building_name"
                value={building.name}
                onChange={(e) => setBuilding({ ...building, name: e.target.value })}
                placeholder="Bina Adı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                value={building.address}
                onChange={(e) => setBuilding({ ...building, address: e.target.value })}
                placeholder="Adres"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">İl</Label>
                <Input
                  id="city"
                  value={building.city}
                  onChange={(e) => setBuilding({ ...building, city: e.target.value })}
                  placeholder="İl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  value={building.district}
                  onChange={(e) => setBuilding({ ...building, district: e.target.value })}
                  placeholder="İlçe"
                />
              </div>
            </div>
            
            {error.building && (
              <p className="text-sm text-red-600">{error.building}</p>
            )}
            
            <Button 
              onClick={handleSaveBuilding} 
              disabled={saving.building}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {saving.building ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : success.building ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {success.building ? 'Kaydedildi!' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>

        {/* Şifre Değiştir */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <Lock className="h-5 w-5 mr-2 text-purple-600" />
              Şifre Değiştir
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Mevcut Şifre</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Yeni Şifre</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {error.password && (
              <p className="text-sm text-red-600">{error.password}</p>
            )}
            
            <Button 
              onClick={handleChangePassword} 
              disabled={saving.password || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {saving.password ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : success.password ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {success.password ? 'Şifre Değiştirildi!' : 'Şifre Değiştir'}
            </Button>
          </CardContent>
        </Card>

        {/* Bildirimler */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <Bell className="h-5 w-5 mr-2 text-purple-600" />
              Bildirim Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications" className="font-medium">E-posta Bildirimleri</Label>
                <p className="text-sm text-gray-500">Önemli güncellemeler için e-posta alın</p>
              </div>
              <Switch
                id="email_notifications"
                checked={notifications.email_notifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms_notifications" className="font-medium">SMS Bildirimleri</Label>
                <p className="text-sm text-gray-500">Acil durumlar için SMS alın</p>
              </div>
              <Switch
                id="sms_notifications"
                checked={notifications.sms_notifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sms_notifications: checked })}
              />
            </div>
            
            {error.notifications && (
              <p className="text-sm text-red-600">{error.notifications}</p>
            )}
            
            <Button 
              onClick={handleSaveNotifications} 
              disabled={saving.notifications}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {saving.notifications ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : success.notifications ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {success.notifications ? 'Kaydedildi!' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
