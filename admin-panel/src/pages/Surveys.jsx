import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Eye, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [{ question: '', options: ['', ''] }],
    end_date: '',
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/surveys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurveys(response.data || []);
    } catch (error) {
      console.error('Anketler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', options: ['', ''] }],
    });
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleAddOption = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push('');
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index].question = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      await axios.post(`${API_URL}/api/surveys`, {
        ...formData,
        building_id: userData.building_id,
        created_by: userData.id,
        status: 'active',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Anket oluşturuldu!');
      setDialogOpen(false);
      resetForm();
      fetchSurveys();
    } catch (error) {
      console.error('Anket eklenemedi:', error);
      toast.error('Anket eklenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      questions: [{ question: '', options: ['', ''] }],
      end_date: '',
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
          <h1 className="text-2xl font-bold text-gray-900">Anketler</h1>
          <p className="mt-1 text-sm text-gray-600">Sakinlerin görüşlerini alın</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Anket
        </Button>
      </div>

      {/* Surveys Grid */}
      <div className="grid gap-4">
        {surveys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Henüz anket yok</p>
            </CardContent>
          </Card>
        ) : (
          surveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
                      <Badge className={survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {survey.status === 'active' ? 'Aktif' : 'Tamamlandı'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{survey.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{survey.questions?.length || 0} soru</span>
                      <span>{survey.responses || 0} yanıt</span>
                      <span>Bitiş: {new Date(survey.end_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" className="text-blue-600">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Survey Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Anket Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Anket Başlığı *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Anket başlığı"
              />
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Anket açıklaması"
                rows={3}
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

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sorular</Label>
                <Button type="button" size="sm" onClick={handleAddQuestion} variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Soru Ekle
                </Button>
              </div>

              {formData.questions.map((q, qIndex) => (
                <Card key={qIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Input
                        placeholder={`Soru ${qIndex + 1}`}
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                        required
                      />
                      {formData.questions.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="pl-4 space-y-2">
                      <Label className="text-sm">Seçenekler:</Label>
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-gray-400" />
                          <Input
                            placeholder={`Seçenek ${oIndex + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            required
                            className="text-sm"
                          />
                          {q.options.length > 2 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveOption(qIndex, oIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-sm"
                      >
                        + Seçenek Ekle
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Anket Oluştur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Surveys;