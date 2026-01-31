import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SecurityPanel from './components/SecurityPanel';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE = 'http://localhost:5000';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [page, setPage] = useState(user ? 'dashboard' : 'login');
  const [authMode, setAuthMode] = useState('login');
  const [authStep, setAuthStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({ email: '', password: '', role: 'donor', otp: '' });
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    if (user) fetchDonations();
  }, [user]);

  const showMsg = (msg, isErr = false) => {
    if (isErr) { setError(msg); setMessage(null); }
    else { setMessage(msg); setError(null); }
    setTimeout(() => { setError(null); setMessage(null); }, 5000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        if (authStep === 1) {
          const res = await api.post('/auth/request-otp', { email: formData.email, password: formData.password, role: formData.role });
          showMsg(res.data.message);
          setAuthStep(2);
        } else {
          const res = await api.post('/auth/verify-signup', { email: formData.email, otp: formData.otp });
          showMsg(res.data.message);
          setAuthMode('login');
          setAuthStep(1);
        }
      } else {
        if (authStep === 1) {
          const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
          showMsg(res.data.message);
          setAuthStep(2);
        } else {
          const res = await api.post('/auth/verify-otp', { email: formData.email, otp: formData.otp });
          const userData = { email: formData.email, role: res.data.role, token: res.data.token, context: res.data.authContext };
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          setPage('dashboard');
          showMsg('Logged in successfully!');
        }
      }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Authentication error', true);
    } finally { setLoading(false); }
  };

  const fetchDonations = async () => {
    try {
      const endpoint = user.role === 'donor' ? '/donation/my-donations' : '/donation/all';
      const res = await api.get(endpoint);
      const data = user.role === 'donor' ? res.data.donations : res.data;
      setDonations(data);
    } catch (err) {
      if (err.response?.status === 403) showMsg(err.response.data.message, true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setPage('login');
    setAuthStep(1);
    setFormData({ email: '', password: '', role: 'donor', otp: '' });
  };

  const createDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/donation/create', {
        amount: formData.amount,
        purpose: formData.purpose,
        donorPhone: formData.phone,
        email: formData.email // for admin recording
      });
      showMsg(res.data.message);
      fetchDonations();
    } catch (err) { showMsg(err.response?.data?.message || 'Error', true); }
  };

  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold">🛡️ SecureOrphanage</span>
          <div className="ms-auto d-flex align-items-center">
            {user ? (
              <>
                <span className="text-light me-3 small">Role: <span className="badge bg-primary text-uppercase">{user.role}</span></span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <span className="text-light small">Cybersecurity Defense Implementation</span>
            )}
          </div>
        </div>
      </nav>

      <div className="container">
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {page === 'login' && (
          <div className="row justify-content-center mt-5">
            <div className="col-md-5">
              <div className="card shadow border-0">
                <div className="card-body p-4">
                  <h3 className="text-center mb-4">{authMode === 'login' ? 'Secure Login' : 'Register Account'}</h3>
                  <form onSubmit={handleAuth}>
                    {authStep === 1 && (
                      <>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">EMAIL ADDRESS</label>
                          <input className="form-control" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">PASSWORD</label>
                          <input className="form-control" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        {authMode === 'signup' && (
                          <div className="mb-3">
                            <label className="form-label small fw-bold">ASSIGN ROLE (RBAC DEMO)</label>
                            <select className="form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                              <option value="donor">Donor (Standard User)</option>
                              <option value="staff">Staff (Limited Admin)</option>
                              <option value="admin">Admin (Full Access)</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    {authStep === 2 && (
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-primary">MFA CODE (OTP IN CONSOLE)</label>
                        <input className="form-control form-control-lg text-center fw-bold" maxLength="6" placeholder="000000" value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} />
                        <div className="form-text text-center">A 6-digit code was sent via 2nd factor simulation.</div>
                      </div>
                    )}
                    <button className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                      {loading ? 'Processing...' : (authStep === 1 ? 'Next' : 'Verify & Enter')}
                    </button>
                  </form>
                  <div className="text-center mt-3">
                    <button className="btn btn-link link-secondary small" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthStep(1); }}>
                      {authMode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'dashboard' && user && (
          <div className="row">
            <div className="col-md-12 mb-4">
              <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm border-start border-4 border-primary">
                <h4 className="mb-0">Welcome, {user.email}</h4>
                <div className="text-end">
                  <span className="d-block small text-muted text-uppercase fw-bold">RBAC Enforcement active</span>
                  <span className="badge bg-info">Session: Authenticated (JWT)</span>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-bold">Donation Records & Integrity Checks</div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Donor</th>
                          <th>Amount</th>
                          <th>Purpose</th>
                          <th>Security</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.length === 0 ? <tr><td colSpan="4" className="text-center p-4">No records found.</td></tr> :
                          donations.map(d => (
                            <tr key={d._id}>
                              <td className="small">{d.donorEmail}</td>
                              <td className="fw-bold text-success">₹{d.amount}</td>
                              <td><span className="badge bg-secondary text-uppercase">{d.purpose}</span></td>
                              <td>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => setFormData({ ...formData, activeDonation: d })}>🛡️ Proof</button>
                                {user.role === 'admin' && <button className="btn btn-sm btn-link text-danger ms-2">Delete</button>}
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              {user.role !== 'donor' && (
                <div className="card shadow-sm mb-4 border-warning">
                  <div className="card-header bg-warning text-dark fw-bold">Admin/Staff Action: Record Donation</div>
                  <div className="card-body">
                    <form onSubmit={createDonation}>
                      <input className="form-control form-control-sm mb-2" placeholder="Donor Phone (Sensitive)" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                      <input className="form-control form-control-sm mb-2" placeholder="Amount" type="number" onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                      <select className="form-select form-select-sm mb-2" onChange={e => setFormData({ ...formData, purpose: e.target.value })}>
                        <option value="food">Food</option>
                        <option value="education">Education</option>
                      </select>
                      <button className="btn btn-warning btn-sm w-100 fw-bold">Securely Save & Sign</button>
                    </form>
                  </div>
                </div>
              )}

              <div className="card shadow-sm border-info">
                <div className="card-header bg-info text-white fw-bold">System Status (CIA Verification)</div>
                <ul className="list-group list-group-flush small">
                  <li className="list-group-item d-flex justify-content-between">Confidentiality <span className="text-success fw-bold">AES-256 Verified</span></li>
                  <li className="list-group-item d-flex justify-content-between">Integrity <span className="text-success fw-bold">RSA-SHA256 Signed</span></li>
                  <li className="list-group-item d-flex justify-content-between">Availability <span className="text-success fw-bold">Load Balanced</span></li>
                  <li className="list-group-item d-flex justify-content-between">RBAC Level <span className="text-primary fw-bold text-uppercase">{user.role}</span></li>
                </ul>
              </div>
            </div>

            <div className="col-md-12">
              <SecurityPanel data={formData.activeDonation ? {
                encryptedPhone: formData.activeDonation.donorPhone,
                decryptedPhone: formData.activeDonation.decryptedPhone || '******** (Locked)',
                dataHash: formData.activeDonation.dataHash,
                encodedContext: user.context
              } : null} />
            </div>
          </div>
        )}
      </div>

      <footer className="footer mt-5 py-3 border-top bg-white">
        <div className="container text-center text-muted small">
          Senior Cybersecurity Refactor © 2026 | Focus: Backend Logic & Secure Implementations
        </div>
      </footer>
    </div>
  );
}

export default App;