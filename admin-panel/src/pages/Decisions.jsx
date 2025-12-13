import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Decisions = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    decision_type: 'management',
    decision_date: '',
    decision_number: '',
  });

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/decisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDecisions(response.data || []);
    } catch (error) {
      console.error('Kararlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      await axios.post(`${API_URL}/api/decisions`, {
        ...formData,
        building_id: userData.building_id,
        created_by: userData.id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Karar kaydedildi!');
      setDialogOpen(false);
      setFormData({ title: '', description: '', decision_type: 'management', decision_date: '', decision_number: '' });
      fetchDecisions();
    } catch (error) {
      toast.error('Karar eklenemedi');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      'management': 'Yönetim Kurulu',
      'general_assembly': 'Genel Kurul',
      'emergency': 'Olağanüstü'
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'management': 'bg-blue-100 text-blue-700',
      'general_assembly': 'bg-purple-100 text-purple-700',
      'emergency': 'bg-red-100 text-red-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kararlar</h1>
          <p className="mt-1 text-sm text-gray-600">Toplantı kararlarını kaydedin</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Karar
        </Button>
      </div>

      <div className="grid gap-4">
        {decisions.map((decision) => (
          <Card key={decision.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{decision.title}</h3>
                    <Badge className={getTypeColor(decision.decision_type)}>
                      {getTypeLabel(decision.decision_type)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{decision.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Karar No: {decision.decision_number}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(decision.decision_date).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>Yeni Karar Kaydet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Karar Başlığı *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Asansör yenileme kararı"
              />
            </div>
            <div>
              <Label htmlFor="description">Karar Metni *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                placeholder="Karar detaylarını yazın..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="decision_type">Karar Türü *</Label>
                <Select value={formData.decision_type} onValueChange={(value) => setFormData({ ...formData, decision_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="management">Yönetim Kurulu</SelectItem>
                    <SelectItem value="general_assembly">Genel Kurul</SelectItem>
                    <SelectItem value="emergency">Olağanüstü</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="decision_number">Karar No *</Label>
                <Input
                  id="decision_number"
                  required
                  value={formData.decision_number}
                  onChange={(e) => setFormData({ ...formData, decision_number: e.target.value })}
                  placeholder="2025/001"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="decision_date">Karar Tarihi *</Label>
              <Input
                id="decision_date"
                type="date"
                required
                value={formData.decision_date}
                onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                Karar Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Decisions;