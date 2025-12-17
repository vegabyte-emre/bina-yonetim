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
                {['Özellikler', 'Fiyatlandırma', 'Güncellemeler'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Şirket</h4>
              <ul className="space-y-2 sm:space-y-3">
                {['Hakkımızda', 'Blog', 'İletişim'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Destek</h4>
              <ul className="space-y-2 sm:space-y-3">
                {['Yardım Merkezi', 'SSS', 'Dökümanlar'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1d1d1f] mb-3 sm:mb-4">Yasal</h4>
              <ul className="space-y-2 sm:space-y-3">
                {['Gizlilik', 'Kullanım Koşulları', 'KVKK'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-xs text-[#424245] hover:text-[#1d1d1f] hover:underline transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
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
