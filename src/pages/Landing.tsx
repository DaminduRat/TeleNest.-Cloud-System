import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Send, Phone, KeyRound, Lock, Share2, Trash2 } from 'lucide-react';

import { API_URL as API_BASE } from '../config';
import { getAuthToken, setAuthToken } from '../config';


const features = [
  { icon: <Shield size={32} color="#10b981" />, title: "End-to-End Encryption", desc: "Your data is secured using Telegram's battle-tested MTProto protocol, ensuring total privacy." },
  { icon: <img src="/logo.png" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />, title: "Infinite Storage", desc: "Break free from storage limits. Leverage Telegram's global infrastructure for unlimited files." },
  { icon: <Zap size={32} color="#3b82f6" />, title: "High-Speed Streaming", desc: "Stream 4K videos and high-fidelity audio instantly without waiting for downloads." },
  { icon: <Share2 size={32} color="#facc15" />, title: "Smart Sharing", desc: "Create secure, temporary or permanent links to share your assets with anyone, anywhere." },
  { icon: <Lock size={32} color="#ec4899" />, title: "Private Cloud Nodes", desc: "Organize your data into private cloud nodes that only you can access and control." },
  { icon: <Trash2 size={32} color="#ef4444" />, title: "Secure Recovery", desc: "Features a dedicated trash vault to protect against accidental deletions with auto-cleanup." },
];


const FeatureCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '140px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-panel"
          style={{ 
            padding: '24px 40px', 
            width: '100%', 
            maxWidth: '800px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            borderRadius: '24px',
            textAlign: 'left'
          }}
        >
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{features[index].icon}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tg-blue)', marginBottom: '4px' }}>{features[index].title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{features[index].desc}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {features.map((_, i) => (
              <div key={i} style={{ height: i === index ? '20px' : '6px', width: '6px', borderRadius: '3px', background: i === index ? 'var(--tg-blue)' : 'rgba(255,255,255,0.1)', transition: '0.3s' }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'INITIAL' | 'PHONE' | 'CODE' | '2FA'>('INITIAL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${API_BASE}/auth/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.authorized) {
          if (data.needsInit) {
            navigate('/init');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (e) {}
    };
    checkAuth();

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [navigate]);


  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleSendCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+94${phoneNumber.replace(/\s+/g, '')}`;
      const res = await fetch(`${API_BASE}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullNumber })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setPhoneCodeHash(data.phoneCodeHash);
      setStep('CODE');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      setError('');
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+94${phoneNumber.replace(/\s+/g, '')}`;
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullNumber, phoneCodeHash, phoneCode })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.requires2FA) {
        setStep('2FA');
      } else if (data.success) {
        if (data.token) setAuthToken(data.token);
        if (data.needsInit) {
          navigate('/init');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FA = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/auth/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.success) {
        if (data.token) setAuthToken(data.token);
        if (data.needsInit) {
          navigate('/init');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    if (step === 'INITIAL') {
      return (
        <motion.button 
          className="btn-primary"
          style={{ margin: '0 auto', fontSize: '1.2rem', padding: '16px 36px', borderRadius: '16px' }}
          onClick={() => setStep('PHONE')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send size={24} />
          Login with Telegram
        </motion.button>
      );
    }

    return (
      <motion.div 
        className="glass-panel"
        style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>{error}</div>}
        
        {step === 'PHONE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter your phone number to continue</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--glass-border)', minWidth: '85px', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.1rem' }}>🇱🇰</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>+94</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '14px', border: '1px solid var(--glass-border)', transition: '0.3s' }} className="input-focus-ring">
                <Phone size={18} color="var(--tg-blue)" />
                <input 
                  type="text" 
                  placeholder="71 234 5678" 
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: 500 }}
                />
              </div>
            </div>
            
            <button className="btn-primary" onClick={handleSendCode} disabled={isLoading} style={{ width: '100%', justifyContent: 'center', height: '52px', fontSize: '1rem', borderRadius: '14px' }}>
              {isLoading ? 'Requesting Access...' : 'Continue with Telegram'}
            </button>
            
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.5 }}>
              By continuing, you agree to our <span style={{ color: 'var(--tg-blue)' }}>Terms</span> and <span style={{ color: 'var(--tg-blue)' }}>Privacy Policy</span>.
            </p>
          </div>
        )}


        {step === 'CODE' && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>We've sent a code to your Telegram app.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <KeyRound size={20} color="var(--tg-blue)" />
              <input 
                type="text" 
                placeholder="Enter Login Code" 
                value={phoneCode}
                onChange={e => setPhoneCode(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
              />
            </div>
            <button className="btn-primary" onClick={handleVerifyCode} disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </>
        )}

        {step === '2FA' && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>Your account is protected with 2-Step Verification.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <Lock size={20} color="var(--accent-purple)" />
              <input 
                type="password" 
                placeholder="Enter Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
              />
            </div>
            <button className="btn-primary" onClick={handle2FA} disabled={isLoading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' }}>
              {isLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', padding: '20px' }}>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: 'center', maxWidth: '800px', zIndex: 10 }}
      >
        <motion.div 
          className="glass-panel"
          style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', marginBottom: '24px' }}
          animate={{ boxShadow: ['0 0 0 0 rgba(42, 171, 238, 0.4)', '0 0 0 20px rgba(42, 171, 238, 0)', '0 0 0 0 rgba(42, 171, 238, 0)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <img src="/logo.png" alt="TeleNest Logo" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
        </motion.div>
        
        <h1 style={{ fontSize: '4.5rem', marginBottom: '16px', letterSpacing: '-2px', fontWeight: 900, lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-brand)' }}>TeleNest<span style={{ color: 'var(--tg-blue)' }}>.</span></span>
          </div>
          <span className="text-gradient-blue">Unlimited Cloud.</span> <br/> Total Privacy.
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '650px', margin: '0 auto 48px auto', lineHeight: 1.6, fontWeight: 500 }}>
          The world's most advanced Telegram-powered storage system. TeleNest provides an encrypted, high-speed bridge to your personal media with zero compromises on security.
        </p>


        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderForm()}
          </motion.div>
        </AnimatePresence>

      </motion.div>

      {step === 'INITIAL' && (
        <div style={{ marginTop: '40px', width: '100%', maxWidth: '1000px', overflow: 'hidden', position: 'relative', padding: '10px 0' }}>
            <FeatureCarousel />
        </div>
      )}

      {deferredPrompt && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel"
          onClick={handleInstallClick}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            border: '1px solid var(--tg-blue)',
            color: 'var(--tg-blue)',
            zIndex: 100,
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
          whileHover={{ scale: 1.05, background: 'rgba(42, 171, 238, 0.1)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap size={18} />
          Install App
        </motion.button>
      )}

      {/* Landing Footer */}
      <footer style={{ marginTop: 'auto', paddingTop: '60px', paddingBottom: '40px', width: '100%', maxWidth: '1000px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
            <div>
              <span style={{ fontWeight: 900, color: '#fff', fontSize: '1rem' }}>TeleNest<span style={{ color: 'var(--tg-blue)' }}>.</span></span>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>PRIVATE CLOUD SYSTEM</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '32px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ cursor: 'pointer' }} className="footer-link">Infrastructure</span>
            <span style={{ cursor: 'pointer' }} className="footer-link">Security</span>
            <span style={{ cursor: 'pointer' }} className="footer-link">Architecture</span>
          </div>

          <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>&copy; 2026 TeleNest Cloud. All rights reserved.</p>
              <a 
                href="https://damindur.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '0.8rem', color: '#fff', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--tg-blue)'}
                onMouseOut={(e) => e.currentTarget.style.color = '#fff'}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 900 }}>DR</div>
                <span>Developed by DaminduR</span>
              </a>
          </div>
      </footer>

      <style>{`
        .input-focus-ring:focus-within {
          border-color: var(--tg-blue) !important;
          box-shadow: 0 0 0 3px rgba(42, 171, 238, 0.1);
        }
        .footer-link:hover {
          color: #fff;
        }
      `}</style>
    </div>

  );
};

export default Landing;
