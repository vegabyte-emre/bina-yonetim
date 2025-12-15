import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Calendar, CheckCircle, Clock, AlertCircle, 
  Loader2, Shield, Lock, ChevronRight, Building, Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// TL İkonu
const TLIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16" />
    <path d="M6 8h8" />
    <path d="M6 14h6" />
    <path d="M14 4l4 16" />
  </svg>
);

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [buildingInfo, setBuildingInfo] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Kart bilgileri
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPaymentData = async () => {
    try {
      // Bina bilgisini getir
      const buildingRes = await axios.get(`${API_URL}/api/building-manager/my-building`, {
        headers: getAuthHeaders()
      });
      setBuildingInfo(buildingRes.data);

      // Ödeme çizelgesini getir
      const paymentsRes = await axios.get(`${API_URL}/api/building-payments`, {
        headers: getAuthHeaders()
      });
      
      if (paymentsRes.data && paymentsRes.data.length > 0) {
        setPaymentSchedule(paymentsRes.data);
      } else {
        // Demo ödeme çizelgesi oluştur
        generatePaymentSchedule(buildingRes.data);
      }

      // Abonelik planını getir
      const plansRes = await axios.get(`${API_URL}/api/subscriptions/public`);
      if (plansRes.data && plansRes.data.length > 0) {
        // Bina'nın planını bul veya varsayılan al
        const plan = plansRes.data.find(p => p.name === buildingRes.data?.subscription_plan) || plansRes.data[0];
        setSubscriptionPlan(plan);
      }
    } catch (error) {
      console.error('Ödeme verileri yüklenemedi:', error);
      // Demo veri oluştur
      generatePaymentSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentSchedule = (building) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const schedule = [];
    const monthlyAmount = building?.subscription_price || 299;

    // Son 3 ay + gelecek 3 ay
    for (let i = -3; i <= 3; i++) {
      const monthIndex = (currentMonth + i + 12) % 12;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      
      let status = 'pending';
      if (i < 0) {
        status = Math.random() > 0.2 ? 'paid' : 'overdue';
      } else if (i === 0) {
        status = 'pending';
      } else {
        status = 'upcoming';
      }

      schedule.push({
        id: `payment-${year}-${monthIndex}`,
        period: `${months[monthIndex]} ${year}`,
        month: monthIndex,
        year: year,
        amount: monthlyAmount,
        status: status,
        dueDate: new Date(year, monthIndex, 15).toISOString(),
        paidDate: status === 'paid' ? new Date(year, monthIndex, Math.floor(Math.random() * 10) + 1).toISOString() : null
      });
    }

    setPaymentSchedule(schedule);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardData({ ...cardData, cardNumber: formatted });
    }
  };

  const openPaymentDialog = (payment) => {
    setSelectedPayment(payment);
    setCardData({
      cardNumber: '',
      cardHolder: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: ''
    });
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    // Validasyon
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Geçerli bir kart numarası giriniz');
      return;
    }
    if (!cardData.cardHolder) {
      toast.error('Kart sahibi adını giriniz');
      return;
    }
    if (!cardData.expiryMonth || !cardData.expiryYear) {
      toast.error('Son kullanma tarihini giriniz');
      return;
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      toast.error('CVV kodunu giriniz');
      return;
    }

    setProcessing(true);
    try {
      // Paratika ödeme oturumu oluştur
      const response = await axios.post(`${API_URL}/api/building-payments/process`, {
        payment_id: selectedPayment.id,
        amount: selectedPayment.amount,
        period: selectedPayment.period,
        card_number: cardData.cardNumber.replace(/\s/g, ''),
        card_holder: cardData.cardHolder,
        expiry_month: cardData.expiryMonth,
        expiry_year: cardData.expiryYear,
        cvv: cardData.cvv
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        toast.success('Ödeme başarıyla tamamlandı!');
        setPaymentDialogOpen(false);
        
        // Ödeme durumunu güncelle
        setPaymentSchedule(prev => prev.map(p => 
          p.id === selectedPayment.id 
            ? { ...p, status: 'paid', paidDate: new Date().toISOString() }
            : p
        ));
      } else if (response.data.payment_url) {
        // 3D Secure yönlendirmesi
        window.location.href = response.data.payment_url;
      } else {
        toast.error(response.data.error || 'Ödeme işlemi başarısız');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      toast.error(error.response?.data?.detail || 'Ödeme işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Ödendi</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Gecikmiş</Badge>;
      case 'upcoming':
        return <Badge className="bg-gray-100 text-gray-600"><Calendar className="h-3 w-3 mr-1" />Yaklaşan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Özet hesapla
  const summary = {
    totalPaid: paymentSchedule.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    totalPending: paymentSchedule.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    paidCount: paymentSchedule.filter(p => p.status === 'paid').length,
    pendingCount: paymentSchedule.filter(p => p.status === 'pending').length,
    overdueCount: paymentSchedule.filter(p => p.status === 'overdue').length
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
          <h1 className="text-2xl font-bold text-gray-900">Abonelik Ödemeleri</h1>
          <p className="mt-1 text-sm text-gray-600">Aylık abonelik ödemelerinizi buradan yönetin</p>
        </div>
        {buildingInfo && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl">
            <Building className="h-5 w-5 text-blue-600" />
            <div className="text-right">
              <p className="text-sm font-medium text-blue-900">{buildingInfo.name}</p>
              <p className="text-xs text-blue-600">{subscriptionPlan?.name || 'Temel Plan'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Ödenen</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(summary.totalPaid)}
                </p>
                <p className="text-xs text-green-600 mt-1">{summary.paidCount} ödeme</p>
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
                  {formatCurrency(summary.totalPending)}
                </p>
                <p className="text-xs text-amber-600 mt-1">{summary.pendingCount + summary.overdueCount} ödeme</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Aylık Tutar</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(subscriptionPlan?.price_monthly || 299)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Abonelik ücreti</p>
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
                <p className="text-sm font-medium text-purple-600">Sonraki Ödeme</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {paymentSchedule.find(p => p.status === 'pending')?.period?.split(' ')[0] || '-'}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Son: {formatDate(paymentSchedule.find(p => p.status === 'pending')?.dueDate)}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Ödeme Çizelgesi</CardTitle>
              <CardDescription>Geçmiş ve gelecek abonelik ödemeleriniz</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {paymentSchedule.map((payment) => (
              <div 
                key={payment.id} 
                className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  payment.status === 'overdue' ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    payment.status === 'paid' ? 'bg-green-100' :
                    payment.status === 'overdue' ? 'bg-red-100' :
                    payment.status === 'pending' ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    <Calendar className={`h-5 w-5 ${
                      payment.status === 'paid' ? 'text-green-600' :
                      payment.status === 'overdue' ? 'text-red-600' :
                      payment.status === 'pending' ? 'text-amber-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{payment.period}</p>
                    <p className="text-sm text-gray-500">
                      Son ödeme: {formatDate(payment.dueDate)}
                      {payment.paidDate && ` • Ödendi: ${formatDate(payment.paidDate)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    {getStatusBadge(payment.status)}
                  </div>

                  {(payment.status === 'pending' || payment.status === 'overdue') && (
                    <Button 
                      onClick={() => openPaymentDialog(payment)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Öde
                    </Button>
                  )}

                  {payment.status === 'paid' && (
                    <Button variant="outline" size="sm" disabled>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Tamamlandı
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-700">Güvenli Ödeme</p>
          <p>Tüm ödemeler 256-bit SSL şifreleme ile korunmaktadır. Kart bilgileriniz Paratika güvenli ödeme altyapısı üzerinden işlenmektedir.</p>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Ödeme Yap
            </DialogTitle>
            <DialogDescription>
              {selectedPayment?.period} dönemi için {formatCurrency(selectedPayment?.amount || 0)} tutarında ödeme yapılacaktır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Ödeme Özeti */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Dönem</span>
                <span className="font-semibold text-blue-900">{selectedPayment?.period}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-blue-700">Tutar</span>
                <span className="font-bold text-xl text-blue-900">{formatCurrency(selectedPayment?.amount || 0)}</span>
              </div>
            </div>

            {/* Kart Bilgileri */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Kart Numarası</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className="pl-10"
                    maxLength={19}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="cardHolder">Kart Üzerindeki İsim</Label>
                <Input
                  id="cardHolder"
                  value={cardData.cardHolder}
                  onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                  placeholder="AD SOYAD"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiryMonth">Ay</Label>
                  <select
                    id="expiryMonth"
                    value={cardData.expiryMonth}
                    onChange={(e) => setCardData({ ...cardData, expiryMonth: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">AA</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="expiryYear">Yıl</Label>
                  <select
                    id="expiryYear"
                    value={cardData.expiryYear}
                    onChange={(e) => setCardData({ ...cardData, expiryYear: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">YY</option>
                    {[...Array(10)].map((_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={i} value={String(year).slice(-2)}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      type="password"
                      value={cardData.cvv}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        if (v.length <= 4) setCardData({ ...cardData, cvv: v });
                      }}
                      placeholder="•••"
                      maxLength={4}
                      className="pl-8"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Kartı Bilgisi */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-800 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Test Modu Aktif
              </p>
              <p className="text-amber-700 mt-1">Test kartı: 4355 0840 0000 0016 | 12/30 | CVV: 000</p>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handlePayment} 
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  {formatCurrency(selectedPayment?.amount || 0)} Öde
                </>
              )}
            </Button>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                256-bit SSL
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Lock className="h-4 w-4" />
                Güvenli Ödeme
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
