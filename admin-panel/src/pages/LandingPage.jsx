import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Users, Bell, FileText, TrendingUp, Shield, 
  Smartphone, Clock, CheckCircle, ArrowRight, Mail, Phone, 
  MapPin, Zap, DollarSign, Star
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    building_name: '',
    manager_name: '',
    email: '',
    phone: '',
    address: '',
    apartment_count: '',
  });

  const features = [
    {
      icon: Building,
      title: 'Daire Yönetimi',
      description: 'Tüm dairelerinizi tek bir yerden yönetin. Blok, kat ve daire bilgilerini kolayca takip edin.'
    },
    {
      icon: Users,
      title: 'Sakin Takibi',
      description: 'Kiracı ve mal sahiplerinin bilgilerini kaydedin. İletişim bilgilerine anında erişin.'
    },
    {
      icon: DollarSign,
      title: 'Aidat Yönetimi',
      description: 'Aidat takibi, ödeme kontrolü ve borç takibi. Otomatik hatırlatmalar gönderin.'
    },
    {
      icon: Bell,
      title: 'Anlık Duyurular',
      description: 'Tüm sakinlere anında duyuru gönderin. Push bildirim desteği ile mobil uygulama entegrasyonu.'
    },
    {
      icon: FileText,
      title: 'Talep Yönetimi',
      description: 'Sakinlerin taleplerini takip edin. Şikayet ve arıza bildirimlerini yönetin.'
    },
    {
      icon: TrendingUp,
      title: 'Raporlama',
      description: 'Detaylı mali raporlar, tahsilat özetleri ve grafikler ile binanızı analiz edin.'
    },
    {
      icon: Smartphone,
      title: 'Mobil Uygulama',
      description: 'Sakinler için Android ve iOS mobil uygulama. Her yerden erişim.'
    },
    {
      icon: Shield,
      title: 'Güvenli Veri',
      description: 'Tüm verileriniz şifrelenmiş ve güvenli sunucularda saklanır. KVKK uyumlu.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Başlangıç',
      price: '499',
      period: 'ay',
      description: 'Küçük siteler için',
      features: [
        '50 daireye kadar',
        'Temel özellikler',
        'Mobil uygulama',
        'Email desteği',
        '5 GB depolama'
      ],
      popular: false
    },
    {
      name: 'Profesyonel',
      price: '999',
      period: 'ay',
      description: 'Orta büyüklükte siteler',
      features: [
        '200 daireye kadar',
        'Tüm özellikler',
        'Mobil uygulama',
        'Öncelikli destek',
        '20 GB depolama',
        'Push bildirim',
        'Detaylı raporlar'
      ],
      popular: true
    },
    {
      name: 'Kurumsal',
      price: 'Özel',
      period: '',
      description: 'Büyük siteler ve yönetim şirketleri',
      features: [
        'Sınırsız daire',
        'Tüm özellikler',
        'Çoklu bina yönetimi',
        '7/24 destek',
        'Sınırsız depolama',
        'API entegrasyonu',
        'Özel eğitim'
      ],
      popular: false
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/registration-requests`, formData);
      toast.success('Başvurunuz alındı! En kısa sürede size dönüş yapacağız.');
      setFormData({
        building_name: '',
        manager_name: '',
        email: '',
        phone: '',
        address: '',
        apartment_count: '',
      });
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">Bina Yönetim Sistemi</span>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                Giriş Yap
              </Button>
              <Button 
                onClick={() => document.getElementById('kayit-form').scrollIntoView({ behavior: 'smooth' })}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Ücretsiz Deneyin
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Türkiye'nin En Gelişmiş Bina Yönetim Sistemi</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Apartman Yönetimini
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> Dijitalleştirin</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Modern, kullanıcı dostu arayüz ile tüm apartman işlemlerinizi tek bir platformdan yönetin. 
            Mobil uygulama ile sakinleriniz de sisteme dahil olsun.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('kayit-form').scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-8 py-6"
            >
              Hemen Başlayın
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('ozellikler').scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              Özellikleri İncele
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600">Aktif Bina</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
              <div className="text-gray-600">Mutlu Sakin</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-xl text-gray-600">
              Apartman yönetimi için ihtiyacınız olan her şey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fiyatlandırma
            </h2>
            <p className="text-xl text-gray-600">
              İhtiyacınıza göre paket seçin
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-2 border-purple-600 shadow-2xl scale-105' : 'border-0 shadow-lg'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      En Popüler
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    {plan.price === 'Özel' ? (
                      <span className="text-4xl font-bold text-gray-900">Özel Fiyat</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{plan.price}₺</span>
                        <span className="text-gray-600">/{plan.period}</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : 'bg-gray-900 hover:bg-gray-800'} text-white`}
                    onClick={() => document.getElementById('kayit-form').scrollIntoView({ behavior: 'smooth' })}
                  >
                    Başvur
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="kayit-form" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Hemen Başlayın
            </h2>
            <p className="text-xl text-gray-600">
              Formu doldurun, size hemen dönüş yapalım
            </p>
          </div>
          
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="building_name">Bina/Site Adı *</Label>
                  <Input
                    id="building_name"
                    required
                    value={formData.building_name}
                    onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                    placeholder="Örn: Mavi Rezidans"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="manager_name">Yönetici Adı Soyadı *</Label>
                  <Input
                    id="manager_name"
                    required
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="Adınız ve soyadınız"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ornek@email.com"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Bina adresi"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="apartment_count">Daire Sayısı *</Label>
                  <Input
                    id="apartment_count"
                    type="number"
                    required
                    min="1"
                    value={formData.apartment_count}
                    onChange={(e) => setFormData({ ...formData, apartment_count: e.target.value })}
                    placeholder="Toplam daire sayısı"
                    className="mt-2"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
                >
                  {loading ? 'Gönderiliyor...' : 'Başvuru Gönder'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-6 w-6" />
                <span className="text-xl font-bold">Bina Yönetim</span>
              </div>
              <p className="text-gray-400 text-sm">
                Modern apartman yönetimi için profesyonel çözümler.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Özellikler</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Daire Yönetimi</li>
                <li>Aidat Takibi</li>
                <li>Duyurular</li>
                <li>Mobil Uygulama</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Hakkımızda</li>
                <li>İletişim</li>
                <li>Gizlilik Politikası</li>
                <li>Kullanım Koşulları</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">İletişim</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@binayonetim.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  0850 XXX XX XX
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  İstanbul, Türkiye
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>© 2025 Bina Yönetim Sistemi. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
