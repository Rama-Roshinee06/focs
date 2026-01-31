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

const PRODUCTS = [
  { id: 'mk1', name: 'Monthly Meal Kit', price: 3000, desc: 'Feeds 1 child for 30 days', icon: '🍲' },
  { id: 'ss1', name: 'School Supplies', price: 2000, desc: 'Equips 1 student for year', icon: '📚' },
  { id: 'dr1', name: 'New Dress', price: 1500, desc: 'One set of new clothes', icon: '👗' },
  { id: 'me1', name: 'Medical Fund', price: 1000, desc: 'Supports regular checkups', icon: '🏥' },
];

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [page, setPage] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [authStep, setAuthStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({ email: '', password: '', role: 'donor', otp: '', phone: '', amount: '', purpose: 'food' });
  const [donations, setDonations] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeDonation, setActiveDonation] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDonations();
      if (page === 'login' || page === 'home') setPage('dashboard');
    }
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
    setPage('home');
    setAuthStep(1);
    setFormData({ email: '', password: '', role: 'donor', otp: '', phone: '', amount: '', purpose: 'food' });
  };

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now() }]);
    showMsg(`Added ${product.name} to cart!`);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const processCartDonation = async () => {
    if (!formData.phone) {
      showMsg("Please enter your phone number for secure recording", true);
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const purposes = cart.map(item => item.name).join(", ");

    try {
      const res = await api.post('/donation/create', {
        amount: total,
        purpose: purposes,
        donorPhone: formData.phone
      });
      showMsg("Donation recorded securely! Please visit the orphanage to finalize.");
      setCart([]);
      setPage('dashboard');
      fetchDonations();
    } catch (err) { showMsg(err.response?.data?.message || 'Error', true); }
  };

  const createManualDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/donation/create', {
        amount: formData.amount,
        purpose: formData.purpose,
        donorPhone: formData.phone,
        email: formData.emailRecord || user.email
      });
      showMsg(res.data.message);
      fetchDonations();
    } catch (err) { showMsg(err.response?.data?.message || 'Error', true); }
  };

  const renderNav = () => (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
      <div className="container">
        <span className="navbar-brand fw-bold cursor-pointer" onClick={() => setPage('home')}>❤️ HopeHaven</span>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => setPage('home')}>Home</button></li>
            {user && (
              <>
                <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => setPage('products')}>Donate Items</button></li>
                <li className="nav-item"><button className="nav-link btn btn-link position-relative" onClick={() => setPage('cart')}>
                  🛒 Cart {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{cart.length}</span>}
                </button></li>
                <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => setPage('dashboard')}>Dashboard</button></li>
                <li className="nav-item ms-3"><button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button></li>
              </>
            )}
            {!user && (
              <li className="nav-item"><button className="btn btn-primary btn-sm px-4" onClick={() => setPage('login')}>Login / Signup</button></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="bg-light min-vh-100 d-flex flex-column font-sans-serif">
      {renderNav()}

      <div className="flex-grow-1 container py-5">
        {error && <div className="alert alert-danger shadow-sm border-0 mb-4 animate__animated animate__shakeX">{error}</div>}
        {message && <div className="alert alert-success shadow-sm border-0 mb-4">{message}</div>}

        {page === 'home' && (
          <div className="text-center py-5">
            <h1 className="display-3 fw-bold mb-4">Make a Real Impact.</h1>
            <p className="lead text-muted mb-5">A secure, transparent platform for orphanage donations verified by technology.</p>
            <div className="row g-4 justify-content-center">
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm p-4">
                  <div className="fs-1 mb-3">🛡️</div>
                  <h4>Secure RBAC</h4>
                  <p className="small text-muted">Role-Based Access Control ensures data is only handled by authorized staff and donors.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm p-4">
                  <div className="fs-1 mb-3">📲</div>
                  <h4>MFA Protected</h4>
                  <p className="small text-muted">Two-factor authentication (OTP) prevents unauthorized access to your donation history.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm p-4">
                  <div className="fs-1 mb-3">✍️</div>
                  <h4>Digital Signatures</h4>
                  <p className="small text-muted">Every transaction is digitally signed (RSA-SHA256) to guarantee data integrity.</p>
                </div>
              </div>
            </div>
            {!user && <button className="btn btn-primary btn-lg mt-5 px-5 shadow" onClick={() => setPage('login')}>Start Donating Now</button>}
          </div>
        )}

        {page === 'login' && (
          <div className="row justify-content-center">
            <div className="col-md-5">
              <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <div className="fs-1 mb-2">🔐</div>
                    <h2 className="fw-bold">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-muted small">Multi-Factor Authentication (OTP) is enabled</p>
                  </div>
                  <form onSubmit={handleAuth}>
                    {authStep === 1 && (
                      <>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">EMAIL</label>
                          <input className="form-control bg-light border-0" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">PASSWORD</label>
                          <input className="form-control bg-light border-0" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        {authMode === 'signup' && (
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">ROLE (FOR DEMO)</label>
                            <select className="form-select bg-light border-0" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                              <option value="donor">Donor</option>
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}
                    {authStep === 2 && (
                      <div className="mb-4 text-center">
                        <label className="form-label d-block mb-3 fw-bold text-primary">ENTER 6-DIGIT OTP</label>
                        <input className="form-control form-control-lg text-center border-primary border-2 fw-bold" maxLength="6" placeholder="000000" required value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} />
                        <div className="form-text mt-3">Check your server console for the simulated OTP.</div>
                      </div>
                    )}
                    <button className="btn btn-primary w-100 py-3 fw-bold shadow-sm" disabled={loading}>
                      {loading ? 'Verifying...' : (authStep === 1 ? 'Continue' : 'Verify & Login')}
                    </button>
                  </form>
                  <div className="text-center mt-4">
                    <button className="btn btn-link link-secondary text-decoration-none small" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthStep(1); }}>
                      {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'products' && (
          <div>
            <h2 className="fw-bold mb-4">Choose Items to Donate</h2>
            <div className="row g-4">
              {PRODUCTS.map(p => (
                <div key={p.id} className="col-md-3">
                  <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-3 hover-shadow transition">
                    <div className="fs-1 py-4">{p.icon}</div>
                    <div className="card-body p-0 pb-3">
                      <h5 className="fw-bold">{p.name}</h5>
                      <p className="small text-muted mb-3">{p.desc}</p>
                      <h4 className="text-primary fw-bold mb-3">₹{p.price}</h4>
                      <button className="btn btn-outline-primary w-100 rounded-pill" onClick={() => addToCart(p)}>Add to Cart</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'cart' && (
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow-sm border-0 rounded-4 p-4">
                <h2 className="fw-bold mb-4">🛒 Your Donation Cart</h2>
                {cart.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">Your cart is empty.</p>
                    <button className="btn btn-primary px-4" onClick={() => setPage('products')}>Browse Items</button>
                  </div>
                ) : (
                  <>
                    <div className="list-group list-group-flush mb-4">
                      {cart.map(item => (
                        <div key={item.cartId} className="list-group-item d-flex justify-content-between align-items-center bg-transparent py-3">
                          <div className="d-flex align-items-center">
                            <span className="fs-3 me-3">{item.icon}</span>
                            <div>
                              <h6 className="mb-0 fw-bold">{item.name}</h6>
                              <span className="text-muted small">Contribution: ₹{item.price}</span>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-link text-danger" onClick={() => removeFromCart(item.cartId)}>Remove</button>
                        </div>
                      ))}
                    </div>
                    <div className="bg-light p-4 rounded-4 mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="mb-0">Total Amount:</h4>
                        <h3 className="mb-0 text-primary fw-bold">₹{cart.reduce((s, i) => s + i.price, 0)}</h3>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">YOUR PHONE (FOR SECURE ENCRYPTION)</label>
                        <input className="form-control" type="text" placeholder="+91 XXXX XXXX" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                      <button className="btn btn-primary w-100 py-3 fw-bold shadow" onClick={processCartDonation}>Securely Record Donation</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {page === 'dashboard' && user && (
          <div className="row">
            <div className="col-md-12 mb-4">
              <div className="d-flex justify-content-between align-items-center bg-white p-4 rounded-4 shadow-sm border-start border-5 border-primary">
                <div>
                  <h3 className="mb-1 fw-bold">Hello, {user.email.split('@')[0]}!</h3>
                  <p className="text-muted mb-0"><span className="badge bg-light text-dark border me-2">ROLE: {user.role.toUpperCase()}</span> Managed via RBAC (Access Control List)</p>
                </div>
                <div className="text-end d-none d-md-block">
                  <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill">MFA VERIFIED SESSION</span>
                </div>
              </div>
            </div>

            <div className="col-md-12">
              <div className="row">
                <div className="col-md-8">
                  <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
                    <div className="card-header bg-white py-3 fw-bold border-0">Donation Records (Transaction Integrity)</div>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Purpose</th>
                            <th>Status</th>
                            <th>Security</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donations.length === 0 ? <tr><td colSpan="5" className="text-center p-5 text-muted">No records found.</td></tr> :
                            donations.map(d => (
                              <tr key={d._id}>
                                <td className="small font-monospace">{d._id.substring(0, 8)}...</td>
                                <td className="fw-bold">₹{d.amount}</td>
                                <td><span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>{d.purpose}</span></td>
                                <td><span className={`badge rounded-pill ${d.status === 'UTILIZED' ? 'bg-success' : 'bg-warning text-dark'}`}>{d.status}</span></td>
                                <td>
                                  <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={() => setActiveDonation(d)}>🛡️ Proof</button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  {user.role !== 'donor' && (
                    <div className="card shadow-sm border-0 rounded-4 mb-4 bg-warning-subtle">
                      <div className="card-body p-4">
                        <h5 className="fw-bold mb-3">Record In-Person Donation</h5>
                        <form onSubmit={createManualDonation}>
                          <div className="mb-2">
                            <input className="form-control form-control-sm border-0" placeholder="Donor email" onChange={e => setFormData({ ...formData, emailRecord: e.target.value })} />
                          </div>
                          <div className="mb-2">
                            <input className="form-control form-control-sm border-0" placeholder="Donor Phone (Encrypted)" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                          </div>
                          <div className="mb-2">
                            <input className="form-control form-control-sm border-0" placeholder="Amount" type="number" onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                          </div>
                          <div className="mb-3">
                            <input className="form-control form-control-sm border-0" placeholder="Purpose" onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                          </div>
                          <button className="btn btn-warning btn-sm w-100 fw-bold shadow-sm">Save & Sign Encrypted</button>
                        </form>
                      </div>
                    </div>
                  )}
                  <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
                    <h5 className="fw-bold mb-3">CIA Triad Status</h5>
                    <div className="d-flex align-items-center mb-3">
                      <div className="p-2 bg-success-subtle text-success rounded-circle me-3">🔒</div>
                      <div className="small"><strong>Confidentiality:</strong> AES-256 for PII data Active.</div>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <div className="p-2 bg-primary-subtle text-primary rounded-circle me-3">✍️</div>
                      <div className="small"><strong>Integrity:</strong> RSA-SHA256 Signatures Active.</div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="p-2 bg-info-subtle text-info rounded-circle me-3">🌐</div>
                      <div className="small"><strong>Availability:</strong> Secure Multi-Role Access Active.</div>
                    </div>
                  </div>
                </div>
              </div>

              <SecurityPanel data={activeDonation ? {
                encryptedPhone: activeDonation.donorPhone,
                decryptedPhone: activeDonation.decryptedPhone || '******** (Locked)',
                dataHash: activeDonation.dataHash,
                encodedContext: user.context
              } : null} />
            </div>
          </div>
        )}
      </div>

      <footer className="footer py-4 border-top bg-white mt-auto">
        <div className="container text-center text-muted small">
          Senior Cybersecurity Developer Framework | Built with AES-256, RSA-SHA256 & MFA
        </div>
      </footer>
    </div>
  );
}

export default App;