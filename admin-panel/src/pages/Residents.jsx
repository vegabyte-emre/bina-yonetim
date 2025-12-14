import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Plus, X, Save, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    type: 'tenant',
    apartment_id: '',
    tc_number: '',
    is_active: true
  });

  useEffect(() => {
    fetchResidents();
    fetchApartments();
  }, []);

  const fetchResidents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/residents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidents(response.data);
    } catch (error) {
      console.error('Sakinler yüklenemedi:', error);
      toast.error('Sakinler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchApartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/apartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApartments(response.data);
    } catch (error) {
      console.error('Daireler yüklenemedi:', error);
    }
  };

  const openAddModal = () => {
    setEditingResident(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      type: 'tenant',
      apartment_id: '',
      tc_number: '',
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (resident) => {
    setEditingResident(resident);
    setFormData({
      full_name: resident.full_name,
      email: resident.email || '',
      phone: resident.phone,
      password: '', // Don't show existing password
      type: resident.type,
      apartment_id: resident.apartment_id || '',
      tc_number: resident.tc_number || '',
      is_active: resident.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Phone format: just digits (5523356797)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    
    if (phoneDigits.length !== 10) {
      toast.error('Telefon numarası 10 haneli olmalıdır');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (editingResident) {
        // Update existing resident
        const updateData = {
          full_name: formData.full_name,
          email: formData.email || null,
          phone: phoneDigits,
          type: formData.type,
          apartment_id: formData.apartment_id || null,
          tc_number: formData.tc_number || null,
          is_active: formData.is_active
        };
        
        // Only include password if it's provided
        if (formData.password && formData.password.length >= 6) {
          updateData.password = formData.password;
        }
        
        await axios.put(`${API_URL}/api/residents/${editingResident.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Sakin başarıyla güncellendi!');
      } else {
        // Create new resident
        if (!formData.password || formData.password.length < 6) {
          toast.error('Şifre en az 6 karakter olmalıdır');
          return;
        }
        
        await axios.post(`${API_URL}/api/residents`, {
          ...formData,
          phone: phoneDigits,
          building_id: user.building_id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Sakin başarıyla eklendi!');
      }
      
      setShowModal(false);
      setEditingResident(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        type: 'tenant',
        apartment_id: '',
        tc_number: '',
        is_active: true
      });
      fetchResidents();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (residentId) => {
    if (!window.confirm('Bu sakini silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/residents/${residentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Sakin silindi');
      fetchResidents();
    } catch (error) {
      console.error('Silme başarısız:', error);
      toast.error(error.response?.data?.detail || 'Silme başarısız');
    }
  };

  const getApartmentNumber = (apartmentId) => {
    const apt = apartments.find(a => a.id === apartmentId);
    return apt?.apartment_number || '-';
  };

  const filteredResidents = residents.filter(resident => {
    if (filter === 'all') return true;
    return resident.type === filter;
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
          <h1 className="text-2xl font-bold text-gray-900">Sakinler</h1>
          <p className="mt-1 text-sm text-gray-600">{residents.length} sakin kayıtlı</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tümü ({residents.length})</option>
            <option value="owner">Mal Sahibi ({residents.filter(r => r.type === 'owner').length})</option>
            <option value="tenant">Kiracı ({residents.filter(r => r.type === 'tenant').length})</option>
          </select>
          <Button 
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sakin Ekle
          </Button>
        </div>
      </div>

      {/* Add/Edit Resident Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">
                {editingResident ? 'Sakin Düzenle' : 'Yeni Sakin Ekle'}
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
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon (Mobil Giriş) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="5321234567"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mobil uygulama giriş için kullanılacak</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingResident ? 'Yeni Şifre (Boş bırakılırsa değişmez)' : 'Şifre (Mobil Giriş) *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editingResident}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                      placeholder={editingResident ? "Değiştirmek için yeni şifre girin" : "Minimum 6 karakter"}
                      minLength={editingResident ? 0 : 6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mobil uygulama giriş şifresi</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TC Kimlik No
                  </label>
                  <input
                    type="text"
                    value={formData.tc_number}
                    onChange={(e) => setFormData({...formData, tc_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="11 haneli TC Kimlik No"
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="tenant">Kiracı</option>
                    <option value="owner">Mal Sahibi</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daire
                  </label>
                  <select
                    value={formData.apartment_id}
                    onChange={(e) => setFormData({...formData, apartment_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Daire Seçin (Opsiyonel)</option>
                    {apartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        Daire {apt.apartment_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Aktif (Mobil uygulamaya giriş yapabilir)
                </label>
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
                  {editingResident ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredResidents.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sakin bulunamadı</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
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
                {filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{resident.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{resident.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{resident.email || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getApartmentNumber(resident.apartment_id)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={resident.type === 'owner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {resident.type === 'owner' ? 'Mal Sahibi' : 'Kiracı'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {resident.is_active ? (
                        <UserCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <UserX className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(resident)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resident.id)}
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
              <p className="text-sm text-gray-600">Toplam Sakin</p>
              <p className="text-2xl font-bold text-purple-600">{residents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Mal Sahipleri</p>
              <p className="text-2xl font-bold text-green-600">
                {residents.filter(r => r.type === 'owner').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Kiracılar</p>
              <p className="text-2xl font-bold text-blue-600">
                {residents.filter(r => r.type === 'tenant').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Residents;
