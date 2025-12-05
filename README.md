# 🏢 Bina Yönetim Sistemi

Modern, kapsamlı bina yönetim çözümü - Süperadmin ve Bina Yöneticisi web panelleri

## 🚀 Özellikler

### Süperadmin Paneli
- 🏗️ Bina yönetimi (ekleme, düzenleme, silme)
- 👥 Kullanıcı ve yönetici yönetimi
- 💳 Abonelik ve finans takibi
- 📊 Dashboard ve raporlama
- ⚙️ Sistem ayarları

### Bina Yöneticisi Paneli
- 🏠 Blok ve daire yönetimi
- 💰 Aidat takibi ve tahsilat
- 📢 Duyuru sistemi
- 🔧 Bina özellikleri durum takibi
- 📝 Talep ve şikayet yönetimi
- ⚖️ Hukuki süreç takibi
- 📱 SMS entegrasyonu (hazır altyapı)

## 🛠️ Teknoloji Stack

- **Backend:** FastAPI (Python 3.11)
- **Frontend:** React 19 + Shadcn UI
- **Database:** MongoDB 7.0
- **Deployment:** Docker + Portainer
- **Web Server:** Nginx

## 📋 Hızlı Başlangıç

### Gereksinimler
- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 20GB+ Disk

### Kurulum

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/yourusername/bina-yonetim.git
cd bina-yonetim
```

2. **Environment dosyasını hazırlayın:**
```bash
cp .env.example .env
nano .env  # VPS IP ve şifreleri güncelleyin
```

3. **Docker Compose ile başlatın:**
```bash
docker compose up -d
```

4. **Uygulamaya erişin:**
- Süperadmin: http://localhost:3000
- Backend API: http://localhost:8001/api

### İlk Giriş

Test verilerini oluşturmak için:
```bash
docker exec -it bina-backend python seed_data.py
```

**Varsayılan giriş:**
- E-posta: `admin@test.com`
- Şifre: `admin123`

⚠️ **Üretim ortamında mutlaka değiştirin!**

## 📖 Detaylı Dokümantasyon

- **[Deployment Rehberi](DEPLOYMENT.md)** - Portainer ile production kurulum
- **[Github Deployment](GITHUB_DEPLOY.md)** - Github ile otomatik deployment ✨ YENİ
- **[Portainer Hızlı Başlangıç](PORTAINER_DEPLOY_GUIDE.md)** - Adım adım kurulum
- **[API Dokümantasyonu](http://localhost:8001/docs)** - Swagger UI
- **[Güvenlik](DEPLOYMENT.md#güvenlik-ayarları)** - Güvenlik yapılandırmaları

## 🐳 Portainer ile Deployment

### Seçenek 1: Github ile Deploy (Tavsiye edilir) ✨

```bash
# 1. Projeyi Github'a push edin
git remote add origin https://github.com/YOUR_USERNAME/bina-yonetim.git
git push -u origin main

# 2. Portainer'da Stack oluşturun
# Repository sekmesini seçin
# Github URL'inizi girin
# Deploy!
```

Detaylı adımlar: **[GITHUB_DEPLOY.md](GITHUB_DEPLOY.md)**

### Seçenek 2: Manuel Upload

VPS'e production deployment için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasını okuyun.

**Özetle:**
1. VPS'e Docker ve Portainer kurun
2. Portainer web arayüzünden stack oluşturun
3. `docker-compose.yml` dosyasını yükleyin
4. Environment variables ekleyin
5. Deploy butonuna tıklayın!

Detaylı adımlar için: **[PORTAINER_DEPLOY_GUIDE.md](PORTAINER_DEPLOY_GUIDE.md)**

## 📁 Proje Yapısı

```
bina-yonetim/
├── backend/                    # FastAPI backend
│   ├── Dockerfile
│   ├── server.py              # Ana API
│   ├── seed_data.py           # Test verileri
│   └── requirements.txt
├── frontend/                   # React frontend (Süperadmin - Port 3000)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   └── package.json
├── admin-panel/                # React frontend (Bina Yöneticisi - Port 3001) ✨ YENİ
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   └── package.json
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── DEPLOYMENT.md               # Detaylı deployment rehberi
├── GITHUB_DEPLOY.md            # Github deployment rehberi ✨ YENİ
├── PORTAINER_DEPLOY_GUIDE.md   # Hızlı başlangıç
└── README.md                   # Bu dosya
```

## 🔒 Güvenlik

- JWT tabanlı authentication
- Bcrypt şifreleme
- Role-based access control (RBAC)
- CORS yapılandırması
- Güvenli environment variables

## 📊 Monitoring

Container'ları Portainer üzerinden izleyin:
- CPU ve RAM kullanımı
- Log görüntüleme
- Health check durumu
- Restart/stop/start işlemleri

## 💾 Yedekleme

Otomatik yedek sistemi için [DEPLOYMENT.md](DEPLOYMENT.md#yedekleme) bölümüne bakın.

## 🆘 Sorun Giderme

Yaygın sorunlar ve çözümleri için [DEPLOYMENT.md](DEPLOYMENT.md#sorun-giderme) bölümüne bakın.

## 📞 Destek

- **Dokümantasyon:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Docs:** http://localhost:8001/docs
- **Issues:** GitHub Issues

## 📄 Lisans

MIT License

## 🙏 Katkıda Bulunanlar

- Backend API ✅
- Süperadmin Panel ✅
- Docker Deployment ✅
- Bina Yönetici Panel 🔨 (Geliştiriliyor)

---

**Not:** Bu proje Docker + Portainer ile kolay deployment için optimize edilmiştir. VPS'e kurulum için sadece Portainer web arayüzü yeterlidir, terminal bilgisi gerektirmez!
