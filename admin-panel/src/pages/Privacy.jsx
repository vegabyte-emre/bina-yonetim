import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Mail, Globe } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: '1. Toplanan Veriler',
      content: `Yönetioo olarak, hizmetlerimizi sunabilmek için aşağıdaki kişisel verileri toplamaktayız:

• Kimlik Bilgileri: Ad, soyad, T.C. kimlik numarası
• İletişim Bilgileri: E-posta adresi, telefon numarası, adres
• Bina/Daire Bilgileri: Site adı, blok, daire numarası, mülkiyet durumu
• Finansal Bilgiler: Aidat ödemeleri, borç durumu, ödeme geçmişi
• Kullanım Verileri: Uygulama kullanım istatistikleri, giriş kayıtları`
    },
    {
      icon: Eye,
      title: '2. Verilerin Kullanım Amaçları',
      content: `Topladığımız kişisel veriler aşağıdaki amaçlarla kullanılmaktadır:

• Bina yönetimi hizmetlerinin sunulması
• Aidat ve ödeme takibinin yapılması
• Sakinler ve yönetim arasında iletişimin sağlanması
• Duyuru ve bildirimlerin iletilmesi
• Toplantı ve oylama süreçlerinin yürütülmesi
• Talep ve şikayetlerin değerlendirilmesi
• Yasal yükümlülüklerin yerine getirilmesi`
    },
    {
      icon: Shield,
      title: '3. Veri Güvenliği',
      content: `Kişisel verilerinizin güvenliği bizim için önemlidir. Verilerinizi korumak için:

• SSL/TLS şifreleme protokolleri kullanılmaktadır
• Veriler Türkiye'de bulunan güvenli sunucularda saklanmaktadır
• Düzenli güvenlik denetimleri ve penetrasyon testleri yapılmaktadır
• Çalışanlarımız veri güvenliği konusunda eğitilmektedir
• Erişim kontrolleri ve yetkilendirme mekanizmaları uygulanmaktadır
• Günlük yedekleme ve felaket kurtarma planları mevcuttur`
    },
    {
      icon: Users,
      title: '4. Veri Paylaşımı',
      content: `Kişisel verileriniz aşağıdaki durumlar haricinde üçüncü taraflarla paylaşılmaz:

• Yasal zorunluluklar (mahkeme kararı, resmi kurum talepleri)
• Site/bina yönetimi kapsamında yetkili kişilerle
• Ödeme işlemleri için anlaşmalı finans kuruluşlarıyla
• SMS ve e-posta bildirimleri için hizmet sağlayıcılarla

Verileriniz hiçbir koşulda pazarlama amaçlı üçüncü taraflarla paylaşılmaz.`
    },
    {
      icon: Lock,
      title: '5. KVKK Kapsamındaki Haklarınız',
      content: `6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:

• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
• Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
• Verilerin silinmesini veya yok edilmesini isteme
• İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme`
    },
    {
      icon: Globe,
      title: '6. Çerezler (Cookies)',
      content: `Web sitemiz ve uygulamamız, deneyiminizi iyileştirmek için çerezler kullanmaktadır:

• Zorunlu Çerezler: Oturum yönetimi ve güvenlik için gereklidir
• Performans Çerezleri: Kullanım istatistikleri toplar
• İşlevsellik Çerezleri: Tercihlerinizi hatırlar

Tarayıcı ayarlarınızdan çerez tercihlerinizi yönetebilirsiniz.`
    },
    {
      icon: Mail,
      title: '7. İletişim',
      content: `Gizlilik politikamız veya kişisel verilerinizle ilgili sorularınız için:

• E-posta: kvkk@yonetioo.com
• Adres: Türkiye

Başvurularınız en geç 30 gün içinde yanıtlanacaktır.`
    }
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[#1d1d1f] hover:text-[#0071e3] transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Anasayfa</span>
            </button>
            <span className="text-lg font-semibold text-[#1d1d1f]">yönetioo</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
              <Shield size={32} className="text-blue-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#1d1d1f] mb-4">
              Gizlilik Politikası
            </h1>
            <p className="text-[#86868b] max-w-xl mx-auto">
              Kişisel verilerinizin korunması bizim için önemlidir. Bu sayfa, verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
            </p>
            <p className="text-sm text-[#86868b] mt-4">
              Son güncelleme: Aralık 2024
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={index} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center flex-shrink-0">
                    <section.icon size={24} className="text-[#1d1d1f]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">{section.title}</h2>
                    <div className="text-[#424245] text-sm leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-[#86868b]">
              Bu gizlilik politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ile uyumludur.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-[#86868b]">
            © 2024 Yönetioo. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
