import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Users, Bell, FileText, TrendingUp, Shield, 
  Smartphone, Clock, CheckCircle, ArrowRight, Mail, Phone, 
  MapPin, Zap, DollarSign, Star, ChevronDown, Play, Menu, X,
  Sparkles, Lock, Globe, BarChart3, MessageSquare, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
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

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const features = [
    {
      icon: Building,
      title: 'Akıllı Bina Yönetimi',
      description: 'Tüm binalarınızı tek bir platformdan yönetin.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: CreditCard,
      title: 'Otomatik Aidat Takibi',
      description: 'Ödemeler anında takip edilsin, hatırlatmalar otomatik gitsin.',
      gradient: 'from-emerald-500 to-teal-400'
    },
    {
      icon: Bell,
      title: 'Anlık Bildirimler',
      description: 'Push notification ile tüm sakinlere anında ulaşın.',
      gradient: 'from-orange-500 to-amber-400'
    },
    {
      icon: BarChart3,
      title: 'Detaylı Raporlar',
      description: 'Gelir-gider analizleri, grafikler ve finansal raporlar.',
      gradient: 'from-purple-500 to-pink-400'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] overflow-x-hidden">
      {/* Navigation - Apple Style */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-xl font-semibold text-[#1d1d1f]">
                yönetioo
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Fiyatlandırma
              </button>
              <button onClick={() => scrollToSection('demo')} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Demo
              </button>
              <button onClick={() => navigate('/login')} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Giriş Yap
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#1d1d1f] hover:bg-black/5 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-12 left-0 right-0 bg-[#fbfbfd]/95 backdrop-blur-2xl border-b border-gray-200/50">
            <div className="px-6 py-4 space-y-1">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-[#1d1d1f] hover:text-blue-600 py-3 text-sm">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-[#1d1d1f] hover:text-blue-600 py-3 text-sm">
                Fiyatlandırma
              </button>
              <button onClick={() => scrollToSection('demo')} className="block w-full text-left text-[#1d1d1f] hover:text-blue-600 py-3 text-sm">
                Demo
              </button>
              <div className="pt-3 border-t border-gray-200">
                <button onClick={() => navigate('/login')} className="block w-full text-left text-[#1d1d1f] py-3 text-sm">
                  Giriş Yap
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Apple Style */}
      <section className="relative pt-28 pb-8 md:pt-32 md:pb-12">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          {/* Headline */}
          <h1 className="text-[40px] md:text-[56px] lg:text-[80px] font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.05] mb-4">
            Bina yönetiminde
          </h1>
          <h1 className="text-[40px] md:text-[56px] lg:text-[80px] font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-[-0.015em] leading-[1.05] mb-6">
            yeni nesil.
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#86868b] max-w-2xl mx-auto mb-8 leading-relaxed">
            Modern arayüz. Güçlü özellikler. Mutlu sakinler.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button 
              onClick={() => scrollToSection('signup')}
              className="group px-7 py-3 bg-[#0071e3] text-white text-sm font-normal rounded-full hover:bg-[#0077ed] transition-all duration-300"
            >
              Ücretsiz Deneyin
              <ArrowRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('demo')}
              className="px-7 py-3 text-[#0071e3] text-sm font-normal hover:underline transition-all"
            >
              Demo hesabı ile dene →
            </button>
          </div>
        </div>

        {/* Hero Visual - Floating Dashboard Preview */}
        <div className="max-w-6xl mx-auto px-6 mt-8">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-transparent blur-3xl -z-10"></div>
            
            {/* Dashboard mockup */}
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-gray-700/50 rounded-md text-xs text-gray-400">
                    yonetioo.com/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard content */}
              <div className="p-4 md:p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                  {[
                    { label: 'Toplam Daire', value: '156', icon: Building, color: 'blue' },
                    { label: 'Aktif Sakin', value: '142', icon: Users, color: 'emerald' },
                    { label: 'Bu Ay Tahsilat', value: '₺45.2K', icon: CreditCard, color: 'purple' },
                    { label: 'Açık Talepler', value: '8', icon: MessageSquare, color: 'orange' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-2 md:mb-3`}>
                        <stat.icon size={16} className={`text-${stat.color}-400`} />
                      </div>
                      <p className="text-lg md:text-2xl font-semibold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                
                {/* Chart placeholder */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium text-sm md:text-base">Aylık Gelir Grafiği</h3>
                    <span className="text-emerald-400 text-xs md:text-sm">+12.5%</span>
                  </div>
                  <div className="flex items-end gap-2 h-24 md:h-32">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[32px] md:text-[48px] font-semibold text-[#1d1d1f] tracking-tight mb-4">
              Her şey düşünüldü.
            </h2>
            <p className="text-lg text-[#86868b] max-w-xl mx-auto">
              Yıllarca bina yönetimi deneyimini, en modern teknolojilerle birleştirdik.
            </p>
          </div>

          {/* Interactive Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-5 md:p-6 rounded-2xl transition-all duration-500 ${
                    activeFeature === index 
                      ? 'bg-white shadow-xl shadow-gray-200/50 scale-[1.02]' 
                      : 'bg-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 ${
                      activeFeature === index ? 'scale-110' : ''
                    } transition-transform duration-500`}>
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1">{feature.title}</h3>
                      <p className="text-[#86868b] text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Feature Visual */}
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].gradient} opacity-10 blur-3xl rounded-full transition-all duration-700`}></div>
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br ${features[activeFeature].gradient} flex items-center justify-center shadow-lg transition-all duration-500`}>
                    {React.createElement(features[activeFeature].icon, { size: 48, className: "text-white" })}
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <h4 className="text-xl font-semibold text-[#1d1d1f] mb-2">{features[activeFeature].title}</h4>
                  <p className="text-[#86868b]">{features[activeFeature].description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-20 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-4">
              Güçlü özellikler. Basit kullanım.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Building, text: 'Sınırsız bina', desc: 'Tüm binalarınız tek platformda' },
              { icon: Users, text: 'Sakin yönetimi', desc: 'Kiracı ve mal sahipleri' },
              { icon: Bell, text: 'Push bildirimler', desc: 'Anında iletişim' },
              { icon: FileText, text: 'Talep sistemi', desc: 'Takip ve raporlama' },
              { icon: TrendingUp, text: 'Detaylı raporlar', desc: 'Gelir-gider analizi' },
              { icon: Shield, text: 'Güvenli altyapı', desc: 'SSL & şifreleme' },
              { icon: Smartphone, text: 'Mobil uygulama', desc: 'iOS & Android' },
              { icon: Clock, text: '7/24 destek', desc: 'Her zaman yanınızda' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] group-hover:bg-blue-50 flex items-center justify-center mb-3 transition-colors">
                  <item.icon size={20} className="text-[#1d1d1f] group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-[#1d1d1f] mb-1">{item.text}</h3>
                <p className="text-sm text-[#86868b]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[32px] md:text-[48px] font-semibold text-[#1d1d1f] tracking-tight mb-4">
              Şeffaf fiyatlandırma.
            </h2>
            <p className="text-lg text-[#86868b]">
              Tüm planlarda 14 gün ücretsiz deneme. Kredi kartı gerekmez.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-2xl bg-white border border-gray-200 p-6 md:p-8 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-[#86868b] text-sm font-medium mb-2">Başlangıç</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[40px] font-semibold text-[#1d1d1f]">₺499</span>
                  <span className="text-[#86868b]">/ay</span>
                </div>
                <p className="text-sm text-[#86868b] mt-2">Küçük apartmanlar için</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {['50 daireye kadar', 'Temel özellikler', 'Mobil uygulama', 'E-posta desteği'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1d1d1f]">
                    <CheckCircle size={18} className="text-[#86868b] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => scrollToSection('signup')}
                className="w-full py-3 rounded-xl border-2 border-[#0071e3] text-[#0071e3] font-medium hover:bg-[#0071e3] hover:text-white transition-all"
              >
                Başla
              </button>
            </div>

            {/* Pro - Popular */}
            <div className="rounded-2xl bg-[#1d1d1f] p-6 md:p-8 text-white relative overflow-hidden transform md:-translate-y-4 shadow-xl">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">Popüler</span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-white/60 text-sm font-medium mb-2">Profesyonel</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[40px] font-semibold">₺999</span>
                  <span className="text-white/60">/ay</span>
                </div>
                <p className="text-sm text-white/60 mt-2">Büyüyen siteler için</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {['200 daireye kadar', 'Tüm özellikler', 'Push bildirimler', 'Öncelikli destek', 'Detaylı raporlar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                    <CheckCircle size={18} className="text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => scrollToSection('signup')}
                className="w-full py-3 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0077ed] transition-all"
              >
                Başla
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl bg-white border border-gray-200 p-6 md:p-8 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-[#86868b] text-sm font-medium mb-2">Kurumsal</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-[40px] font-semibold text-[#1d1d1f]">₺1999</span>
                  <span className="text-[#86868b]">/ay</span>
                </div>
                <p className="text-sm text-[#86868b] mt-2">Büyük siteler için</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {['Sınırsız daire', 'Tüm özellikler', 'API erişimi', 'Özel destek', 'SLA garantisi'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1d1d1f]">
                    <CheckCircle size={18} className="text-[#86868b] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => scrollToSection('signup')}
                className="w-full py-3 rounded-xl border-2 border-[#0071e3] text-[#0071e3] font-medium hover:bg-[#0071e3] hover:text-white transition-all"
              >
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-4">
              Hemen deneyin.
            </h2>
            <p className="text-lg text-[#86868b]">
              Demo hesapları ile tüm özellikleri keşfedin.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Manager Panel */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1d1d1f]">Yönetici Paneli</h3>
                  <p className="text-sm text-[#86868b]">Web uygulaması</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-[#f5f5f7] rounded-xl">
                  <p className="text-xs text-[#86868b] mb-1">E-posta</p>
                  <p className="font-mono text-sm text-[#1d1d1f]">ahmet@mavirezidans.com</p>
                </div>
                <div className="p-4 bg-[#f5f5f7] rounded-xl">
                  <p className="text-xs text-[#86868b] mb-1">Şifre</p>
                  <p className="font-mono text-sm text-[#1d1d1f]">admin123</p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ed] transition-all"
              >
                Panele Giriş Yap
              </button>
            </div>

            {/* Mobile App */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Smartphone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1d1d1f]">Mobil Uygulama</h3>
                  <p className="text-sm text-[#86868b]">Android APK</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-[#f5f5f7] rounded-xl">
                  <p className="text-xs text-[#86868b] mb-1">Telefon</p>
                  <p className="font-mono text-sm text-[#1d1d1f]">5523356797</p>
                </div>
                <div className="p-4 bg-[#f5f5f7] rounded-xl">
                  <p className="text-xs text-[#86868b] mb-1">Şifre</p>
                  <p className="font-mono text-sm text-[#1d1d1f]">123456</p>
                </div>
              </div>
              
              <button className="w-full py-3 bg-[#1d1d1f] text-white rounded-xl font-medium hover:bg-black transition-all flex items-center justify-center gap-2">
                <Smartphone size={18} />
                APK İndir
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section id="signup" className="py-20 md:py-28 bg-white">
        <div className="max-w-[580px] mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-4">
              Hemen başlayın.
            </h2>
            <p className="text-lg text-[#86868b]">
              Formu doldurun, 24 saat içinde sizinle iletişime geçelim.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Bina/Site Adı</label>
                <input
                  type="text"
                  value={formData.building_name}
                  onChange={(e) => setFormData({...formData, building_name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all"
                  placeholder="Örn: Mavi Rezidans"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Yönetici Adı Soyadı</label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all"
                  placeholder="Adınız ve soyadınız"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all"
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Adres</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all"
                placeholder="Bina adresi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Daire Sayısı</label>
              <input
                type="number"
                value={formData.apartment_count}
                onChange={(e) => setFormData({...formData, apartment_count: e.target.value})}
                className="w-full px-4 py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all"
                placeholder="Toplam daire sayısı"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#0071e3] text-white font-medium rounded-xl hover:bg-[#0077ed] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            <p className="text-center text-sm text-[#86868b]">
              Başvurunuz onaylandıktan sonra 14 gün ücretsiz deneme başlar.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-12 border-t border-gray-200">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-4">Ürün</h4>
              <ul className="space-y-3">
                {['Özellikler', 'Fiyatlandırma', 'Demo', 'Güncellemeler'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-4">Şirket</h4>
              <ul className="space-y-3">
                {['Hakkımızda', 'Blog', 'Kariyer', 'İletişim'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-4">Destek</h4>
              <ul className="space-y-3">
                {['Yardım Merkezi', 'SSS', 'Dökümanlar', 'API'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-4">Yasal</h4>
              <ul className="space-y-3">
                {['Gizlilik', 'Kullanım Koşulları', 'KVKK', 'Çerezler'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#86868b]">
                Copyright © 2024 Yönetioo. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f]">Türkiye</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
