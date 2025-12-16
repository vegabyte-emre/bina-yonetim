import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, 
  ArrowUpDown, AlertTriangle,
  Zap, ZapOff,
  Droplets, DropletOff,
  RefreshCw, Save, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BuildingStatus = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState({
    wifi: 'active',
    elevator: 'active',
    electricity: 'active',
    water: 'active'
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/building-manager/building-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus({
          wifi: data.wifi || 'active',
          elevator: data.elevator || 'active',
          electricity: data.electricity || 'active',
          water: data.water || 'active'
        });
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (field, value) => {
    setStatus(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/building-manager/building-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(status)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving status:', err);
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    wifi: {
      label: 'Wi-Fi',
      icon: Wifi,
      iconOff: WifiOff,
      options: [
        { value: 'active', label: 'Aktif', color: 'emerald' },
        { value: 'inactive', label: 'Kapalı', color: 'red' },
        { value: 'maintenance', label: 'Bakımda', color: 'amber' }
      ],
      gradient: 'from-cyan-400 to-blue-500'
    },
    elevator: {
      label: 'Asansör',
      icon: ArrowUpDown,
      iconOff: AlertTriangle,
      options: [
        { value: 'active', label: 'Çalışıyor', color: 'emerald' },
        { value: 'faulty', label: 'Arızalı', color: 'red' },
        { value: 'maintenance', label: 'Bakımda', color: 'amber' }
      ],
      gradient: 'from-violet-400 to-purple-500',
      alert: true
    },
    electricity: {
      label: 'Elektrik',
      icon: Zap,
      iconOff: ZapOff,
      options: [
        { value: 'active', label: 'Aktif', color: 'emerald' },
        { value: 'outage', label: 'Kesinti', color: 'red' },
        { value: 'maintenance', label: 'Bakımda', color: 'amber' }
      ],
      gradient: 'from-amber-400 to-orange-500'
    },
    water: {
      label: 'Su',
      icon: Droplets,
      iconOff: DropletOff,
      options: [
        { value: 'active', label: 'Aktif', color: 'emerald' },
        { value: 'outage', label: 'Kesinti', color: 'red' },
        { value: 'maintenance', label: 'Bakımda', color: 'amber' }
      ],
      gradient: 'from-blue-400 to-cyan-500'
    }
  };

  const getStatusColor = (value) => {
    if (value === 'active') return 'emerald';
    if (value === 'faulty' || value === 'outage' || value === 'inactive') return 'red';
    return 'amber';
  };

  const getGlowColor = (value) => {
    if (value === 'active') return 'shadow-emerald-500/50';
    if (value === 'faulty' || value === 'outage' || value === 'inactive') return 'shadow-red-500/50';
    return 'shadow-amber-500/50';
  };

  const getBgColor = (value) => {
    if (value === 'active') return 'bg-emerald-500';
    if (value === 'faulty' || value === 'outage' || value === 'inactive') return 'bg-red-500';
    return 'bg-amber-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bina Durumu</h1>
          <p className="mt-1 text-sm text-gray-600">Bina sistemlerinin durumunu yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchStatus}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
            data-testid="save-button"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {success ? 'Kaydedildi!' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Alert for elevator */}
      {status.elevator === 'faulty' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3" data-testid="elevator-alert">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">Asansör Arızası Bildirimi</h4>
            <p className="text-sm text-red-600 mt-1">
              Asansör arızalı olarak işaretlendiğinde tüm sakinlere otomatik olarak e-posta ve push bildirim gönderilir.
            </p>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Object.entries(statusConfig).map(([key, config]) => {
          const currentValue = status[key];
          const color = getStatusColor(currentValue);
          const Icon = currentValue === 'active' ? config.icon : config.iconOff;
          
          return (
            <Card 
              key={key} 
              className={`border-0 shadow-lg overflow-hidden transition-all duration-500 ${getGlowColor(currentValue)} shadow-lg hover:shadow-xl`}
              data-testid={`${key}-card`}
            >
              {/* Neon Header */}
              <div className={`relative h-32 bg-gradient-to-br ${config.gradient} p-6 flex items-center justify-center`}>
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50 blur-xl`}></div>
                
                {/* Pulsing ring for active status */}
                {currentValue === 'active' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 animate-ping"></div>
                  </div>
                )}
                
                {/* Icon */}
                <div className={`relative z-10 w-16 h-16 rounded-2xl ${getBgColor(currentValue)} bg-opacity-30 backdrop-blur-sm flex items-center justify-center border border-white/30`}>
                  <Icon className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                
                {/* Status indicator dot */}
                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${getBgColor(currentValue)} ${currentValue === 'active' ? 'animate-pulse' : ''}`} data-testid={`${key}-status-indicator`}>
                  <div className={`absolute inset-0 rounded-full ${getBgColor(currentValue)} animate-ping opacity-75`}></div>
                </div>
              </div>
              
              <CardContent className="p-4 bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{config.label}</h3>
                  {config.alert && currentValue === 'faulty' && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Bildirim
                    </span>
                  )}
                </div>
                
                {/* Status Options */}
                <div className="flex flex-wrap gap-2">
                  {config.options.map((option) => {
                    const isSelected = currentValue === option.value;
                    const colorClasses = {
                      emerald: isSelected ? 'bg-emerald-500 text-white shadow-emerald-500/50 shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
                      red: isSelected ? 'bg-red-500 text-white shadow-red-500/50 shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
                      amber: isSelected ? 'bg-amber-500 text-white shadow-amber-500/50 shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    };
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(key, option.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${colorClasses[option.color]}`}
                        data-testid={`${key}-${option.value}-button`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          Bildirim Sistemi
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-medium">Aktif</span>
            </div>
            <p className="text-sm text-gray-400">Sistem normal çalışıyor</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <span className="font-medium">Arızalı/Kesinti</span>
            </div>
            <p className="text-sm text-gray-400">Sistem çalışmıyor</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-amber-400" />
              </div>
              <span className="font-medium">Bakımda</span>
            </div>
            <p className="text-sm text-gray-400">Planlı bakım yapılıyor</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <ArrowUpDown className="h-4 w-4 text-purple-400" />
              </div>
              <span className="font-medium">Asansör Bildirimi</span>
            </div>
            <p className="text-sm text-gray-400">Arıza durumunda otomatik bildirim</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingStatus;