# 🔗 Github ile Portainer Deployment Rehberi

Bu rehber, projenizi Github'a yükleyip Portainer üzerinden otomatik deploy etmeyi anlatır.

---

## 📋 Ön Hazırlık

### 1. Github Repository Oluşturma

1. Github'da yeni repository oluşturun: https://github.com/new
2. Repository adı: `bina-yonetim-sistemi` (veya istediğiniz ad)
3. **Private** seçin (önerilir)
4. README, .gitignore eklemeyin (zaten var)

---

## 🚀 Adım 1: Projeyi Github'a Push Etme

### VPS'de Git Yapılandırması

```bash
# VPS'e bağlanın
ssh root@72.62.58.82

# Proje klasörüne gidin
cd /root/bina-yonetim

# Git kullanıcı bilgilerini ayarlayın (ilk kez ise)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Git repository başlatın (eğer yoksa)
git init

# Tüm dosyaları ekleyin
git add .

# İlk commit
git commit -m "Initial commit: Bina Yönetim Sistemi - Superadmin + Admin Panel"

# Github repository'nizi bağlayın
# NOT: YOUR_USERNAME yerine kendi kullanıcı adınızı yazın
git remote add origin https://github.com/YOUR_USERNAME/bina-yonetim-sistemi.git

# Ana branch'i ayarlayın
git branch -M main

# Github'a push edin
git push -u origin main
```

### 🔑 Github Authentication

Github 2021'den beri şifre ile push kabul etmiyor. İki seçenek var:

**Seçenek A: Personal Access Token (PAT) - Tavsiye edilir**

1. Github → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" tıklayın
3. Note: "Portainer Deployment"
4. Expiration: 90 days (veya No expiration)
5. Scope: `repo` işaretleyin (full control)
6. "Generate token" tıklayın
7. **Token'ı kopyalayın** (bir daha gösterilmez!)

Push yaparken:
```bash
Username: your-github-username
Password: ghp_xxxxxxxxxxxxxxxxxxxx (PAT token'ınız)
```

**Seçenek B: SSH Key**

```bash
# SSH key oluşturun (VPS'de)
ssh-keygen -t ed25519 -C "your-email@example.com"
# Enter, Enter, Enter (şifresiz)

# Public key'i kopyalayın
cat ~/.ssh/id_ed25519.pub

# Github → Settings → SSH and GPG keys → New SSH key
# Kopyaladığınız key'i yapıştırın

# Remote URL'i SSH olarak değiştirin
git remote set-url origin git@github.com:YOUR_USERNAME/bina-yonetim-sistemi.git

# Push edin
git push -u origin main
```

---

## 📦 Adım 2: Portainer'da Github ile Deploy

### 2.1. Portainer'a Giriş Yapın

```
http://72.62.58.82:9000
```

### 2.2. Stack Oluştur/Güncelle

#### Yeni Stack İçin:
1. **Stacks** → **+ Add stack**
2. Name: `bina-yonetim`
3. Build method: **Repository** seçin ✅

#### Mevcut Stack Güncelleme İçin:
1. **Stacks** → `bina-yonetim` → **Editor**
2. En altta **"Repository"** sekmesine tıklayın

### 2.3. Repository Ayarları

**Repository URL:**
```
https://github.com/YOUR_USERNAME/bina-yonetim-sistemi
```

**Reference:**
```
refs/heads/main
```
(veya `master` kullanıyorsanız `refs/heads/master`)

**Compose path:**
```
docker-compose.yml
```

**Authentication:** (Private repo ise)
- Username: GitHub kullanıcı adınız
- Personal Access Token: `ghp_xxxxxxxxxxxx` (oluşturduğunuz PAT)

### 2.4. Environment Variables

**Advanced mode** → Şunları ekleyin:

```env
MONGO_USER=admin
MONGO_PASSWORD=SuperGuvenli123ABC
MONGO_DB=building_management
SECRET_KEY=your_super_secret_jwt_key_change_this_in_production_12345678
REACT_APP_BACKEND_URL=http://72.62.58.82:8001
```

**⚠️ ÖNEMLİ:** Bu değişkenler Github'a push edilmiyor, sadece Portainer'da saklanıyor.

### 2.5. Automatic Updates (Opsiyonel)

**Enable automatic updates from repository** işaretleyebilirsiniz:
- Fetch interval: 5 minutes
- Her push'ta Portainer otomatik güncelleyecek

### 2.6. Deploy!

**"Deploy the stack"** veya **"Update the stack"** butonuna tıklayın.

---

## 🔄 Adım 3: Güncellemeleri Push Etme

Artık her değişiklikte:

```bash
# VPS'de veya local'de
cd /root/bina-yonetim

# Değişiklikleri ekle
git add .

# Commit
git commit -m "Admin panel güncellendi"

# Push
git push origin main
```

**Portainer'da Automatic Updates aktifse:** 5 dakika içinde otomatik deploy edilir

**Manuel güncelleme için:**
1. Portainer → Stacks → `bina-yonetim` 
2. **"Pull and redeploy"** butonuna tıklayın

---

## 📂 Proje Yapısı (Github'da)

```
bina-yonetim-sistemi/
├── .gitignore              ✅ Hassas dosyalar ignore edilir
├── .env.example            ✅ Örnek environment variables
├── docker-compose.yml      ✅ Ana deployment dosyası
├── DEPLOYMENT.md           ✅ Detaylı deployment rehberi
├── GITHUB_DEPLOY.md        ✅ Bu dosya
├── PORTAINER_DEPLOY_GUIDE.md ✅ Hızlı başlangıç
├── README.md               ✅ Proje dokümantasyonu
│
├── backend/
│   ├── Dockerfile          ✅ Backend image
│   ├── requirements.txt    ✅ Python dependencies
│   ├── server.py           ✅ FastAPI app
│   └── seed_data.py        ✅ Test verileri
│
├── frontend/               (Superadmin - Port 3000)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│
└── admin-panel/            (Bina Yöneticisi - Port 3001)
    ├── Dockerfile          ✅ YENİ
    ├── nginx.conf          ✅ YENİ
    ├── package.json
    └── src/                ✅ YENİ
```

**Not:** `.env` dosyası Github'a yüklenmez (.gitignore'da)

---

## ✅ Deploy Sonrası Kontrol

### 1. Container'ları Kontrol

Portainer → Containers:
- ✅ `bina-mongodb` (yeşil)
- ✅ `bina-backend` (yeşil)
- ✅ `bina-superadmin` (yeşil)
- ✅ `bina-admin-panel` (yeşil)

### 2. Loglara Bakın

Her container için "Logs" butonuna tıklayarak hataları kontrol edin.

### 3. Uygulamayı Test Edin

- **Superadmin:** http://72.62.58.82:3000
- **Admin Panel:** http://72.62.58.82:3001
- **API Docs:** http://72.62.58.82:8001/docs

---

## 🔒 Güvenlik Notları

### Github Repository Güvenliği

1. ✅ **Private** repository kullanın
2. ✅ `.env` dosyası Github'a yüklenmiyor (.gitignore)
3. ✅ Hassas bilgiler sadece Portainer environment variables'da
4. ✅ PAT token'ı güvenli saklayın (1Password, Bitwarden vb.)

### Environment Variables Yönetimi

**Github'da ASLA yüklemeyin:**
- ❌ `.env`
- ❌ Şifreler
- ❌ API keys
- ❌ Database credentials

**Portainer'da saklayın:**
- ✅ `MONGO_PASSWORD`
- ✅ `SECRET_KEY`
- ✅ `REACT_APP_BACKEND_URL`

---

## 🚨 Sorun Giderme

### "Repository not found" Hatası

**Sebep:** Private repo ve authentication eksik

**Çözüm:**
1. Portainer'da Repository Authentication kısmını doldurun
2. PAT token yetkilerini kontrol edin (`repo` scope olmalı)

### "Build failed" Hatası

**Sebep:** Dockerfile veya dependencies sorunu

**Çözüm:**
1. Portainer → Container Logs → Build loglarına bakın
2. Genellikle `npm install` veya `pip install` hataları
3. VPS'de manuel test edin:
```bash
cd /root/bina-yonetim/admin-panel
docker build -t test-build .
```

### "Environment variable not found" Hatası

**Sebep:** Portainer'da environment variables eksik

**Çözüm:**
1. Stacks → `bina-yonetim` → Editor
2. Environment variables bölümünü kontrol edin
3. Tüm required değişkenlerin olduğundan emin olun

### Automatic Update Çalışmıyor

**Sebep:** Webhook veya polling ayarları

**Çözüm:**
1. Stack → Editor → "Automatic updates" kısmını kontrol edin
2. Fetch interval'i 5 dakika yapın
3. Veya manuel olarak "Pull and redeploy" kullanın

---

## 🎯 En İyi Pratikler

### 1. Branch Stratejisi

```bash
# Development branch oluşturun
git checkout -b development
git push origin development

# Portainer'da development stack oluşturun
# Testler başarılı olunca main'e merge edin
git checkout main
git merge development
git push origin main
```

### 2. Commit Mesajları

İyi commit mesajları:
```bash
git commit -m "feat: Admin panel'e duyuru CRUD eklendi"
git commit -m "fix: Dashboard istatistik hesaplama düzeltildi"
git commit -m "docs: DEPLOYMENT.md güncellendi"
```

### 3. Versiyon Tagging

```bash
# Stable release için tag oluşturun
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0

# Portainer'da Reference'i tag olarak ayarlayabilirsiniz
# refs/tags/v1.0.0
```

### 4. .env.example Güncel Tutma

Her yeni environment variable eklediğinizde `.env.example`'ı güncelleyin:

```bash
# .env.example
NEW_FEATURE_API_KEY=your_api_key_here
```

---

## 📊 Workflow Özeti

```
Local/VPS                Github              Portainer              VPS Containers
─────────                ──────              ─────────              ──────────────
                                             
Code değişikliği    →    git push    →    Auto/Manuel    →    docker-compose
                        (main branch)         pull              up -d --build
                                                ↓
                                           Build images
                                                ↓
                                         Deploy containers
                                                ↓
                                           ✅ LIVE!
```

---

## ✨ Başarılar!

Artık projeniz Github'da ve Portainer üzerinden otomatik deploy ediliyor! 🎉

**Avantajlar:**
- ✅ Version control (Git)
- ✅ Collaboration (Team members)
- ✅ Automatic deployment
- ✅ Rollback (git revert + redeploy)
- ✅ CI/CD ready

**Sıradaki Adımlar:**
- Github Actions ile automated testing
- Slack/Discord webhook notifications
- Blue-green deployment
- SSL certificate automation
