import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Building, User, Mail, Phone, MapPin, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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

const RegistrationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/registration-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Başvurular yüklenemedi:', error);
      toast.error('Başvurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/registration-requests/${selectedRequest.id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(
        <div>
          <p className="font-semibold">Başvuru onaylandı!</p>
          <p className="text-sm mt-1">Building ve kullanıcı oluşturuldu.</p>
          <p className="text-xs mt-1 text-gray-600">Geçici Şifre: {response.data.temp_password}</p>
        </div>,
        { duration: 10000 }
      );

      setApproveDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Onaylama hatası:', error);
      toast.error('Başvuru onaylanamadı');
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/registration-requests/${selectedRequest.id}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Başvuru reddedildi');
      setRejectDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Reddetme hatası:', error);
      toast.error('Başvuru reddedilemedi');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Bekliyor', class: 'bg-yellow-100 text-yellow-700' },
      'approved': { label: 'Onaylandı', class: 'bg-green-100 text-green-700' },
      'rejected': { label: 'Reddedildi', class: 'bg-red-100 text-red-700' }
    };
    const s = statusMap[status] || statusMap['pending'];
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kayıt Başvuruları</h1>
        <p className="mt-1 text-sm text-gray-600">
          Yeni bina yöneticisi başvurularını onaylayın
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bekleyen Başvurular ({pendingRequests.length})
          </h2>
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Building className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.building_name}
                          </h3>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{request.manager_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{request.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>{request.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Home className="h-4 w-4" />
                          <span>{request.apartment_count} daire</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(request.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApproveDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Onayla
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setRejectDialogOpen(true);
                        }}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reddet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            İşlenmiş Başvurular ({processedRequests.length})
          </h2>
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{request.building_name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{request.manager_name}</span>
                        <span>{request.email}</span>
                        <span>
                          {new Date(request.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Henüz başvuru yok</p>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Başvuruyu Onayla</AlertDialogTitle>
            <AlertDialogDescription>
              Bu başvuruyu onaylamak istediğinizden emin misiniz?
              <br /><br />
              <strong>Otomatik olarak:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Yeni bir bina oluşturulacak</li>
                <li>Yönetici kullanıcısı oluşturulacak</li>
                <li>Geçici şifre atanacak</li>
                <li>Email ile bilgilendirme yapılabilir</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Başvuruyu Reddet</AlertDialogTitle>
            <AlertDialogDescription>
              Bu başvuruyu reddetmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reddet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RegistrationRequests;
