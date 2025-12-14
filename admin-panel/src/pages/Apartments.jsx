import React, { useState, useEffect } from 'react';
import { Home, Filter, Plus, X, Save, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Apartments = () => {
  const [apartments, setApartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingApartment, setEditingApartment] = useState(null);
  const [formData, setFormData] = useState({
    apartment_number: '',
    block_id: '',
    floor: 1,
    area_sqm: 100,
    room_count: '2+1',
    status: 'empty'
  });

  useEffect(() => {
    fetchApartments();
    fetchBlocks();
  }, []);

  const fetchApartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/apartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApartments(response.data);
    } catch (error) {
      console.error('Daireler yüklenemedi:', error);
      toast.error('Daireler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlocks(response.data);
    } catch (error) {
      console.error('Bloklar yüklenemedi:', error);
    }
  };

  const openAddModal = () => {
    setEditingApartment(null);
    setFormData({
      apartment_number: '',
      block_id: '',
      floor: 1,
      area_sqm: 100,
      room_count: '2+1',
      status: 'empty'
    });
    setShowModal(true);
  };

  const openEditModal = (apartment) => {
    setEditingApartment(apartment);
    setFormData({
      apartment_number: apartment.apartment_number,
      block_id: apartment.block_id,
      floor: apartment.floor,
      area_sqm: apartment.square_meters || 100,
      room_count: apartment.room_count || '2+1',
      status: apartment.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (editingApartment) {
        // Update existing apartment
        await axios.put(`${API_URL}/api/apartments/${editingApartment.id}`, {
          floor: formData.floor,
          door_number: formData.apartment_number,
          square_meters: formData.area_sqm,
          room_count: formData.room_count,
          status: formData.status
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Daire başarıyla güncellendi!');
      } else {
        // Create new apartment
        await axios.post(`${API_URL}/api/apartments`, {
          building_id: user.building_id,
          block_id: formData.block_id,
          apartment_number: formData.apartment_number,
          floor: formData.floor,
          door_number: formData.apartment_number,
          square_meters: formData.area_sqm,
          room_count: formData.room_count,
          status: formData.status
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Daire başarıyla eklendi!');
      }
      
      setShowModal(false);
      setEditingApartment(null);
      setFormData({
        apartment_number: '',
        block_id: '',
        floor: 1,
        area_sqm: 100,
        room_count: '2+1',
        status: 'empty'
      });
      fetchApartments();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (apartmentId) => {
    if (!window.confirm('Bu daireyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/apartments/${apartmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Daire silindi');
      fetchApartments();
    } catch (error) {
      console.error('Silme başarısız:', error);
      toast.error(error.response?.data?.detail || 'Silme başarısız');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'owner_occupied': { label: 'Mal Sahibi', class: 'bg-green-100 text-green-700' },
      'rented': { label: 'Kiracı', class: 'bg-blue-100 text-blue-700' },
      'empty': { label: 'Boş', class: 'bg-gray-100 text-gray-700' }
    };
    const s = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  const getBlockName = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    return block?.name || '-';
  };

  const filteredApartments = apartments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Daireler</h1>
          <p className="mt-1 text-sm text-gray-600">{apartments.length} daire kayıtlı</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tümü ({apartments.length})</option>
              <option value="owner_occupied">Mal Sahibi ({apartments.filter(a => a.status === 'owner_occupied').length})</option>
              <option value="rented">Kiracı ({apartments.filter(a => a.status === 'rented').length})</option>
              <option value="empty">Boş ({apartments.filter(a => a.status === 'empty').length})</option>
            </select>
          </div>
          <Button 
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Daire Ekle
          </Button>
        </div>
      </div>

      {/* Add/Edit Apartment Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingApartment ? 'Daire Düzenle' : 'Yeni Daire Ekle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daire No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apartment_number}
                    onChange={(e) => setFormData({...formData, apartment_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: 101"
                    disabled={!!editingApartment}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blok *
                  </label>
                  <select
                    required
                    value={formData.block_id}
                    onChange={(e) => setFormData({...formData, block_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!!editingApartment}
                  >
                    <option value="">Blok Seçin</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kat
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alan (m²)
                  </label>
                  <input
                    type="number"
                    value={formData.area_sqm}
                    onChange={(e) => setFormData({...formData, area_sqm: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oda Sayısı
                  </label>
                  <select
                    value={formData.room_count}
                    onChange={(e) => setFormData({...formData, room_count: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="1+0">1+0</option>
                    <option value="1+1">1+1</option>
                    <option value="2+1">2+1</option>
                    <option value="3+1">3+1</option>
                    <option value="4+1">4+1</option>
                    <option value="5+1">5+1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="empty">Boş</option>
                    <option value="rented">Kiracı</option>
                    <option value="owner_occupied">Mal Sahibi</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="outline"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingApartment ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredApartments.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Daire bulunamadı</h3>
            <p className="text-sm text-gray-500">Farklı bir filtre deneyin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daire No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oda Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    m²
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Home className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{apt.apartment_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getBlockName(apt.block_id)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{apt.floor}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{apt.room_count || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{apt.square_meters || '-'} m²</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(apt.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(apt)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(apt.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Mal Sahibi</p>
              <p className="text-2xl font-bold text-green-600">
                {apartments.filter(a => a.status === 'owner_occupied').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Kiracı</p>
              <p className="text-2xl font-bold text-blue-600">
                {apartments.filter(a => a.status === 'rented').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Boş</p>
              <p className="text-2xl font-bold text-gray-600">
                {apartments.filter(a => a.status === 'empty').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Apartments;
