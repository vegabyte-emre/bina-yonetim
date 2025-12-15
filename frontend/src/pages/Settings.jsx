import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, CreditCard, TestTube, CheckCircle, XCircle, Loader2, Shield, AlertCircle, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  
  // Netgsm Settings
  const [netgsmConfig, setNetgsmConfig] = useState({
    is_active: false,
    username: '',
    password: '',
    default_sender: ''
  });
  
  // Paratika Settings
  const [paratikaConfig, setParatikaConfig] = useState({
    is_active: false,
    is_live: false,
    merchant: '',
    merchant_user: '',
    merchant_password: '',
    return_url: '',
    cancel_url: ''
  });
  
  // Test SMS
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Yönetioo test mesajı');
  const [sendingSms, setSendingSms] = useState(false);
  
  // Netgsm Balance
  const [netgsmBalance, setNetgsmBalance] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchSettings = async () => {
    try {
      // Netgsm config
      const netgsmRes = await fetch(`${API}/netgsm/config`, { headers: getAuthHeaders() });
      if (netgsmRes.ok) {
        const data = await netgsmRes.json();
        setNetgsmConfig({
          is_active: data.is_active || false,
          username: data.username || '',
          password: data.password || '',
          default_sender: data.default_sender || ''
        });
      }
      
      // Paratika config
      const paratikaRes = await fetch(`${API}/paratika/config`, { headers: getAuthHeaders() });
      if (paratikaRes.ok) {
        const data = await paratikaRes.json();
        setParatikaConfig({
          is_active: data.is_active || false,
          is_live: data.is_live || false,
          merchant: data.merchant || '',
          merchant_user: data.merchant_user || '',
          merchant_password: data.merchant_password || '',
          return_url: data.return_url || '',
          cancel_url: data.cancel_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNetgsmConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/netgsm/config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(netgsmConfig)
      });
      
      if (response.ok) {
        toast.success('Netgsm ayarları kaydedildi');
      } else {
        toast.error('Ayarlar kaydedilemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const saveParatikaConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/paratika/config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paratikaConfig)
      });
      
      if (response.ok) {
        toast.success('Paratika ayarları kaydedildi');
      } else {
        toast.error('Ayarlar kaydedilemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const testNetgsmConnection = async () => {
    setTesting('netgsm');
    try {
      const response = await fetch(`${API}/netgsm/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      if (data.success) {
        setNetgsmBalance(data.balance);
        toast.success('Netgsm bağlantısı başarılı!');
      } else {
        toast.error(data.error || 'Bağlantı hatası');
      }
    } catch (error) {
      toast.error('Bağlantı test edilemedi');
    } finally {
      setTesting(null);
    }
  };

  const testParatikaConnection = async () => {
    setTesting('paratika');
    try {
      const response = await fetch(`${API}/paratika/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Paratika bağlantısı başarılı!');
      } else {
        toast.error(data.error || 'Bağlantı hatası');
      }
    } catch (error) {
      toast.error('Bağlantı test edilemedi');
    } finally {
      setTesting(null);
    }
  };

  const sendTestSms = async () => {
    if (!testPhone) {
      toast.error('Telefon numarası giriniz');
      return;
    }
    
    setSendingSms(true);
    try {
      const response = await fetch(`${API}/netgsm/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phone_numbers: [testPhone],
          message: testMessage
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`SMS gönderildi! Job ID: ${data.job_id}`);
      } else {
        toast.error(data.error || 'SMS gönderilemedi');
      }
    } catch (error) {
      toast.error('SMS gönderilemedi');
    } finally {
      setSendingSms(false);
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
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
        <p className="mt-1 text-sm text-gray-600">SMS ve ödeme entegrasyonlarını yönetin</p>
      </div>

      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS (Netgsm)
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Ödeme (Paratika)
          </TabsTrigger>
        </TabsList>

        {/* NETGSM TAB */}
        <TabsContent value="sms" className="space-y-4 mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Netgsm SMS Entegrasyonu</CardTitle>
                    <CardDescription>Türkiye'nin lider SMS sağlayıcısı</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="netgsm-active" className="text-sm">Aktif</Label>
                  <Switch
                    id="netgsm-active"
                    checked={netgsmConfig.is_active}
                    onCheckedChange={(checked) => setNetgsmConfig({...netgsmConfig, is_active: checked})}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Netgsm Hesabı Gerekli</p>
                    <p>SMS göndermek için <a href="https://www.netgsm.com.tr" target="_blank" rel="noreferrer" className="underline">netgsm.com.tr</a> adresinden hesap oluşturun. Alt kullanıcı oluşturup API yetkisi vermeyi unutmayın.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="netgsm-username">Abone Numarası (Username)</Label>
                  <Input
                    id="netgsm-username"
                    value={netgsmConfig.username}
                    onChange={(e) => setNetgsmConfig({...netgsmConfig, username: e.target.value})}
                    placeholder="850XXXXXXX veya 312XXXXXXX"
                  />
                  <p className="text-xs text-gray-500 mt-1">Netgsm abone numaranız</p>
                </div>
                <div>
                  <Label htmlFor="netgsm-password">Alt Kullanıcı Şifresi</Label>
                  <Input
                    id="netgsm-password"
                    type="password"
                    value={netgsmConfig.password}
                    onChange={(e) => setNetgsmConfig({...netgsmConfig, password: e.target.value})}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1">API yetkili alt kullanıcı şifresi</p>
                </div>
              </div>

              <div>
                <Label htmlFor="netgsm-sender">Varsayılan Gönderici Adı</Label>
                <Input
                  id="netgsm-sender"
                  value={netgsmConfig.default_sender}
                  onChange={(e) => setNetgsmConfig({...netgsmConfig, default_sender: e.target.value})}
                  placeholder="YONETIOO"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 mt-1">En fazla 11 karakter. Netgsm'de tanımlı olmalı.</p>
              </div>

              {/* Balance Info */}
              {netgsmBalance && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Bakiye Bilgisi</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {netgsmBalance.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-700">{item.amount}</p>
                        <p className="text-xs text-gray-600">{item.balance_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button onClick={saveNetgsmConfig} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Kaydet
                </Button>
                <Button onClick={testNetgsmConnection} variant="outline" disabled={testing === 'netgsm'}>
                  {testing === 'netgsm' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Bağlantıyı Test Et
                </Button>
              </div>

              {/* Test SMS Section */}
              {netgsmConfig.is_active && (
                <div className="border-t pt-6 mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Test SMS Gönder</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="test-phone">Telefon Numarası</Label>
                      <Input
                        id="test-phone"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="5XXXXXXXXX"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="test-message">Mesaj</Label>
                      <Input
                        id="test-message"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Test mesajınız"
                      />
                    </div>
                  </div>
                  <Button onClick={sendTestSms} disabled={sendingSms} className="mt-4" variant="outline">
                    {sendingSms ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Test SMS Gönder
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARATIKA TAB */}
        <TabsContent value="payment" className="space-y-4 mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paratika Ödeme Sistemi</CardTitle>
                    <CardDescription>Asseco SEE tarafından sağlanan güvenli ödeme altyapısı</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {paratikaConfig.is_live ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Canlı Mod
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Test Modu
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="paratika-active" className="text-sm">Aktif</Label>
                    <Switch
                      id="paratika-active"
                      checked={paratikaConfig.is_active}
                      onCheckedChange={(checked) => setParatikaConfig({...paratikaConfig, is_active: checked})}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Live Mode Toggle */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">Canlı Mod</p>
                      <p className="text-sm text-amber-700">Gerçek ödemeler için canlı moda geçin. Test modunda sadece test kartları çalışır.</p>
                    </div>
                  </div>
                  <Switch
                    checked={paratikaConfig.is_live}
                    onCheckedChange={(checked) => setParatikaConfig({...paratikaConfig, is_live: checked})}
                  />
                </div>
              </div>

              {/* API Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="paratika-merchant">Merchant Kodu</Label>
                  <Input
                    id="paratika-merchant"
                    value={paratikaConfig.merchant}
                    onChange={(e) => setParatikaConfig({...paratikaConfig, merchant: e.target.value})}
                    placeholder="700XXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="paratika-user">Merchant User</Label>
                  <Input
                    id="paratika-user"
                    value={paratikaConfig.merchant_user}
                    onChange={(e) => setParatikaConfig({...paratikaConfig, merchant_user: e.target.value})}
                    placeholder="API kullanıcı adı"
                  />
                </div>
                <div>
                  <Label htmlFor="paratika-password">Merchant Password</Label>
                  <Input
                    id="paratika-password"
                    type="password"
                    value={paratikaConfig.merchant_password}
                    onChange={(e) => setParatikaConfig({...paratikaConfig, merchant_password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paratika-return">Başarılı Ödeme Dönüş URL</Label>
                  <Input
                    id="paratika-return"
                    value={paratikaConfig.return_url}
                    onChange={(e) => setParatikaConfig({...paratikaConfig, return_url: e.target.value})}
                    placeholder="https://yonetioo.com/odeme/basarili"
                  />
                </div>
                <div>
                  <Label htmlFor="paratika-cancel">İptal Dönüş URL</Label>
                  <Input
                    id="paratika-cancel"
                    value={paratikaConfig.cancel_url}
                    onChange={(e) => setParatikaConfig({...paratikaConfig, cancel_url: e.target.value})}
                    placeholder="https://yonetioo.com/odeme/iptal"
                  />
                </div>
              </div>

              {/* Test Card Info */}
              {!paratikaConfig.is_live && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Test Kartı Bilgileri</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Kart No</p>
                      <p className="font-mono">4355 0840 0000 0016</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Son Kullanma</p>
                      <p className="font-mono">12/30</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CVV</p>
                      <p className="font-mono">000</p>
                    </div>
                    <div>
                      <p className="text-gray-500">3D Şifre</p>
                      <p className="font-mono">a</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button onClick={saveParatikaConfig} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Kaydet
                </Button>
                <Button onClick={testParatikaConnection} variant="outline" disabled={testing === 'paratika'}>
                  {testing === 'paratika' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                  Bağlantıyı Test Et
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
