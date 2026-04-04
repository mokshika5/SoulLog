import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar as CalendarIcon, Target, 
  Map, CheckCircle2, Circle, Plus, Sun, 
  Heart, Image as ImageIcon, Lock, 
  ListTodo, X, Trash2, Droplets, 
  ChevronLeft, ChevronRight, BarChart2, 
  Upload, CloudOff, Cloud, Sparkles
} from 'lucide-react';

import { 
  signInWithCustomToken, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  getAuth
} from "firebase/auth";

import { doc, setDoc, getDoc, getFirestore } from "firebase/firestore";
import { auth, db } from './firebase';
const appId = 'soullog';

// Resize image before upload to keep usage low
const resizeImageToBlob = (file, maxDim = 900, quality = 0.82) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
      else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 2. Add back your Cloudinary function (and remove the dead Firebase Storage one!)
const uploadImageToCloudinary = async (file) => {
  const blob = await resizeImageToBlob(file);
  
  const formData = new FormData();
  formData.append('file', blob);
  
  const CLOUD_NAME = "dklabdj1s"; 
  const UPLOAD_PRESET = "soullog_uploads"; 

  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error("Upload to Cloudinary failed");

  const data = await response.json();
  return data.secure_url; 
};

const LogoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
    <path d="M20 8 C20 8 28 14 28 22 C28 26.4 24.4 30 20 30 C15.6 30 12 26.4 12 22 C12 14 20 8 20 8Z" fill="currentColor" opacity="0.15"/>
    <path d="M20 8 C20 8 28 14 28 22 C28 26.4 24.4 30 20 30 C15.6 30 12 26.4 12 22 C12 14 20 8 20 8Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <line x1="20" y1="22" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --ink: #1C1917;
    --ink-60: rgba(28,25,23,0.6);
    --ink-30: rgba(28,25,23,0.3);
    --ink-10: rgba(28,25,23,0.1);
    --ink-05: rgba(28,25,23,0.05);
    --cream: #FAF8F5;
    --paper: #F4F1EB;
    --sage: #7C9A82;
    --sage-light: #B8CFB8;
    --sage-pale: #E8F0E8;
    --lavender: #9B8FBD;
    --lavender-pale: #EAE7F5;
    --rose: #C4756A;
    --rose-pale: #F5E8E6;
    --gold: #C4A35A;
    --gold-pale: #F5EDD6;
    --white: #FFFFFF;
    --radius: 16px;
    --radius-sm: 10px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); }
  
  .font-serif { font-family: 'Playfair Display', Georgia, serif !important; }
  .font-mono { font-family: 'DM Mono', monospace !important; }

  /* RESPONSIVE LAYOUT CLASSES */
  .layout-grid {
    display: grid;
    gap: 24px;
  }
  .layout-sidebar-right {
    grid-template-columns: 1fr 320px;
  }
  .layout-halves {
    grid-template-columns: 1fr 1fr;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  @media (max-width: 900px) {
    .layout-sidebar-right, .layout-halves { grid-template-columns: 1fr; }
    .main-container { padding: 30px 20px 80px !important; }
  }
  
  @media (max-width: 600px) {
    .stats-grid, .summary-grid { grid-template-columns: 1fr; }
    .sl-card { padding: 18px; }
    .hard75-wrapper { padding: 16px !important; }
    .hard75-cell { width: 22px !important; height: 22px !important; border-radius: 4px !important; }
    .hard75-th { min-width: 24px !important; padding: 4px 1px !important; }
    
    /* NEW MOBILE OPTIMIZATIONS FOR 75 HARD */
    .hard75-habit-col { width: 110px !important; min-width: 110px !important; padding-left: 8px !important; padding-right: 4px !important; }
    .hard75-habit-title { font-size: 11px !important; white-space: normal !important; line-height: 1.2 !important; word-break: break-word; }
    .hard75-habit-badges { flex-direction: column !important; gap: 3px !important; align-items: flex-start !important; }
    .hard75-summary-block { padding: 4px 8px !important; }
    .hard75-summary-block .val { font-size: 13px !important; }
    .hard75-summary-block .lbl { font-size: 8px !important; }
    .hard75-header-container { flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }
  }

  .sl-sidebar {
    width: 260px;
    min-width: 260px;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: sticky;
    top: 0;
  }

  .sl-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    color: rgba(250,248,245,0.55);
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    background: none;
    width: 100%;
    text-align: left;
  }
  .sl-nav-item:hover { color: rgba(250,248,245,0.85); background: rgba(250,248,245,0.06); }
  .sl-nav-item.active { color: var(--cream); background: rgba(250,248,245,0.12); border-color: rgba(250,248,245,0.1); }
  .sl-nav-item .icon { width: 18px; height: 18px; opacity: 0.8; }

  .sl-card {
    background: var(--white);
    border-radius: var(--radius);
    border: 1px solid var(--ink-10);
    padding: 24px;
  }

  .sl-card-sage { background: var(--sage-pale); border-color: rgba(124,154,130,0.25); }
  .sl-card-lavender { background: var(--lavender-pale); border-color: rgba(155,143,189,0.25); }
  .sl-card-gold { background: var(--gold-pale); border-color: rgba(196,163,90,0.25); }

  .sl-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }
  .sl-btn-primary { background: var(--ink); color: var(--cream); }
  .sl-btn-primary:hover { background: #2D2926; }
  .sl-btn-sage { background: var(--sage); color: white; }
  .sl-btn-sage:hover { background: #6B8870; }
  .sl-btn-ghost { background: var(--ink-05); color: var(--ink); }
  .sl-btn-ghost:hover { background: var(--ink-10); }
  .sl-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .sl-input {
    width: 100%;
    background: var(--paper);
    border: 1px solid var(--ink-10);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sl-input:focus { border-color: var(--sage); box-shadow: 0 0 0 3px rgba(124,154,130,0.12); }
  .sl-input::placeholder { color: var(--ink-30); }

  .sl-textarea { resize: none; min-height: 120px; line-height: 1.6; }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .tag-sage { background: var(--sage-pale); color: var(--sage); border: 1px solid rgba(124,154,130,0.3); }
  .tag-done { background: var(--sage); color: white; }
  .tag-ink { background: var(--ink-05); color: var(--ink-60); border: 1px solid var(--ink-10); }

  .habit-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    transition: background 0.15s;
    cursor: pointer;
  }
  .habit-row:hover { background: var(--paper); }

  .check-circle {
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 2px solid var(--ink-30);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .check-circle.done { background: var(--sage); border-color: var(--sage); }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(28,25,23,0.55);
    backdrop-filter: blur(6px);
    z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: fadeIn 0.15s ease;
  }
  .modal-box {
    background: var(--white);
    border-radius: 20px;
    border: 1px solid var(--ink-10);
    width: 100%; max-width: 480px;
    max-height: 90vh;
    display: flex; flex-direction: column;
    overflow: hidden;
    animation: scaleIn 0.2s ease;
    box-shadow: 0 24px 64px rgba(28,25,23,0.18);
  }
  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--ink-10);
    display: flex; justify-content: space-between; align-items: center;
    background: var(--paper);
  }
  .modal-body { padding: 24px; overflow-y: auto; flex: 1; }

  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }

  .animate-up { animation: slideUp 0.4s ease both; }
  .animate-up-delay-1 { animation: slideUp 0.4s ease 0.05s both; }
  .animate-up-delay-2 { animation: slideUp 0.4s ease 0.1s both; }
  .animate-up-delay-3 { animation: slideUp 0.4s ease 0.15s both; }

  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
  .cal-day {
    aspect-ratio: 1;
    padding: 8px;
    border: 1px solid var(--ink-05);
    cursor: pointer;
    transition: background 0.12s;
    background: var(--white);
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 90px;
  }
  .cal-day:hover { background: var(--paper); }
  .cal-day.period { background: #FFF0EE; }
  .cal-day.period:hover { background: #FFE5E2; }
  .cal-day-num {
    font-size: 13px;
    font-weight: 600;
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .cal-day-num.today { background: var(--ink); color: var(--cream); }
  .cal-day-num.period-day { color: var(--rose); }

  .hard75-cell {
    width: 26px; height: 26px;
    border-radius: 6px;
    border: 1.5px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    background: rgba(255,255,255,0.15);
    flex-shrink: 0;
  }
  .hard75-cell.done { background: var(--ink); border-color: var(--ink); }
  .hard75-cell:not(.done):hover { background: rgba(255,255,255,0.3); }

  .letter-card {
    padding: 16px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px;
    transition: all 0.2s;
    border: 1px solid var(--ink-10);
  }
  .letter-card.unlocked { background: var(--white); cursor: pointer; }
  .letter-card.unlocked:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(28,25,23,0.08); }
  .letter-card.locked { background: var(--paper); opacity: 0.65; cursor: not-allowed; }

  .vision-img-wrap {
    width: 100%; height: 280px;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    background: var(--paper);
  }
  .vision-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease; }
  .vision-img-wrap:hover img { transform: scale(1.04); }

  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-30);
  }

  .priority-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: all 0.12s;
  }
  .priority-row:hover { background: var(--paper); border-color: var(--ink-05); }

  .divider { height: 1px; background: var(--ink-10); margin: 16px 0; }

  .badge {
    font-size: 11px; font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
  }
  .badge-streak { background: rgba(28,25,23,0.85); color: var(--cream); }
  .badge-count { background: rgba(255,255,255,0.3); color: rgba(28,25,23,0.7); }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--ink-10); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--ink-30); }

  input[type='checkbox'] {
    appearance: none;
    width: 18px; height: 18px;
    border: 2px solid var(--ink-30);
    border-radius: 5px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
    position: relative;
  }
  input[type='checkbox']:checked {
    background: var(--sage);
    border-color: var(--sage);
  }
  input[type='checkbox']:checked::after {
    content: '';
    position: absolute;
    width: 5px; height: 9px;
    border: 2px solid white;
    border-left: none; border-top: none;
    transform: rotate(45deg) translate(-1px, -1px);
  }

  @media (max-width: 768px) {
    .sl-sidebar { display: none; }
    .mobile-nav { display: flex !important; }
    main { padding-top: 60px !important; }
  }
  .mobile-nav { display: none; }

  .stat-block {
    background: var(--paper);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }
`;

export default function App() {
  const [currentTab, setCurrentTab] = useState('daily');
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const todayKey = `${currentYear}-${currentMonth}-${currentDate}`;
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const defaultData = {
    username: '',
    habitsList: [
      { id: 1, title: "Wake up by 6 AM" },
      { id: 2, title: "Read 10 pages" },
      { id: 3, title: "10 Min Meditation" }
    ],
    hard75StartDate: today.toISOString().split('T')[0],
    hard75Habits: [
      { id: 'diet', title: 'Diet (No Cheat)', progress: Array(75).fill(false) },
      { id: 'w1', title: 'Workout 1 (45m)', progress: Array(75).fill(false) },
      { id: 'w2', title: 'Workout 2 (Outdoors)', progress: Array(75).fill(false) },
      { id: 'water', title: 'Drink 4L Water', progress: Array(75).fill(false) },
      { id: 'read', title: 'Read 10 Pages', progress: Array(75).fill(false) },
      { id: 'pic', title: 'Progress Picture', progress: Array(75).fill(false) },
    ],
    calendarData: {
      [todayKey]: { events: ['Start of SoulLog'], isPeriod: false, journal: '', priorities: [], habitCompletion: {}, gratitude: ['', '', ''] }
    },
    letters: [], monthlyGoals: [], moments: [],
    visionBoardImage: 'https://picsum.photos/seed/vision/1200/400',
    bucketList: [], trips: [], hobbiesList: [], customSections: []
  };

  const [userData, setUserData] = useState(defaultData);
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isReadyToSave, setIsReadyToSave] = useState(false); // The Stop Sign!

  useEffect(() => {
    if (!auth) { setInitialLoadDone(true); return; }
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else { await signInAnonymously(auth); }
        }
      } catch (err) { setInitialLoadDone(true); }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsReadyToSave(false); // 🛑 Put up the stop sign!
      
      if (u && db) {
        try {
          const snap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'appData', 'state'));
          if (snap.exists()) {
            setUserData(prev => ({ ...prev, ...snap.data() }));
          } else {
            setUserData(defaultData); // Load defaults if completely new account
          }
        } catch (e) { console.error("Fetch Error:", e); }
      } else {
        setUserData(defaultData); // Clear screen if logged out
      }
      
      setInitialLoadDone(true);
      setIsReadyToSave(true); // ✅ Take down the stop sign! Data is fully loaded.
    });
    return () => unsubscribe();
  }, []);

  // ---> AUTO-SAVE EFFECT <---
  useEffect(() => {
    // 1. Don't try to save if the app is still loading or nobody is logged in
    if (!isReadyToSave || !user || !db) return;

    const saveDataToCloud = async () => {
      setIsSyncing(true); // Turns on your little "Syncing..." cloud icon!
      try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'state');
        await setDoc(userDocRef, userData);
      } catch (error) {
        console.error("Error saving data:", error);
      }
      setIsSyncing(false); // Turns back to "Cloud Ready"
    };

    // 2. Wait 1.5 seconds after they stop typing before saving.
    const timeoutId = setTimeout(() => {
      saveDataToCloud();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [userData, user, isReadyToSave]); // This triggers anytime userData changes!

  const handleLogin = async () => {
    setIsAuthLoading(true); setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuthModal(false); setAuthEmail(''); setAuthPassword('');
    } catch (e) {
      if (e.code === 'auth/user-not-found') setAuthError("No account found.");
      else if (e.code === 'auth/wrong-password') setAuthError("Incorrect password.");
      else setAuthError("Could not log in. Please check your details.");
    }
    setIsAuthLoading(false);
  };

  const handleSignup = async () => {
    setIsAuthLoading(true); setAuthError('');
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const newUserData = { ...defaultData, username: authUsername };
      await setDoc(doc(db, 'artifacts', appId, 'users', newUser.uid, 'appData', 'state'), newUserData);
      setUserData(newUserData); setShowAuthModal(false);
      setAuthUsername(''); setAuthEmail(''); setAuthPassword('');
    } catch (e) { setAuthError(e.message); }
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    if (window.confirm("Log out?")) {
      setIsAuthLoading(true);
      setIsReadyToSave(false); // 🛑 Put up the stop sign! Don't save a blank screen
      try { await signOut(auth); setUserData(defaultData); await signInAnonymously(auth); }
      catch(e) { console.error(e); }
      setIsAuthLoading(false); setShowAuthModal(false);
    }
  };

  const navItems = [
    { id: 'daily', icon: Sun, label: 'Daily Hub' },
    { id: 'timeline', icon: CalendarIcon, label: 'Timeline' },
    { id: 'reflection', icon: Heart, label: 'Reflections' },
    { id: 'vision', icon: Map, label: 'Vision & Lists' },
  ];

  const userInitial = userData.username ? userData.username[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : '?');
  const displayName = userData.username || (user?.email ? user.email.split('@')[0] : 'Guest');

  if (!initialLoadDone) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'var(--cream)', fontFamily:'DM Sans, sans-serif', color:'var(--ink-30)', fontSize:14 }}>
          Loading SoulLog…
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display:'flex', height:'100vh', background:'var(--cream)', overflow:'hidden' }}>

        {/* Sidebar */}
        <aside className="sl-sidebar">
          <div style={{ padding:'28px 20px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ color:'var(--cream)' }}><LogoMark size={30} /></div>
              <span className="font-serif" style={{ fontSize:22, fontWeight:700, color:'var(--cream)', letterSpacing:'-0.02em' }}>SoulLog</span>
            </div>
            <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(250,248,245,0.3)', marginLeft:40 }}>write what your soul feels</p>
          </div>

          <div style={{ padding:'4px 12px', flex:1 }}>
            {navItems.map(item => (
              <button key={item.id} className={`sl-nav-item ${currentTab === item.id ? 'active' : ''}`} onClick={() => setCurrentTab(item.id)}>
                <item.icon className="icon" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Profile block */}
          <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(250,248,245,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => setShowAuthModal(true)}>
              <div style={{
                width:38, height:38, borderRadius:'50%',
                background:'rgba(124,154,130,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'var(--cream)', fontWeight:700, fontSize:16, flexShrink:0
              }}>{userInitial}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <input
                  type="text"
                  value={userData.username || ''}
                  onChange={e => { e.stopPropagation(); setUserData(p => ({...p, username: e.target.value})); }}
                  onClick={e => e.stopPropagation()}
                  placeholder="Your name…"
                  style={{ background:'none', border:'none', outline:'none', color:'var(--cream)', fontSize:13, fontWeight:600, width:'100%', fontFamily:'DM Sans, sans-serif' }}
                />
                <div style={{ fontSize:10, color:'rgba(250,248,245,0.35)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:1 }}>
                  {user?.email ? user.email : 'Guest Mode'}
                </div>
              </div>
            </div>
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(250,248,245,0.25)' }}>
              {isSyncing
                ? <><Cloud size={12} style={{ color:'var(--sage-light)' }} /> Syncing…</>
                : <><CloudOff size={12} /> Cloud Ready</>}
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="mobile-nav" style={{ position:'fixed', top:0, left:0, right:0, zIndex:30, background:'var(--ink)', padding:'12px 16px', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--cream)' }}>
            <LogoMark size={22} />
            <span className="font-serif" style={{ fontSize:16, fontWeight:700, color:'var(--cream)' }}>SoulLog</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <select value={currentTab} onChange={e => setCurrentTab(e.target.value)}
              style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 10px', color:'var(--cream)', fontSize:13, fontWeight:600, outline:'none', cursor:'pointer' }}>
              {navItems.map(i => <option key={i.id} value={i.id} style={{ color:'var(--ink)' }}>{i.label}</option>)}
            </select>
            
            {/* Added Profile Avatar for Mobile */}
            <button 
              onClick={() => setShowAuthModal(true)}
              style={{
                width:32, height:32, borderRadius:'50%',
                background:'rgba(124,154,130,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'var(--cream)', fontWeight:700, fontSize:14, flexShrink:0, border: 'none', cursor: 'pointer'
              }}
            >
              {userInitial}
            </button>
          </div>
        </div>

        {/* Main */}
        <main style={{ flex:1, overflowY:'auto', paddingTop:0 }}>
          <div className="main-container" style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px 80px' }}>
            {currentTab === 'daily' && <DailyHubView userData={userData} setUserData={setUserData} today={today} dayNames={dayNames} monthNames={monthNames} todayKey={todayKey} />}
            {currentTab === 'timeline' && <TimelineView userData={userData} setUserData={setUserData} initialYear={currentYear} initialMonth={currentMonth} currentDate={currentDate} monthNames={monthNames} todayKey={todayKey} />}
            {currentTab === 'reflection' && <ReflectionView userData={userData} setUserData={setUserData} today={today} currentMonth={currentMonth} currentYear={currentYear} />}
            {currentTab === 'vision' && <VisionBoardView userData={userData} setUserData={setUserData} />}
          </div>
        </main>

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth:400 }}>
              <div className="modal-header">
                <span className="font-serif" style={{ fontSize:18, fontWeight:700 }}>Account</span>
                <button onClick={() => setShowAuthModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)' }}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ padding:'28px 24px' }}>
                {!user?.email ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'flex', gap:0, borderRadius:8, overflow:'hidden', border:'1px solid var(--ink-10)', marginBottom:4 }}>
                      {['Log In','Sign Up'].map((label, i) => (
                        <button key={label} onClick={() => setIsSigningUp(!!i)}
                          style={{ flex:1, padding:'9px', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'DM Sans, sans-serif', transition:'all 0.15s',
                            background: (isSigningUp === !!i) ? 'var(--ink)' : 'var(--paper)',
                            color: (isSigningUp === !!i) ? 'var(--cream)' : 'var(--ink-60)' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {isSigningUp && (
                      <div>
                        <div className="section-label" style={{ marginBottom:6 }}>Name</div>
                        <input className="sl-input" type="text" value={authUsername} onChange={e => setAuthUsername(e.target.value)} placeholder="Your name" />
                      </div>
                    )}
                    <div>
                      <div className="section-label" style={{ marginBottom:6 }}>Email</div>
                      <input className="sl-input" type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div>
                      <div className="section-label" style={{ marginBottom:6 }}>Password</div>
                      <input className="sl-input" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    {authError && <p style={{ fontSize:12, color:' var(--rose)', fontWeight:500 }}>{authError}</p>}
                    <button className="sl-btn sl-btn-primary" onClick={isSigningUp ? handleSignup : handleLogin}
                      disabled={isAuthLoading || !authEmail || !authPassword}
                      style={{ width:'100%', justifyContent:'center', padding:'12px' }}>
                      {isAuthLoading ? 'Processing…' : (isSigningUp ? 'Create Account' : 'Log In')}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:20, alignItems:'center' }}>
                    <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--sage-pale)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, color:'var(--sage)' }}>{userInitial}</div>
                    <div style={{ width: '100%' }}>
                      <div className="section-label" style={{ marginBottom:6, textAlign: 'left', color: 'var(--ink)' }}>Display Name</div>
                      <input
                        className="sl-input"
                        type="text"
                        value={userData.username || ''}
                        onChange={e => setUserData(p => ({...p, username: e.target.value}))}
                        placeholder="Your name…"
                        style={{ textAlign: 'center', fontWeight: 600 }}
                      />
                      <div style={{ fontSize:12, color:'var(--ink-60)', marginTop:8 }}>{user?.email || 'Guest Mode'}</div>
                    </div>
                    <button className="sl-btn sl-btn-primary" onClick={handleLogout} style={{ width:'100%', justifyContent:'center', padding:'12px' }}>Log Out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================
   DAILY HUB
   ========================================= */
function DailyHubView({ userData, setUserData, today, dayNames, monthNames, todayKey }) {
  const [newPriority, setNewPriority] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [new75Habit, setNew75Habit] = useState('');

  const todayData = userData.calendarData[todayKey] || { journal:'', priorities:[], habitCompletion:{}, gratitude:['','',''] };

  const updateToday = (updates) => setUserData(prev => ({
    ...prev,
    calendarData: { ...prev.calendarData, [todayKey]: { ...(prev.calendarData[todayKey] || { events:[], priorities:[], habitCompletion:{} }), ...updates } }
  }));

  const togglePriority = (id) => updateToday({ priorities: todayData.priorities.map(p => p.id === id ? {...p, done:!p.done} : p) });
  const addPriority = () => { if(newPriority.trim()) { updateToday({ priorities:[...(todayData.priorities||[]), {id:Date.now(),text:newPriority,done:false}] }); setNewPriority(''); }};
  const deletePriority = (id) => updateToday({ priorities: todayData.priorities.filter(p => p.id !== id) });
  const toggleHabit = (id) => updateToday({ habitCompletion:{...todayData.habitCompletion,[id]:!todayData.habitCompletion[id]} });
  const addHabit = () => { if(newHabit.trim()) { setUserData(p => ({...p, habitsList:[...p.habitsList,{id:Date.now(),title:newHabit}]})); setNewHabit(''); }};
  const deleteHabit = (id) => setUserData(p => ({...p, habitsList:p.habitsList.filter(h=>h.id!==id)}));

  const toggle75HardItem = (hIdx, dIdx) => setUserData(prev => {
    const newHabits = [...prev.hard75Habits];
    const newProgress = [...newHabits[hIdx].progress];
    newProgress[dIdx] = !newProgress[dIdx];
    newHabits[hIdx] = {...newHabits[hIdx], progress:newProgress};
    return {...prev, hard75Habits:newHabits};
  });
  const add75Habit = () => { if(new75Habit.trim()) { setUserData(p => ({...p, hard75Habits:[...p.hard75Habits,{id:Date.now(),title:new75Habit,progress:Array(75).fill(false)}]})); setNew75Habit(''); }};
  const delete75Habit = (id) => setUserData(p => ({...p, hard75Habits:p.hard75Habits.filter(h=>h.id!==id)}));

  const endDateObj = new Date(new Date(userData.hard75StartDate).getTime() + 74*86400000);
  const doneCount = userData.habitsList.filter(h => todayData.habitCompletion[h.id]).length;

  const gratitude = todayData.gratitude || ['', '', ''];
  const updateGratitude = (idx, val) => {
    const next = [...gratitude];
    next[idx] = val;
    updateToday({ gratitude: next });
  };
  const gratitudeFilled = gratitude.filter(g => g.trim()).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
      {/* Header */}
      <div className="animate-up">
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-30)', marginBottom:8 }}>
          {dayNames[today.getDay()]} · {monthNames[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
        </div>
        <h1 className="font-serif" style={{ fontSize:38, fontWeight:700, color:'var(--ink)', lineHeight:1.15, letterSpacing:'-0.02em' }}>
          {userData.username ? `Good to see you, ${userData.username}.` : 'Welcome to your space.'}
        </h1>
      </div>

      <div className="layout-grid layout-sidebar-right">
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Journal */}
          <div className="sl-card animate-up-delay-1">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <BookOpen size={16} style={{ color:'var(--sage)' }} />
              <span style={{ fontWeight:700, fontSize:15 }}>Daily Braindump</span>
            </div>
            <textarea
              className="sl-input sl-textarea"
              value={todayData.journal || ''}
              onChange={e => updateToday({journal:e.target.value})}
              placeholder="What's on your mind? Write freely…"
              style={{ width:'100%', height:140 }}
            />
          </div>

          {/* Priorities */}
          <div className="sl-card animate-up-delay-2">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <ListTodo size={16} style={{ color:'var(--sage)' }} />
              <span style={{ fontWeight:700, fontSize:15 }}>Priorities & Planner</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {(todayData.priorities||[]).map(task => (
                <div key={task.id} className="priority-row" style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="checkbox" checked={task.done} onChange={() => togglePriority(task.id)} />
                  <span style={{ flex:1, fontSize:14, color: task.done ? 'var(--ink-30)' : 'var(--ink)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                  <button onClick={() => deletePriority(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)', padding:4, opacity:0 }}
                    onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:8, paddingTop:12, borderTop:'1px solid var(--ink-05)' }}>
                <input className="sl-input" value={newPriority} onChange={e => setNewPriority(e.target.value)} onKeyDown={e => e.key==='Enter' && addPriority()} placeholder="Add a priority…" style={{ flex:1 }} />
                <button className="sl-btn sl-btn-sage" onClick={addPriority} style={{ padding:'10px 14px' }}><Plus size={16} /></button>
              </div>
            </div>
          </div>

          {/* Gratitude Jar */}
          <div className="sl-card animate-up-delay-3" style={{
            background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF8E6 100%)',
            border: '1px solid rgba(196,163,90,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* decorative jar silhouette */}
            <div style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', opacity:0.07, pointerEvents:'none', fontSize:80, lineHeight:1 }}>🫙</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Sparkles size={16} style={{ color:'var(--gold)' }} />
                <span style={{ fontWeight:700, fontSize:15 }}>Gratitude Jar</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color: gratitudeFilled === 3 ? 'var(--gold)' : 'var(--ink-30)',
                background: gratitudeFilled === 3 ? 'rgba(196,163,90,0.15)' : 'var(--ink-05)',
                padding:'3px 10px', borderRadius:20, transition:'all 0.3s' }}>
                {gratitudeFilled === 3 ? '✨ Complete' : `${gratitudeFilled}/3`}
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { placeholder: 'One thing that made you smile today…', prefix: '01' },
                { placeholder: "Something you're thankful for right now…", prefix: '02' },
                { placeholder: 'A small win or moment of goodness…', prefix: '03' },
              ].map(({ placeholder, prefix }, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'rgba(196,163,90,0.5)', letterSpacing:'0.06em', flexShrink:0, width:20, textAlign:'right' }}>{prefix}</span>
                  <div style={{ flex:1, position:'relative' }}>
                    <input
                      className="sl-input"
                      value={gratitude[idx]}
                      onChange={e => updateGratitude(idx, e.target.value)}
                      placeholder={placeholder}
                      style={{
                        background: gratitude[idx].trim() ? 'rgba(196,163,90,0.08)' : 'rgba(255,255,255,0.7)',
                        border: `1px solid ${gratitude[idx].trim() ? 'rgba(196,163,90,0.35)' : 'rgba(196,163,90,0.15)'}`,
                        fontSize:13,
                        transition:'all 0.2s',
                      }}
                    />
                    {gratitude[idx].trim() && (
                      <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'var(--gold)', fontSize:14 }}>✦</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {gratitudeFilled === 3 && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(196,163,90,0.12)', borderRadius:10, border:'1px solid rgba(196,163,90,0.2)', fontSize:12, color:'rgba(100,80,20,0.8)', fontWeight:500, fontStyle:'italic' }}>
                "Gratitude turns what we have into enough." — Beautiful, keep going. 🌿
              </div>
            )}
          </div>
        </div>

        {/* Right: Habits + 75 Hard */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Habits */}
          <div className="sl-card sl-card-sage animate-up-delay-1">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Target size={16} style={{ color:'var(--sage)' }} />
                <span style={{ fontWeight:700, fontSize:15 }}>Daily Habits</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--sage)', background:'rgba(124,154,130,0.2)', padding:'3px 10px', borderRadius:20 }}>
                {doneCount}/{userData.habitsList.length}
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {userData.habitsList.map(habit => {
                const isDone = todayData.habitCompletion[habit.id] || false;
                return (
                  <div key={habit.id} className="habit-row" onClick={() => toggleHabit(habit.id)}>
                    <div className={`check-circle ${isDone ? 'done' : ''}`}>
                      {isDone && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <span style={{ flex:1, fontSize:13, fontWeight:500, color: isDone ? 'var(--ink-30)' : 'var(--ink)', textDecoration: isDone ? 'line-through' : 'none' }}>{habit.title}</span>
                    <button onClick={e => { e.stopPropagation(); deleteHabit(habit.id); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)', padding:2 }}><X size={12} /></button>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(124,154,130,0.2)' }}>
              <input className="sl-input" value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key==='Enter' && addHabit()} placeholder="New habit…" style={{ flex:1, fontSize:13, padding:'8px 12px' }} />
              <button className="sl-btn sl-btn-sage" onClick={addHabit} style={{ padding:'8px 12px' }}><Plus size={15} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* 75 Hard - Full width */}
      <div className="hard75-wrapper" style={{ background:'var(--ink)', borderRadius:20, padding:28, overflow:'hidden', position:'relative', maxWidth: '100%' }}>
        <div style={{ position:'absolute', top:-20, right:-20, opacity:0.04 }}>
          <Target size={160} color="white" />
        </div>
        <div className="hard75-header-container" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(250,248,245,0.4)', marginBottom:4 }}>Challenge</div>
            <h3 className="font-serif" style={{ fontSize:22, fontWeight:700, color:'var(--cream)', letterSpacing:'-0.01em' }}>75 Hard Tracker</h3>
            <div style={{ fontSize:12, color:'rgba(250,248,245,0.45)', marginTop:4, display:'flex', alignItems:'center', gap:8 }}>
              <input type="date" value={userData.hard75StartDate} onChange={e => setUserData(p => ({...p,hard75StartDate:e.target.value}))}
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'3px 8px', color:'var(--cream)', fontSize:12, outline:'none', cursor:'pointer' }} />
              <span>→ {endDateObj.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-start' }}>
            {userData.hard75Habits.map(h => {
              const done = h.progress.filter(Boolean).length;
              const streak = (() => { let s=0; for(let i=h.progress.length-1;i>=0&&h.progress[i];i--)s++; return s; })();
              return (
                <div key={h.id} className="hard75-summary-block" style={{ background:'rgba(255,255,255,0.07)', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
                  <div className="val" style={{ fontSize:15, fontWeight:700, color:'var(--cream)' }}>{done}</div>
                  <div className="lbl" style={{ fontSize:9, color:'rgba(250,248,245,0.4)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginTop:1 }}>done</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ overflowX:'auto', paddingBottom:8, WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse:'collapse', minWidth:'max-content', width:'100%' }}>
            <thead>
              <tr>
                <th className="hard75-habit-col" style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, color:'rgba(250,248,245,0.35)', letterSpacing:'0.06em', textTransform:'uppercase', width:180, position:'sticky', left:0, background:'var(--ink)', zIndex:2 }}>Habit</th>
                {Array.from({length:75}).map((_,i) => (
                  <th key={i} className="hard75-th" style={{ padding:'4px 2px', fontSize:9, fontWeight:700, color:'rgba(250,248,245,0.3)', textAlign:'center', minWidth:30 }}>
                    {(i+1)%5===0 ? i+1 : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userData.hard75Habits.map((habit, hIdx) => {
                const maxStreak = (() => { let max=0,cur=0; habit.progress.forEach(d => { if(d){cur++;if(cur>max)max=cur;}else cur=0; }); return max; })();
                const totalTicks = habit.progress.filter(Boolean).length;
                return (
                  <tr key={habit.id}>
                    <td className="hard75-habit-col" style={{ padding:'6px 12px', position:'sticky', left:0, background:'var(--ink)', zIndex:2 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="hard75-habit-title" style={{ fontSize:12, fontWeight:600, color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{habit.title}</div>
                          <div className="hard75-habit-badges" style={{ display:'flex', gap:6, marginTop:3 }}>
                            <span className="badge badge-streak" style={{ fontSize:9, padding:'2px 4px' }}>🔥 {maxStreak}</span>
                            <span className="badge badge-count" style={{ fontSize:9, padding:'2px 4px' }}>{totalTicks}/75</span>
                          </div>
                        </div>
                        <button onClick={() => delete75Habit(habit.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(250,248,245,0.25)', padding:4, flexShrink: 0 }}><X size={12} /></button>
                      </div>
                    </td>
                    {habit.progress.map((isDone, dIdx) => (
                      <td key={dIdx} style={{ padding:'6px 2px', textAlign:'center' }}>
                        <div className={`hard75-cell ${isDone ? 'done' : ''}`} onClick={() => toggle75HardItem(hIdx, dIdx)}>
                          {isDone && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:20, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <input value={new75Habit} onChange={e => setNew75Habit(e.target.value)} onKeyDown={e => e.key==='Enter' && add75Habit()}
            placeholder="Add custom 75 Hard habit…"
            style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'9px 14px', fontSize:13, color:'var(--cream)', outline:'none', fontFamily:'DM Sans, sans-serif' }} />
          <button onClick={add75Habit} style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, padding:'9px 14px', cursor:'pointer', color:'var(--cream)' }}><Plus size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   TIMELINE
   ========================================= */
function TimelineView({ userData, setUserData, initialYear, initialMonth, currentDate, monthNames, todayKey }) {
  const [displayYear, setDisplayYear] = useState(initialYear);
  const [displayMonth, setDisplayMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(null);
  const [draftEvent, setDraftEvent] = useState('');
  const [draftSticker, setDraftSticker] = useState('');
  const [draftIsPeriod, setDraftIsPeriod] = useState(false);
  const [showMonthSummary, setShowMonthSummary] = useState(false);

  const prevMonth = () => { if(displayMonth===0){setDisplayMonth(11);setDisplayYear(y=>y-1);}else setDisplayMonth(m=>m-1); };
  const nextMonth = () => { if(displayMonth===11){setDisplayMonth(0);setDisplayYear(y=>y+1);}else setDisplayMonth(m=>m+1); };

  const daysInMonth = new Date(displayYear, displayMonth+1, 0).getDate();
  const firstDayOffset = new Date(displayYear, displayMonth, 1).getDay();

  const getKey = (day) => `${displayYear}-${displayMonth}-${day}`;

  const openModal = (day) => {
    setSelectedDay(day);
    const data = userData.calendarData[getKey(day)] || {};
    setDraftSticker(data.sticker || '');
    setDraftIsPeriod(data.isPeriod || false);
    setDraftEvent('');
  };

  const handleSave = () => {
    const key = getKey(selectedDay);
    setUserData(prev => {
      const dayInfo = prev.calendarData[key] || { events:[] };
      const updatedEvents = draftEvent.trim() ? [...(dayInfo.events||[]), draftEvent.trim()] : (dayInfo.events||[]);
      return { ...prev, calendarData: { ...prev.calendarData, [key]: { ...dayInfo, sticker:draftSticker.trim(), events:updatedEvents, isPeriod:draftIsPeriod } } };
    });
    setSelectedDay(null);
  };

  const monthKeys = Object.keys(userData.calendarData).filter(k => k.startsWith(`${displayYear}-${displayMonth}-`));
  const journalCount = monthKeys.filter(k => userData.calendarData[k]?.journal?.trim()?.length > 0).length;
  const relevantGoals = userData.monthlyGoals.filter(g => g.month===displayMonth && g.year===displayYear);
  const relevantMoments = userData.moments.filter(m => { const d=new Date(m.date); return d.getMonth()===displayMonth && d.getFullYear()===displayYear; });

  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }} className="animate-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <h1 className="font-serif" style={{ fontSize:38, fontWeight:700, letterSpacing:'-0.02em' }}>Timeline</h1>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', background:'var(--white)', borderRadius:10, border:'1px solid var(--ink-10)', overflow:'hidden' }}>
            <button onClick={prevMonth} style={{ padding:'8px 12px', background:'none', border:'none', cursor:'pointer', color:'var(--ink-60)', display:'flex', alignItems:'center' }}><ChevronLeft size={18}/></button>
            <div style={{ padding:'8px 16px', fontWeight:700, fontSize:14, color:'var(--ink)', minWidth:160, textAlign:'center', borderLeft:'1px solid var(--ink-05)', borderRight:'1px solid var(--ink-05)' }}>
              {monthNames[displayMonth]} {displayYear}
            </div>
            <button onClick={nextMonth} style={{ padding:'8px 12px', background:'none', border:'none', cursor:'pointer', color:'var(--ink-60)', display:'flex', alignItems:'center' }}><ChevronRight size={18}/></button>
          </div>
          <button className="sl-btn sl-btn-ghost" onClick={() => setShowMonthSummary(true)}><BarChart2 size={14}/> Summary</button>
          <button className="sl-btn sl-btn-primary" onClick={() => { setDisplayMonth(initialMonth); setDisplayYear(initialYear); }}>Today</button>
        </div>
      </div>

      <div style={{ background:'var(--white)', borderRadius:20, border:'1px solid var(--ink-10)', overflow:'hidden' }}>
        {/* Day labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'var(--paper)', borderBottom:'1px solid var(--ink-10)' }}>
          {dayLabels.map(d => <div key={d} style={{ padding:'12px 0', textAlign:'center', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-30)' }}>{d}</div>)}
        </div>
        {/* Calendar cells */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px', background:'var(--ink-05)' }}>
          {Array.from({length:firstDayOffset}).map((_,i) => <div key={`b${i}`} style={{ background:'var(--cream)', minHeight:90 }} />)}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(day => {
            const key = getKey(day);
            const data = userData.calendarData[key] || {};
            const isToday = key === todayKey;
            return (
              <div key={day} className={`cal-day ${data.isPeriod ? 'period' : ''}`} onClick={() => openModal(day)}
                style={{ background: data.isPeriod ? '#FFF0EE' : 'var(--white)', outline: isToday ? '2px solid var(--sage)' : 'none', outlineOffset:'-2px', zIndex: isToday ? 1 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className={`cal-day-num ${isToday?'today':''} ${data.isPeriod&&!isToday?'period-day':''}`}>{day}</span>
                  {data.sticker && <span style={{ fontSize:16 }}>{data.sticker}</span>}
                </div>
                <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:2 }}>
                  {(data.events||[]).slice(0,2).map((ev,i) => (
                    <div key={i} style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background: data.isPeriod ? 'rgba(196,117,106,0.15)' : 'var(--sage-pale)', color: data.isPeriod ? 'var(--rose)' : 'var(--sage)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev}</div>
                  ))}
                  <div style={{ display:'flex', gap:3, marginTop:2 }}>
                    {data.journal && <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--lavender)' }} title="Journal"/>}
                    {data.gratitude?.some(g=>g?.trim()) && <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--gold)' }} title="Gratitude"/>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Summary Modal */}
      {showMonthSummary && (
        <div className="modal-overlay" onClick={() => setShowMonthSummary(false)}>
          <div className="modal-box" style={{ maxWidth:580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <BarChart2 size={18} style={{ color:'var(--sage)' }} />
                <span className="font-serif" style={{ fontSize:18, fontWeight:700 }}>{monthNames[displayMonth]} {displayYear}</span>
              </div>
              <button onClick={() => setShowMonthSummary(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)' }}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div className="stats-grid">
                <div className="stat-block">
                  <div style={{ fontSize:32, fontWeight:700, color:'var(--ink)' }}>{journalCount}</div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-30)', marginTop:4 }}>Journal Days</div>
                </div>
                <div className="stat-block">
                  <div style={{ fontSize:32, fontWeight:700, color:'var(--sage)' }}>{relevantGoals.filter(g=>g.done).length}</div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-30)', marginTop:4 }}>Goals Done</div>
                </div>
                <div className="stat-block">
                  <div style={{ fontSize:32, fontWeight:700, color:'var(--lavender)' }}>{relevantMoments.length}</div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-30)', marginTop:4 }}>Memories</div>
                </div>
              </div>
              <div className="summary-grid">
                <div>
                  <div className="section-label" style={{ marginBottom:10 }}>Goals This Month</div>
                  {relevantGoals.length > 0
                    ? relevantGoals.map(g => (
                        <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                          {g.done ? <CheckCircle2 size={14} style={{ color:'var(--sage)', flexShrink:0 }}/> : <Circle size={14} style={{ color:'var(--ink-30)', flexShrink:0 }}/>}
                          <span style={{ fontSize:13, color: g.done ? 'var(--ink-30)' : 'var(--ink)', textDecoration: g.done ? 'line-through' : 'none' }}>{g.text}</span>
                        </div>))
                    : <p style={{ fontSize:12, color:'var(--ink-30)', fontStyle:'italic' }}>No goals set.</p>}
                </div>
                <div>
                  <div className="section-label" style={{ marginBottom:10 }}>Memories</div>
                  {relevantMoments.length > 0
                    ? <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {relevantMoments.map(m => <img key={m.id} src={m.url} style={{ width:52, height:52, objectFit:'cover', borderRadius:8, border:'1px solid var(--ink-10)' }} title={m.caption}/>)}
                      </div>
                    : <p style={{ fontSize:12, color:'var(--ink-30)', fontStyle:'italic' }}>No photos this month.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Modal */}
      {selectedDay && (() => {
        const key = getKey(selectedDay);
        const dayData = userData.calendarData[key] || {};
        const selectedDateObj = new Date(displayYear, displayMonth, selectedDay);
        const startDateObj = new Date(userData.hard75StartDate);
        const hard75DayIndex = Math.floor((selectedDateObj - startDateObj) / 86400000);
        const is75Active = hard75DayIndex >= 0 && hard75DayIndex < 75;
        return (
          <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="font-serif" style={{ fontSize:18, fontWeight:700 }}>{monthNames[displayMonth]} {selectedDay}, {displayYear}</span>
                <button onClick={() => setSelectedDay(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)' }}><X size={18}/></button>
              </div>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* Snapshot */}
                <div style={{ background:'var(--paper)', borderRadius:12, padding:16 }}>
                  <div className="section-label" style={{ marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                    <BookOpen size={12} style={{ color:'var(--sage)' }} /> Snapshot for the Day
                  </div>
                  {(dayData.journal || (dayData.gratitude && dayData.gratitude.some(g => g?.trim()))) ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {dayData.journal && <p style={{ fontStyle:'italic', fontSize:13, color:'var(--ink-60)', lineHeight:1.6, borderLeft:'2px solid var(--sage)', paddingLeft:12, margin:0 }}>"{dayData.journal}"</p>}
                      {dayData.gratitude?.some(g => g?.trim()) && (
                        <div style={{ background:'rgba(196,163,90,0.08)', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(196,163,90,0.15)' }}>
                          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(140,110,30,0.6)', marginBottom:6 }}>✦ Gratitude</div>
                          {(dayData.gratitude||[]).filter(g=>g?.trim()).map((g,i) => (
                            <div key={i} style={{ fontSize:12, color:'rgba(100,80,20,0.8)', marginBottom:3 }}>· {g}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : <p style={{ fontSize:12, color:'var(--ink-30)', fontStyle:'italic' }}>No entry saved.</p>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
                    <div>
                      <div className="section-label" style={{ marginBottom:8 }}>Priorities</div>
                      {dayData.priorities?.length > 0 ? dayData.priorities.map(p => (
                        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          {p.done ? <CheckCircle2 size={12} style={{ color:'var(--sage)' }}/> : <Circle size={12} style={{ color:'var(--ink-30)' }}/>}
                          <span style={{ fontSize:11, color: p.done ? 'var(--ink-30)' : 'var(--ink)', textDecoration: p.done ? 'line-through' : 'none' }}>{p.text}</span>
                        </div>)) : <span style={{ fontSize:11, color:'var(--ink-30)' }}>None logged</span>}
                    </div>
                    <div>
                      <div className="section-label" style={{ marginBottom:8 }}>Habits</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {userData.habitsList.map(h => {
                          const done = (dayData.habitCompletion||{})[h.id];
                          return <span key={h.id} style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:6, background: done ? 'var(--sage-pale)' : 'var(--ink-05)', color: done ? 'var(--sage)' : 'var(--ink-30)', border: `1px solid ${done ? 'rgba(124,154,130,0.3)' : 'transparent'}` }}>{h.title}{done?' ✓':''}</span>
                        })}
                      </div>
                    </div>
                  </div>
                  {is75Active && (
                    <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--ink-10)' }}>
                      <div className="section-label" style={{ marginBottom:8 }}>75 Hard — Day {hard75DayIndex+1}</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {userData.hard75Habits.map((h,i) => {
                          const done = h.progress[hard75DayIndex];
                          return <span key={i} style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:6, background: done ? 'var(--sage-pale)' : 'var(--ink-05)', color: done ? 'var(--sage)' : 'var(--ink-30)' }}>{h.title}{done?' ✓':''}</span>
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan day */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div className="section-label">Plan & Mark Day</div>
                  <input className="sl-input" value={draftEvent} onChange={e => setDraftEvent(e.target.value)} placeholder="Add an event or note…" />
                  <input className="sl-input" maxLength={2} value={draftSticker} onChange={e => setDraftSticker(e.target.value)} placeholder="Emoji sticker (e.g. ✈️)" />
                  <label style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#FFF5F4', borderRadius:10, border:'1px solid rgba(196,117,106,0.2)', cursor:'pointer' }}>
                    <Droplets size={16} style={{ color:'var(--rose)' }} />
                    <span style={{ flex:1, fontSize:14, fontWeight:600 }}>Mark as Period</span>
                    <input type="checkbox" checked={draftIsPeriod} onChange={e => setDraftIsPeriod(e.target.checked)} style={{ borderColor:'var(--rose)' }} />
                  </label>
                  <button className="sl-btn sl-btn-sage" onClick={handleSave} style={{ width:'100%', justifyContent:'center', padding:'12px' }}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* =========================================
   REFLECTIONS
   ========================================= */
function ReflectionView({ userData, setUserData, today, currentMonth, currentYear }) {
  const [isAddingMoment, setIsAddingMoment] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newCaption, setNewCaption] = useState('');
  const [isWritingLetter, setIsWritingLetter] = useState(false);
  const [draftLetterTitle, setDraftLetterTitle] = useState('');
  const [draftLetterContent, setDraftLetterContent] = useState('');
  const [draftLetterDate, setDraftLetterDate] = useState('');
  const [viewingLetter, setViewingLetter] = useState(null);
  const [newGoal, setNewGoal] = useState('');
  const todayStr = today.toISOString().split('T')[0];

  const [momentUploading, setMomentUploading] = useState(false);
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMomentUploading(true);
    try {
      // Send straight to Cloudinary!
      const url = await uploadImageToCloudinary(file);
      setNewImageFile(url);
    } catch (err) { 
      console.error("Moment upload failed:", err); 
      alert("Failed to upload image.");
    }
    setMomentUploading(false);
  };
  const handleAddMoment = () => {
    if(newImageFile) {
      setUserData(p => ({...p, moments:[{id:Date.now(),url:newImageFile,caption:newCaption||'A great memory',date:today.toISOString()},...p.moments]}));
      setIsAddingMoment(false); setNewImageFile(null); setNewCaption('');
    }
  };
  const handleSaveLetter = () => {
    if(draftLetterTitle.trim()&&draftLetterContent.trim()&&draftLetterDate) {
      setUserData(p => ({...p, letters:[...p.letters,{id:Date.now(),title:draftLetterTitle,content:draftLetterContent,openDate:draftLetterDate,createdAt:todayStr}]}));
      setIsWritingLetter(false); setDraftLetterTitle(''); setDraftLetterContent(''); setDraftLetterDate('');
    }
  };
  const toggleGoal = (id) => setUserData(p => ({...p, monthlyGoals:p.monthlyGoals.map(g => g.id===id?{...g,done:!g.done}:g)}));
  const deleteGoal = (id) => setUserData(p => ({...p, monthlyGoals:p.monthlyGoals.filter(g=>g.id!==id)}));
  const addGoal = () => { if(newGoal.trim()){setUserData(p=>({...p,monthlyGoals:[...p.monthlyGoals,{id:Date.now(),text:newGoal,done:false,month:currentMonth,year:currentYear}]}));setNewGoal('');} };
  const currentMonthGoals = userData.monthlyGoals.filter(g=>g.month===currentMonth&&g.year===currentYear);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:36 }} className="animate-up">
      <div>
        <h1 className="font-serif" style={{ fontSize:38, fontWeight:700, letterSpacing:'-0.02em' }}>Reflection Room</h1>
        <p style={{ color:'var(--ink-60)', marginTop:6, fontSize:15 }}>Assess your month, remember moments, and speak to your future self.</p>
      </div>

      {/* Moments */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ImageIcon size={16} style={{ color:'var(--sage)' }} />
            <span style={{ fontWeight:700, fontSize:16 }}>Highlights & Moments</span>
          </div>
          {!isAddingMoment && <button className="sl-btn sl-btn-sage" onClick={() => setIsAddingMoment(true)} style={{ fontSize:12 }}><Plus size={14}/> Add Memory</button>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:14 }}>
          {isAddingMoment && (
            <div style={{ aspectRatio:'1', background:'var(--paper)', border:'1.5px dashed var(--ink-10)', borderRadius:16, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ flex:1, borderRadius:10, overflow:'hidden', position:'relative', background:'var(--white)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'1px solid var(--ink-10)' }}>
                {newImageFile ? <img src={newImageFile} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> :
                  <div style={{ textAlign:'center', color:'var(--ink-30)' }}><Upload size={18} style={{ margin:'0 auto 4px', color:'var(--sage)' }}/><div style={{ fontSize:10, fontWeight:700 }}>Select</div></div>}
                <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}/>
              </div>
              <input className="sl-input" value={newCaption} onChange={e => setNewCaption(e.target.value)} placeholder="Caption…" style={{ padding:'6px 10px', fontSize:12 }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button className="sl-btn sl-btn-sage" onClick={handleAddMoment} disabled={!newImageFile} style={{ flex:1, justifyContent:'center', padding:'7px', fontSize:12 }}>Save</button>
                <button className="sl-btn sl-btn-ghost" onClick={() => {setIsAddingMoment(false);setNewImageFile(null);}} style={{ flex:1, justifyContent:'center', padding:'7px', fontSize:12 }}>Cancel</button>
              </div>
            </div>
          )}
          {userData.moments.map(m => (
            <div key={m.id} style={{ aspectRatio:'1', borderRadius:16, overflow:'hidden', position:'relative', background:'var(--paper)', border:'1px solid var(--ink-10)' }}
              onMouseEnter={e => { e.currentTarget.querySelector('.overlay').style.opacity=1; }}
              onMouseLeave={e => { e.currentTarget.querySelector('.overlay').style.opacity=0; }}>
              <img src={m.url} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              <div className="overlay" style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(28,25,23,0.85), transparent)', opacity:0, transition:'opacity 0.25s', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:12 }}>
                <p style={{ color:'white', fontSize:11, fontWeight:500, lineHeight:1.4 }}>{m.caption}</p>
                <button onClick={() => setUserData(p => ({...p,moments:p.moments.filter(x=>x.id!==m.id)}))}
                  style={{ position:'absolute', top:8, right:8, background:'rgba(220,50,50,0.8)', border:'none', borderRadius:6, padding:5, cursor:'pointer', color:'white', display:'flex' }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="layout-grid layout-halves">
        {/* Monthly Goals */}
        <div className="sl-card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ marginBottom:4 }}>
            <h3 style={{ fontWeight:700, fontSize:16 }}>Monthly Goals</h3>
            <p style={{ color:'var(--ink-30)', fontSize:13, marginTop:3 }}>Accomplish these by month's end.</p>
          </div>
          <div className="divider" />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, marginBottom:16 }}>
            {currentMonthGoals.length === 0 && <p style={{ fontSize:13, color:'var(--ink-30)', fontStyle:'italic', padding:'8px 0' }}>No goals set yet.</p>}
            {currentMonthGoals.map(goal => (
              <div key={goal.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:9, cursor:'pointer', transition:'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--paper)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <input type="checkbox" checked={goal.done} onChange={() => toggleGoal(goal.id)} />
                <span style={{ flex:1, fontSize:14, color: goal.done ? 'var(--ink-30)' : 'var(--ink)', textDecoration: goal.done ? 'line-through' : 'none' }}>{goal.text}</span>
                <button onClick={() => deleteGoal(goal.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)', padding:3 }}><X size={13}/></button>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input className="sl-input" value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key==='Enter' && addGoal()} placeholder="Add a goal…" style={{ flex:1 }}/>
            <button className="sl-btn sl-btn-sage" onClick={addGoal} style={{ padding:'10px 14px' }}><Plus size={16}/></button>
          </div>
        </div>

        {/* Time Capsule */}
        <div style={{ background:'linear-gradient(135deg, var(--lavender-pale) 0%, white 100%)', borderRadius:'var(--radius)', border:'1px solid rgba(155,143,189,0.25)', padding:24, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
          <Lock size={100} style={{ position:'absolute', top:-16, right:-16, color:'var(--lavender)', opacity:0.07 }}/>
          <h3 className="font-serif" style={{ fontWeight:700, fontSize:20, marginBottom:3 }}>Time Capsule</h3>
          <p style={{ color:'var(--ink-30)', fontSize:13, marginBottom:16 }}>Letters to your future self.</p>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, overflowY:'auto', maxHeight:200 }}>
            {userData.letters.map(letter => {
              const isLocked = letter.openDate > todayStr;
              return (
                <div key={letter.id} className={`letter-card ${isLocked ? 'locked' : 'unlocked'}`} onClick={() => !isLocked && setViewingLetter(letter)}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{letter.title}</div>
                    <div style={{ fontSize:10, color:'var(--ink-30)', marginTop:2, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Written {letter.createdAt}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, padding:'5px 10px', borderRadius:8, background: isLocked ? 'var(--ink-05)' : 'var(--lavender-pale)', color: isLocked ? 'var(--ink-30)' : 'var(--lavender)', whiteSpace:'nowrap', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
                    {isLocked ? <><Lock size={10}/> {letter.openDate}</> : <>✨ Read</>}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setIsWritingLetter(true)}
            style={{ marginTop:16, width:'100%', padding:'11px', border:'1.5px dashed rgba(155,143,189,0.4)', borderRadius:10, background:'rgba(155,143,189,0.08)', color:'var(--lavender)', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'DM Sans, sans-serif', transition:'background 0.15s' }}
            onMouseEnter={e => e.target.style.background='rgba(155,143,189,0.15)'}
            onMouseLeave={e => e.target.style.background='rgba(155,143,189,0.08)'}>
            <Plus size={15}/> Seal a New Letter
          </button>
        </div>
      </div>

      {/* Write Letter Modal */}
      {isWritingLetter && (
        <div className="modal-overlay" onClick={() => setIsWritingLetter(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><Lock size={16} style={{ color:'var(--lavender)' }}/><span style={{ fontWeight:700, fontSize:16 }}>Seal New Letter</span></div>
              <button onClick={() => setIsWritingLetter(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)' }}><X size={18}/></button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div><div className="section-label" style={{ marginBottom:6 }}>Letter Title</div><input className="sl-input" value={draftLetterTitle} onChange={e => setDraftLetterTitle(e.target.value)} placeholder="e.g. Note to my 30-year-old self"/></div>
              <div><div className="section-label" style={{ marginBottom:6 }}>Unlock Date</div><input className="sl-input" type="date" value={draftLetterDate} onChange={e => setDraftLetterDate(e.target.value)} min={todayStr}/></div>
              <div><div className="section-label" style={{ marginBottom:6 }}>Your Message</div><textarea className="sl-input sl-textarea" value={draftLetterContent} onChange={e => setDraftLetterContent(e.target.value)} placeholder="Write your thoughts freely…" style={{ height:140 }}/></div>
              <button className="sl-btn sl-btn-primary" onClick={handleSaveLetter} disabled={!draftLetterTitle||!draftLetterContent||!draftLetterDate} style={{ width:'100%', justifyContent:'center', padding:'12px' }}>Lock Away Letter</button>
            </div>
          </div>
        </div>
      )}

      {/* Read Letter Modal */}
      {viewingLetter && (
        <div className="modal-overlay" onClick={() => setViewingLetter(null)}>
          <div className="modal-box" style={{ background:'#FAF8F5', fontFamily:'Playfair Display, serif' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background:'#F0EDE6' }}>
              <div>
                <div className="font-serif" style={{ fontWeight:700, fontSize:18 }}>{viewingLetter.title}</div>
                <div style={{ fontSize:10, color:'var(--ink-30)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2, fontFamily:'DM Sans, sans-serif' }}>Written {viewingLetter.createdAt}</div>
              </div>
              <button onClick={() => setViewingLetter(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)' }}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <p className="font-serif" style={{ whiteSpace:'pre-wrap', lineHeight:1.9, fontSize:16, color:'var(--ink)', fontStyle:'italic' }}>{viewingLetter.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   VISION & LISTS
   ========================================= */
function VisionBoardView({ userData, setUserData }) {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [tripData, setTripData] = useState({ title:'', date:'', details:'' });
  const [newHobby, setNewHobby] = useState('');

  const saveSection = () => { if(newSectionTitle.trim()){setUserData(p=>({...p,customSections:[...p.customSections,{id:Date.now(),title:newSectionTitle,items:[]}]}));setNewSectionTitle('');setIsAddingSection(false);} };
  const saveTrip = () => { if(tripData.title){setUserData(p=>({...p,trips:[...p.trips,{id:Date.now(),...tripData}]}));setTripData({title:'',date:'',details:''});setIsAddingTrip(false);} };
  const deleteTrip = (id) => setUserData(p=>({...p,trips:p.trips.filter(t=>t.id!==id)}));
  const addHobby = () => { if(newHobby.trim()){setUserData(p=>({...p,hobbiesList:[...p.hobbiesList,{id:Date.now(),name:newHobby}]}));setNewHobby('');} };
  const deleteHobby = (id) => setUserData(p=>({...p,hobbiesList:p.hobbiesList.filter(h=>h.id!==id)}));

  const [visionUploading, setVisionUploading] = useState(false);
  const handleVisionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVisionUploading(true);
    try {
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file);
      
      // Save the URL to your existing Firebase UserData
      setUserData(prev => ({ ...prev, visionBoardImage: imageUrl }));
      
      alert("Vision Board updated!");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check your Cloudinary keys!");
    }
    setVisionUploading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }} className="animate-up">
      <div>
        <h1 className="font-serif" style={{ fontSize:38, fontWeight:700, letterSpacing:'-0.02em' }}>Vision & Lists</h1>
        <p style={{ color:'var(--ink-60)', marginTop:6, fontSize:15 }}>Things to do, places to see, and your personalized collections.</p>
      </div>

      {/* Vision Image — object-fit: contain so full image is always visible */}
      <div style={{
        width:'100%', height:320, borderRadius:20, overflow:'hidden', position:'relative',
        background: userData.visionBoardImage ? '#0D0D0D' : 'var(--paper)',
        border: '1px solid var(--ink-10)',
        cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}
        onMouseEnter={e => e.currentTarget.querySelector('.vision-overlay').style.opacity=1}
        onMouseLeave={e => e.currentTarget.querySelector('.vision-overlay').style.opacity=0}>
        {userData.visionBoardImage
          ? <img src={userData.visionBoardImage} alt="Vision Board"
              style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', transition:'transform 0.8s ease' }}
              onMouseEnter={e => e.target.style.transform='scale(1.02)'}
              onMouseLeave={e => e.target.style.transform='scale(1)'}
            />
          : <div style={{ textAlign:'center', color:'var(--ink-30)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌅</div>
              <div style={{ fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', fontSize:13 }}>Upload Your Vision Board</div>
              <div style={{ fontSize:12, marginTop:4 }}>The full image will be displayed</div>
            </div>}
        <div className="vision-overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', opacity:0, transition:'opacity 0.25s', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'relative' }}>
            <button style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:10, padding:'10px 20px', color:'white', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'DM Sans, sans-serif', backdropFilter:'blur(6px)' }}>
              {visionUploading ? 'Uploading…' : <><Upload size={15}/> Change Vision Board</>}
            </button>
            {!visionUploading && <input type="file" accept="image/*" onChange={handleVisionUpload} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}/>}
          </div>
        </div>
        {visionUploading && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ color:'white', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:16, height:16, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              Uploading to cloud…
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ columns:'1', columnGap:'20px' }} className="multi-col">
        <style>{`.multi-col { columns: 1; } @media(min-width:640px){.multi-col{columns:2;}} @media(min-width:900px){.multi-col{columns:3;}}`}</style>

        {/* Trips */}
        <div className="sl-card" style={{ breakInside:'avoid', marginBottom:20, overflow:'hidden', padding:0 }}>
          <div style={{ height:80, background:'var(--ink)', position:'relative', overflow:'hidden' }}>
            <img src="https://picsum.photos/seed/travel/800/300" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.45 }}/>
            <div style={{ position:'absolute', inset:0, padding:'20px 20px 0', display:'flex', alignItems:'flex-end', paddingBottom:16 }}>
              <h3 className="font-serif" style={{ color:'white', fontSize:16, fontWeight:700 }}>✈️ Upcoming Trips</h3>
            </div>
          </div>
          <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
            {userData.trips.map(trip => (
              <div key={trip.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:10, borderBottom:'1px solid var(--ink-05)' }}
                onMouseEnter={e => e.currentTarget.querySelector('.trip-del').style.opacity=1}
                onMouseLeave={e => e.currentTarget.querySelector('.trip-del').style.opacity=0}>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{trip.title}</div>
                  <div style={{ fontSize:11, color:'var(--ink-30)', marginTop:2 }}>{trip.date}{trip.details && ` · ${trip.details}`}</div>
                </div>
                <button className="trip-del" onClick={() => deleteTrip(trip.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--rose)', opacity:0, transition:'opacity 0.15s', padding:4 }}><Trash2 size={13}/></button>
              </div>
            ))}
            {isAddingTrip ? (
              <div style={{ background:'var(--paper)', borderRadius:10, padding:14, display:'flex', flexDirection:'column', gap:8 }}>
                <input className="sl-input" value={tripData.title} onChange={e=>setTripData({...tripData,title:e.target.value})} placeholder="Destination…" style={{ fontSize:13, padding:'8px 12px' }}/>
                <input className="sl-input" value={tripData.date} onChange={e=>setTripData({...tripData,date:e.target.value})} placeholder="Date (e.g. Aug 2026)" style={{ fontSize:13, padding:'8px 12px' }}/>
                <input className="sl-input" value={tripData.details} onChange={e=>setTripData({...tripData,details:e.target.value})} placeholder="Details…" style={{ fontSize:13, padding:'8px 12px' }}/>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="sl-btn sl-btn-sage" onClick={saveTrip} style={{ flex:1, justifyContent:'center', padding:'8px', fontSize:12 }}>Save</button>
                  <button className="sl-btn sl-btn-ghost" onClick={() => setIsAddingTrip(false)} style={{ flex:1, justifyContent:'center', padding:'8px', fontSize:12 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingTrip(true)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'var(--sage)', fontWeight:700, fontSize:13, padding:'8px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontFamily:'DM Sans, sans-serif' }}>
                <Plus size={14}/> Plan New Trip
              </button>
            )}
          </div>
        </div>

        {/* Skills & Hobbies */}
        <div className="sl-card" style={{ breakInside:'avoid', marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>🎨 Skills & Hobbies</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {userData.hobbiesList.map(h => (
              <span key={h.id} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'white', border:'1px solid rgba(124,154,130,0.3)', borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:600, color:'var(--ink)' }}
                onMouseEnter={e => e.currentTarget.querySelector('.h-del').style.opacity=1}
                onMouseLeave={e => e.currentTarget.querySelector('.h-del').style.opacity=0}>
                {h.name}
                <button className="h-del" onClick={() => deleteHobby(h.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--rose)', opacity:0, transition:'opacity 0.15s', padding:0, display:'flex' }}><X size={11}/></button>
              </span>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input className="sl-input" value={newHobby} onChange={e=>setNewHobby(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHobby()} placeholder="Add skill or hobby…" style={{ flex:1, fontSize:13 }}/>
            <button className="sl-btn sl-btn-sage" onClick={addHobby} style={{ padding:'10px 12px' }}><Plus size={15}/></button>
          </div>
        </div>

        {/* Bucket List */}
        <div className="sl-card" style={{ breakInside:'avoid', marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:15, marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--ink-10)' }}>✨ Life Bucket List</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {userData.bucketList.map(item => (
              <ListItem key={item.id} text={item.text} done={item.done}
                onToggle={() => setUserData(p=>({...p,bucketList:p.bucketList.map(i=>i.id===item.id?{...i,done:!i.done}:i)}))}
                onDelete={() => setUserData(p=>({...p,bucketList:p.bucketList.filter(i=>i.id!==item.id)}))} />
            ))}
          </div>
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--ink-05)' }}>
            <input className="sl-input" placeholder="Add to bucket list & press Enter…" style={{ fontSize:13 }}
              onKeyDown={e => { 
                if(e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if(val) {
                    setUserData(p => ({...p, bucketList: [...p.bucketList, {id: Date.now(), text: val, done: false}]}));
                    e.target.value = '';
                  }
                } 
              }}/>
          </div>
        </div>

        {/* Custom sections */}
        {userData.customSections.map(section => (
          <div key={section.id} className="sl-card" style={{ breakInside:'avoid', marginBottom:20, position:'relative' }}
            onMouseEnter={e => e.currentTarget.querySelector('.sec-del').style.opacity=1}
            onMouseLeave={e => e.currentTarget.querySelector('.sec-del').style.opacity=0}>
            <button className="sec-del" onClick={() => setUserData(p=>({...p,customSections:p.customSections.filter(s=>s.id!==section.id)}))}
              style={{ position:'absolute', top:14, right:14, background:'none', border:'none', cursor:'pointer', color:'var(--ink-30)', opacity:0, transition:'opacity 0.15s', padding:4 }}>
              <X size={14}/>
            </button>
            <h3 style={{ fontWeight:700, fontSize:15, marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--ink-10)', paddingRight:24, color: '#1C1917' }}>📌 {section.title}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {section.items.map(item => (
                <ListItem key={item.id} text={item.text} done={item.done}
                  onToggle={() => setUserData(p=>({...p,customSections:p.customSections.map(s=>s.id===section.id?{...s,items:s.items.map(i=>i.id===item.id?{...i,done:!i.done}:i)}:s)}))}
                  onDelete={() => setUserData(p=>({...p,customSections:p.customSections.map(s=>s.id===section.id?{...s,items:s.items.filter(i=>i.id!==item.id)}:s)}))} />
              ))}
            </div>
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--ink-05)' }}>
              <input className="sl-input" placeholder="Add item & press Enter…" style={{ fontSize:13 }}
                onKeyDown={e => { 
                  if(e.key === 'Enter') {
                    const val = e.target.value.trim();
                    if(val) {
                      setUserData(p => ({...p, customSections: p.customSections.map(s => s.id === section.id ? {...s, items: [...s.items, {id: Date.now(), text: val, done: false}]} : s)}));
                      e.target.value = '';
                    }
                  } 
                }}/>
            </div>
          </div>
        ))}

        {/* Add custom section */}
        {isAddingSection ? (
          <div className="sl-card" style={{ breakInside:'avoid', marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12, color: '#1C1917' }}>New List Name</div>
            <input className="sl-input" autoFocus value={newSectionTitle} onChange={e=>setNewSectionTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveSection()} placeholder="e.g. Books to Read" style={{ marginBottom:12, color: '#1C1917' }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button className="sl-btn sl-btn-primary" onClick={saveSection} style={{ flex:1, justifyContent:'center' }}>Save</button>
              <button className="sl-btn sl-btn-ghost" onClick={() => setIsAddingSection(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setIsAddingSection(true)} style={{ breakInside:'avoid', marginBottom:20, background:'var(--paper)', border:'1.5px dashed var(--ink-10)', borderRadius:16, padding:28, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', cursor:'pointer', transition:'background 0.15s', minHeight:120, color: '#1C1917' }}
            onMouseEnter={e => e.currentTarget.style.background='#EDE9E0'}
            onMouseLeave={e => e.currentTarget.style.background='var(--paper)'}>
            <Plus size={24} style={{ color:'var(--sage)', marginBottom:8 }}/>
            <div style={{ fontWeight:700, fontSize:14, color: '#1C1917' }}>Create Custom Section</div>
            <div style={{ fontSize:12, color:'rgba(28,25,23,0.6)', marginTop:4 }}>Add your own personalized lists</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ListItem({ text, done, onToggle, onDelete }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:8, transition:'background 0.12s', cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background='var(--paper)'; e.currentTarget.querySelector('.li-del').style.opacity=1; }}
      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.querySelector('.li-del').style.opacity=0; }}>
      <div onClick={onToggle} style={{ width:16, height:16, borderRadius:4, border:`2px solid ${done ? 'var(--sage)' : 'var(--ink-30)'}`, background: done ? 'var(--sage)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s', cursor:'pointer' }}>
        {done && <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
      </div>
      {/* Explicitly setting color, opacity, and adding fallback text so it doesn't vanish */}
      <span onClick={onToggle} style={{ flex:1, fontSize:13, color: done ? 'rgba(28,25,23,0.4)' : '#1C1917', textDecoration: done ? 'line-through' : 'none', cursor:'pointer', opacity: 1, wordBreak: 'break-word' }}>
        {text || 'Empty Item'}
      </span>
      <button className="li-del" onClick={onDelete} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--rose)', opacity:0, transition:'opacity 0.15s', padding:2, display:'flex' }}><X size={12}/></button>
    </div>
  );
}