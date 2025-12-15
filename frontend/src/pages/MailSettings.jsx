import React, { useState, useEffect } from 'react';
import { 
  Mail, Settings, FileText, Send, Save, TestTube, 
  Plus, Edit2, Trash2, Eye, X, Code, AlertCircle,
  CheckCircle, Loader2, RefreshCw, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MailSettings = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);
  
  // Config State
  const [config, setConfig] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    sender_name: 'Yönetioo',
    sender_email: '',
    is_active: true
  });
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  
  // Templates State
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body_html: '',
    body_text: '',
    variables: [],
    description: '',
    is_active: true
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [variableInput, setVariableInput] = useState('');
  
  // Logs State
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchConfig();
    fetchTemplates();
    fetchLogs();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Config Functions
  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mail/config`, {
        headers: getAuthHeaders()
      });
      if (response.data && Object.keys(response.data).length > 0) {
        setConfig({ ...config, ...response.data });
      }
    } catch (error) {
      console.error('Config yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      await axios.post(`${API_URL}/api/mail/config`, config, {
        headers: getAuthHeaders()
      });
      toast.success('Mail ayarları kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setConfigSaving(false);
    }
  };

  const testMailConfig = async () => {
    if (!testEmail) {
      toast.error('Test için email adresi girin');
      return;
    }
    setTestLoading(true);
    try {
      await axios.post(`${API_URL}/api/mail/config/test`, 
        { to_email: testEmail },
        { headers: getAuthHeaders() }
      );
      toast.success('Test maili gönderildi!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Test başarısız');
    } finally {
      setTestLoading(false);
    }
  };

  // Template Functions
  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mail/templates`, {
        headers: getAuthHeaders()
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error);
    }
  };

  const seedDefaultTemplates = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/mail/templates/seed-defaults`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(response.data.message);
      fetchTemplates();
    } catch (error) {
      toast.error('Varsayılan şablonlar eklenemedi');
    }
  };

  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      subject: '',
      body_html: '',
      body_text: '',
      variables: [],
      description: '',
      is_active: true
    });
    setShowTemplateModal(true);
    setPreviewMode(false);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || '',
      variables: template.variables || [],
      description: template.description || '',
      is_active: template.is_active
    });
    setShowTemplateModal(true);
    setPreviewMode(false);
  };

  const saveTemplate = async () => {
    try {
      if (editingTemplate) {
        await axios.put(`${API_URL}/api/mail/templates/${editingTemplate.id}`, templateForm, {
          headers: getAuthHeaders()
        });
        toast.success('Şablon güncellendi');
      } else {
        await axios.post(`${API_URL}/api/mail/templates`, templateForm, {
          headers: getAuthHeaders()
        });
        toast.success('Şablon oluşturuldu');
      }
      setShowTemplateModal(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/api/mail/templates/${templateId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Şablon silindi');
      fetchTemplates();
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const addVariable = () => {
    if (variableInput && !templateForm.variables.includes(variableInput)) {
      setTemplateForm({
        ...templateForm,
        variables: [...templateForm.variables, variableInput]
      });
      setVariableInput('');
    }
  };

  const removeVariable = (variable) => {
    setTemplateForm({
      ...templateForm,
      variables: templateForm.variables.filter(v => v !== variable)
    });
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('body_html');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateForm.body_html;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setTemplateForm({ ...templateForm, body_html: newText });
    }
  };

  // Logs Functions
  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mail/logs?limit=50`, {
        headers: getAuthHeaders()
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Loglar yüklenemedi:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mail Ayarları</h1>
          <p className="mt-1 text-sm text-gray-600">Gmail SMTP yapılandırması ve mail şablonları</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'config', name: 'SMTP Ayarları', icon: Settings },
            { id: 'templates', name: 'Mail Şablonları', icon: FileText },
            { id: 'logs', name: 'Gönderim Logları', icon: Send }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gmail Ayarları */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Gmail SMTP Ayarları
              </h3>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Gmail App Password Gerekli</p>
                    <p className="mt-1">Gmail hesabınızda 2FA aktif olmalı ve App Password oluşturmalısınız:</p>
                    <ol className="mt-2 list-decimal list-inside space-y-1">
                      <li>Google Hesabı → Güvenlik → 2 Adımlı Doğrulama (aktif)</li>
                      <li>Google Hesabı → Güvenlik → Uygulama Şifreleri</li>
                      <li>"Mail" ve "Windows Bilgisayar" seçip şifre oluşturun</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={config.smtp_host}
                      onChange={(e) => setConfig({...config, smtp_host: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={config.smtp_port}
                      onChange={(e) => setConfig({...config, smtp_port: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gmail Adresi</label>
                  <input
                    type="email"
                    value={config.smtp_user}
                    onChange={(e) => setConfig({...config, smtp_user: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="ornek@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App Password</label>
                  <input
                    type="password"
                    value={config.smtp_password}
                    onChange={(e) => setConfig({...config, smtp_password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="xxxx xxxx xxxx xxxx"
                  />
                </div>
              </div>
            </div>

            {/* Gönderen Bilgileri */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                Gönderen Bilgileri
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gönderen Adı</label>
                  <input
                    type="text"
                    value={config.sender_name}
                    onChange={(e) => setConfig({...config, sender_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Yönetioo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gönderen Email</label>
                  <input
                    type="email"
                    value={config.sender_email}
                    onChange={(e) => setConfig({...config, sender_email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="noreply@yonetioo.com"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={config.is_active}
                    onChange={(e) => setConfig({...config, is_active: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Mail servisi aktif
                  </label>
                </div>

                <button
                  onClick={saveConfig}
                  disabled={configSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {configSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Ayarları Kaydet
                </button>
              </div>

              {/* Test Bölümü */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Bağlantı Testi</h4>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@email.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={testMailConfig}
                    disabled={testLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {testLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <TestTube className="h-5 w-5" />}
                    Test Et
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={openAddTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-5 w-5" />
                Yeni Şablon
              </button>
              <button
                onClick={seedDefaultTemplates}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="h-5 w-5" />
                Varsayılan Şablonları Ekle
              </button>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Henüz şablon yok</h3>
              <p className="text-gray-500 mt-1">Varsayılan şablonları ekleyerek başlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map(template => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                      {template.description && (
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      )}
                      {template.variables?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map(v => (
                            <span key={v} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-mono">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditTemplate(template)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Düzenle"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Son Gönderimler</h3>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </div>
          
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz mail gönderimi yapılmamış</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {log.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium text-gray-900">{log.subject}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Alıcı: {log.to?.join(', ')}
                      </p>
                      {log.error && (
                        <p className="text-sm text-red-600 mt-1">Hata: {log.error}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.sent_at).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTemplateModal(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon'}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    previewMode ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {previewMode ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {previewMode ? 'Kod' : 'Önizleme'}
                </button>
                <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Adı *</label>
                      <input
                        type="text"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="welcome"
                        disabled={!!editingTemplate}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={templateForm.is_active}
                          onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Aktif</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                    <input
                      type="text"
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Şablon açıklaması..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mail Konusu *</label>
                    <input
                      type="text"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Hoş Geldiniz {{user_name}}!"
                    />
                  </div>

                  {/* Variables */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Değişkenler</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={variableInput}
                        onChange={(e) => setVariableInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addVariable()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="user_name"
                      />
                      <button
                        onClick={addVariable}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {templateForm.variables.map(v => (
                        <span key={v} className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                          <button
                            onClick={() => insertVariable(v)}
                            className="font-mono hover:underline"
                            title="HTML'e ekle"
                          >
                            {`{{${v}}}`}
                          </button>
                          <button onClick={() => removeVariable(v)} className="text-purple-400 hover:text-purple-600">
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HTML İçerik *</label>
                    <textarea
                      id="body_html"
                      value={templateForm.body_html}
                      onChange={(e) => setTemplateForm({...templateForm, body_html: e.target.value})}
                      className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="<html>..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plain Text (Opsiyonel)</label>
                    <textarea
                      value={templateForm.body_text}
                      onChange={(e) => setTemplateForm({...templateForm, body_text: e.target.value})}
                      className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Düz metin versiyonu..."
                    />
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {previewMode ? 'HTML Önizleme' : 'Kaynak Kod'}
                  </h4>
                  {previewMode ? (
                    <div 
                      className="bg-white rounded-lg p-4 h-[500px] overflow-auto"
                      dangerouslySetInnerHTML={{ __html: templateForm.body_html }}
                    />
                  ) : (
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 h-[500px] overflow-auto text-sm">
                      <code>{templateForm.body_html}</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                İptal
              </button>
              <button
                onClick={saveTemplate}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Save className="h-5 w-5" />
                {editingTemplate ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailSettings;
