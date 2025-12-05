# 🚀 Portainer ile Hızlı Deployment Rehberi (Admin Panel Dahil)

## Genel Bakış

Sisteminiz şu servisleri içerir:
- **MongoDB** (Port 27017) - Veritabanı
- **Backend API** (Port 8001) - FastAPI
- **Süperadmin Panel** (Port 3000) - React
- **Bina Yöneticisi Panel** (Port 3001) - React ✨ YENİ

---

## 📋 Ön Gereksinimler

1. ✅ VPS hazır (Ubuntu 20.04+)
2. ✅ Docker kurulu
3. ✅ Portainer kurulu ve çalışıyor (http://YOUR_VPS_IP:9000)
4. ✅ Firewall portları açık: 22, 80, 443, 3000, 3001, 8001, 9000

---

## 🔥 Adım Adım Deployment

### 1. VPS'e SSH ile Bağlanın

```bash
ssh root@72.62.58.82
```

### 2. Proje Dosyalarını Hazırlayın

VPS'inizde proje klasörünü oluşturun veya mevcut projeyi güncelleyin:

```bash
# Eğer proje yoksa
mkdir -p /root/bina-yonetim && cd /root/bina-yonetim

# Proje dosyalarınızı buraya kopyalayın
# (SCP, SFTP, veya Git ile)
```

### 3. .env Dosyasını Oluşturun

```bash
cd /root/bina-yonetim
nano .env
```

Aşağıdaki içeriği yapıştırın:

```env
# MongoDB Configuration
MONGO_USER=admin
MONGO_PASSWORD=SuperGuvenli123ABC
MONGO_DB=building_management

# Backend Configuration
SECRET_KEY=your_super_secret_jwt_key_change_this_in_production_12345678

# Frontend Configuration
REACT_APP_BACKEND_URL=http://72.62.58.82:8001
```

**ÖNEMLİ:**
- ✅ `MONGO_PASSWORD` özel karakterler içermemeli (`!@#$%` gibi)
- ✅ `SECRET_KEY` uzun ve karmaşık olmalı
- ✅ `REACT_APP_BACKEND_URL` VPS IP'nizi içermeli

Kaydet ve çık: `CTRL+X`, `Y`, `ENTER`

### 4. Portainer'da Stack Oluşturun

#### 4.1 Portainer'a Giriş Yapın
- Tarayıcıda: `http://72.62.58.82:9000`
- Kullanıcı adı ve şifrenizle giriş yapın

#### 4.2 Stack Oluştur
1. Sol menüden **Stacks** → **+ Add stack**
2. **Name:** `bina-yonetim`

#### 4.3 Stack Dosyasını Yükleyin

**Seçenek A: Web editor (Tavsiye edilir)**

"Web editor" sekmesine `docker-compose.yml` içeriğini yapıştırın.

**Seçenek B: Upload**

`docker-compose.yml` dosyasını bilgisayarınızdan yükleyin.

**Seçenek C: Repository (Git varsa)**

- Repository URL'nizi girin
- Branch: `main` veya `master`
- Compose path: `docker-compose.yml`

#### 4.4 Environment Variables Ekleyin

"Environment variables" bölümünde **"Advanced mode"** butonuna tıklayın ve şunları ekleyin:

```env
MONGO_USER=admin
MONGO_PASSWORD=SuperGuvenli123ABC
MONGO_DB=building_management
SECRET_KEY=your_super_secret_jwt_key_change_this_in_production_12345678
REACT_APP_BACKEND_URL=http://72.62.58.82:8001
```

#### 4.5 Deploy!

- **"Deploy the stack"** butonuna tıklayın
- 3-5 dakika bekleyin (Docker image'ları build ediliyor)

---

## ✅ Deployment Kontrolü

### Portainer'da Kontrol

1. Sol menü → **Containers**
2. Tüm container'lar yeşil olmalı:
   - ✅ `bina-mongodb`
   - ✅ `bina-backend`
   - ✅ `bina-superadmin`
   - ✅ `bina-admin-panel` ✨

### Terminal'de Kontrol

```bash
docker ps
```

Çıktı şöyle olmalı:
```
CONTAINER ID   IMAGE                    STATUS         PORTS
xxxxx          bina-yonetim_backend     Up 2 minutes   0.0.0.0:8001->8001/tcp
xxxxx          bina-yonetim_superadmin  Up 2 minutes   0.0.0.0:3000->3000/tcp
xxxxx          bina-yonetim_admin-panel Up 2 minutes   0.0.0.0:3001->3001/tcp
xxxxx          mongo:7.0                Up 3 minutes   0.0.0.0:27017->27017/tcp
```

---

## 🗄️ Test Verilerini Yükleme

```bash
# Backend container'a girin
docker exec -it bina-backend bash

# Seed data scriptini çalıştırın
python seed_data.py

# Çıkış
exit
```

---

## 🌐 Erişim Bilgileri

### Süperadmin Panel (Port 3000)
- **URL:** http://72.62.58.82:3000
- **E-posta:** admin@test.com
- **Şifre:** admin123

### Bina Yöneticisi Panel (Port 3001) ✨ YENİ
- **URL:** http://72.62.58.82:3001
- **Demo Hesaplar:**
  - Mavi Rezidans: `ahmet@mavirezidans.com` / `admin123`
  - Yeşil Park: `mehmet@yesilpark.com` / `admin123`
  - Sarı Bahçe: `ayse@saribahce.com` / `admin123`

### Backend API
- **URL:** http://72.62.58.82:8001
- **Docs:** http://72.62.58.82:8001/docs

---

## 🔄 Güncelleme (Update)

Stack'i güncellemek için:

### Portainer Üzerinden:
1. **Stacks** → `bina-yonetim` → **Editor**
2. Değişiklikleri yapın
3. **"Update the stack"** → **"Pull and redeploy"** ✅
4. Deploy butonuna tıklayın

### Terminal Üzerinden:
```bash
cd /root/bina-yonetim

# Yeni kodları çekin (git varsa)
git pull

# Stack'i yeniden deploy edin
docker-compose down
docker-compose up -d --build
```

---

## 🚨 Sorun Giderme

### Container Çalışmıyor?

```bash
# Logları kontrol et
docker logs bina-backend
docker logs bina-superadmin
docker logs bina-admin-panel
docker logs bina-mongodb
```

### Port Çakışması?

```bash
# Portları kontrol et
netstat -tulpn | grep -E '3000|3001|8001|27017'

# Çakışan process'i durdur
sudo kill -9 <PID>
```

### MongoDB Bağlantı Hatası?

1. MongoDB container'ının çalıştığını kontrol edin: `docker ps`
2. MongoDB loglarını inceleyin: `docker logs bina-mongodb`
3. `.env` dosyasındaki `MONGO_PASSWORD` özel karakter içermemeli

### Frontend Build Hatası?

Admin-panel Dockerfile'da `--legacy-peer-deps` flag'i kullanılıyor. Eğer hata alırsanız:

```bash
# Manuel build
cd /root/bina-yonetim/admin-panel
docker build -t bina-admin-panel:latest .

# Yeniden başlat
docker-compose up -d admin-panel
```

### Image Build Çok Uzun Sürüyor?

İlk build 5-10 dakika sürebilir. Node modülleri indiriliyor ve React uygulaması build ediliyor.

---

## 📊 Sistem Gereksinimleri

**Minimum:**
- RAM: 2GB
- CPU: 2 Core
- Disk: 20GB

**Önerilen (Tüm Servisler İçin):**
- RAM: 4GB
- CPU: 2-4 Core
- Disk: 40GB SSD

---

## 🔒 Güvenlik Notları

1. ✅ Firewall'u aktifleştirin
2. ✅ Default şifreleri değiştirin
3. ✅ SSH key authentication kullanın
4. ✅ Düzenli yedekleme yapın
5. ✅ SSL sertifikası ekleyin (üretim için)

---

## 📞 Destek

Sorun yaşıyorsanız:
1. Docker loglarını kontrol edin
2. Portainer event log'larına bakın
3. Container'ların health check durumunu inceleyin

**Önemli Loglar:**
- Backend: `/var/log/supervisor/backend.*.log`
- Admin Panel Build Logs: Portainer → Container → Logs

---

## ✨ Başarılar!

Artık 3 web paneli çalışıyor:
- ✅ Süperadmin Panel (Port 3000)
- ✅ Bina Yöneticisi Panel (Port 3001)
- ✅ Backend API (Port 8001)

Her şey hazır! 🎉
