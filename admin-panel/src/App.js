import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Login Page
function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/api/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);
      setToken(response.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Bina Yöneticisi Paneli</h1>
        <p className="subtitle">Lütfen giriş yapın</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="demo-credentials">
          <p><strong>Demo Hesaplar:</strong></p>
          <p>ahmet@mavirezidans.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

// Dashboard Page
function Dashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/building-manager/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Dashboard yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats?.total_apartments || 0}</h3>
          <p>Toplam Daire</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.occupied_apartments || 0}</h3>
          <p>Dolu Daire</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.empty_apartments || 0}</h3>
          <p>Boş Daire</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.total_residents || 0}</h3>
          <p>Toplam Sakin</p>
        </div>
        <div className="stat-card red">
          <h3>{stats?.pending_dues || 0}</h3>
          <p>Bekleyen Aidat</p>
        </div>
        <div className="stat-card orange">
          <h3>{stats?.pending_requests || 0}</h3>
          <p>Bekleyen Talep</p>
        </div>
        <div className="stat-card green">
          <h3>{stats?.collected_amount?.toLocaleString('tr-TR') || 0} ₺</h3>
          <p>Tahsil Edilen</p>
        </div>
        <div className="stat-card blue">
          <h3>{stats?.total_due_amount?.toLocaleString('tr-TR') || 0} ₺</h3>
          <p>Bekleyen Tutar</p>
        </div>
      </div>
    </div>
  );
}

// Blocks Page
function Blocks({ token }) {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/blocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlocks(response.data);
    } catch (err) {
      console.error('Bloklar yüklenemedi:', err);
    }
  };

  return (
    <div className="content-page">
      <h2>Bloklar</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Blok Adı</th>
              <th>Kat Sayısı</th>
              <th>Kat Başı Daire</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(block => (
              <tr key={block.id}>
                <td>{block.name}</td>
                <td>{block.floor_count}</td>
                <td>{block.apartment_per_floor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Apartments Page
function Apartments({ token }) {
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/apartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApartments(response.data);
    } catch (err) {
      console.error('Daireler yüklenemedi:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'owner_occupied': { label: 'Mal Sahibi', class: 'status-owner' },
      'rented': { label: 'Kiracı', class: 'status-rented' },
      'empty': { label: 'Boş', class: 'status-empty' }
    };
    const s = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  };

  return (
    <div className="content-page">
      <h2>Daireler</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Daire No</th>
              <th>Kat</th>
              <th>Oda Sayısı</th>
              <th>m²</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {apartments.map(apt => (
              <tr key={apt.id}>
                <td><strong>{apt.apartment_number}</strong></td>
                <td>{apt.floor}</td>
                <td>{apt.room_count}</td>
                <td>{apt.square_meters}</td>
                <td>{getStatusBadge(apt.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Residents Page
function Residents({ token }) {
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/residents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidents(response.data);
    } catch (err) {
      console.error('Sakinler yüklenemedi:', err);
    }
  };

  return (
    <div className="content-page">
      <h2>Sakinler</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Tip</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {residents.map(resident => (
              <tr key={resident.id}>
                <td><strong>{resident.full_name}</strong></td>
                <td>{resident.phone}</td>
                <td>{resident.email}</td>
                <td>{resident.type === 'owner' ? 'Mal Sahibi' : 'Kiracı'}</td>
                <td>
                  <span className={`status-badge ${resident.is_active ? 'status-active' : 'status-inactive'}`}>
                    {resident.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Dues Page
function Dues({ token }) {
  const [dues, setDues] = useState([]);

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDues(response.data);
    } catch (err) {
      console.error('Aidatlar yüklenemedi:', err);
    }
  };

  return (
    <div className="content-page">
      <h2>Aidatlar</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ay</th>
              <th>Açıklama</th>
              <th>Tutar</th>
              <th>Son Ödeme</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {dues.map(due => (
              <tr key={due.id}>
                <td>{due.month}</td>
                <td>{due.description}</td>
                <td><strong>{due.amount.toLocaleString('tr-TR')} ₺</strong></td>
                <td>{new Date(due.due_date).toLocaleDateString('tr-TR')}</td>
                <td>
                  <span className={`status-badge ${due.status === 'paid' ? 'status-paid' : 'status-unpaid'}`}>
                    {due.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Announcements Page
function Announcements({ token }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (err) {
      console.error('Duyurular yüklenemedi:', err);
    }
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      'general': { label: 'Genel', class: 'type-general' },
      'urgent': { label: 'Acil', class: 'type-urgent' },
      'event': { label: 'Etkinlik', class: 'type-event' },
      'maintenance': { label: 'Bakım', class: 'type-maintenance' }
    };
    const t = typeMap[type] || { label: type, class: '' };
    return <span className={`type-badge ${t.class}`}>{t.label}</span>;
  };

  return (
    <div className="content-page">
      <h2>Duyurular</h2>
      <div className="announcements-list">
        {announcements.map(announcement => (
          <div key={announcement.id} className="announcement-card">
            <div className="announcement-header">
              <h3>{announcement.title}</h3>
              {getTypeBadge(announcement.type)}
            </div>
            <p className="announcement-content">{announcement.content}</p>
            <small>{new Date(announcement.created_at).toLocaleString('tr-TR')}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

// Requests Page
function Requests({ token }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (err) {
      console.error('Talepler yüklenemedi:', err);
    }
  };

  return (
    <div className="content-page">
      <h2>Talepler & Şikayetler</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Tip</th>
              <th>Kategori</th>
              <th>Öncelik</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr key={request.id}>
                <td><strong>{request.title}</strong></td>
                <td>{request.type === 'complaint' ? 'Şikayet' : request.type === 'maintenance' ? 'Bakım' : 'Talep'}</td>
                <td>{request.category}</td>
                <td>
                  <span className={`priority-badge priority-${request.priority}`}>
                    {request.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status === 'pending' ? 'Bekliyor' : request.status === 'in_progress' ? 'İşlemde' : request.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Layout
function Layout({ children, setToken }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>🏢 Bina Yönetimi</h2>
        </div>
        <ul className="nav-menu">
          <li><Link to="/dashboard">📊 Dashboard</Link></li>
          <li><Link to="/blocks">🏗️ Bloklar</Link></li>
          <li><Link to="/apartments">🏠 Daireler</Link></li>
          <li><Link to="/residents">👥 Sakinler</Link></li>
          <li><Link to="/dues">💰 Aidatlar</Link></li>
          <li><Link to="/announcements">📢 Duyurular</Link></li>
          <li><Link to="/requests">📝 Talepler</Link></li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>Çıkış Yap</button>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// Main App
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <Router>
      <Layout setToken={setToken}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard token={token} />} />
          <Route path="/blocks" element={<Blocks token={token} />} />
          <Route path="/apartments" element={<Apartments token={token} />} />
          <Route path="/residents" element={<Residents token={token} />} />
          <Route path="/dues" element={<Dues token={token} />} />
          <Route path="/announcements" element={<Announcements token={token} />} />
          <Route path="/requests" element={<Requests token={token} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
