import React, { useState, useEffect } from 'react';
import { Plus, Building2, Edit, Trash2, MapPin, Home, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const Buildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    district: '',
    block_count: 1,
    apartment_count: '',
    currency: 'TRY',
    aidat_amount: '',
    subscription_status: 'active',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: ''
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/buildings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      } else {
        toast.error('Binalar yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const url = editMode ? `${API}/buildings/${selectedBuilding.id}` : `${API}/buildings`;
      const method = editMode ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (editMode) {
        delete payload.admin_password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editMode ? 'Bina güncellendi' : 'Bina oluşturuldu');
        setDialogOpen(false);
        resetForm();
        fetchBuildings();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error saving building:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/buildings/${selectedBuilding.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Bina silindi');
        setDeleteDialogOpen(false);
        setSelectedBuilding(null);
        fetchBuildings();
      } else {
        toast.error('Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const openEditDialog = (building) => {
    setEditMode(true);
    setSelectedBuilding(building);
    setFormData({
      name: building.name,
      address: building.address,
      city: building.city,
      district: building.district,
      block_count: building.block_count,
      apartment_count: building.apartment_count,
      currency: building.currency,
      aidat_amount: building.aidat_amount,
      subscription_status: building.subscription_status || 'active',
      admin_name: building.admin_name,
      admin_email: building.admin_email,
      admin_phone: building.admin_phone,
      admin_password: ''
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setSelectedBuilding(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      district: '',
      block_count: 1,
      apartment_count: '',
      currency: 'TRY',
      aidat_amount: '',
      subscription_status: 'active',
      admin_name: '',
      admin_email: '',
      admin_phone: '',
      admin_password: ''
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
    <div className="space-y-6 fade-in" data-testid="buildings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Binalar</h1>
          <p className="mt-1 text-sm text-gray-600">Tüm binaları yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              data-testid="add-building-button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Bina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Bina Düzenle' : 'Yeni Bina Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Bina Adı *</Label>
                  <Input
                    id="name"
                    data-testid="building-name-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Şehir *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="district">İlçe *</Label>
                  <Input
                    id="district"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="block_count">Blok Sayısı *</Label>
                  <Input
                    id="block_count"
                    type="number"
                    min="1"
                    required
                    value={formData.block_count}
                    onChange={(e) => setFormData({ ...formData, block_count: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="apartment_count">Daire Sayısı *</Label>
                  <Input
                    id="apartment_count"
                    type="number"
                    min="1"
                    required
                    value={formData.apartment_count}
                    onChange={(e) => setFormData({ ...formData, apartment_count: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Para Birimi *</Label>
                  <Input
                    id="currency"
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="aidat_amount">Aidat Tutarı</Label>
                  <Input
                    id="aidat_amount"
                    type="number"
                    step="0.01"
                    value={formData.aidat_amount}
                    onChange={(e) => setFormData({ ...formData, aidat_amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Bina Yöneticisi Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="admin_name">Yönetici Adı *</Label>
                    <Input
                      id="admin_name"
                      required={!editMode}
                      value={formData.admin_name}
                      onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin_email">E-posta *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      required={!editMode}
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin_phone">Telefon *</Label>
                    <Input
                      id="admin_phone"
                      required={!editMode}
                      value={formData.admin_phone}
                      onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    />
                  </div>
                  {!editMode && (
                    <div className="col-span-2">
                      <Label htmlFor="admin_password">Şifre *</Label>
                      <Input
                        id="admin_password"
                        type="password"
                        required
                        value={formData.admin_password}
                        onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" data-testid="submit-building-button" className="bg-blue-600 hover:bg-blue-700">
                  {editMode ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {buildings.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz bina yok</h3>
            <p className="text-sm text-gray-500 mb-4">Hemen ilk binanızı ekleyin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <Card key={building.id} data-testid={`building-card-${building.id}`} className="card-hover border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditDialog(building)}
                      data-testid={`edit-building-${building.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBuilding(building);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-building-${building.id}`}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{building.name}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{building.city}, {building.district}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Home className="h-4 w-4 mr-2" />
                    <span>{building.apartment_count} Daire</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Durum</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      building.subscription_status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : building.subscription_status === 'trial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {building.subscription_status === 'active'
                        ? 'Aktif'
                        : building.subscription_status === 'trial'
                        ? 'Deneme'
                        : 'Süresi Dolmuş'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">Yönetici</span>
                    <span className="text-sm font-medium text-gray-900">{building.admin_name}</span>
                  </div>
                  <div className="mt-3">
                    <Button
                      onClick={() => {
                        const adminPanelUrl = window.location.protocol + '//' + window.location.hostname + ':3001';
                        window.open(adminPanelUrl, '_blank');
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Yönetici Panelini Aç
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
            <AlertDialogTitle>Binanın silinmesini onaylıyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bina ve ilgili tüm veriler kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-building"
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

export default Buildings;
