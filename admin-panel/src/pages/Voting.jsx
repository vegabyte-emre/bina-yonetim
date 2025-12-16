import React, { useState, useEffect } from 'react';
import { Plus, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Voting = () => {
  const [votings, setVotings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    end_date: '',
  });

  useEffect(() => {
    fetchVotings();
  }, []);

  const fetchVotings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/votings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVotings(response.data || []);
    } catch (error) {
      console.error('Oylamalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      await axios.post(`${API_URL}/api/votings`, {
        ...formData,
        building_id: userData.building_id,
        status: 'active',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Oylama oluşturuldu!');
      setDialogOpen(false);
      setFormData({ title: '', description: '', end_date: '' });
      fetchVotings();
    } catch (error) {
      toast.error('Oylama eklenemedi');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oylamalar</h1>
          <p className="mt-1 text-sm text-gray-600">Sakinlerin kararlarını alın</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Oylama
        </Button>
      </div>

      <div className="grid gap-4">
        {votings.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ThumbsUp className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz oylama yok</h3>
              <p className="text-sm text-gray-500 mb-4">Yeni bir oylama oluşturarak başlayın</p>
            </CardContent>
          </Card>
        ) : (
        votings.map((voting) => (
          <Card key={voting.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{voting.title}</h3>
                  <p className="text-gray-600 mb-4">{voting.description}</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">{voting.yes_votes || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                      <span className="font-semibold">{voting.no_votes || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Minus className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold">{voting.abstain_votes || 0}</span>
                    </div>
                  </div>
                </div>
                <Badge className={voting.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {voting.status === 'active' ? 'Aktif' : 'Tamamlandı'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Yeni Oylama Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Bitiş Tarihi *</Label>
              <Input
                id="end_date"
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Oylama Oluştur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Voting;