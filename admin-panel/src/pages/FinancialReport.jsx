import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FinancialReport = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('thisMonth');
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    pendingDues: 0,
  });
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Gelir verilerini çek (aidatlar)
      const duesResponse = await axios.get(`${API_URL}/api/dues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Daireleri çek (daire numaralarını göstermek için)
      const apartmentsResponse = await axios.get(`${API_URL}/api/apartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Daire ID -> Daire numarası map'i oluştur
      const apartmentMap = {};
      apartmentsResponse.data.forEach(apt => {
        apartmentMap[apt.id] = apt.apartment_number || apt.door_number || 'Bilinmiyor';
      });
      
      const paidDues = duesResponse.data.filter(due => due.status === 'paid');
      const pendingDues = duesResponse.data.filter(due => due.status === 'pending' || due.status === 'overdue');
      
      const totalIncome = paidDues.reduce((sum, due) => sum + due.amount, 0);
      const totalPending = pendingDues.reduce((sum, due) => sum + due.amount, 0);
      
      // Gider verilerini mock data olarak oluştur (gerçek sistemde expenses endpoint'i olmalı)
      const mockExpenses = [
        { id: '1', title: 'Elektrik Faturası', amount: 5000, date: '2025-12-01', category: 'Utilities' },
        { id: '2', title: 'Su Faturası', amount: 3000, date: '2025-12-02', category: 'Utilities' },
        { id: '3', title: 'Temizlik Malzemeleri', amount: 2500, date: '2025-12-05', category: 'Cleaning' },
        { id: '4', title: 'Asansör Bakımı', amount: 4000, date: '2025-12-10', category: 'Maintenance' },
        { id: '5', title: 'Güvenlik Görevlisi Maaşı', amount: 15000, date: '2025-12-01', category: 'Salary' },
        { id: '6', title: 'Kapıcı Maaşı', amount: 12000, date: '2025-12-01', category: 'Salary' },
      ];
      
      const totalExpense = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      setSummary({
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        pendingDues: totalPending,
      });
      
      // Gelir listesi - ödenen aidatlar (daire numarası ile)
      const incomeData = paidDues.map(due => ({
        id: due.id,
        title: `Aidat - Daire ${apartmentMap[due.apartment_id] || 'Bilinmiyor'}`,
        amount: due.amount,
        date: due.paid_date || due.due_date,
        category: 'Aidat',
      }));
      
      setIncomeList(incomeData);
      setExpenseList(mockExpenses);
      
    } catch (error) {
      console.error('Mali veri yüklenemedi:', error);
      toast.error('Mali veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Rapor indirilmeye hazırlanıyor...');
    // CSV export logic buraya eklenebilir
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Utilities': 'bg-blue-100 text-blue-700',
      'Cleaning': 'bg-green-100 text-green-700',
      'Maintenance': 'bg-orange-100 text-orange-700',
      'Salary': 'bg-purple-100 text-purple-700',
      'Aidat': 'bg-emerald-100 text-emerald-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tahsilat Özeti</h1>
          <p className="mt-1 text-sm text-gray-600">Detaylı gelir-gider raporu</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dönem seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Bu Ay</SelectItem>
              <SelectItem value="lastMonth">Geçen Ay</SelectItem>
              <SelectItem value="last3Months">Son 3 Ay</SelectItem>
              <SelectItem value="thisYear">Bu Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Gider</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {formatCurrency(summary.totalExpense)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Bakiye</p>
                <p className={`text-2xl font-bold mt-2 ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen Tahsilat</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {formatCurrency(summary.pendingDues)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income & Expense Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Gelirler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {incomeList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Henüz gelir kaydı yok
                </div>
              ) : (
                <div className="divide-y">
                  {incomeList.map((income) => (
                    <div key={income.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{income.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(income.category)}`}>
                              {income.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(income.date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-green-600">
                          +{formatCurrency(income.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Giderler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {expenseList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Henüz gider kaydı yok
                </div>
              ) : (
                <div className="divide-y">
                  {expenseList.map((expense) => (
                    <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{expense.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(expense.category)}`}>
                              {expense.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(expense.date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-semibold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialReport;
