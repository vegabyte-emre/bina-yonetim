import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
} from '../components/ui/alert-dialog';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Blocks = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    floor_count: 1,
    apartment_per_floor: 1,
  });

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlocks(response.data);
    } catch (error) {
      console.error('Bloklar yüklenemedi:', error);
      toast.error('Bloklar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      // Get building_id from user info
      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const building_id = userResponse.data.building_id;

      const payload = { ...formData, building_id };

      if (editMode) {
        await axios.put(`${API_URL}/api/blocks/${selectedBlock.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Blok güncellendi');
      } else {
        await axios.post(`${API_URL}/api/blocks`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Blok oluşturuldu');
      }

      setDialogOpen(false);
      resetForm();
      fetchBlocks();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      toast.error(error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/blocks/${selectedBlock.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Blok silindi');
      setDeleteDialogOpen(false);
      setSelectedBlock(null);
      fetchBlocks();
    } catch (error) {
      console.error('Silme işlemi başarısız:', error);
      toast.error('Silme işlemi başarısız');
    }
  };

  const openEditDialog = (block) => {
    setEditMode(true);
    setSelectedBlock(block);
    setFormData({
      name: block.name,
      floor_count: block.floor_count,
      apartment_per_floor: block.apartment_per_floor,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setSelectedBlock(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      floor_count: 1,
      apartment_per_floor: 1,
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bloklar</h1>
          <p className="mt-1 text-sm text-gray-600">Bina bloklarını yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Blok
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Blok Düzenle' : 'Yeni Blok Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Blok Adı *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="A Blok"
                />
              </div>
              <div>
                <Label htmlFor="floor_count">Kat Sayısı *</Label>
                <Input
                  id="floor_count"
                  type="number"
                  min="1"
                  required
                  value={formData.floor_count}
                  onChange={(e) => setFormData({ ...formData, floor_count: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="apartment_per_floor">Kat Başı Daire Sayısı *</Label>
                <Input
                  id="apartment_per_floor"
                  type="number"
                  min="1"
                  required
                  value={formData.apartment_per_floor}
                  onChange={(e) => setFormData({ ...formData, apartment_per_floor: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editMode ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {blocks.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz blok yok</h3>
            <p className="text-sm text-gray-500 mb-4">Hemen ilk bloğunuzu ekleyin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map((block) => (
            <Card key={block.id} className="card-hover border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditDialog(block)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBlock(block);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{block.name}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kat Sayısı:</span>
                    <span className="font-medium text-gray-900">{block.floor_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kat Başı Daire:</span>
                    <span className="font-medium text-gray-900">{block.apartment_per_floor}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Toplam Daire:</span>
                    <span className="font-bold text-purple-600">{block.floor_count * block.apartment_per_floor}</span>
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
            <AlertDialogTitle>Bloğun silinmesini onaylıyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Blok kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default Blocks;
