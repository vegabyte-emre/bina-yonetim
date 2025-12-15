import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Users, DollarSign, Calendar, CheckCircle, 
  XCircle, FileText, Loader2, AlertCircle, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MailGonder = () => {
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState([]);
  const [residentsWithEmail, setResidentsWithEmail] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sending, setSending] = useState(false);
  
  // Form states for each template
  const [duesForm, setDuesForm] = useState({
    month: '',
    amount: '',
    due_date: '',
    expense_details: ''
  });
  
  const [meetingForm, setMeetingForm] = useState({
    meeting_type: 'Toplantı',
    meeting_title: '',
    meeting_date: '',
    meeting_time: '',
    meeting_location: '',
    meeting_description: '',
    vote_deadline: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    month: '',
    amount: '',
    payment_date: new Date().toLocaleDateString('tr-TR'),
    payment_method: 'Banka Transferi',
    receipt_no: '',
    error_message: ''
  });

  const templates = [
    {
      id: 'dues_notification',
      name: 'Aidat Bildirimi',
      description: 'Aylık aidat bildirimi, harcama detayları ile birlikte',
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'meeting_voting',
      name: 'Toplantı / Oylama',
      description: 'Toplantı veya oylama bildirimi',
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'payment_success',
      name: 'Ödeme Başarılı',
      description: 'Aidat ödemesi başarılı bildirimi',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      id: 'payment_failed',
      name: 'Ödeme Başarısız',
      description: 'Aidat ödemesi başarısız bildirimi',
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  useEffect(() => {
    fetchResidents();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchResidents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/residents`, {
        headers: getAuthHeaders()
      });
      setResidents(response.data);
      const withEmail = response.data.filter(r => r.email && r.is_active).length;
      setResidentsWithEmail(withEmail);
    } catch (error) {
      console.error('Sakinler yüklenemedi:', error);
    }
  };

  const handleSendMail = async (templateName, variables) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Get building info
      const buildingResponse = await axios.get(`${API_URL}/api/buildings/${user.building_id}`, {
        headers: getAuthHeaders()
      });
      const buildingName = buildingResponse.data?.name || 'Bina';
      
      // Get active residents with email
      const activeResidents = residents.filter(r => r.email && r.is_active);
      
      if (activeResidents.length === 0) {
        toast.error('Mail adresi olan aktif sakin bulunamadı');
        setSending(false);
        return;
      }
      
      let sentCount = 0;
      let failedCount = 0;
      
      for (const resident of activeResidents) {
        try {
          // Get apartment info
          let apartmentNo = '-';
          if (resident.apartment_id) {
            const aptResponse = await axios.get(`${API_URL}/api/apartments/${resident.apartment_id}`, {
              headers: getAuthHeaders()
            }).catch(() => null);
            if (aptResponse?.data) {
              apartmentNo = aptResponse.data.apartment_number || '-';
            }
          }
          
          // Prepare variables for this resident
          const residentVars = {
            ...variables,
            user_name: resident.full_name,
            building_name: buildingName,
            apartment_no: apartmentNo
          };
          
          await axios.post(`${API_URL}/api/mail/send`, {
            to: [resident.email],
            template_name: templateName,
            variables: residentVars
          }, {
            headers: getAuthHeaders()
          });
          
          sentCount++;
        } catch (error) {
          console.error(`Mail error for ${resident.email}:`, error);
          failedCount++;
        }
      }
      
      if (sentCount > 0) {
        toast.success(`${sentCount} sakin'e mail gönderildi!`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} mail gönderilemedi`);
      }
      
      setSelectedTemplate(null);
      
    } catch (error) {
      console.error('Mail error:', error);
      toast.error(error.response?.data?.detail || 'Mail gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const handleDuesSubmit = (e) => {
    e.preventDefault();
    
    // Create expense details HTML
    let expenseHtml = '';
    if (duesForm.expense_details) {
      const lines = duesForm.expense_details.split('\n').filter(l => l.trim());
      expenseHtml = lines.map(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          return `<tr><td>${parts[0].trim()}</td><td style="text-align: right;">${parts[1].trim()}</td></tr>`;
        }
        return `<tr><td colspan="2">${line}</td></tr>`;
      }).join('');
    }
    
    handleSendMail('dues_notification', {
      month: duesForm.month,
      amount: duesForm.amount,
      due_date: duesForm.due_date,
      expense_details: expenseHtml,
      previous_balance: '₺0',
      total_amount: duesForm.amount
    });
  };

  const handleMeetingSubmit = (e) => {
    e.preventDefault();
    handleSendMail('meeting_voting', {
      meeting_type: meetingForm.meeting_type,
      meeting_title: meetingForm.meeting_title,
      meeting_date: meetingForm.meeting_date,
      meeting_time: meetingForm.meeting_time,
      meeting_location: meetingForm.meeting_location,
      meeting_description: meetingForm.meeting_description,
      vote_deadline: meetingForm.vote_deadline
    });
  };

  const handlePaymentSuccessSubmit = (e) => {
    e.preventDefault();
    handleSendMail('payment_success', {
      month: paymentForm.month,
      amount: paymentForm.amount,
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      receipt_no: paymentForm.receipt_no || `RCP-${Date.now()}`
    });
  };

  const handlePaymentFailedSubmit = (e) => {
    e.preventDefault();
    handleSendMail('payment_failed', {
      month: paymentForm.month,
      amount: paymentForm.amount,
      payment_date: paymentForm.payment_date,
      error_message: paymentForm.error_message || 'Ödeme işlemi başarısız oldu'
    });
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toplu Mail Gönder</h1>
          <p className="mt-1 text-sm text-gray-600">Kayıtlı sakinlere mail bildirimi gönderin</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
          <Users className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">
            {residentsWithEmail} sakin mail alabilir
          </span>
        </div>
      </div>

      {/* Mail Config Warning */}
      {residentsWithEmail === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Mail adresi olan sakin yok</p>
            <p className="text-sm text-amber-700">Sakinler sayfasından email adreslerini ekleyin.</p>
          </div>
        </div>
      )}

      {/* Template Selection */}
      {!selectedTemplate ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer hover:shadow-lg transition-all border-2 ${template.borderColor} ${template.bgColor}`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${template.color} text-white`}>
                    <template.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400 rotate-[-90deg]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => setSelectedTemplate(null)}
            className="mb-4"
          >
            ← Geri Dön
          </Button>

          {/* Dues Notification Form */}
          {selectedTemplate === 'dues_notification' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Aidat Bildirimi Gönder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDuesSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Dönem (Ay/Yıl) *</Label>
                      <Input
                        value={duesForm.month}
                        onChange={(e) => setDuesForm({...duesForm, month: e.target.value})}
                        placeholder="Ocak 2025"
                        required
                      />
                    </div>
                    <div>
                      <Label>Aidat Tutarı *</Label>
                      <Input
                        value={duesForm.amount}
                        onChange={(e) => setDuesForm({...duesForm, amount: e.target.value})}
                        placeholder="₺1.500"
                        required
                      />
                    </div>
                    <div>
                      <Label>Son Ödeme Tarihi *</Label>
                      <Input
                        type="date"
                        value={duesForm.due_date}
                        onChange={(e) => setDuesForm({...duesForm, due_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Harcama Detayları (Her satıra bir kalem: "Açıklama: Tutar")</Label>
                    <Textarea
                      value={duesForm.expense_details}
                      onChange={(e) => setDuesForm({...duesForm, expense_details: e.target.value})}
                      placeholder="Elektrik: ₺500&#10;Su: ₺300&#10;Temizlik: ₺400&#10;Güvenlik: ₺300"
                      rows={5}
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full bg-green-600 hover:bg-green-700">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {residentsWithEmail} Sakin'e Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Meeting/Voting Form */}
          {selectedTemplate === 'meeting_voting' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Toplantı / Oylama Bildirimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMeetingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tür *</Label>
                      <select
                        value={meetingForm.meeting_type}
                        onChange={(e) => setMeetingForm({...meetingForm, meeting_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Toplantı">Toplantı</option>
                        <option value="Oylama">Oylama</option>
                        <option value="Genel Kurul">Genel Kurul</option>
                        <option value="Olağanüstü Toplantı">Olağanüstü Toplantı</option>
                      </select>
                    </div>
                    <div>
                      <Label>Başlık *</Label>
                      <Input
                        value={meetingForm.meeting_title}
                        onChange={(e) => setMeetingForm({...meetingForm, meeting_title: e.target.value})}
                        placeholder="2025 Yılı Bütçe Görüşmesi"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tarih *</Label>
                      <Input
                        type="date"
                        value={meetingForm.meeting_date}
                        onChange={(e) => setMeetingForm({...meetingForm, meeting_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Saat *</Label>
                      <Input
                        type="time"
                        value={meetingForm.meeting_time}
                        onChange={(e) => setMeetingForm({...meetingForm, meeting_time: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Oylama Son Tarihi *</Label>
                      <Input
                        type="date"
                        value={meetingForm.vote_deadline}
                        onChange={(e) => setMeetingForm({...meetingForm, vote_deadline: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Yer *</Label>
                    <Input
                      value={meetingForm.meeting_location}
                      onChange={(e) => setMeetingForm({...meetingForm, meeting_location: e.target.value})}
                      placeholder="Site Toplantı Salonu"
                      required
                    />
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      value={meetingForm.meeting_description}
                      onChange={(e) => setMeetingForm({...meetingForm, meeting_description: e.target.value})}
                      placeholder="Toplantı gündemi ve detaylar..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full bg-purple-600 hover:bg-purple-700">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {residentsWithEmail} Sakin'e Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Success Form */}
          {selectedTemplate === 'payment_success' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Ödeme Başarılı Bildirimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSuccessSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Dönem (Ay/Yıl) *</Label>
                      <Input
                        value={paymentForm.month}
                        onChange={(e) => setPaymentForm({...paymentForm, month: e.target.value})}
                        placeholder="Ocak 2025"
                        required
                      />
                    </div>
                    <div>
                      <Label>Ödeme Tutarı *</Label>
                      <Input
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        placeholder="₺1.500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Ödeme Tarihi</Label>
                      <Input
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                        placeholder="15.01.2025"
                      />
                    </div>
                    <div>
                      <Label>Ödeme Yöntemi</Label>
                      <select
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Banka Transferi">Banka Transferi</option>
                        <option value="Kredi Kartı">Kredi Kartı</option>
                        <option value="Nakit">Nakit</option>
                        <option value="Havale/EFT">Havale/EFT</option>
                      </select>
                    </div>
                    <div>
                      <Label>Makbuz No</Label>
                      <Input
                        value={paymentForm.receipt_no}
                        onChange={(e) => setPaymentForm({...paymentForm, receipt_no: e.target.value})}
                        placeholder="Otomatik oluşturulur"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {residentsWithEmail} Sakin'e Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Failed Form */}
          {selectedTemplate === 'payment_failed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Ödeme Başarısız Bildirimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentFailedSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Dönem (Ay/Yıl) *</Label>
                      <Input
                        value={paymentForm.month}
                        onChange={(e) => setPaymentForm({...paymentForm, month: e.target.value})}
                        placeholder="Ocak 2025"
                        required
                      />
                    </div>
                    <div>
                      <Label>Ödeme Tutarı *</Label>
                      <Input
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        placeholder="₺1.500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Hata Mesajı</Label>
                    <Textarea
                      value={paymentForm.error_message}
                      onChange={(e) => setPaymentForm({...paymentForm, error_message: e.target.value})}
                      placeholder="Yetersiz bakiye, kart limiti aşıldı vb."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full bg-red-600 hover:bg-red-700">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {residentsWithEmail} Sakin'e Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MailGonder;
