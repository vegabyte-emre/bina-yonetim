import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Users, Bell, FileText, TrendingUp, Shield, 
  Smartphone, Clock, CheckCircle, ArrowRight, Mail, Phone, 
  MapPin, Zap, DollarSign, Star, ChevronDown, Play, Menu, X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    building_name: '',
    manager_name: '',
    email: '',
    phone: '',
    address: '',
    apartment_count: '',
  });

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Building,
      title: 'Akıllı Daire Yönetimi',
      description: 'Blok, kat ve daire bilgilerini tek platformda yönetin. Anlık güncelleme ve kolay erişim.'
    },
    {
      icon: Users,
      title: 'Sakin Portalı',
      description: 'Kiracı ve mal sahipleri için özel portal. Tüm bilgiler parmaklarınızın ucunda.'
    },
    {
      icon: DollarSign,
      title: 'Otomatik Aidat',
      description: 'Akıllı aidat takibi, otomatik hatırlatmalar ve detaylı ödeme raporları.'
    },
    {
      icon: Bell,
      title: 'Anlık Bildirimler',
      description: 'Push notification ile tüm sakinlere anında ulaşın. Hiçbir duyuruyu kaçırmayın.'
    }
  ];

  const allFeatures = [
    { icon: Building, text: 'Sınırsız daire yönetimi' },
    { icon: Users, text: 'Sakin ve aidat takibi' },
    { icon: Bell, text: 'Push bildirimler' },
    { icon: FileText, text: 'Talep yönetimi' },
    { icon: TrendingUp, text: 'Detaylı raporlama' },
    { icon: Shield, text: 'Güvenli altyapı' },
    { icon: Smartphone, text: 'Mobil uygulama' },
    { icon: Clock, text: '7/24 destek' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/registration-requests`, formData);
      if (response.data.success) {
        toast.success('Başvurunuz alındı! En kısa sürede sizinle iletişime geçeceğiz.');
        setFormData({
          building_name: '',
          manager_name: '',
          email: '',
          phone: '',
          address: '',
          apartment_count: '',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation - Apple Style */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                yönetioo
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Fiyatlandırma
              </button>
              <button onClick={() => scrollToSection('demo')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Demo
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Giriş Yap
              </button>
              <button 
                onClick={() => scrollToSection('signup')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200"
              >
                Ücretsiz Başla
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-700 hover:text-blue-600 py-2">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-gray-700 hover:text-blue-600 py-2">
                Fiyatlandırma
              </button>
              <button onClick={() => scrollToSection('demo')} className="block w-full text-left text-gray-700 hover:text-blue-600 py-2">
                Demo
              </button>
              <div className="pt-4 border-t space-y-3">
                <button onClick={() => navigate('/login')} className="block w-full text-center py-2.5 text-gray-700 border rounded-full hover:bg-gray-50">
                  Giriş Yap
                </button>
                <button onClick={() => scrollToSection('signup')} className="block w-full text-center py-2.5 text-white bg-blue-600 rounded-full hover:bg-blue-700">
                  Ücretsiz Başla
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Apple Style */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-8">
              <Zap size={16} className="mr-2" />
              Türkiye'nin En Modern Bina Yönetim Sistemi
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-semibold text-gray-900 tracking-tight leading-tight mb-6">
              Bina yönetiminde
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                yeni nesil deneyim.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              Modern arayüz, güçlü özellikler. Apartman ve site yönetimini 
              dijitalleştirin, sakinlerinizi mutlu edin.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => scrollToSection('signup')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-200 transform hover:scale-105"
              >
                Ücretsiz Deneyin
              </button>
              <button 
                onClick={() => scrollToSection('demo')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Play size={20} className="text-blue-600" />
                Demo İzle
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold text-gray-900">500+</div>
                <div className="text-sm text-gray-500 mt-1">Aktif Bina</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold text-gray-900">50K+</div>
                <div className="text-sm text-gray-500 mt-1">Mutlu Sakin</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-semibold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-500 mt-1">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={32} className="text-gray-300" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
              Her şey tek platformda.
            </h2>
            <p className="text-xl text-gray-500">
              Bina yönetimi için ihtiyacınız olan tüm araçlar, modern ve kullanımı kolay bir arayüzde.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-3xl bg-gray-50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-500 hover:shadow-xl hover:shadow-blue-100/50 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <feature.icon size={28} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature List Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-6">
                Güçlü özellikler,
                <span className="block text-blue-600">basit kullanım.</span>
              </h2>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                Yıllarca bina yönetimi deneyimimizi, en modern teknolojilerle birleştirdik. 
                Sonuç: Kullanımı kolay, özellikleri güçlü bir platform.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {allFeatures.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <item.icon size={20} className="text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl transform rotate-3 opacity-10"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-blue-100/50 p-8 border border-gray-100">
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                    <p className="text-gray-500">Platform Tanıtım Videosu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
              Şeffaf fiyatlandırma.
            </h2>
            <p className="text-xl text-gray-500">
              İhtiyacınıza uygun planı seçin. Tüm planlarda 14 gün ücretsiz deneme.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="rounded-3xl border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-100 transition-all duration-500">
              <div className="text-gray-500 font-medium mb-2">Başlangıç</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-semibold text-gray-900">₺499</span>
                <span className="text-gray-500">/ay</span>
              </div>
              <p className="text-gray-500 mb-8">Küçük apartmanlar için ideal</p>
              
              <ul className="space-y-4 mb-8">
                {['50 daireye kadar', 'Temel özellikler', 'Mobil uygulama', 'E-posta desteği'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full py-3 rounded-full border-2 border-gray-200 text-gray-700 font-medium hover:border-blue-600 hover:text-blue-600 transition-colors">
                Başla
              </button>
            </div>

            {/* Pro - Popular */}
            <div className="rounded-3xl bg-gradient-to-b from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-200 transform md:-translate-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-200 font-medium">Profesyonel</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Popüler</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-semibold">₺999</span>
                <span className="text-blue-200">/ay</span>
              </div>
              <p className="text-blue-100 mb-8">Büyüyen siteler için</p>
              
              <ul className="space-y-4 mb-8">
                {['200 daireye kadar', 'Tüm özellikler', 'Push bildirimler', 'Öncelikli destek', 'Detaylı raporlar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-blue-50">
                    <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full py-3 rounded-full bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors">
                Başla
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-100 transition-all duration-500">
              <div className="text-gray-500 font-medium mb-2">Kurumsal</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-semibold text-gray-900">₺1999</span>
                <span className="text-gray-500">/ay</span>
              </div>
              <p className="text-gray-500 mb-8">Büyük siteler ve kompleksler</p>
              
              <ul className="space-y-4 mb-8">
                {['Sınırsız daire', 'Tüm özellikler', 'API erişimi', 'Özel destek', 'SLA garantisi'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="w-full py-3 rounded-full border-2 border-gray-200 text-gray-700 font-medium hover:border-blue-600 hover:text-blue-600 transition-colors">
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
              Canlı demo ile keşfedin.
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              Demo hesabı ile tüm özellikleri ücretsiz deneyin.
            </p>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Yönetici Paneli</h3>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-500 mb-2">E-posta</p>
                    <p className="font-mono text-gray-900">ahmet@mavirezidans.com</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-500 mb-2">Şifre</p>
                    <p className="font-mono text-gray-900">admin123</p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                  >
                    Panele Giriş Yap
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Mobil Uygulama</h3>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-500 mb-2">Telefon</p>
                    <p className="font-mono text-gray-900">5523356797</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-500 mb-2">Şifre</p>
                    <p className="font-mono text-gray-900">123456</p>
                  </div>
                  <button className="w-full py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    <Smartphone size={20} />
                    APK İndir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section id="signup" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-4">
                Hemen başlayın.
              </h2>
              <p className="text-xl text-gray-500">
                Formu doldurun, 24 saat içinde sizinle iletişime geçelim.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bina/Site Adı *</label>
                  <input
                    type="text"
                    value={formData.building_name}
                    onChange={(e) => setFormData({...formData, building_name: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="Örn: Mavi Rezidans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yönetici Adı Soyadı *</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="Adınız ve soyadınız"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="05XX XXX XX XX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Bina adresi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daire Sayısı *</label>
                <input
                  type="number"
                  value={formData.apartment_count}
                  onChange={(e) => setFormData({...formData, apartment_count: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Toplam daire sayısı"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white text-lg font-medium rounded-2xl hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Gönderiliyor...
                  </span>
                ) : (
                  'Ücretsiz Başvuru Yap'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Başvurunuz onaylandıktan sonra 14 gün ücretsiz deneme başlar.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <span className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                yönetioo
              </span>
              <p className="text-gray-400 mt-4">
                Modern bina yönetim sistemi. Apartman ve site yönetimini kolaylaştırıyoruz.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Ürün</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SSS</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">İletişim</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail size={18} />
                  info@yonetioo.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  0850 XXX XX XX
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2024 Yönetioo. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
              <a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a>
              <a href="#" className="hover:text-white transition-colors">KVKK</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
