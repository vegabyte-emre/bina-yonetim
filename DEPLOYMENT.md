# 🐳 Bina Yönetim Sistemi - Docker + Portainer Deployment Rehberi

## 📋 İçindekiler
1. [Sistem Gereksinimleri](#sistem-gereksinimleri)
2. [VPS Hazırlığı](#vps-hazırlığı)
3. [Docker Kurulumu](#docker-kurulumu)
4. [Portainer Kurulumu](#portainer-kurulumu)
5. [Uygulama Deployment](#uygulama-deployment)
6. [Güvenlik Ayarları](#güvenlik-ayarları)
7. [Yedekleme](#yedekleme)
8. [Sorun Giderme](#sorun-giderme)

---

## 📦 Sistem Gereksinimleri

### Minimum Gereksinimler:
- **İşletim Sistemi:** Ubuntu 20.04 LTS veya üzeri / Debian 11+
- **RAM:** 2GB (4GB önerilir)
- **Disk:** 20GB (40GB önerilir)
- **CPU:** 2 Core
- **İnternet:** Kesintisiz bağlantı

### Önerilen VPS Sağlayıcıları:
- **Hostinger** (~$10/ay) ✅ Türkçe destek
- **DigitalOcean** ($6/ay) ✅ Kolay kullanım
- **Vultr** ($5/ay)
- **Linode** ($5/ay)
- **Contabo** (~€5/ay) ✅ Ucuz

---

## 🖥️ VPS Hazırlığı

### 1. Adım: VPS'e Bağlanma

**Windows için:**
```bash
# PuTTY veya PowerShell kullanın
ssh root@YOUR_VPS_IP
```

**Mac/Linux için:**
```bash
ssh root@YOUR_VPS_IP
```

### 2. Adım: Sistem Güncelleme

```bash
# Paket listesini güncelle
apt update

# Tüm paketleri yükselt
apt upgrade -y

# Gerekli araçları kur
apt install -y curl wget git nano ufw
```

---

## 🐳 Docker Kurulumu

### Otomatik Kurulum (Önerilen)

```bash
# Docker'ı tek komutla kur
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker'ı başlat ve otomatik başlamasını sağla
systemctl start docker
systemctl enable docker

# Docker versiyonunu kontrol et
docker --version
```

**Beklenen çıktı:**
```
Docker version 24.0.7, build afdd53b
```

### Docker Compose Kurulumu

```bash
# En son Docker Compose sürümünü kur
apt install -y docker-compose-plugin

# Versiyonu kontrol et
docker compose version
```

---

## 🎛️ Portainer Kurulumu

### Adım 1: Portainer Volume Oluştur

```bash
docker volume create portainer_data
```

### Adım 2: Portainer Container'ını Başlat

```bash
docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### Adım 3: Portainer'a Erişim

1. Tarayıcınızda şu adresi açın:
   ```
   http://YOUR_VPS_IP:9000
   ```

2. İlk giriş ekranında:
   - **Username:** admin
   - **Password:** En az 12 karakterlik güçlü şifre oluşturun
   - "Create user" butonuna tıklayın

3. "Get Started" butonuna tıklayın

4. "Local" ortamını seçin

✅ Artık Portainer hazır!

---

## 🚀 Uygulama Deployment

### Adım 1: Projeyi VPS'e Yükleme

#### Seçenek A: Git ile (Önerilen)

```bash
# Ana dizine git
cd /root

# Projeyi klonla
git clone https://github.com/YOUR_USERNAME/bina-yonetim.git

# Proje dizinine gir
cd bina-yonetim
```

#### Seçenek B: Manuel Yükleme

```bash
# Yerel bilgisayarınızdan VPS'e dosya gönder
scp -r /path/to/project root@YOUR_VPS_IP:/root/bina-yonetim
```

### Adım 2: Environment Dosyasını Hazırlama

```bash
# .env.example dosyasını kopyala
cp .env.example .env

# .env dosyasını düzenle
nano .env
```

**Önemli:** Aşağıdaki değerleri mutlaka değiştirin:

```env
# MongoDB - Güçlü şifreler kullanın!
MONGO_USER=admin
MONGO_PASSWORD=SuperGuvenliSifre123!@#

# Backend - Rastgele uzun bir key oluşturun
SECRET_KEY=aB3$dE6&fG9*hJ2-kL5+mN8.pQ1

# Frontend - VPS IP adresinizi yazın
REACT_APP_BACKEND_URL=http://YOUR_VPS_IP:8001
```

**Ctrl+O** → Enter → **Ctrl+X** ile kaydet

### Adım 3: Portainer'da Stack Oluşturma

#### 3.1. Portainer Web Arayüzüne Git
```
http://YOUR_VPS_IP:9000
```

#### 3.2. Stacks Menüsüne Gir
- Sol menüden **"Stacks"** seçin
- **"Add stack"** butonuna tıklayın

#### 3.3. Stack Yapılandırması

**Stack adı:** `bina-yonetim`

**Build method:** "Repository" seçin

**Repository bilgileri:**
- Repository URL: Proje URL'nizi girin
- Reference: `main` veya `master`
- Compose path: `docker-compose.yml`

**VEYA**

**Build method:** "Upload" seçin
- `docker-compose.yml` dosyasını yükleyin

#### 3.4. Environment Variables Ekleme

"Advanced mode" butonuna tıklayın ve şunları yapıştırın:

```env
MONGO_USER=admin
MONGO_PASSWORD=SuperGuvenliSifre123!@#
MONGO_DB=building_management
SECRET_KEY=aB3$dE6&fG9*hJ2-kL5+mN8.pQ1
REACT_APP_BACKEND_URL=http://YOUR_VPS_IP:8001
```

**⚠️ ÖNEMLİ:** `YOUR_VPS_IP` yerine gerçek IP adresinizi yazın!

#### 3.5. Deploy!

- "Deploy the stack" butonuna tıklayın
- **2-5 dakika bekleyin** (ilk kurulum uzun sürer)
- Stack listesinde `bina-yonetim` görünecek

### Adım 4: Container'ların Durumunu Kontrol

**Portainer'da:**
- Sol menü → **Containers**
- Şu container'lar çalışıyor olmalı:
  - ✅ `bina-mongodb` (yeşil)
  - ✅ `bina-backend` (yeşil)
  - ✅ `bina-superadmin` (yeşil)
  - ✅ `bina-admin-panel` (yeşil)

**Terminal'de:**
```bash
docker ps
```

Tüm container'lar "Up" durumunda olmalı.

---

## 🌐 Uygulamaya Erişim

Deployment tamamlandıktan sonra:

| Servis | URL | Açıklama |
|--------|-----|----------|
| **Süperadmin Panel** | `http://YOUR_VPS_IP:3000` | Web yönetim paneli |
| **Backend API** | `http://YOUR_VPS_IP:8001/api` | REST API |
| **Portainer** | `http://YOUR_VPS_IP:9000` | Container yönetimi |
| **MongoDB** | `YOUR_VPS_IP:27017` | Veritabanı (sadece internal) |

### İlk Giriş Bilgileri

Test için varsayılan kullanıcı oluşturmak üzere:

```bash
# Backend container'ına gir
docker exec -it bina-backend bash

# Seed data scriptini çalıştır
python seed_data.py

# Container'dan çık
exit
```

**Varsayılan Süperadmin:**
- E-posta: `admin@test.com`
- Şifre: `admin123`

⚠️ **ÜRETİMDE MU TAKILARAK ŞIFREYI DEĞİŞTİRİN!**

---

## 🔒 Güvenlik Ayarları

### 1. Firewall Yapılandırması

```bash
# UFW'yi aktifleştir
ufw enable

# SSH portunu aç (DİKKAT: Bağlantınız kopmadan önce!)
ufw allow 22/tcp

# Portainer
ufw allow 9000/tcp
ufw allow 9443/tcp

# Süperadmin Panel
ufw allow 3000/tcp

# Backend API
ufw allow 8001/tcp

# HTTP/HTTPS (gelecekte SSL için)
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall durumunu kontrol et
ufw status
```

### 2. MongoDB Güvenliği

MongoDB sadece Docker network içinden erişilebilir olmalı. Dışarıdan erişimi kapatmak için:

```bash
# Firewall'da MongoDB portunu KAPATMAYIN
# docker-compose.yml'de zaten internal network kullanılıyor
```

### 3. SSL Sertifikası (Opsiyonel - Üretim için Önerilen)

**Certbot ile Let's Encrypt:**

```bash
# Certbot kur
apt install -y certbot python3-certbot-nginx

# Domain için SSL al
certbot --nginx -d yourdomain.com
```

### 4. Şifre Değiştirme

**Süperadmin şifresini değiştirmek için:**

1. Panele giriş yapın
2. Profil → Şifre Değiştir
3. Güçlü bir şifre belirleyin

**MongoDB şifresini değiştirmek için:**

```bash
# Container içine gir
docker exec -it bina-mongodb mongosh -u admin -p

# Yeni şifre ata
db.changeUserPassword("admin", "YeniSuperGuvenliSifre456!")
```

---

## 💾 Yedekleme

### Otomatik MongoDB Yedeği

**Backup scripti oluştur:**

```bash
# Backup klasörü oluştur
mkdir -p /root/backups

# Backup scripti oluştur
nano /root/backup.sh
```

**Script içeriği:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

# MongoDB yedeği al
docker exec bina-mongodb mongodump \
  --username admin \
  --password YOUR_MONGO_PASSWORD \
  --authenticationDatabase admin \
  --out /data/backup_$DATE

# Yedekleri container'dan çıkar
docker cp bina-mongodb:/data/backup_$DATE $BACKUP_DIR/

# 7 günden eski yedekleri sil
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

echo "Yedek tamamlandı: backup_$DATE"
```

**Çalıştırılabilir yap:**

```bash
chmod +x /root/backup.sh
```

**Cron ile otomatik yedek (her gün 3:00):**

```bash
crontab -e

# Şunu ekle:
0 3 * * * /root/backup.sh >> /root/backup.log 2>&1
```

### Manuel Yedek Alma (Portainer'dan)

1. **Containers** → `bina-mongodb` seçin
2. **Console** → `/bin/bash` → **Connect**
3. Şu komutu çalıştır:
   ```bash
   mongodump --out=/backup
   ```
4. **Volumes** → `mongodb_data` → **Download**

---

## 🔧 Portainer ile Yönetim

### Container Yönetimi

**Portainer Web UI'da:**

1. **Containers** menüsüne git
2. Her container için:
   - ▶️ **Start** - Başlat
   - ⏸️ **Stop** - Durdur
   - 🔄 **Restart** - Yeniden başlat
   - 📊 **Logs** - Log'ları gör
   - 📈 **Stats** - CPU/RAM kullanımı
   - 🖥️ **Console** - Terminal aç

### Stack Güncelleme

**Kod değişikliği yaptığınızda:**

1. **Stacks** → `bina-yonetim` seçin
2. **Editor** tab'ına git
3. Gerekirse docker-compose.yml'i güncelle
4. **Pull and redeploy** seçeneğini işaretle
5. **Update the stack** butonuna tıkla

### Logları Görüntüleme

**Portainer'da:**
- **Containers** → İstediğin container → **Logs**
- Auto-refresh seçeneğini aç
- Hataları gerçek zamanlı izle

**Terminal'de:**
```bash
# Tüm logları göster
docker logs bina-backend

# Son 100 satırı göster
docker logs --tail 100 bina-backend

# Canlı takip
docker logs -f bina-backend
```

---

## 🆘 Sorun Giderme

### 1. Container Başlamıyor

**Portainer'da:**
- Container'ı seç → **Logs** → Hata mesajını oku

**Yaygın sorunlar:**

#### MongoDB bağlantı hatası
```
Error: MongoNetworkError
```

**Çözüm:**
```bash
# MongoDB çalışıyor mu?
docker ps | grep mongodb

# Yeniden başlat
docker restart bina-mongodb

# Environment variables doğru mu kontrol et
```

#### Port zaten kullanımda
```
Error: port 3000 already in use
```

**Çözüm:**
```bash
# Hangi process kullanıyor?
netstat -tulpn | grep 3000

# Process'i durdur
kill -9 <PID>
```

### 2. Backend API Çalışmıyor

**Kontrol adımları:**

```bash
# Health check
curl http://localhost:8001/api/

# Beklenen: {"message":"Hello World"}
```

**Hata alıyorsanız:**

```bash
# Backend loglarını incele
docker logs bina-backend

# Container içine gir
docker exec -it bina-backend bash

# Python çalışıyor mu test et
python -c "import server"
```

### 3. Frontend Beyaz Ekran

**Sebepler:**
- Backend API'ye ulaşamıyor
- REACT_APP_BACKEND_URL yanlış
- Build hatası

**Çözüm:**

```bash
# Nginx loglarını kontrol et
docker logs bina-superadmin

# Environment variable'ı kontrol et
docker exec bina-superadmin env | grep REACT_APP

# Stack'i yeniden deploy et (Portainer'da)
```

### 4. Database Bağlantı Hatası

```bash
# MongoDB çalışıyor mu?
docker exec -it bina-mongodb mongosh -u admin -p

# Şifre ile gir ve test et
use building_management
show collections
```

### 5. Port Erişimi Yok

```bash
# Portların açık olduğunu kontrol et
ufw status

# Gerekirse portu aç
ufw allow 3000/tcp
```

### 6. Disk Doldu

```bash
# Disk kullanımını kontrol et
df -h

# Docker disk kullanımı
docker system df

# Kullanılmayan image'leri temizle
docker system prune -a

# Eski logları temizle
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

---

## 🔄 Güncelleme

### Yeni Versiyon Deploy Etme

**Git ile:**

```bash
# VPS'e SSH ile bağlan
ssh root@YOUR_VPS_IP

# Proje dizinine git
cd /root/bina-yonetim

# Yeni kodu çek
git pull origin main

# Portainer'da stack'i güncelle
# (Portainer UI'dan "Pull and redeploy" seçeneği)
```

**Portainer'dan:**

1. **Stacks** → `bina-yonetim`
2. **Pull and redeploy** seçeneğini işaretle
3. **Update the stack** tıkla
4. 2-3 dakika bekle

---

## 📊 İzleme ve Monitoring

### Container İstatistikleri

**Portainer'da:**
- **Containers** → Container seç → **Stats**
- CPU, RAM, Network kullanımını gösterir

**Terminal'de:**
```bash
# Tüm container'ların kaynak kullanımı
docker stats

# Belirli bir container
docker stats bina-backend
```

### Sağlık Kontrolü

```bash
# Tüm container'ların durumu
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check
docker inspect --format='{{.State.Health.Status}}' bina-backend
```

---

## 📞 Destek

### Yaygın Komutlar

```bash
# Tüm container'ları durdur
docker stop $(docker ps -aq)

# Tüm container'ları başlat
docker start $(docker ps -aq)

# Tüm container'ları sil (DİKKAT!)
docker rm -f $(docker ps -aq)

# Volume'leri listele
docker volume ls

# Network'leri listele
docker network ls

# Tüm sistemi temizle (DİKKAT: Tüm datalar silinir!)
docker system prune -a --volumes
```

### Log Dosyaları

- **Portainer logs:** `/var/log/docker/portainer/`
- **Container logs:** `/var/lib/docker/containers/`
- **Nginx logs:** Container içinde `/var/log/nginx/`

### İletişim

Sorun yaşadığınızda:
1. Portainer'da log'ları kontrol edin
2. `docker logs <container-name>` ile hata mesajını alın
3. Google'da arayın veya destek ekibine ulaşın

---

## ✅ Kurulum Kontrol Listesi

Deployment öncesi:
- [ ] VPS hazır (Ubuntu/Debian)
- [ ] Docker kurulu
- [ ] Portainer kurulu
- [ ] .env dosyası hazırlandı
- [ ] Firewall ayarları yapıldı

Deployment sonrası:
- [ ] Tüm container'lar çalışıyor
- [ ] MongoDB bağlantısı başarılı
- [ ] Backend API erişilebilir (http://IP:8001/api/)
- [ ] Frontend açılıyor (http://IP:3000)
- [ ] İlk kullanıcı oluşturuldu
- [ ] Şifreler değiştirildi
- [ ] Yedek sistemi kuruldu

---

## 🎉 Tebrikler!

Bina Yönetim Sistemi başarıyla deploy edildi! 

**Sonraki adımlar:**
1. SSL sertifikası ekleyin (Let's Encrypt)
2. Domain adı bağlayın
3. Yedek sistemini test edin
4. Monitoring araçları ekleyin (Grafana, Prometheus)

**Artık Portainer'dan tüm sistemi yönetebilirsiniz!** 🚀
