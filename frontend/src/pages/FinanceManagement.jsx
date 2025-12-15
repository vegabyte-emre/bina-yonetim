import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, FileSpreadsheet, 
  FileText, Filter, RefreshCw, CreditCard, Building, CheckCircle, XCircle,
  Clock, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// TL İkonu
const TLIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16" />
    <path d="M6 8h8" />
    <path d="M6 14h6" />
    <path d="M14 4l4 16" />
  </svg>
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinanceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      // Binaları getir
      const buildingsRes = await fetch(`${API}/buildings`, { headers: getAuthHeaders() });
      const buildingsData = buildingsRes.ok ? await buildingsRes.json() : [];
      setBuildings(buildingsData);

      // Abonelik ödemelerini getir
      const paymentsRes = await fetch(`${API}/subscription-payments`, { headers: getAuthHeaders() });
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      setPayments(paymentsData);

      // İstatistikleri hesapla
      calculateStats(buildingsData, paymentsData);
    } catch (error) {
      console.error('Veri yüklenemedi:', error);
      // Demo veri oluştur
      generateDemoData();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = () => {
    // Demo binalar - gerçek veriler için API'den gelecek
    const demoBuildingsData = buildings.length > 0 ? buildings : [];
    
    // Aylık gelir verisi (demo)
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const currentMonth = new Date().getMonth();
    
    const demoMonthlyData = months.slice(0, currentMonth + 1).map((month, i) => ({
      name: month,
      gelir: Math.floor(Math.random() * 50000) + 20000,
      tahsilat: Math.floor(Math.random() * 40000) + 15000
    }));
    setMonthlyData(demoMonthlyData);

    // Durum dağılımı
    setStatusData([
      { name: 'Ödendi', value: 65, color: '#10b981' },
      { name: 'Bekliyor', value: 25, color: '#f59e0b' },
      { name: 'Gecikmiş', value: 10, color: '#ef4444' }
    ]);

    // Demo istatistikler
    setSubscriptionStats({
      totalRevenue: 285000,
      monthlyRevenue: 28500,
      paidCount: 18,
      pendingCount: 6,
      overdueCount: 2
    });
  };

  const calculateStats = (buildingsData, paymentsData) => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    paymentsData.forEach(payment => {
      if (payment.status === 'paid') {
        totalRevenue += payment.amount;
        paidCount++;
      } else if (payment.status === 'pending') {
        pendingCount++;
      } else if (payment.status === 'overdue') {
        overdueCount++;
      }
    });

    // Bu ay geliri
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = paymentsData
      .filter(p => {
        const pDate = new Date(p.payment_date || p.created_at);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear && p.status === 'paid';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    setSubscriptionStats({
      totalRevenue,
      monthlyRevenue,
      paidCount,
      pendingCount,
      overdueCount
    });

    // Aylık veri oluştur
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthlyRevenues = {};
    
    paymentsData.forEach(p => {
      const date = new Date(p.payment_date || p.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyRevenues[monthKey]) {
        monthlyRevenues[monthKey] = { gelir: 0, tahsilat: 0 };
      }
      monthlyRevenues[monthKey].gelir += p.amount;
      if (p.status === 'paid') {
        monthlyRevenues[monthKey].tahsilat += p.amount;
      }
    });

    const chartData = Object.entries(monthlyRevenues).map(([key, data]) => {
      const [year, month] = key.split('-');
      return {
        name: months[parseInt(month)],
        ...data
      };
    });

    setMonthlyData(chartData.length > 0 ? chartData : generateDemoData());

    // Durum dağılımı
    const total = paidCount + pendingCount + overdueCount || 1;
    setStatusData([
      { name: 'Ödendi', value: Math.round((paidCount / total) * 100), color: '#10b981' },
      { name: 'Bekliyor', value: Math.round((pendingCount / total) * 100), color: '#f59e0b' },
      { name: 'Gecikmiş', value: Math.round((overdueCount / total) * 100), color: '#ef4444' }
    ]);
  };

  // Excel export
  const exportToExcel = () => {
    const data = payments.map(p => ({
      'Bina': p.building_name || '-',
      'Dönem': p.period || '-',
      'Tutar': p.amount,
      'Durum': p.status === 'paid' ? 'Ödendi' : p.status === 'pending' ? 'Bekliyor' : 'Gecikmiş',
      'Ödeme Tarihi': p.payment_date ? new Date(p.payment_date).toLocaleDateString('tr-TR') : '-',
      'Oluşturulma': new Date(p.created_at).toLocaleDateString('tr-TR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ödemeler');
    
    // Sütun genişlikleri
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Yonetioo_Finans_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel raporu indirildi');
  };

  // PDF export
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Başlık
    doc.setFontSize(20);
    doc.text('Yönetioo Finans Raporu', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);
    
    // Özet
    doc.setFontSize(14);
    doc.text('Özet', 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Toplam Gelir: ${subscriptionStats.totalRevenue.toLocaleString('tr-TR')} TL`, 14, 55);
    doc.text(`Bu Ay Gelir: ${subscriptionStats.monthlyRevenue.toLocaleString('tr-TR')} TL`, 14, 62);
    doc.text(`Ödenen: ${subscriptionStats.paidCount} adet`, 14, 69);
    doc.text(`Bekleyen: ${subscriptionStats.pendingCount} adet`, 14, 76);
    doc.text(`Gecikmiş: ${subscriptionStats.overdueCount} adet`, 14, 83);
    
    // Tablo
    const tableData = payments.map(p => [
      p.building_name || '-',
      p.period || '-',
      `${p.amount.toLocaleString('tr-TR')} TL`,
      p.status === 'paid' ? 'Ödendi' : p.status === 'pending' ? 'Bekliyor' : 'Gecikmiş',
      p.payment_date ? new Date(p.payment_date).toLocaleDateString('tr-TR') : '-'
    ]);

    doc.autoTable({
      startY: 95,
      head: [['Bina', 'Dönem', 'Tutar', 'Durum', 'Ödeme Tarihi']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`Yonetioo_Finans_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF raporu indirildi');
  };

  // Para formatla
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finans Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">Abonelik gelirleri ve ödeme takibi</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm" className="text-green-600 hover:text-green-700">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(subscriptionStats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <TLIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Bu Ay Gelir</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {formatCurrency(subscriptionStats.monthlyRevenue)}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Ödenen</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {subscriptionStats.paidCount}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Bekleyen</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {subscriptionStats.pendingCount}
                </p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Gecikmiş</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {subscriptionStats.overdueCount}
                </p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Aylık Gelir Grafiği
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString('tr-TR')} TL`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="gelir" name="Toplam Gelir" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="tahsilat" name="Tahsilat" stroke="#10b981" fill="#6ee7b7" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              Ödeme Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: %${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`%${value}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Ödeme Çizelgesi
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Başlangıç:</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Bitiş:</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-40"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bina</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Dönem</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Tutar</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Durum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Son Ödeme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buildings.length > 0 ? buildings.map((building) => (
                  <tr key={building.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{building.name}</p>
                          <p className="text-sm text-gray-500">{building.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {building.subscription_plan || 'Temel'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(building.subscription_price || 299)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {building.subscription_status === 'active' ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ödendi
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Bekliyor
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {building.subscription_end_date 
                        ? new Date(building.subscription_end_date).toLocaleDateString('tr-TR')
                        : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Henüz kayıtlı bina bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceManagement;
