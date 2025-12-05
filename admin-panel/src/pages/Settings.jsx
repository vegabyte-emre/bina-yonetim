import React from 'react';
import { Settings as SettingsIcon, User, Bell, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Settings = () => {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="mt-1 text-sm text-gray-600">Hesap ve sistem ayarlarınızı yönetin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Profil Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Profil bilgilerinizi güncelleyin</p>
            <div className="mt-4">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Düzenle
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <Lock className="h-5 w-5 mr-2 text-purple-600" />
              Şifre Değiştir
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Güvenlik için düzenli olarak şifrenizi değiştirin</p>
            <div className="mt-4">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Şifre Değiştir
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <Bell className="h-5 w-5 mr-2 text-purple-600" />
              Bildirimler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Bildirim tercihlerinizi yönetin</p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">E-posta bildirimleri</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">SMS bildirimleri</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <SettingsIcon className="h-5 w-5 mr-2 text-purple-600" />
              Sistem Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Genel sistem ayarları</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Yapım aşamasında...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
