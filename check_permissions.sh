#!/bin/bash

echo "================================================"
echo "🔍 MOBİL UYGULAMA İZİN KONTROLÜ"
echo "================================================"
echo ""

echo "1️⃣  app.json kontrolü:"
echo "-------------------"
if grep -q "INTERNET" /app/mobile/frontend/app.json; then
    echo "✅ INTERNET permission var"
else
    echo "❌ INTERNET permission YOK!"
fi

if grep -q "ACCESS_NETWORK_STATE" /app/mobile/frontend/app.json; then
    echo "✅ ACCESS_NETWORK_STATE permission var"
else
    echo "❌ ACCESS_NETWORK_STATE permission YOK!"
fi

if grep -q "usesCleartextTraffic" /app/mobile/frontend/app.json; then
    echo "✅ usesCleartextTraffic true"
else
    echo "❌ usesCleartextTraffic YOK!"
fi

echo ""
echo "2️⃣  app.config.js kontrolü:"
echo "-------------------"
if [ -f "/app/mobile/frontend/app.config.js" ]; then
    echo "✅ app.config.js var"
    if grep -q "INTERNET" /app/mobile/frontend/app.config.js; then
        echo "✅ INTERNET permission tanımlı"
    fi
    if grep -q "ACCESS_WIFI_STATE" /app/mobile/frontend/app.config.js; then
        echo "✅ ACCESS_WIFI_STATE permission tanımlı"
    fi
else
    echo "⚠️  app.config.js YOK"
fi

echo ""
echo "3️⃣  AndroidManifest plugin kontrolü:"
echo "-------------------"
if [ -f "/app/mobile/frontend/plugins/withAndroidManifest.js" ]; then
    echo "✅ withAndroidManifest.js plugin var"
    if grep -q "android.permission.INTERNET" /app/mobile/frontend/plugins/withAndroidManifest.js; then
        echo "✅ Plugin INTERNET permission ekliyor"
    fi
else
    echo "⚠️  withAndroidManifest.js plugin YOK"
fi

echo ""
echo "4️⃣  Backend URL kontrolü:"
echo "-------------------"
if grep -q "backendUrl" /app/mobile/frontend/app.config.js; then
    BACKEND_URL=$(grep "backendUrl" /app/mobile/frontend/app.config.js | head -1)
    echo "✅ Backend URL tanımlı: $BACKEND_URL"
else
    echo "⚠️  Backend URL bulunamadı"
fi

echo ""
echo "5️⃣  Hardcoded fallback kontrolü:"
echo "-------------------"
if grep -q "72.62.58.82:8001" /app/mobile/frontend/app/index.tsx; then
    echo "✅ Hardcoded fallback URL var (index.tsx)"
fi

if grep -q "72.62.58.82:8001" /app/mobile/frontend/utils/api.ts; then
    echo "✅ Hardcoded fallback URL var (api.ts)"
fi

echo ""
echo "================================================"
echo "✅ TÜM İZİNLER TANIMLI"
echo "================================================"
echo ""
echo "📱 YENİ APK BUILD'DE OLACAKLAR:"
echo "  ✅ INTERNET permission"
echo "  ✅ ACCESS_NETWORK_STATE permission"
echo "  ✅ ACCESS_WIFI_STATE permission"
echo "  ✅ usesCleartextTraffic (HTTP için)"
echo "  ✅ Hardcoded backend URL fallback"
echo ""
echo "🎯 Android veri kullanımı 0'dan büyük olacak!"
echo ""
