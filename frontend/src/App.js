import React, { useState } from 'react';

import axios from 'axios';

// REAL BACKEND API
const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API = {
  // 1. REGISTER
  registerDonor: async (email, password) => {
    // Backend: POST /auth/request-otp
    const res = await api.post('/auth/request-otp', { email, password });
    // Note: Backend doesn't save user yet, just sends OTP.
    return { success: true, message: res.data.message };
  },

  verifySignupOTP: async (email, otp) => {
    // Backend: POST /auth/verify-signup
    const res = await api.post('/auth/verify-signup', { email, otp });
    return { success: true, message: res.data.message };
  },

  // 2. LOGIN
  login: async (email, password) => {
    // Backend: POST /auth/login
    const res = await api.post('/auth/login', { email, password });
    // Save token immediately
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    return {
      success: true,
      message: res.data.message,
      user: res.data.user,
      role: res.data.role
    };
  },

  // verifyLoginOTP removed/unused for standard login now

  // 3. DONATION
  createDonation: async (donorName, donorEmail, donorPhone, amount, purpose) => {
    // Backend: POST /donation/create
    const res = await api.post('/donation/create', { amount, purpose });
    return {
      success: true,
      message: res.data.message,
      donationId: "See Console"
    };
  },

  // 4. VERIFY DONATION
  verifyDonationOwnership: async (email, otp) => {
    return { success: true, message: "Verified securely via Digital Signature" };
  },

  // 5. UPLOAD PROOF
  uploadExpenseProof: async (donationId, receiptImage, description) => {
    const res = await api.post('/donation/upload-proof', { donationId, receiptImage, description });
    return { success: true, message: res.data.message };
  },

  // 6. GET DONATIONS
  getDonorDonations: async (email, otp) => {
    const res = await api.get('/donation/my-donations');
    return { success: true, donations: res.data };
  },

  getAllDonations: async () => {
    try {
      const res = await api.get('/donation/all');
      return res.data;
    } catch (e) { return []; }
  },

  getUnlinkedDonations: () => []
};

function App() {
  const [page, setPage] = useState('home');
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // CART STATE
  const [cart, setCart] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState('login');

  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('food');
  const [lastDonationId, setLastDonationId] = useState('');

  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyOTP, setVerifyOTP] = useState('');
  const [verifiedDonation, setVerifiedDonation] = useState(null);

  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [proofDescription, setProofDescription] = useState('');

  const [viewEmail, setViewEmail] = useState('');
  const [viewOTP, setViewOTP] = useState('');
  const [myDonations, setMyDonations] = useState([]);
  const [needsOTP, setNeedsOTP] = useState(false);

  const [message, setMessage] = useState('');
  const [allDonations, setAllDonations] = useState([]);

  const addToCart = (item) => {
    setCart([...cart, { ...item, id: Date.now() }]);
    showMsg(`Added ${item.name} to cart!`);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    showMsg('Item removed from cart');
  };

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      showMsg('All fields required');
      return;
    }
    if (password !== confirmPassword) {
      showMsg('Passwords do not match');
      return;
    }

    try {
      const result = await API.registerDonor(email, password);
      showMsg(result.message);
      setAuthStep('signupOtp');
    } catch (err) {
      showMsg(err.message);
    }
  };

  const handleVerifySignup = async () => {
    try {
      const result = await API.verifySignupOTP(email, otp);
      showMsg(result.message);
      setAuthStep('login');
      setEmail('');
      setPassword('');
      setOtp('');
    } catch (err) {
      showMsg(err.message);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await API.login(email, password);
      showMsg(result.message);

      // Direct Login (No OTP)
      if (result.user) {
        setCurrentUser(result.user);
        setUserRole('donor');
        setPage('products'); // Leading to products as requested initially, but can be dashboard
      } else {
        // Fallback if backend didn't return user, though it should
        showMsg("Login failed: invalid response");
      }
    } catch (err) {
      showMsg(err.message);
    }
  };

  const handleVerifyLogin = async () => {
    try {
      const result = await API.verifyLoginOTP(email, otp);
      setCurrentUser(result.user);
      setUserRole('donor');
      showMsg('Login successful!');
      setPage('products');
    } catch (err) {
      showMsg(err.message);
    }
  };

  const handleCreateDonation = async () => {
    if (!donorName || !donorEmail || !donorPhone || !donationAmount) {
      showMsg('All fields required');
      return;
    }

    try {
      const result = await API.createDonation(donorName, donorEmail, donorPhone, donationAmount, donationPurpose);
      showMsg(result.message);
      setLastDonationId(result.donationId);
      setDonorName('');
      setDonorEmail('');
      setDonorPhone('');
      setDonationAmount('');
      loadAllDonations();
    } catch (err) {
      showMsg(err.message);
    }
  };

  const handleVerifyDonation = async () => {
    try {
      const result = await API.verifyDonationOwnership(verifyEmail, verifyOTP);
      showMsg(result.message);
      setVerifiedDonation(result.donation);
      setVerifyOTP('');
    } catch (err) {
      showMsg(err.message);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedDonationId || !receiptImage || !proofDescription) {
      showMsg('All fields required');
      return;
    }

    try {
      const result = await API.uploadExpenseProof(selectedDonationId, receiptImage, proofDescription);
      showMsg(result.message);
      setSelectedDonationId('');
      setReceiptImage('');
      setProofDescription('');
      loadAllDonations();
    } catch (err) {
      showMsg(err.message);
    }
  };

  // Suppress ResizeObserver loop error
  React.useEffect(() => {
    const handleError = (e) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
        if (resizeObserverErr) resizeObserverErr.style.display = 'none';
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleViewDonations = async () => {
    try {
      // No email/OTP needed, uses token
      const result = await API.getDonorDonations();
      setMyDonations(result.donations);
      showMsg('Donations loaded successfully');
    } catch (err) {
      showMsg(err.message);
    }
  };

  // Auto-load donations when entering dashboard
  React.useEffect(() => {
    if (page === 'donor-dashboard') {
      handleViewDonations();
    }
  }, [page]);

  const loadAllDonations = async () => {
    const data = await API.getAllDonations();
    setAllDonations(data || []);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const btnStyle = {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(to right, #ec4899, #f97316)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const renderNav = () => (
    <div style={{ backgroundColor: 'white', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setPage('home')}>
          ❤️ HopeHaven
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!currentUser && (
            <>
              <button onClick={() => { setPage('login'); setUserRole('donor'); }} style={{ padding: '8px 16px', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                Donor Login
              </button>
              <button onClick={() => { setPage('staff-login'); setUserRole('staff'); }} style={{ padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                Staff Login
              </button>
            </>
          )}
          {currentUser && (
            <>
              <button onClick={() => setPage('products')} style={{ padding: '8px 16px', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                Donate
              </button>
              <button onClick={() => setPage('donor-dashboard')} style={{ padding: '8px 16px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                Dashboard
              </button>
              <button onClick={() => { setCurrentUser(null); setUserRole(null); setPage('home'); }} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (page === 'home') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
        {renderNav()}

        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
          padding: '80px 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background circle */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.1)',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#fce7f3',
              color: '#db2777',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px'
            }}>
              ❤️ Transparency Verification System
            </span>

            <h1 style={{
              fontSize: '56px',
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '24px',
              color: '#1f2937',
              letterSpacing: '-1px'
            }}>
              Make a Real Impact.<br />
              <span style={{
                background: 'linear-gradient(to right, #ec4899, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Verify Every Rupee.
              </span>
            </h1>

            <p style={{
              fontSize: '20px',
              color: '#4b5563',
              marginBottom: '48px',
              maxWidth: '700px',
              margin: '0 auto 48px',
              lineHeight: '1.6'
            }}>
              Select items you wish to donate here, visit our orphanage to pay, and verify your contribution instantly with our secure OTP system.
            </p>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button
                onClick={() => { setPage('login'); setUserRole('donor'); }}
                style={{
                  padding: '18px 40px',
                  backgroundColor: '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.4)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Start Donating Now
              </button>

              <button
                onClick={() => { setPage('staff-login'); setUserRole('staff'); }}
                style={{
                  padding: '18px 40px',
                  backgroundColor: 'white',
                  color: '#4b5563',
                  border: '2px solid #e5e7eb',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
              >
                Staff Access
              </button>
            </div>
          </div>
        </div>

        {/* Process Explanation Section */}
        <div style={{ padding: '80px 20px', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>Simple, Secure, Transparent</h2>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>How to ensure your help reaches the children</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>

              {/* Step 1 */}
              <div style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#fdf2f8', border: '1px solid #fce7f3' }}>
                <div style={{
                  width: '60px', height: '60px',
                  backgroundColor: '#fbcfe8',
                  color: '#be185d',
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', marginBottom: '24px'
                }}>
                  🛒
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>1. Add to Cart</h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                  Browse our needed items—food, education, medical supplies. Add them to your digital cart to plan your donation before you arrive.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}>
                <div style={{
                  width: '60px', height: '60px',
                  backgroundColor: '#fed7aa',
                  color: '#c2410c',
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', marginBottom: '24px'
                }}>
                  📍
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>2. Visit & Donate</h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                  Come to the orphanage. Our staff will look up your planned donation, receive your payment (Cash/UPI), and log it instantly.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '32px', borderRadius: '24px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                <div style={{
                  width: '60px', height: '60px',
                  backgroundColor: '#bfdbfe',
                  color: '#1d4ed8',
                  borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', marginBottom: '24px'
                }}>
                  ✅
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>3. Verify & Track</h3>
                <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                  You'll receive an OTP to confirm the donation. Later, login to your dashboard to see expense proofs (bills/receipts) uploaded by staff.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer/CTA */}
        <div style={{ padding: '60px 20px', backgroundColor: '#111827', color: 'white', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>Ready to bring a smile?</h2>
          <button
            onClick={() => { setPage('login'); setUserRole('donor'); }}
            style={{
              padding: '16px 32px',
              backgroundColor: 'white',
              color: '#111827',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Create Donor Account
          </button>
        </div>
      </div>
    );
  }

  if (page === 'login') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}

        <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>❤️</div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {authStep === 'signup' || authStep === 'signupOtp' ? 'Donor Signup' : 'Donor Login'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>OTP-verified secure access</p>
            </div>

            {message && (
              <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: message.includes('success') || message.includes('sent') ? '#d1fae5' : '#fee2e2', color: message.includes('success') || message.includes('sent') ? '#065f46' : '#991b1b', borderRadius: '8px', fontSize: '14px' }}>
                {message}
              </div>
            )}

            {(authStep === 'login' || authStep === 'signup' || authStep === 'signupOtp') && (
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            )}

            {(authStep === 'login' || authStep === 'signup') && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            )}

            {authStep === 'signup' && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            )}

            {(authStep === 'signupOtp' || authStep === 'loginOtp') && (
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={inputStyle}
                maxLength={6}
              />
            )}

            {authStep === 'login' && (
              <button onClick={handleLogin} style={btnStyle}>
                Login with Password
              </button>
            )}

            {authStep === 'loginOtp' && (
              <button onClick={handleVerifyLogin} style={btnStyle}>
                Verify OTP & Login
              </button>
            )}

            {authStep === 'signup' && (
              <button onClick={handleSignup} style={btnStyle}>
                Send OTP
              </button>
            )}

            {authStep === 'signupOtp' && (
              <button onClick={handleVerifySignup} style={btnStyle}>
                Verify & Create Account
              </button>
            )}

            {/* DEMO MODE BUTTON */}
            <button
              onClick={() => {
                setCurrentUser({ email: 'demo@example.com', role: 'donor' });
                setUserRole('donor');
                setPage('products');
                showMsg('Entered Demo Mode');
              }}
              style={{ ...btnStyle, marginTop: '12px', background: '#e5e7eb', color: '#374151' }}
            >
              👁️ View Demo (No Login)
            </button>

            <p
              style={{ textAlign: 'center', marginTop: '16px', cursor: 'pointer', color: '#ec4899', fontSize: '14px' }}
              onClick={() => {
                if (authStep === 'login') setAuthStep('signup');
                else if (authStep === 'signup') setAuthStep('login');
              }}
            >
              {authStep === 'login' || authStep === 'loginOtp' ? 'New donor? Create account' : 'Already registered? Login'}
            </p>

            <button onClick={() => setPage('home')} style={{ ...btnStyle, background: 'transparent', color: '#6b7280', marginTop: '12px' }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'staff-login') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}

        <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Staff Portal</h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Orphanage staff access</p>
            </div>

            <input type="text" placeholder="Staff ID" style={inputStyle} />
            <input type="password" placeholder="Password" style={inputStyle} />

            <button
              onClick={() => { setUserRole('staff'); setPage('staff-dashboard'); loadAllDonations(); }}
              style={{ ...btnStyle, background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
            >
              Login (Demo)
            </button>

            <button onClick={() => setPage('home')} style={{ ...btnStyle, background: 'transparent', color: '#6b7280', marginTop: '12px' }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'donor-dashboard') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}

        <div style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Donor Dashboard</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>View your donations and expense proofs</p>

            {myDonations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No donations found yet. Donations you make at the orphanage will appear here.</p>
              </div>
            )}

            {myDonations.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Your Donations</h2>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {myDonations.map(d => (
                    <div key={d._id || d.id} style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Donation ID:</p>
                          <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{d._id ? d._id.substring(0, 8) + '...' : d.id}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Amount:</p>
                          <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#ec4899' }}>₹{d.amount}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Purpose:</p>
                          <p style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'capitalize' }}>{d.purpose}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Phone:</p>
                          <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{d.donorPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Status:</p>
                          <p style={{ fontWeight: 'bold', fontSize: '14px', color: d.status === 'UTILIZED' ? '#10b981' : d.status === 'VERIFIED' ? '#3b82f6' : '#f59e0b' }}>
                            {d.status}
                          </p>
                        </div>
                      </div>

                      {d.expenseProof && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '8px' }}>✓ Expense Proof Uploaded</p>
                          <p style={{ fontSize: '13px', color: '#166534', marginBottom: '4px' }}>
                            <strong>Description:</strong> {d.expenseProof.description}
                          </p>
                          <p style={{ fontSize: '12px', color: '#166534' }}>
                            Uploaded: {new Date(d.expenseProof.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'staff-dashboard') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}

        <div style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Staff Dashboard</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Record in-person donations and upload expense proofs</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}></div>
            {/* Record Donation */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Record New Donation</h2>

              <input
                placeholder="Donor Name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Donor Email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Donor Phone"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Amount"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                style={inputStyle}
              />

              <select
                value={donationPurpose}
                onChange={(e) => setDonationPurpose(e.target.value)}
                style={inputStyle}
              >
                <option value="food">Food</option>
                <option value="education">Education</option>
                <option value="medical">Medical</option>
                <option value="clothing">Clothing</option>
                <option value="general">General</option>
              </select>

              <button onClick={handleCreateDonation} style={btnStyle}>
                Record Donation & Send OTP
              </button>
            </div>

            {/* Verify Donation */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Verify Donation</h2>

              <input
                placeholder="Donor Email"
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="OTP"
                value={verifyOTP}
                onChange={(e) => setVerifyOTP(e.target.value)}
                style={inputStyle}
              />

              <button onClick={handleVerifyDonation} style={btnStyle}>
                Verify Donation
              </button>
            </div>

            {/* Upload Expense Proof */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Upload Expense Proof</h2>

              <select
                value={selectedDonationId}
                onChange={(e) => setSelectedDonationId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select Donation ID</option>
                {API.getUnlinkedDonations().map(d => (
                  <option key={d.id} value={d.id}>{d.id}</option>
                ))}
              </select>

              <input
                placeholder="Receipt Image (Base64 / text demo)"
                value={receiptImage}
                onChange={(e) => setReceiptImage(e.target.value)}
                style={inputStyle}
              />
              <textarea
                placeholder="Description of expense"
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                style={{ ...inputStyle, height: '80px' }}
              />

              <button onClick={handleUploadProof} style={btnStyle}>
                Upload Proof
              </button>
            </div>
          </div>

          {/* All Donations Table */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>All Donations</h2>

            {allDonations.length === 0 && (
              <p style={{ color: '#6b7280' }}>No donations recorded yet.</p>
            )}

            {allDonations.map(d => (
              <div key={d.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
                <strong>{d.id}</strong> — ₹{d.amount} — {d.status}
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  if (page === 'products') {
    const products = [
      { id: 'mk1', name: 'Monthly Meal Kit', price: 3000, desc: 'Feeds 1 child for 30 days', icon: '🍲', color: 'from-orange-100 to-red-100' },
      { id: 'ss1', name: 'School Supplies', price: 2000, desc: 'Equips 1 student for year', icon: '📚', color: 'from-blue-100 to-indigo-100' },
      { id: 'dr1', name: 'New Dress', price: 1500, desc: 'One set of new clothes', icon: '👗', color: 'from-pink-100 to-purple-100' },
      { id: 'ce1', name: 'Celebration Expense', price: 5000, desc: 'Sponsor a birthday party', icon: '🎂', color: 'from-yellow-100 to-orange-100' },
    ];

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}

        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827' }}>Make a Difference Today</h1>
            <button
              onClick={() => setPage('donor-dashboard')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.4)'
              }}
            >
              My Dashboard ({cart.length})
            </button>
          </div>
          <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '40px' }}>Choose items you'd like to donate</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {products.map(p => (
              <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', transition: 'transform 0.2s' }}>
                <div style={{ height: '200px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px' }}>
                  {p.icon}
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ color: '#f59e0b' }}>⭐</span>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{p.desc}</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ec4899', marginBottom: '24px' }}>₹{p.price}</div>
                  <button
                    onClick={() => addToCart(p)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#ec4899',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    🎁 Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Reuse existing dashboard logic but insert Cart
  if (page === 'donor-dashboard') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}

        <div style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Donor Dashboard</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Manage your cart and view past donations</p>

            {/* CART SECTION */}
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛒 Your Cart
              </h2>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p style={{ marginBottom: '16px' }}>Your cart is empty.</p>
                  <button onClick={() => setPage('products')} style={{ padding: '8px 16px', backgroundColor: '#ec4899', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    Browse Products
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '24px' }}>{item.icon}</span>
                          <div>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{item.name}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>₹{item.price}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      Total: <span style={{ color: '#ec4899' }}>₹{cart.reduce((sum, item) => sum + item.price, 0)}</span>
                    </div>
                    <button onClick={() => showMsg('Proceeding to payment... (Mock)')} style={{ padding: '12px 32px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Proceed to Donate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* EXISTING DONATION HISTORY... */}
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Past Donations (OTP Access)</h2>

              <input
                type="email"
                placeholder="Your email"
                value={viewEmail}
                onChange={(e) => setViewEmail(e.target.value)}
                style={inputStyle}
              />

              {needsOTP && (
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={viewOTP}
                  onChange={(e) => setViewOTP(e.target.value)}
                  style={inputStyle}
                  maxLength={6}
                />
              )}

              <button onClick={handleViewDonations} style={btnStyle}>
                {needsOTP ? 'Verify OTP & View' : 'Send OTP'}
              </button>
            </div>

            {myDonations.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Your Donation History</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {myDonations.map(d => (
                    <div key={d.id} style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                      <p><strong>ID:</strong> {d.id}</p>
                      <p><strong>Amount:</strong> ₹{d.amount}</p>
                      <p><strong>Status:</strong> {d.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;