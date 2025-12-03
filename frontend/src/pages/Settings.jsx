import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    sms_provider: '',
    sms_api_key: '',
    sms_username: '',
    payment_provider: '',
    payment_api_key: '',
    payment_secret_key: '',
    email_from: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          sms_provider: data.sms_provider || '',
          sms_api_key: data.sms_api_key || '',
          sms_username: data.sms_username || '',
          payment_provider: data.payment_provider || '',
          payment_api_key: data.payment_api_key || '',
          payment_secret_key: data.payment_secret_key || '',
          email_from: data.email_from || ''
        });
      } else {
        toast.error('Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Ayarlar kaydedildi');
      } else {
        toast.error('Ayarlar kaydedilemedi');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
        <p className="mt-1 text-sm text-gray-600">Sistem genelindeki entegrasyonları yönetin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SMS Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">SMS Entegrasyonu</CardTitle>
                <CardDescription>Netgsm ve diğer SMS sağlayıcıları için ayarlar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="sms_provider">SMS Sağlayıcısı</Label>
              <Input
                id="sms_provider"
                data-testid="sms-provider-input"
                value={settings.sms_provider}
                onChange={(e) => setSettings({ ...settings, sms_provider: e.target.value })}
                placeholder="örn: Netgsm"
              />
            </div>
            <div>
              <Label htmlFor="sms_username">Kullanıcı Adı</Label>
              <Input
                id="sms_username"
                value={settings.sms_username}
                onChange={(e) => setSettings({ ...settings, sms_username: e.target.value })}
                placeholder="SMS sağlayıcı kullanıcı adı"
              />
            </div>
            <div>
              <Label htmlFor="sms_api_key">API Anahtarı</Label>
              <Input
                id="sms_api_key"
                type="password"
                value={settings.sms_api_key}
                onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                placeholder="SMS API anahtarı"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Ödeme Entegrasyonu</CardTitle>
                <CardDescription>PayTR, İyzico, Paratika vb. ödeme sistemleri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="payment_provider">Ödeme Sağlayıcısı</Label>
              <Input
                id="payment_provider"
                data-testid="payment-provider-input"
                value={settings.payment_provider}
                onChange={(e) => setSettings({ ...settings, payment_provider: e.target.value })}
                placeholder="örn: PayTR, İyzico"
              />
            </div>
            <div>
              <Label htmlFor="payment_api_key">API Anahtarı</Label>
              <Input
                id="payment_api_key"
                type="password"
                value={settings.payment_api_key}
                onChange={(e) => setSettings({ ...settings, payment_api_key: e.target.value })}
                placeholder="Ödeme API anahtarı"
              />
            </div>
            <div>
              <Label htmlFor="payment_secret_key">Gizli Anahtar</Label>
              <Input
                id="payment_secret_key"
                type="password"
                value={settings.payment_secret_key}
                onChange={(e) => setSettings({ ...settings, payment_secret_key: e.target.value })}
                placeholder="Ödeme gizli anahtarı"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">E-posta Ayarları</CardTitle>
            <CardDescription>Sistem e-postaları için ayarlar</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div>
              <Label htmlFor="email_from">Gönderen E-posta</Label>
              <Input
                id="email_from"
                type="email"
                value={settings.email_from}
                onChange={(e) => setSettings({ ...settings, email_from: e.target.value })}
                placeholder="noreply@yourapp.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            data-testid="save-settings-button"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Ayarları Kaydet
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
