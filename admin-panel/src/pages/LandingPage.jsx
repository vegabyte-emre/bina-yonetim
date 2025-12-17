import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  Building, Users, Bell, FileText, TrendingUp, Shield, 
  Smartphone, Clock, CheckCircle, ArrowRight, Mail, Phone, 
  MapPin, Zap, Star, Menu, X, BarChart3, MessageSquare, CreditCard,
  Home, CalendarCheck, Vote, Megaphone, PieChart, Lock, Globe,
  Headphones, Wifi, Layers, Settings, Award, Heart, ChevronRight, Video
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
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({
    building_name: '',
    manager_name: '',
    email: '',
    phone: '',
    address: '',
    apartment_count: '',
  });

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/subscriptions/public`);
        if (response.data && response.data.length > 0) {
          setSubscriptionPlans(response.data);
        }
      } catch (error) {
        console.error('Planlar yüklenemedi:', error);
      }
    };
    fetchPlans();
  }, []);

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
      description: 'Tüm binalarınızı tek bir platformdan yönetin. Blok, daire ve sakin bilgileriniz her zaman güncel.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: CreditCard,
      title: 'Otomatik Aidat Takibi',
      description: 'Ödemeler anında takip edilsin, hatırlatmalar otomatik gitsin. Tahsilat hiç bu kadar kolay olmamıştı.',
      gradient: 'from-emerald-500 to-teal-400'
    },
    {
      icon: Bell,
      title: 'Anlık Bildirimler',
      description: 'Push notification ile tüm sakinlere anında ulaşın. Duyurular, toplantılar, acil durumlar.',
      gradient: 'from-orange-500 to-amber-400'
    },
    {
      icon: BarChart3,
      title: 'Detaylı Raporlar',
      description: 'Gelir-gider analizleri, grafikler ve finansal raporlar. Excel ve PDF olarak indirin.',
      gradient: 'from-purple-500 to-pink-400'
    }
  ];

  const stats = [
    { value: '500+', label: 'Aktif Bina' },
    { value: '25.000+', label: 'Mutlu Sakin' },
    { value: '₺2M+', label: 'Aylık Tahsilat' },
    { value: '%99.9', label: 'Uptime' },
  ];

  const testimonials = [
    {
      name: 'Mehmet Kaya',
      role: 'Site Yöneticisi',
      company: 'Yeşil Vadi Sitesi',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      content: 'Yönetioo ile aidat takibi çok kolaylaştı. Artık Excel tablolarıyla uğraşmıyorum.',
      rating: 5
    },
    {
      name: 'Ayşe Demir',
      role: 'Apartman Yöneticisi',
      company: 'Mavi Apartmanı',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      content: 'Mobil uygulama sayesinde sakinlerle iletişim kurabiliyorum. Harika bir çözüm!',
      rating: 5
    },
    {
      name: 'Ali Yılmaz',
      role: 'Yönetim Kurulu Başkanı',
      company: 'Park Rezidans',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      content: 'Raporlama özellikleri muhasebecimizin işini çok kolaylaştırdı. Kesinlikle tavsiye ederim.',
      rating: 5
    },
  ];

  const faqs = [
    {
      question: 'Yönetioo nasıl çalışır?',
      answer: 'Yönetioo, web tabanlı bir bina yönetim platformudur. Kayıt olduktan sonra binalarınızı, dairelerinizi ve sakinlerinizi sisteme ekleyerek hemen kullanmaya başlayabilirsiniz.'
    },
    {
      question: 'Mobil uygulama mevcut mu?',
      answer: 'Evet! Sakinler için iOS ve Android uygulamalarımız mevcuttur. Sakinler aidat ödemelerini takip edebilir, duyuruları görebilir ve taleplerini iletebilir.'
    },
    {
      question: 'Verilerim güvende mi?',
      answer: 'Kesinlikle. Tüm veriler SSL ile şifrelenir ve Türkiye\'de bulunan güvenli sunucularda saklanır. KVKK uyumlu altyapımızla verileriniz güvende.'
    },
    {
      question: 'Kaç bina ekleyebilirim?',
      answer: 'Plan türüne göre değişir. Başlangıç planında 1 bina, Profesyonel planında 5 bina, Kurumsal planında sınırsız bina ekleyebilirsiniz.'
    },
    {
      question: 'Destek alabilir miyim?',
      answer: 'Elbette! E-posta, telefon ve canlı destek kanallarımızdan 7/24 destek alabilirsiniz. Ayrıca kapsamlı yardım merkezimiz de hizmetinizde.'
    },
  ];

  const allFeatures = [
    { icon: Building, text: 'Sınırsız bina', desc: 'Tüm binalarınız tek platformda' },
    { icon: Users, text: 'Sakin yönetimi', desc: 'Kiracı ve mal sahipleri' },
    { icon: Bell, text: 'Push bildirimler', desc: 'Anında iletişim' },
    { icon: FileText, text: 'Talep sistemi', desc: 'Takip ve raporlama' },
    { icon: TrendingUp, text: 'Detaylı raporlar', desc: 'Gelir-gider analizi' },
    { icon: Shield, text: 'Güvenli altyapı', desc: 'SSL & şifreleme' },
    { icon: Smartphone, text: 'Mobil uygulama', desc: 'iOS & Android' },
    { icon: Clock, text: '7/24 destek', desc: 'Her zaman yanınızda' },
    { icon: CalendarCheck, text: 'Toplantı yönetimi', desc: 'Planlama ve tutanaklar' },
    { icon: Video, text: 'Google Meet', desc: 'Online toplantı desteği' },
    { icon: Vote, text: 'Oylama sistemi', desc: 'Demokratik kararlar' },
    { icon: Megaphone, text: 'Duyuru sistemi', desc: 'Anlık bilgilendirme' },
    { icon: PieChart, text: 'Gider takibi', desc: 'Kategorize edilmiş giderler' },
  ];

  // WhatsApp number
  const whatsappNumber = "905321111111"; // Replace with actual number

  return (
    <div className="min-h-screen bg-[#fbfbfd] overflow-x-hidden">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Yönetioo - Türkiye'nin En Modern Bina Yönetim Sistemi</title>
        <meta name="description" content="Yönetioo ile bina ve site yönetimini dijitalleştirin. Aidat takibi, sakin yönetimi, push bildirimler, Google Meet toplantıları ve daha fazlası. 14 gün ücretsiz deneyin." />
        <meta name="keywords" content="bina yönetimi, site yönetimi, aidat takibi, apartman yönetimi, sakin yönetimi, yönetici programı, aidat programı, site yönetim yazılımı" />
        <meta property="og:title" content="Yönetioo - Akıllı Bina Yönetim Sistemi" />
        <meta property="og:description" content="Modern arayüz, güçlü özellikler, mutlu sakinler. Bina yönetiminde yeni nesil." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yonetioo.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://yonetioo.com" />
      </Helmet>

      {/* Sticky WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=Merhaba, Yönetioo hakkında bilgi almak istiyorum.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
        aria-label="WhatsApp ile iletişime geçin"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="absolute right-16 bg-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Bize yazın
        </span>
      </a>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-lg sm:text-xl font-semibold text-[#1d1d1f]">
                yönetioo
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Anasayfa
              </button>
              <button onClick={() => scrollToSection('features')} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
                Fiyatlandırma
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
            <div className="px-4 sm:px-6 py-4 space-y-1">
              <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block w-full text-left text-[#1d1d1f] hover:text-blue-600 py-3 text-sm">
                Anasayfa
              </button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-[#1d1d1f] hover:text-blue-600 py-3 text-sm">
                Özellikler
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-[#1d1d1f] hover:text-blue-600 py-3 text-sm">
                Fiyatlandırma
              </button>
              <div className="pt-3 border-t border-gray-200">
                <button onClick={() => navigate('/login')} className="block w-full text-left text-[#1d1d1f] py-3 text-sm font-medium">
                  Giriş Yap
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 sm:pt-28 md:pt-32 md:pb-16">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-xs sm:text-sm text-blue-600 font-medium">Türkiye'nin en modern bina yönetim sistemi</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-[40px] md:text-[56px] lg:text-[72px] font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.1] mb-3 sm:mb-4">
            Bina yönetiminde
          </h1>
          <h1 className="text-3xl sm:text-[40px] md:text-[56px] lg:text-[72px] font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-[-0.015em] leading-[1.1] mb-4 sm:mb-6">
            yeni nesil.
          </h1>
          
          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-[#86868b] max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
            Modern arayüz. Güçlü özellikler. Mutlu sakinler.
            <br className="hidden sm:block" />
            <span className="text-[#1d1d1f]">14 gün ücretsiz deneyin.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 px-4">
            <button 
              onClick={() => scrollToSection('signup')}
              className="w-full sm:w-auto group px-6 sm:px-8 py-3 sm:py-3.5 bg-[#0071e3] text-white text-sm font-medium rounded-full hover:bg-[#0077ed] transition-all duration-300 shadow-lg shadow-blue-500/25"
            >
              Ücretsiz Başlayın
              <ArrowRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-[#0071e3] text-sm font-medium border border-[#0071e3]/30 rounded-full hover:bg-blue-50 transition-all"
            >
              Özellikleri Keşfedin
            </button>
          </div>
        </div>

        {/* Hero Visual - Building Image + Dashboard */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-transparent to-transparent blur-3xl -z-10"></div>
            
            {/* Background Building Image */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80" 
                alt="Modern bina"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60"></div>
            </div>

            <div className="relative bg-gradient-to-b from-gray-900/95 to-gray-800/95 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50 backdrop-blur-sm">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 border-b border-gray-700/50">
                <div className="flex gap-1 sm:gap-1.5">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 sm:px-4 py-1 bg-gray-700/50 rounded-md text-[10px] sm:text-xs text-gray-400">
                    yonetioo.com/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard content */}
              <div className="p-3 sm:p-4 md:p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                  {[
                    { label: 'Toplam Daire', value: '156', icon: Building, color: 'blue' },
                    { label: 'Aktif Sakin', value: '142', icon: Users, color: 'emerald' },
                    { label: 'Bu Ay Tahsilat', value: '₺45.2K', icon: CreditCard, color: 'purple' },
                    { label: 'Açık Talepler', value: '8', icon: MessageSquare, color: 'orange' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-white/10">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-1 sm:mb-2 md:mb-3`}>
                        <stat.icon size={14} className={`text-${stat.color}-400 sm:w-4 sm:h-4 md:w-5 md:h-5`} />
                      </div>
                      <p className="text-sm sm:text-lg md:text-2xl font-semibold text-white">{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                
                {/* Chart */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-white font-medium text-xs sm:text-sm md:text-base">Aylık Gelir Grafiği</h3>
                    <span className="text-emerald-400 text-[10px] sm:text-xs md:text-sm">+12.5%</span>
                  </div>
                  <div className="flex items-end gap-1 sm:gap-2 h-16 sm:h-24 md:h-32">
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

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white border-y border-gray-100">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm text-[#86868b]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-28 bg-white">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-[32px] md:text-[48px] font-semibold text-[#1d1d1f] tracking-tight mb-3 sm:mb-4">
              Her şey düşünüldü.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#86868b] max-w-xl mx-auto px-4">
              Yıllarca bina yönetimi deneyimini, en modern teknolojilerle birleştirdik.
            </p>
          </div>

          {/* Interactive Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl transition-all duration-500 ${
                    activeFeature === index 
                      ? 'bg-white shadow-xl shadow-gray-200/50 scale-[1.02]' 
                      : 'bg-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 ${
                      activeFeature === index ? 'scale-110' : ''
                    } transition-transform duration-500`}>
                      <feature.icon size={20} className="text-white sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-[#1d1d1f] mb-1">{feature.title}</h3>
                      <p className="text-[#86868b] text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Feature Visual */}
            <div className="relative order-1 lg:order-2">
              <div className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].gradient} opacity-10 blur-3xl rounded-full transition-all duration-700`}></div>
              <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-200/50 p-4 sm:p-6 md:p-8 border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${features[activeFeature].gradient} flex items-center justify-center shadow-lg transition-all duration-500`}>
                    {React.createElement(features[activeFeature].icon, { size: 40, className: "text-white sm:w-12 sm:h-12" })}
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                  <h4 className="text-lg sm:text-xl font-semibold text-[#1d1d1f] mb-2">{features[activeFeature].title}</h4>
                  <p className="text-sm text-[#86868b]">{features[activeFeature].description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-16 sm:py-20 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-3 sm:mb-4">
              Güçlü özellikler. Basit kullanım.
            </h2>
            <p className="text-sm sm:text-base text-[#86868b] max-w-lg mx-auto">
              İhtiyacınız olan tüm araçlar tek bir platformda.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {allFeatures.map((item, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group cursor-default">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#f5f5f7] group-hover:bg-blue-50 flex items-center justify-center mb-2 sm:mb-3 transition-colors">
                  <item.icon size={16} className="text-[#1d1d1f] group-hover:text-blue-600 transition-colors sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-semibold text-[#1d1d1f] mb-1 text-sm sm:text-base">{item.text}</h3>
                <p className="text-xs sm:text-sm text-[#86868b]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 md:py-28 bg-white">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-[32px] md:text-[48px] font-semibold text-[#1d1d1f] tracking-tight mb-3 sm:mb-4">
              Müşterilerimiz ne diyor?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#86868b]">
              Binlerce yönetici Yönetioo'yu tercih ediyor.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#f5f5f7] rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-[#1d1d1f] mb-4 text-sm sm:text-base leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <img src={testimonial.image} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-[#1d1d1f] text-sm">{testimonial.name}</p>
                    <p className="text-xs text-[#86868b]">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 md:py-28 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-[32px] md:text-[48px] font-semibold text-[#1d1d1f] tracking-tight mb-3 sm:mb-4">
              Şeffaf fiyatlandırma.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#86868b]">
              Tüm planlarda 14 gün ücretsiz deneme. Kredi kartı gerekmez.
            </p>
          </div>

          {/* Dynamic Plans from API */}
          {subscriptionPlans.length > 0 ? (
            <div className={`grid gap-4 sm:gap-6 ${subscriptionPlans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : subscriptionPlans.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {subscriptionPlans.map((plan, index) => {
                const isPopular = index === 1 || subscriptionPlans.length === 1;
                return (
                  <div 
                    key={plan.id} 
                    className={`rounded-2xl p-5 sm:p-6 md:p-8 transition-all duration-300 ${
                      isPopular 
                        ? 'bg-[#1d1d1f] text-white relative overflow-hidden md:-translate-y-4 shadow-xl' 
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">Popüler</span>
                      </div>
                    )}
                    
                    <div className="mb-5 sm:mb-6">
                      <h3 className={`text-xs sm:text-sm font-medium mb-2 ${isPopular ? 'text-white/60' : 'text-[#86868b]'}`}>
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl sm:text-[40px] font-semibold ${isPopular ? 'text-white' : 'text-[#1d1d1f]'}`}>
                          ₺{plan.price_monthly?.toLocaleString('tr-TR')}
                        </span>
                        <span className={`text-sm ${isPopular ? 'text-white/60' : 'text-[#86868b]'}`}>/ay</span>
                      </div>
                      <p className={`text-xs sm:text-sm mt-2 ${isPopular ? 'text-white/60' : 'text-[#86868b]'}`}>
                        {plan.description || `${plan.max_apartments} daireye kadar`}
                      </p>
                    </div>
                    
                    <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                      <li className={`flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ${isPopular ? 'text-white/90' : 'text-[#1d1d1f]'}`}>
                        <CheckCircle size={16} className={`flex-shrink-0 ${isPopular ? 'text-blue-400' : 'text-[#86868b]'}`} />
                        {plan.max_apartments === 999999 || plan.max_apartments > 1000 ? 'Sınırsız daire' : `${plan.max_apartments} daireye kadar`}
                      </li>
                      {plan.features?.slice(0, 4).map((feature, i) => (
                        <li key={i} className={`flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ${isPopular ? 'text-white/90' : 'text-[#1d1d1f]'}`}>
                          <CheckCircle size={16} className={`flex-shrink-0 ${isPopular ? 'text-blue-400' : 'text-[#86868b]'}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <button 
                      onClick={() => scrollToSection('signup')}
                      className={`w-full py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm ${
                        isPopular 
                          ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]' 
                          : 'border-2 border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3] hover:text-white'
                      }`}
                    >
                      Başla
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback - Static Plans */
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {/* Starter */}
              <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 md:p-8 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-[#86868b] text-xs sm:text-sm font-medium mb-2">Başlangıç</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-[40px] font-semibold text-[#1d1d1f]">₺499</span>
                    <span className="text-sm text-[#86868b]">/ay</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#86868b] mt-2">Küçük apartmanlar için</p>
                </div>
                
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {['50 daireye kadar', 'Temel özellikler', 'Mobil uygulama', 'E-posta desteği'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#1d1d1f]">
                      <CheckCircle size={16} className="text-[#86868b] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => scrollToSection('signup')}
                  className="w-full py-2.5 sm:py-3 rounded-xl border-2 border-[#0071e3] text-[#0071e3] font-medium hover:bg-[#0071e3] hover:text-white transition-all text-sm"
                >
                  Başla
                </button>
              </div>

              {/* Pro */}
              <div className="rounded-2xl bg-[#1d1d1f] p-5 sm:p-6 md:p-8 text-white relative overflow-hidden md:-translate-y-4 shadow-xl">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">Popüler</span>
                </div>
                
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-2">Profesyonel</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-[40px] font-semibold">₺999</span>
                    <span className="text-sm text-white/60">/ay</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 mt-2">Büyüyen siteler için</p>
                </div>
                
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {['200 daireye kadar', 'Tüm özellikler', 'Push bildirimler', 'Öncelikli destek'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/90">
                      <CheckCircle size={16} className="text-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => scrollToSection('signup')}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-[#0071e3] text-white font-medium hover:bg-[#0077ed] transition-all text-sm"
                >
                  Başla
                </button>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl bg-white border border-gray-200 p-5 sm:p-6 md:p-8 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-[#86868b] text-xs sm:text-sm font-medium mb-2">Kurumsal</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-[40px] font-semibold text-[#1d1d1f]">₺1999</span>
                    <span className="text-sm text-[#86868b]">/ay</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#86868b] mt-2">Büyük siteler için</p>
                </div>
                
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {['Sınırsız daire', 'Tüm özellikler', 'API erişimi', 'Özel destek'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#1d1d1f]">
                      <CheckCircle size={16} className="text-[#86868b] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => scrollToSection('signup')}
                  className="w-full py-2.5 sm:py-3 rounded-xl border-2 border-[#0071e3] text-[#0071e3] font-medium hover:bg-[#0071e3] hover:text-white transition-all text-sm"
                >
                  İletişime Geç
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-3 sm:mb-4">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-[#f5f5f7] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between"
                >
                  <span className="font-medium text-[#1d1d1f] text-sm sm:text-base pr-4">{faq.question}</span>
                  <ChevronRight 
                    size={18} 
                    className={`text-[#86868b] transition-transform flex-shrink-0 ${activeFaq === index ? 'rotate-90' : ''}`} 
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <p className="text-sm text-[#86868b] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section id="signup" className="py-16 sm:py-20 md:py-28 bg-[#f5f5f7]">
        <div className="max-w-[580px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-3 sm:mb-4">
              Hemen başlayın.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#86868b]">
              Formu doldurun, 24 saat içinde sizinle iletişime geçelim.
            </p>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#1d1d1f] mb-1.5 sm:mb-2">Bina/Site Adı</label>
                  <input
                    type="text"
                    value={formData.building_name}
                    onChange={(e) => setFormData({...formData, building_name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all text-sm"
                    placeholder="Örn: Mavi Rezidans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#1d1d1f] mb-1.5 sm:mb-2">Yönetici Adı Soyadı</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all text-sm"
                    placeholder="Adınız ve soyadınız"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#1d1d1f] mb-1.5 sm:mb-2">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all text-sm"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#1d1d1f] mb-1.5 sm:mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all text-sm"
                    placeholder="05XX XXX XX XX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1d1d1f] mb-1.5 sm:mb-2">Adres</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all text-sm"
                  placeholder="Bina adresi"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#1d1d1f] mb-1.5 sm:mb-2">Daire Sayısı</label>
                <input
                  type="number"
                  value={formData.apartment_count}
                  onChange={(e) => setFormData({...formData, apartment_count: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#f5f5f7] border-0 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3] focus:bg-white transition-all text-sm"
                  placeholder="Toplam daire sayısı"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-[#0071e3] text-white font-medium rounded-xl hover:bg-[#0077ed] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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

              <p className="text-center text-xs sm:text-sm text-[#86868b]">
                Başvurunuz onaylandıktan sonra 14 gün ücretsiz deneme başlar.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1d1d1f] to-gray-900">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4">
            Bina yönetimini kolaylaştırmaya hazır mısınız?
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto">
            Binlerce yönetici Yönetioo ile zamandan tasarruf ediyor.
          </p>
          <button 
            onClick={() => scrollToSection('signup')}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#1d1d1f] font-medium rounded-full hover:bg-gray-100 transition-all text-sm sm:text-base"
          >
            14 Gün Ücretsiz Deneyin
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-10 sm:py-12 border-t border-gray-200">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Ürün</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><button onClick={() => scrollToSection('features')} className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Özellikler</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Fiyatlandırma</button></li>
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Güncellemeler</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Şirket</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Blog</a></li>
                <li><button onClick={() => scrollToSection('signup')} className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">İletişim</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Destek</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">SSS</a></li>
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Dökümanlar</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Yasal</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li><button onClick={() => navigate('/privacy')} className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Gizlilik Politikası</button></li>
                <li><a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">Kullanım Koşulları</a></li>
                <li><button onClick={() => navigate('/privacy')} className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">KVKK</button></li>
              </ul>
            </div>
          </div>

          {/* App Store Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 border-t border-gray-300">
            <span className="text-xs text-[#86868b] mr-2">Mobil Uygulama:</span>
            <a href="#" className="transition-opacity hover:opacity-80" aria-label="App Store'dan İndir">
              <svg viewBox="0 0 120 40" className="h-10">
                <rect width="120" height="40" rx="6" fill="#000"/>
                <path fill="#fff" d="M24.769 20.301a4.947 4.947 0 012.356-4.151 5.066 5.066 0 00-3.99-2.158c-1.679-.176-3.308 1.005-4.164 1.005-.872 0-2.19-.988-3.608-.958a5.315 5.315 0 00-4.473 2.728c-1.934 3.348-.491 8.269 1.361 10.976.927 1.325 2.01 2.805 3.428 2.753 1.387-.058 1.905-.885 3.58-.885 1.658 0 2.144.885 3.59.852 1.489-.025 2.426-1.332 3.32-2.67a10.962 10.962 0 001.52-3.092 4.782 4.782 0 01-2.92-4.4zM22.037 12.21a4.872 4.872 0 001.115-3.49 4.957 4.957 0 00-3.208 1.66 4.636 4.636 0 00-1.144 3.36 4.1 4.1 0 003.237-1.53z"/>
                <g fill="#fff">
                  <path d="M42.302 27.14h-4.733l-1.136 3.356h-2.005l4.484-12.418h2.083l4.483 12.418h-2.039l-1.137-3.356zm-4.243-1.55h3.752l-1.85-5.446h-.051l-1.85 5.447zM55.16 25.97c0 2.813-1.506 4.62-3.778 4.62a3.07 3.07 0 01-2.848-1.584h-.043v4.484h-1.859V21.442h1.799v1.506h.034a3.212 3.212 0 012.883-1.6c2.298 0 3.811 1.816 3.811 4.622zm-1.91 0c0-1.833-.948-3.038-2.393-3.038-1.42 0-2.375 1.23-2.375 3.038 0 1.824.955 3.046 2.375 3.046 1.445 0 2.393-1.197 2.393-3.046zM65.124 25.97c0 2.813-1.505 4.62-3.778 4.62a3.07 3.07 0 01-2.848-1.584h-.043v4.484h-1.858V21.442h1.798v1.506h.034a3.212 3.212 0 012.883-1.6c2.298 0 3.812 1.816 3.812 4.622zm-1.91 0c0-1.833-.948-3.038-2.393-3.038-1.42 0-2.375 1.23-2.375 3.038 0 1.824.955 3.046 2.375 3.046 1.445 0 2.393-1.197 2.393-3.046zM71.71 27.036c.138 1.231 1.334 2.04 2.968 2.04 1.566 0 2.693-.809 2.693-1.919 0-.964-.68-1.54-2.29-1.936l-1.609-.388c-2.28-.55-3.339-1.617-3.339-3.348 0-2.142 1.867-3.614 4.519-3.614 2.624 0 4.423 1.472 4.483 3.614h-1.876c-.112-1.239-1.136-1.987-2.634-1.987s-2.521.757-2.521 1.858c0 .878.654 1.395 2.255 1.79l1.368.336c2.548.603 3.606 1.626 3.606 3.443 0 2.323-1.85 3.778-4.793 3.778-2.754 0-4.614-1.42-4.734-3.667h1.904zM83.346 19.3v2.142h1.722v1.472h-1.722v4.991c0 .776.345 1.137 1.102 1.137a5.808 5.808 0 00.611-.043v1.463a5.104 5.104 0 01-1.032.086c-1.833 0-2.548-.689-2.548-2.444v-5.19h-1.316v-1.472h1.316V19.3h1.867zM86.065 25.97c0-2.849 1.678-4.639 4.294-4.639 2.625 0 4.295 1.79 4.295 4.639 0 2.856-1.661 4.638-4.295 4.638-2.633 0-4.294-1.782-4.294-4.638zm6.695 0c0-1.954-.895-3.108-2.401-3.108s-2.4 1.162-2.4 3.108c0 1.962.894 3.106 2.4 3.106s2.401-1.144 2.401-3.106zM96.186 21.442h1.773v1.541h.043a2.16 2.16 0 012.177-1.635 2.866 2.866 0 01.637.07v1.738a2.598 2.598 0 00-.835-.112 1.873 1.873 0 00-1.937 2.083v5.37h-1.858v-9.055zM109.384 27.837c-.25 1.643-1.85 2.771-3.898 2.771-2.634 0-4.269-1.764-4.269-4.595 0-2.84 1.644-4.682 4.19-4.682 2.505 0 4.08 1.72 4.08 4.466v.637h-6.394v.112a2.358 2.358 0 002.436 2.564 2.048 2.048 0 002.09-1.273h1.765zm-6.282-2.702h4.526a2.177 2.177 0 00-2.22-2.298 2.292 2.292 0 00-2.306 2.298z"/>
                </g>
              </svg>
            </a>
            <a href="#" className="transition-opacity hover:opacity-80" aria-label="Google Play'den İndir">
              <svg viewBox="0 0 135 40" className="h-10">
                <rect width="135" height="40" rx="6" fill="#000"/>
                <path fill="#fff" d="M68.135 21.75a4.273 4.273 0 00-4.07 4.453 4.273 4.273 0 004.07 4.453 4.273 4.273 0 004.07-4.453 4.273 4.273 0 00-4.07-4.453zm0 7.151c-1.33 0-2.478-1.098-2.478-2.698s1.148-2.698 2.478-2.698 2.478 1.098 2.478 2.698-1.148 2.698-2.478 2.698zm-8.882-7.151a4.273 4.273 0 00-4.07 4.453 4.273 4.273 0 004.07 4.453 4.273 4.273 0 004.07-4.453 4.273 4.273 0 00-4.07-4.453zm0 7.151c-1.33 0-2.478-1.098-2.478-2.698s1.148-2.698 2.478-2.698 2.478 1.098 2.478 2.698-1.148 2.698-2.478 2.698zm-10.565-5.784v1.545h3.703a3.233 3.233 0 01-.844 1.95 3.79 3.79 0 01-2.859 1.132 4.115 4.115 0 010-8.23 3.94 3.94 0 012.79 1.098l1.092-1.092a5.373 5.373 0 00-3.882-1.56 5.67 5.67 0 000 11.339 5.21 5.21 0 003.975-1.594 5.145 5.145 0 001.346-3.633 5.076 5.076 0 00-.083-.955h-5.238zm43.255 1.199a3.971 3.971 0 00-3.652-2.566 4.044 4.044 0 00-4.018 4.453 4.174 4.174 0 004.174 4.453 4.192 4.192 0 003.505-1.863l-1.434-.955a2.404 2.404 0 01-2.071 1.166 2.143 2.143 0 01-2.044-1.28l5.643-2.336-.103-.072zm-5.756 1.406a2.34 2.34 0 012.235-2.478 1.662 1.662 0 011.593.905l-3.828 1.573zm-4.416 4.316h1.592V17.28h-1.592v12.758zm-2.61-7.454h-.055a2.513 2.513 0 00-1.91-.826 4.276 4.276 0 00-4.096 4.471 4.256 4.256 0 004.096 4.435 2.461 2.461 0 001.91-.843h.055v.534c0 1.416-.756 2.176-1.978 2.176a2.049 2.049 0 01-1.864-1.315l-1.386.577a3.53 3.53 0 003.25 2.167c1.889 0 3.488-1.113 3.488-3.823v-6.587h-1.51v.534zm-1.866 6.16c-1.33 0-2.444-1.116-2.444-2.68s1.114-2.698 2.444-2.698 2.375 1.142 2.375 2.715-1.063 2.663-2.375 2.663zm26.97-11.625h-3.808v12.72h1.592v-4.82h2.216a3.305 3.305 0 003.505-3.95 3.305 3.305 0 00-3.505-3.95zm.04 6.127h-2.256v-4.355h2.256a2.18 2.18 0 110 4.355zm9.808-1.826a2.978 2.978 0 00-2.83 1.627l1.414.59a1.505 1.505 0 011.45-.782 1.53 1.53 0 011.691 1.368v.11a3.52 3.52 0 00-1.657-.41c-1.52 0-3.065.835-3.065 2.394a2.458 2.458 0 002.637 2.34 2.236 2.236 0 002.02-1.03h.051v.814h1.537v-4.076c0-1.886-1.409-2.946-3.228-2.946l-.02.001zm-.193 5.826c-.52 0-1.245-.26-1.245-.904 0-.822.904-1.137 1.684-1.137a2.83 2.83 0 011.45.355 1.924 1.924 0 01-1.889 1.686zm9.005-5.593l-1.826 4.627h-.051l-1.894-4.627h-1.715l2.842 6.47-1.622 3.598h1.664l4.381-10.068h-1.779zm-14.312 6.836h1.592V17.28h-1.592v12.758z"/>
                <path fill="#EA4335" d="M10.435 7.538a2.058 2.058 0 00-.475 1.432v22.06c0 .527.163 1.04.475 1.432l.075.073 12.36-12.36v-.29l-12.36-12.42-.075.073z"/>
                <path fill="#FBBC04" d="M27 24.295l-4.12-4.12v-.29l4.12-4.12.093.054 4.886 2.775c1.395.793 1.395 2.09 0 2.882l-4.886 2.776-.093.043z"/>
                <path fill="#4285F4" d="M27.093 24.252L22.88 20.04 10.36 32.535c.46.487 1.22.546 1.754.133l14.98-8.416"/>
                <path fill="#34A853" d="M27.093 15.788L12.113 7.37a1.393 1.393 0 00-1.754.133l12.52 12.537 4.214-4.252z"/>
              </svg>
            </a>
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-gray-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#86868b]">
                © 2024 Yönetioo. Tüm hakları saklıdır.
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
