import React, { useState, useEffect } from 'react';
import { Plus, Bell, Calendar, Image as ImageIcon, Send, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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

const AnnouncementsNew = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    category: 'general',
    image_url: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
      toast.error('Duyurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      const announcementData = {
        ...formData,
        building_id: userData.building_id,
        created_by: userData.id,
      };

      await axios.post(`${API_URL}/api/announcements`, announcementData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Duyuru başarıyla oluşturuldu!');
      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Duyuru eklenemedi:', error);
      toast.error('Duyuru eklenemedi');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/announcements/${selectedAnnouncement.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Duyuru silindi');
      setDeleteDialogOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Duyuru silinemedi:', error);
      toast.error('Duyuru silinemedi');
    }
  };

  const sendPushNotification = async (announcement) => {
    try {
      setSendingNotification(true);
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      // Expo Push API ile bildirim gönder (bina bazlı)
      const response = await axios.post(`${API_URL}/api/expo-push/send-announcement`, {
        building_id: userData.building_id,
        announcement_id: announcement.id,
        title: announcement.title,
        body: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
        priority: announcement.priority || 'normal',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;
      if (result.sent_count > 0) {
        toast.success(`Bildirim ${result.sent_count} cihaza gönderildi!`);
      } else {
        toast.info(result.message || 'Bu binada aktif cihaz bulunamadı');
      }
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
      
      // Hata detayını göster
      const errorMessage = error.response?.data?.detail || 'Bildirim gönderilemedi';
      toast.error(errorMessage);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      category: 'general',
      image_url: '',
    });
    setImagePreview(null);
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'urgent': { label: 'Acil', class: 'bg-red-100 text-red-700' },
      'high': { label: 'Yüksek', class: 'bg-orange-100 text-orange-700' },
      'normal': { label: 'Normal', class: 'bg-blue-100 text-blue-700' },
      'low': { label: 'Düşük', class: 'bg-gray-100 text-gray-700' }
    };
    const p = priorityMap[priority] || priorityMap['normal'];
    return <Badge className={p.class}>{p.label}</Badge>;
  };

  const getCategoryBadge = (category) => {
    const categoryMap = {
      'general': { label: 'Genel', class: 'bg-blue-100 text-blue-700' },
      'maintenance': { label: 'Bakım', class: 'bg-yellow-100 text-yellow-700' },
      'event': { label: 'Etkinlik', class: 'bg-purple-100 text-purple-700' },
      'important': { label: 'Önemli', class: 'bg-red-100 text-red-700' }
    };
    const c = categoryMap[category] || categoryMap['general'];
    return <Badge className={c.class}>{c.label}</Badge>;
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
          <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
          <p className="mt-1 text-sm text-gray-600">Sakinlere duyuru gönderin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Duyuru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Duyuru Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Duyuru başlığı"
                />
              </div>

              <div>
                <Label htmlFor="content">Açıklama *</Label>
                <Textarea
                  id="content"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Duyuru içeriği..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Öncelik *</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="urgent">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Kategori *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Genel</SelectItem>
                      <SelectItem value="maintenance">Bakım</SelectItem>
                      <SelectItem value="event">Etkinlik</SelectItem>
                      <SelectItem value="important">Önemli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="image">Görsel (Opsiyonel)</Label>
                <div className="mt-2">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="image" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Görsel yüklemek için tıklayın</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Duyuru Oluştur
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Henüz duyuru yok</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      {getPriorityBadge(announcement.priority)}
                      {getCategoryBadge(announcement.category)}
                    </div>
                    <p className="text-gray-600 mb-3">{announcement.content}</p>
                    {announcement.image_url && (
                      <img 
                        src={announcement.image_url} 
                        alt="Duyuru görseli" 
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {announcement.read_count || 0} kişi okudu
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendPushNotification(announcement)}
                      disabled={sendingNotification}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Duyuruyu sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export default AnnouncementsNew;
