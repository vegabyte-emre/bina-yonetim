# ⚡ Hızlı Başlangıç - 5 Dakikada Deploy!

## 🎯 Portainer ile 5 Adımda Kurulum

### Adım 1: VPS Hazırlığı (2 dakika)

```bash
# SSH ile VPS'e bağlan
ssh root@YOUR_VPS_IP

# Docker kur
curl -fsSL https://get.docker.com | sh

# Portainer kur
docker volume create portainer_data
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### Adım 2: Portainer'a Giriş (30 saniye)

1. Tarayıcıda aç: `http://YOUR_VPS_IP:9000`
2. Admin şifre oluştur
3. "Get Started" → "Local" seç

### Adım 3: Stack Oluştur (1 dakika)

1. Sol menü → **Stacks** → **Add stack**
2. Name: `bina-yonetim`
3. **Upload** seç → `docker-compose.yml` yükle

### Adım 4: Environment Variables (1 dakika)

**Advanced mode** tıkla ve yapıştır:

```env
MONGO_USER=admin
MONGO_PASSWORD=SuperGuvenli123!@#
MONGO_DB=building_management
SECRET_KEY=your-super-secret-key-123456789
REACT_APP_BACKEND_URL=http://YOUR_VPS_IP:8001
```

**⚠️ YOUR_VPS_IP'yi değiştir!**

### Adım 5: Deploy! (2 dakika)

1. **Deploy the stack** tıkla
2. 2-3 dakika bekle
3. ✅ Hazır!

## 🌐 Erişim

- **Süperadmin:** `http://YOUR_VPS_IP:3000`
- **Backend API:** `http://YOUR_VPS_IP:8001/api`

### İlk Giriş

Terminal'den test verisi oluştur:

```bash
docker exec -it bina-backend python seed_data.py
```

**Login:**
- Email: `admin@test.com`
- Şifre: `admin123`

## 🔒 Güvenlik (Hemen Yap!)

```bash
# Firewall aç
ufw enable
ufw allow 22,80,443,3000,8001,9000/tcp

# Portainer şifresini değiştir
# http://YOUR_VPS_IP:9000 → Settings
```

## 📊 Yönetim

**Portainer'dan (http://YOUR_VPS_IP:9000):**

- 📦 **Containers** → Container'ları yönet
- 📊 **Logs** → Hata bul
- 📈 **Stats** → Performans izle
- 🔄 **Restart** → Yeniden başlat

**Stack Güncelleme:**
1. Stacks → bina-yonetim
2. Pull and redeploy ✅
3. Update the stack

## 🆘 Hata mı? Log'a Bak!

**Portainer'da:**
- Containers → bina-backend → Logs

**Terminal'de:**
```bash
docker logs bina-backend
```

## 📚 Detaylı Rehber

Daha fazla bilgi için: **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

**🎉 Tebrikler! Sisteminiz hazır.**

Şimdi http://YOUR_VPS_IP:3000 adresine gidin!
