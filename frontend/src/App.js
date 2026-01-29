import React, { useState } from 'react';

// SIMULATED BACKEND API
const API = {
  donations: [],
  users: [],
  expenseProofs: [],
  otpStore: {},
  
  generateOTP: () => Math.floor(100000 + Math.random() * 900000).toString(),
  hashPassword: (password) => 'hashed_' + btoa(password),
  
  registerDonor: async (email, password) => {
    const existing = API.users.find(u => u.email === email);
    if (existing) throw new Error('Email already registered');
    
    const otp = API.generateOTP();
    API.otpStore[email] = { otp, expires: Date.now() + 300000, password };
    console.log(`📧 OTP for ${email}: ${otp}`);
    return { success: true, message: 'OTP sent to email' };
  },
  
  verifySignupOTP: async (email, otp) => {
    const stored = API.otpStore[email];
    if (!stored || stored.expires < Date.now()) throw new Error('OTP expired');
    if (stored.otp !== otp) throw new Error('Invalid OTP');
    
    API.users.push({
      id: 'user_' + Date.now(),
      email,
      passwordHash: API.hashPassword(stored.password),
      createdAt: new Date().toISOString()
    });
    
    delete API.otpStore[email];
    return { success: true, message: 'Registration successful' };
  },
  
  login: async (email, password) => {
    const user = API.users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    
    const hashedInput = API.hashPassword(password);
    if (user.passwordHash !== hashedInput) throw new Error('Invalid password');
    
    const otp = API.generateOTP();
    API.otpStore[email] = { otp, expires: Date.now() + 300000, userId: user.id };
    console.log(`📧 Login OTP for ${email}: ${otp}`);
    return { success: true, message: 'OTP sent to email' };
  },
  
  verifyLoginOTP: async (email, otp) => {
    const stored = API.otpStore[email];
    if (!stored || stored.expires < Date.now()) throw new Error('OTP expired');
    if (stored.otp !== otp) throw new Error('Invalid OTP');
    
    const user = API.users.find(u => u.id === stored.userId);
    delete API.otpStore[email];
    
    return { 
      success: true, 
      user: { id: user.id, email: user.email }
    };
  },
  
  createDonation: async (donorName, donorEmail, donorPhone, amount, purpose) => {
    const donationId = 'DON_' + Date.now();
    
    const donation = {
      id: donationId,
      donorName,
      donorEmail,
      donorPhone,
      amount: parseFloat(amount),
      purpose,
      status: 'RECORDED',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      expenseProofId: null
    };
    
    API.donations.push(donation);
    
    const otp = API.generateOTP();
    API.otpStore[donorEmail] = { otp, expires: Date.now() + 300000, donationId };
    console.log(`📧 Donation verification OTP for ${donorEmail}: ${otp}`);
    
    return { 
      success: true, 
      donationId,
      message: 'Donation recorded. OTP sent to donor.'
    };
  },
  
  verifyDonationOwnership: async (email, otp) => {
    const stored = API.otpStore[email];
    if (!stored || stored.expires < Date.now()) throw new Error('OTP expired');
    if (stored.otp !== otp) throw new Error('Invalid OTP');
    
    const donation = API.donations.find(d => d.id === stored.donationId);
    if (!donation) throw new Error('Donation not found');
    
    donation.verifiedAt = new Date().toISOString();
    donation.status = 'VERIFIED';
    
    delete API.otpStore[email];
    
    return { 
      success: true, 
      donation,
      message: 'Donation verified successfully'
    };
  },
  
  uploadExpenseProof: async (donationId, receiptImage, description) => {
    const donation = API.donations.find(d => d.id === donationId);
    if (!donation) throw new Error('Donation not found');
    
    const proofId = 'PROOF_' + Date.now();
    
    const proof = {
      id: proofId,
      donationId,
      receiptImage,
      description,
      uploadedAt: new Date().toISOString(),
      receiptHash: 'SHA256_' + btoa(receiptImage)
    };
    
    API.expenseProofs.push(proof);
    
    donation.expenseProofId = proofId;
    donation.status = 'UTILIZED';
    
    return { 
      success: true, 
      proofId,
      message: 'Expense proof uploaded successfully'
    };
  },
  
  getDonorDonations: async (email, otp) => {
    const stored = API.otpStore[email];
    if (stored && stored.otp === otp && stored.expires > Date.now()) {
      delete API.otpStore[email];
      
      const donations = API.donations.filter(d => d.donorEmail === email);
      
      const donationsWithProofs = donations.map(d => {
        const proof = d.expenseProofId 
          ? API.expenseProofs.find(p => p.id === d.expenseProofId)
          : null;
        return { ...d, expenseProof: proof };
      });
      
      return { success: true, donations: donationsWithProofs };
    }
    
    const otp2 = API.generateOTP();
    API.otpStore[email] = { otp: otp2, expires: Date.now() + 300000, action: 'view' };
    console.log(`📧 View donations OTP for ${email}: ${otp2}`);
    
    throw new Error('OTP_REQUIRED');
  },
  
  getAllDonations: () => API.donations,
  getUnlinkedDonations: () => API.donations.filter(d => !d.expenseProofId)
};

function App() {
  const [page, setPage] = useState('home');
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
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
      setAuthStep('loginOtp');
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
      setPage('donor-dashboard');
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
  
  const handleViewDonations = async () => {
    try {
      const result = await API.getDonorDonations(viewEmail, viewOTP);
      setMyDonations(result.donations);
      setNeedsOTP(false);
      showMsg('Donations loaded successfully');
    } catch (err) {
      if (err.message === 'OTP_REQUIRED') {
        setNeedsOTP(true);
        showMsg('OTP sent to your email');
      } else {
        showMsg(err.message);
      }
    }
  };
  
  const loadAllDonations = () => {
    setAllDonations(API.getAllDonations());
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
            <button onClick={() => { setCurrentUser(null); setUserRole(null); setPage('home'); }} style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
  
  if (page === 'home') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {renderNav()}
        
        <div style={{ background: 'linear-gradient(to bottom right, #fff1f2, #ffedd5)', padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
            In-Person Donation with <span style={{ color: '#ec4899' }}>OTP Verification</span>
          </h1>
          <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px' }}>
            Donate at the orphanage physically. Track with OTP-based transparency. No payment gateway needed.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '64px' }}>
            <button onClick={() => { setPage('login'); setUserRole('donor'); }} style={{ padding: '16px 32px', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              I'm a Donor
            </button>
            <button onClick={() => { setPage('staff-login'); setUserRole('staff'); }} style={{ padding: '16px 32px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              I'm Staff
            </button>
          </div>
          
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>How It Works</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              {[
                { num: '1', title: 'In-Person Donation', desc: 'Visit orphanage, donate cash/UPI' },
                { num: '2', title: 'Record Creation', desc: 'Staff enters details, creates Donation ID' },
                { num: '3', title: 'OTP Verification', desc: 'You receive OTP to verify ownership' },
                { num: '4', title: 'Expense Proof Upload', desc: 'Staff uploads receipt showing usage' },
                { num: '5', title: 'Track with OTP', desc: 'Login anytime to view expense proofs' }
              ].map(step => (
                <div key={step.num} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#ec4899', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{step.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
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
                Login with OTP
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
            
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>View My Donations (OTP Required)</h2>
              
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
              
              {message && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '8px', fontSize: '14px' }}>
                  {message}
                </div>
              )}
            </div>
            
            {myDonations.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Your Donations</h2>
                
                <div style={{ display: 'grid', gap: '16px' }}>
                  {myDonations.map(d => (
                    <div key={d.id} style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>Donation ID:</p>
                          <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{d.id}</p>
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

  return null;
}

export default App;