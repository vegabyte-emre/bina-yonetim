import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Edit, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    max_apartments: '',
    features: '',
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        toast.error('Abonelik planları yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const url = editMode ? `${API}/subscriptions/${selectedPlan.id}` : `${API}/subscriptions`;
      const method = editMode ? 'PUT' : 'POST';
      
      const featuresArray = formData.features.split('\n').filter(f => f.trim());
      
      const payload = {
        name: formData.name,
        description: formData.description,
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
        max_apartments: parseInt(formData.max_apartments),
        features: featuresArray,
        is_active: formData.is_active
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editMode ? 'Plan güncellendi' : 'Plan oluşturuldu');
        setDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/subscriptions/${selectedPlan.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Plan silindi');
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        toast.error('Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const openEditDialog = (plan) => {
    setEditMode(true);
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_apartments: plan.max_apartments,
      features: plan.features.join('\n'),
      is_active: plan.is_active
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setSelectedPlan(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_monthly: '',
      price_yearly: '',
      max_apartments: '',
      features: '',
      is_active: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="subscriptions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonelik Planları</h1>
          <p className="mt-1 text-sm text-gray-600">Abonelik planlarını yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              data-testid="add-plan-button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Plan Düzenle' : 'Yeni Plan Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Plan Adı *</Label>
                <Input
                  id="name"
                  data-testid="plan-name-input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="örn: Temel Plan"
                />
              </div>

              <div>
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan hakkında kısa açıklama"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_monthly">Aylık Fiyat (TL) *</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_yearly">Yıllık Fiyat (TL) *</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.01"
                    required
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_apartments">Maksimum Daire Sayısı *</Label>
                <Input
                  id="max_apartments"
                  type="number"
                  required
                  value={formData.max_apartments}
                  onChange={(e) => setFormData({ ...formData, max_apartments: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="features">Özellikler (her satıra bir özellik) *</Label>
                <Textarea
                  id="features"
                  required
                  rows={6}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Aidat takibi\nÖdeme sistemi\nDuyuru sistemi"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" data-testid="submit-plan-button" className="bg-blue-600 hover:bg-blue-700">
                  {editMode ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz plan yok</h3>
            <p className="text-sm text-gray-500 mb-4">Hemen ilk abonelik planını oluşturun</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} data-testid={`plan-card-${plan.id}`} className="card-hover border-0 shadow-md relative">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  </div>
                  {plan.is_active && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">
                        ₺{plan.price_monthly.toFixed(0)}
                      </span>
                      <span className="ml-1 text-gray-500">/ay</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      veya ₺{plan.price_yearly.toFixed(0)}/yıl
                      {plan.price_monthly * 12 > plan.price_yearly && (
                        <Badge className="ml-2 bg-green-100 text-green-700">
                          %{Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)} tasarruf
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Maksimum {plan.max_apartments} daire
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => openEditDialog(plan)}
                      data-testid={`edit-plan-${plan.id}`}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-plan-${plan.id}`}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Planın silinmesini onaylıyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Abonelik planı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-plan"
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Subscriptions;
