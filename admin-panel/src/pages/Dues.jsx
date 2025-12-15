import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Send, Mail, Calendar, 
  Calculator, Building, AlertCircle, CheckCircle, Loader2,
  ChevronDown, ChevronUp, Edit, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// TL İkonu komponenti
const TLIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16" />
    <path d="M6 8h8" />
    <path d="M6 14h6" />
    <path d="M14 4l4 16" />
  </svg>
);

const Dues = () => {
  const [monthlyDues, setMonthlyDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [sendingMail, setSendingMail] = useState(null);
  const [apartmentCount, setApartmentCount] = useState(0);
  const [expandedDue, setExpandedDue] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    month: '',
    due_date: '',
    expense_items: [{ name: '', amount: '' }]
  });

  useEffect(() => {
    fetchMonthlyDues();
    fetchApartmentCount();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchMonthlyDues = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/monthly-dues`, {
        headers: getAuthHeaders()
      });
      setMonthlyDues(response.data);
    } catch (error) {
      console.error('Aidat tanımları yüklenemedi:', error);
      toast.error('Aidat tanımları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchApartmentCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/apartments`, {
        headers: getAuthHeaders()
      });
      setApartmentCount(response.data.length);
    } catch (error) {
      console.error('Daire sayısı alınamadı:', error);
    }
  };

  // Toplam tutar hesapla
  const calculateTotal = () => {
    return formData.expense_items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  // Daire başına düşen tutar
  const calculatePerApartment = () => {
    const total = calculateTotal();
    if (apartmentCount > 0) {
      return total / apartmentCount;
    }
    return 0;
  };

  // Gider kalemi ekle
  const addExpenseItem = () => {
    setFormData({
      ...formData,
      expense_items: [...formData.expense_items, { name: '', amount: '' }]
    });
  };

  // Gider kalemi sil
  const removeExpenseItem = (index) => {
    if (formData.expense_items.length > 1) {
      const newItems = formData.expense_items.filter((_, i) => i !== index);
      setFormData({ ...formData, expense_items: newItems });
    }
  };

  // Gider kalemi güncelle
  const updateExpenseItem = (index, field, value) => {
    const newItems = [...formData.expense_items];
    newItems[index][field] = value;
    setFormData({ ...formData, expense_items: newItems });
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      month: '',
      due_date: '',
      expense_items: [{ name: '', amount: '' }]
    });
  };

  // Aidat tanımı oluştur
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validItems = formData.expense_items.filter(item => item.name.trim() && parseFloat(item.amount) > 0);
    if (validItems.length === 0) {
      toast.error('En az bir gider kalemi ekleyin');
      return;
    }
    
    if (!formData.month.trim()) {
      toast.error('Dönem seçin');
      return;
    }
    
    if (!formData.due_date) {
      toast.error('Son ödeme tarihi seçin');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      const payload = {
        building_id: user.building_id,
        month: formData.month,
        expense_items: validItems.map(item => ({
          name: item.name,
          amount: parseFloat(item.amount)
        })),
        total_amount: calculateTotal(),
        per_apartment_amount: calculatePerApartment(),
        due_date: new Date(formData.due_date).toISOString(),
        is_sent: false
      };
      
      await axios.post(`${API_URL}/api/monthly-dues`, payload, {
        headers: getAuthHeaders()
      });
      
      toast.success('Aidat tanımı oluşturuldu');
      setDialogOpen(false);
      resetForm();
      fetchMonthlyDues();
    } catch (error) {
      console.error('Aidat oluşturulamadı:', error);
      toast.error(error.response?.data?.detail || 'Aidat oluşturulamadı');
    }
  };

  // Aidat sil
  const handleDelete = async () => {
    if (!selectedDue) return;
    
    try {
      await axios.delete(`${API_URL}/api/monthly-dues/${selectedDue.id}`, {
        headers: getAuthHeaders()
      });
      toast.success('Aidat tanımı silindi');
      setDeleteDialogOpen(false);
      setSelectedDue(null);
      fetchMonthlyDues();
    } catch (error) {
      console.error('Aidat silinemedi:', error);
      toast.error('Aidat silinemedi');
    }
  };

  // Mail gönder
  const handleSendMail = async (monthlyDue) => {
    setSendingMail(monthlyDue.id);
    try {
      const response = await axios.post(
        `${API_URL}/api/monthly-dues/${monthlyDue.id}/send-mail`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchMonthlyDues();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Mail gönderilemedi:', error);
      toast.error(error.response?.data?.detail || 'Mail gönderilemedi');
    } finally {
      setSendingMail(null);
    }
  };

  // Tarih formatla
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Aidat Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-600">Aylık aidat tanımları ve mail bildirimleri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Aidat Tanımla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TLIcon className="h-5 w-5 text-blue-600" />
                Yeni Aidat Tanımla
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dönem ve Son Ödeme */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Dönem (Ay/Yıl) *</Label>
                  <Input
                    id="month"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    placeholder="Ocak 2025"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Son Ödeme Tarihi *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Gider Kalemleri Tablosu */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Gider Kalemleri</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addExpenseItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Kalem Ekle
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Hizmet / Ürün</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 w-40">Tutar (₺)</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.expense_items.map((item, index) => (
                        <tr key={index} className="bg-white">
                          <td className="px-4 py-2">
                            <Input
                              value={item.name}
                              onChange={(e) => updateExpenseItem(index, 'name', e.target.value)}
                              placeholder="Örn: Elektrik, Su, Temizlik..."
                              className="border-0 bg-transparent focus:ring-0"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.amount}
                              onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)}
                              placeholder="0.00"
                              className="border-0 bg-transparent focus:ring-0 text-right"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            {formData.expense_items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeExpenseItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Özet Kartları */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">Toplam Gider</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 font-medium">Daire Sayısı</p>
                  <p className="text-2xl font-bold text-gray-700 mt-1">{apartmentCount}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium">Daire Başı Aidat</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {formatCurrency(calculatePerApartment())}
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Bilgi</p>
                  <p>Toplam gider tutarı ({formatCurrency(calculateTotal())}) tüm dairelere ({apartmentCount} daire) eşit olarak paylaştırılacaktır. Her dairenin aylık aidatı {formatCurrency(calculatePerApartment())} olacaktır.</p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Calculator className="mr-2 h-4 w-4" />
                  Aidat Tanımla
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Toplam Daire</p>
                <p className="text-2xl font-bold text-blue-700">{apartmentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Gönderilen</p>
                <p className="text-2xl font-bold text-green-700">
                  {monthlyDues.filter(d => d.is_sent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-xl">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-600 font-medium">Bekleyen</p>
                <p className="text-2xl font-bold text-amber-700">
                  {monthlyDues.filter(d => !d.is_sent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aidat Listesi */}
      {monthlyDues.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TLIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz aidat tanımı yok</h3>
            <p className="text-gray-600 text-center mb-6">
              İlk aidat tanımınızı oluşturmak için yukarıdaki butonu kullanın
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {monthlyDues.map((due) => (
            <Card key={due.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Header */}
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedDue(expandedDue === due.id ? null : due.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${due.is_sent ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <TLIcon className={`h-6 w-6 ${due.is_sent ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{due.month}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Son Ödeme: {formatDate(due.due_date)}
                        </span>
                        {due.is_sent ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Gönderildi
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Mail className="h-3 w-3 mr-1" />
                            Bekliyor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Daire Başı</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(due.per_apartment_amount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!due.is_sent && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleSendMail(due); }}
                          disabled={sendingMail === due.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {sendingMail === due.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Mail Gönder
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setSelectedDue(due); setDeleteDialogOpen(true); }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedDue === due.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedDue === due.id && (
                  <div className="px-6 pb-6 border-t bg-gray-50">
                    <div className="pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Gider Kalemleri</h4>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-gray-600">Hizmet / Ürün</th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {due.expense_items?.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{item.name}</td>
                              <td className="py-2 text-right text-gray-900">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                          <tr className="font-semibold bg-blue-50">
                            <td className="py-3 text-blue-900">Toplam Gider</td>
                            <td className="py-3 text-right text-blue-900">{formatCurrency(due.total_amount)}</td>
                          </tr>
                          <tr className="font-bold bg-green-50">
                            <td className="py-3 text-green-900">Daire Başı Aidat ({apartmentCount} daire)</td>
                            <td className="py-3 text-right text-green-900">{formatCurrency(due.per_apartment_amount)}</td>
                          </tr>
                        </tbody>
                      </table>
                      {due.sent_at && (
                        <p className="text-sm text-gray-500 mt-4">
                          <CheckCircle className="h-4 w-4 inline mr-1 text-green-500" />
                          Mail gönderim tarihi: {formatDate(due.sent_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Aidat Tanımını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedDue?.month}" aidat tanımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dues;
