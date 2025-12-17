import React, { useState, useEffect } from 'react';
import { 
  Mail, Edit, Save, X, Eye, Code, FileText,
  AlertCircle, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Şablon kategori eşlemeleri
const TEMPLATE_CATEGORIES = {
  dues_notification: { label: 'Aidat Bildirimi', icon: '💰', category: 'Aidat' },
  payment_success: { label: 'Ödeme Onayı', icon: '✅', category: 'Aidat' },
  payment_reminder: { label: 'Ödeme Hatırlatma', icon: '⏰', category: 'Aidat' },
  new_announcement: { label: 'Yeni Duyuru', icon: '📢', category: 'Duyuru' },
  survey_invite: { label: 'Anket Daveti', icon: '📊', category: 'Anket' },
  meeting_invite: { label: 'Toplantı Daveti', icon: '📅', category: 'Toplantı' },
  meeting_voting: { label: 'Toplantı Oylama', icon: '🗳️', category: 'Toplantı' },
  status_change: { label: 'Durum Değişikliği', icon: '🏢', category: 'Bildirim' },
  request_received: { label: 'Talep Alındı', icon: '📝', category: 'Talep' },
  request_resolved: { label: 'Talep Çözüldü', icon: '✔️', category: 'Talep' },
  welcome: { label: 'Hoşgeldiniz', icon: '👋', category: 'Genel' },
  manager_welcome: { label: 'Yönetici Hoşgeldin', icon: '🏠', category: 'Genel' },
};

const MailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const [editForm, setEditForm] = useState({
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/building-manager/mail-templates`, {
        headers: getAuthHeaders()
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error);
      toast.error('Mail şablonları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setEditForm({
      subject: template.subject,
      body: template.body
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/api/building-manager/mail-templates/${editingTemplate.name}`,
        editForm,
        { headers: getAuthHeaders() }
      );
      toast.success('Şablon güncellendi');
      setEditDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Şablon kaydedilemedi:', error);
      toast.error(error.response?.data?.detail || 'Şablon kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleResetTemplate = async (templateName) => {
    try {
      await axios.delete(
        `${API_URL}/api/building-manager/mail-templates/${templateName}`,
        { headers: getAuthHeaders() }
      );
      toast.success('Şablon varsayılana sıfırlandı');
      fetchTemplates();
    } catch (error) {
      console.error('Şablon sıfırlanamadı:', error);
      toast.error('Şablon sıfırlanamadı');
    }
  };

  // Kategorilere göre filtreleme
  const categories = ['all', ...new Set(Object.values(TEMPLATE_CATEGORIES).map(t => t.category))];
  
  const filteredTemplates = templates.filter(template => {
    if (activeCategory === 'all') return true;
    const config = TEMPLATE_CATEGORIES[template.name];
    return config?.category === activeCategory;
  });

  // HTML'i preview için render et (değişkenleri örnek değerlerle değiştir)
  const renderPreview = (body) => {
    const sampleVariables = {
      '{{user_name}}': 'Ahmet Yılmaz',
      '{{building_name}}': 'Mavi Rezidans',
      '{{month}}': 'Aralık 2025',
      '{{amount}}': '₺1.500,00',
      '{{due_date}}': '15.01.2026',
      '{{expense_details}}': '<tr><td>Elektrik</td><td>₺500</td></tr><tr><td>Su</td><td>₺300</td></tr>',
      '{{apartment_no}}': 'A-15',
      '{{previous_balance}}': '₺0',
      '{{total_amount}}': '₺1.500,00',
      '{{announcement_title}}': 'Örnek Duyuru Başlığı',
      '{{announcement_content}}': 'Bu bir örnek duyuru içeriğidir.',
      '{{survey_title}}': 'Örnek Anket',
      '{{meeting_title}}': 'Örnek Toplantı',
      '{{meeting_date}}': '20.01.2026',
      '{{meeting_time}}': '19:00',
      '{{meeting_location}}': 'Toplantı Salonu',
      '{{status_item}}': 'Asansör',
      '{{status_value}}': 'Aktif',
      '{{request_title}}': 'Örnek Talep',
      '{{request_status}}': 'İşleniyor',
    };

    let rendered = body;
    Object.entries(sampleVariables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return rendered;
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
          <h1 className="text-2xl font-bold text-gray-900">Mail Şablonları</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sakinlere gönderilen mail şablonlarını özelleştirin
          </p>
        </div>
        <Button variant="outline" onClick={fetchTemplates}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Mail Şablonu Değişkenleri</p>
            <p className="mt-1">
              Şablonlarda <code className="bg-blue-100 px-1 rounded">{'{{değişken_adı}}'}</code> formatında değişkenler kullanabilirsiniz.
              Örnek: <code className="bg-blue-100 px-1 rounded">{'{{user_name}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{building_name}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{amount}}'}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className={activeCategory === cat ? 'bg-blue-600' : ''}
          >
            {cat === 'all' ? 'Tümü' : cat}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const config = TEMPLATE_CATEGORIES[template.name] || { label: template.name, icon: '📧', category: 'Diğer' };
          
          return (
            <Card key={template.name} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {config.category}
                      </Badge>
                    </div>
                  </div>
                  {template.is_custom && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Özelleştirilmiş
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Konu</Label>
                    <p className="text-sm font-medium truncate">{template.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(template)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Önizle
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                  </div>
                  {template.is_custom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResetTemplate(template.name)}
                      className="w-full text-gray-500 hover:text-red-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Varsayılana Sıfırla
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Şablon bulunamadı</h3>
            <p className="text-gray-600 text-center">
              Bu kategoride mail şablonu bulunmuyor.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Şablon Düzenle: {editingTemplate && TEMPLATE_CATEGORIES[editingTemplate.name]?.label}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="edit" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">
                <Code className="h-4 w-4 mr-2" />
                Düzenle
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Önizle
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="subject">Mail Konusu</Label>
                <Input
                  id="subject"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  placeholder="Mail konusu..."
                />
              </div>
              <div>
                <Label htmlFor="body">Mail İçeriği (HTML)</Label>
                <textarea
                  id="body"
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-y"
                  placeholder="HTML içerik..."
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium">Kullanılabilir Değişkenler:</p>
                <p className="mt-1 font-mono text-xs">
                  {'{{user_name}}, {{building_name}}, {{month}}, {{amount}}, {{due_date}}, {{apartment_no}}, {{expense_details}}'}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-3 pb-3 border-b">
                  <Label className="text-xs text-gray-500">Konu</Label>
                  <p className="font-medium">{editForm.subject}</p>
                </div>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderPreview(editForm.body) }}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Şablon Önizleme: {previewTemplate && TEMPLATE_CATEGORIES[previewTemplate.name]?.label}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <p className="text-sm text-gray-500">Konu:</p>
                  <p className="font-medium">{previewTemplate.subject}</p>
                </div>
                <div 
                  className="p-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderPreview(previewTemplate.body) }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailTemplates;
