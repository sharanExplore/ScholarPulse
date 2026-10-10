import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Sparkles,
  Settings,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCode,
  User,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Award,
  Shield,
  ShieldAlert,
  Users,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  ChevronDown,
  Activity,
  UserCheck,
  FileCheck,
  Network
} from 'lucide-react';

import PaperAnalysis from './pages/PaperAnalysis';
import Recommendations from './pages/Recommendations';
import CitationIntelligence from './pages/CitationIntelligence';
import AdminDashboard from './pages/AdminDashboard';
import Toast from './components/Toast/Toast';
import api from './services/api';

export default function App() {
  // Authentication & User States
  // Authentication & User States
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // App Navigation & UI States
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Admin / Superuser States
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminPapers, setAdminPapers] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  // Upload & Analysis States
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('Uploading paper...');
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Active Paper for Dossier View
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [currentAnalysisData, setCurrentAnalysisData] = useState(null);

  // Toast & Delete Modal States
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title, isAdmin: boolean }

  // Search in My Papers / Admin Papers
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUserSearch, setAdminUserSearch] = useState('');

  // 1. Initial Authentication & Backend Health Check
  useEffect(() => {
    initAuthAndHealth();
    const interval = setInterval(checkBackendHealth, 20000);
    return () => clearInterval(interval);
  }, []);



  const viewToPath = {
    'admin': '/admin',
    'admin-users': '/admin/users',
    'admin-papers': '/admin/papers',
    'admin-analytics': '/admin/analytics',
    'dashboard': '/dashboard',
    'upload': '/upload',
    'papers': '/papers',
    'citations': '/citations',
    'analysis': '/papers',
    'recommendations': '/recommendations',
    'settings': '/settings',
    'profile': '/profile',
    'login': '/login',
  };

  const pathToView = (pathname) => {
    const clean = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    if (clean === '/admin') return 'admin';
    if (clean === '/admin/users') return 'admin-users';
    if (clean === '/admin/papers') return 'admin-papers';
    if (clean === '/admin/analytics') return 'admin-analytics';
    if (clean === '/dashboard') return 'dashboard';
    if (clean === '/upload') return 'upload';
    if (clean === '/papers') return 'papers';
    if (clean === '/citations') return 'citations';
    if (clean === '/recommendations') return 'recommendations';
    if (clean === '/settings') return 'settings';
    if (clean === '/profile') return 'profile';
    if (clean === '/login') return 'login';
    return null;
  };

  const initAuthAndHealth = async () => {
    setAuthLoading(true);
    try {
      await checkBackendHealth();

      // Check for session parameters in URL (token or error)
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');
      const urlError = searchParams.get('error');

      if (urlError) {
        const decodedError = decodeURIComponent(urlError);
        setAuthError(decodedError);
        showToast({
          type: 'error',
          message: decodedError
        });
        window.history.replaceState(null, '', '/login');
      }

      if (urlToken) {
        api.setToken(urlToken);
        window.history.replaceState(null, '', '/dashboard');
      }

      const token = api.getToken();
      const currentPath = window.location.pathname;

      if (!token) {
        setCurrentUser(null);
        if (currentPath !== '/login' && currentPath !== '/') {
          showToast({
            type: 'info',
            message: 'Authentication required. Please log in.'
          });
        }
        window.history.replaceState(null, '', '/login');
        return;
      }

      try {
        const profile = await api.getCurrentUser();
        if (profile && profile.user) {
          const user = profile.user;
          setCurrentUser(user);

          const requestedView = pathToView(currentPath);
          if (user.role === 'superuser') {
            await Promise.all([loadAdminData(), loadUserPapers()]);
            if (requestedView && requestedView.startsWith('admin')) {
              setCurrentView(requestedView);
            } else if (requestedView && requestedView !== 'login') {
              setCurrentView(requestedView);
            } else {
              setCurrentView('admin');
              window.history.replaceState(null, '', '/admin');
            }
          } else {
            // Normal user
            if (requestedView && requestedView.startsWith('admin')) {
              showToast({
                type: 'error',
                message: 'Access denied.'
              });
              setCurrentView('dashboard');
              window.history.replaceState(null, '', '/dashboard');
              await loadUserPapers();
            } else if (requestedView && requestedView !== 'login') {
              setCurrentView(requestedView);
              await loadUserPapers();
            } else {
              setCurrentView('dashboard');
              window.history.replaceState(null, '', '/dashboard');
              await loadUserPapers();
            }
          }
        } else {
          throw new Error('Invalid user profile');
        }
      } catch {
        api.clearToken();
        setCurrentUser(null);
        window.history.replaceState(null, '', '/login');
        showToast({
          type: 'info',
          message: 'Authentication required. Please log in.'
        });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Browser back/forward navigation listener
  useEffect(() => {
    const handlePopState = () => {
      const token = api.getToken();
      const currentPath = window.location.pathname;
      if (!token) {
        setCurrentUser(null);
        if (currentPath !== '/login') {
          window.history.replaceState(null, '', '/login');
          showToast({
            type: 'info',
            message: 'Authentication required. Please log in.'
          });
        }
        return;
      }
      const view = pathToView(currentPath);
      if (view) {
        if (view.startsWith('admin') && currentUser?.role !== 'superuser') {
          showToast({
            type: 'error',
            message: 'Access denied.'
          });
          setCurrentView('dashboard');
          window.history.replaceState(null, '', '/dashboard');
        } else {
          setCurrentView(view);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  const checkBackendHealth = async () => {
    try {
      await api.getHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);

    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      const msg = 'Please enter both email and password.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const data = await api.login(email, loginPassword);
      setCurrentUser(data.user);
      setLoginPassword('');
      showToast({
        type: 'success',
        message: `Welcome back, ${data.user.name || 'Scholar'}!`
      });

      if (data.user.role === 'superuser') {
        setCurrentView('admin');
        window.history.replaceState(null, '', '/admin');
        await Promise.all([loadAdminData(), loadUserPapers()]);
      } else {
        setCurrentView('dashboard');
        window.history.replaceState(null, '', '/dashboard');
        await loadUserPapers();
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      const msg = err.message || 'Invalid email or password.';
      setAuthError(msg);
      showToast({
        type: 'error',
        message: msg
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAuthError(null);

    const name = registerName.trim();
    const email = registerEmail.trim();
    const password = registerPassword;
    const confirmPassword = registerConfirmPassword;

    if (!name) {
      const msg = 'Full name is required.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (!email) {
      const msg = 'Email is required.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = 'Please enter a valid email address.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (!password) {
      const msg = 'Password is required.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setAuthError(msg);
      showToast({ type: 'error', message: msg });
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const data = await api.register(name, email, password);
      setCurrentUser(data.user);
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      showToast({
        type: 'success',
        message: `Account created successfully! Welcome, ${data.user.name}!`
      });

      // Normal registered accounts always route to /dashboard
      setCurrentView('dashboard');
      window.history.replaceState(null, '', '/dashboard');
      await loadUserPapers();
    } catch (err) {
      console.error('Registration failed:', err);
      const msg = err.message || 'Registration failed. Please try again.';
      setAuthError(msg);
      showToast({
        type: 'error',
        message: msg
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      api.clearToken();
      setCurrentUser(null);
      setPapers([]);
      setAdminStats(null);
      setAdminUsers([]);
      setAdminPapers([]);
      setSelectedPaperId(null);
      setCurrentAnalysisData(null);
      setCurrentView('dashboard');
      setUserDropdownOpen(false);
      window.history.replaceState(null, '', '/login');
      showToast({
        type: 'info',
        message: 'Logged out successfully.'
      });
    }
  };

  const loadUserPapers = async () => {
    setLoadingPapers(true);
    try {
      const data = await api.getPapers();
      if (data && Array.isArray(data.papers)) {
        setPapers(data.papers);
      }
    } catch (err) {
      console.error('Failed to load user papers:', err);
    } finally {
      setLoadingPapers(false);
    }
  };

  const loadAdminData = async () => {
    setLoadingAdminData(true);
    try {
      const [stats, usersData, papersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminPapers(),
      ]);
      setAdminStats(stats);
      setAdminUsers(usersData.users || []);
      setAdminPapers(papersData.papers || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const showToast = (toastObj) => {
    setToast(toastObj);
    setTimeout(() => setToast(null), 4000);
  };

  // Nav Handlers with Role-Based Protection
  const navItems = currentUser?.role === 'superuser'
    ? [
        { id: 'admin', label: 'Admin Dashboard', icon: Shield, badge: 'Super', path: '/admin' },
        { id: 'upload', label: 'Upload Paper', icon: UploadCloud, path: '/upload' },
        { id: 'papers', label: 'My Research', icon: FileText, badge: papers.length || null, path: '/papers' },
        { id: 'citations', label: 'Citation Intelligence', icon: Network, path: '/citations' },
        { id: 'recommendations', label: 'Recommendations', icon: Sparkles, path: '/recommendations' },
        { id: 'admin-users', label: 'All Users', icon: Users, badge: adminUsers.length || null, path: '/admin/users' },
        { id: 'admin-papers', label: 'All Papers', icon: Layers, badge: adminPapers.length || null, path: '/admin/papers' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'upload', label: 'Upload Paper', icon: UploadCloud, path: '/upload' },
        { id: 'papers', label: 'My Papers', icon: FileText, badge: papers.length, path: '/papers' },
        { id: 'citations', label: 'Citations', icon: Network, path: '/citations' },
        { id: 'recommendations', label: 'Recommendations', icon: Sparkles, path: '/recommendations' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
      ];

  const handleNavClick = (viewId) => {
    if (viewId === 'logout') {
      handleLogout();
      return;
    }

    // Prevent normal users from accessing admin routes
    if (viewId.startsWith('admin') && currentUser?.role !== 'superuser') {
      showToast({
        type: 'error',
        message: 'Access denied.'
      });
      setCurrentView('dashboard');
      window.history.replaceState(null, '', '/dashboard');
      return;
    }

    setCurrentView(viewId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const targetPath = viewToPath[viewId] || '/dashboard';
    window.history.pushState(null, '', targetPath);

    if (viewId === 'papers') {
      loadUserPapers();
    } else if (viewId.startsWith('admin')) {
      loadAdminData();
    }
  };

  // File Selection
  const handleFileChange = (e) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Invalid format. Please select an academic PDF document (.pdf).');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Remove Selected File Before Analysis
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute Analysis via Real API Request
  const handleExecuteAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setUploadError(null);
    setAnalysisStage('Uploading paper...');

    const timer1 = setTimeout(() => setAnalysisStage('Extracting document structure...'), 1400);
    const timer2 = setTimeout(() => setAnalysisStage('Synthesizing research findings...'), 3200);
    const timer3 = setTimeout(() => setAnalysisStage('Computing citation intelligence...'), 5200);

    try {
      const result = await api.uploadPaper(selectedFile);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      await loadUserPapers();
      if (currentUser?.role === 'superuser') {
        loadAdminData();
      }

      setSelectedPaperId(result.paper_id);
      setCurrentAnalysisData(result);
      handleRemoveFile();

      showToast({
        type: 'success',
        message: `Paper "${result.metadata?.title || selectedFile.name}" analyzed successfully!`
      });

      setCurrentView('analysis');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      console.error('Analysis failed:', err);

      let reason = 'Please ensure the FastAPI backend is running and the uploaded file is a valid PDF.';
      if (err.status === 400) {
        reason = err.message || 'The uploaded file is empty or corrupted.';
      } else if (err.status === 403) {
        reason = 'Access denied: You do not have permission to upload.';
      } else if (err.status === 401) {
        reason = 'Session expired. Please log in again.';
        handleLogout();
      } else if (err.status === 500) {
        reason = err.message || 'Server error occurred during multi-agent pipeline extraction.';
      }
      setUploadError(reason);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // View Paper Dossier
  const handleViewPaper = (paperId) => {
    setSelectedPaperId(paperId);
    setCurrentAnalysisData(null);
    setCurrentView('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Handlers (Works for both User & Admin)
  const promptDeletePaper = (paperId, title, isAdmin = false) => {
    setDeleteConfirm({ id: paperId, title, isAdmin });
  };

  const confirmDeletePaper = async () => {
    if (!deleteConfirm) return;
    const { id, isAdmin } = deleteConfirm;
    setDeleteConfirm(null);

    try {
      if (isAdmin) {
        await api.adminDeletePaper(id);
      } else {
        await api.deletePaper(id);
      }

      showToast({
        type: 'success',
        message: 'Paper deleted successfully.'
      });

      // Refresh both user list and admin data
      await loadUserPapers();
      if (currentUser?.role === 'superuser') {
        await loadAdminData();
      }

      if (selectedPaperId === id) {
        setSelectedPaperId(null);
        setCurrentAnalysisData(null);
        setCurrentView(isAdmin ? 'admin-papers' : 'papers');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      showToast({
        type: 'error',
        message: err.message || 'Failed to delete paper from repository.'
      });
    }
  };

  // Filtered papers
  const filteredUserPapers = papers.filter((p) => {
    const q = searchQuery.toLowerCase();
    const title = (p.title || p.filename || '').toLowerCase();
    const authors = Array.isArray(p.authors) ? p.authors.join(' ').toLowerCase() : (p.authors || '').toLowerCase();
    return title.includes(q) || authors.includes(q);
  });

  const filteredAdminPapers = adminPapers.filter((p) => {
    const q = searchQuery.toLowerCase();
    const title = (p.title || p.filename || '').toLowerCase();
    const owner = (p.owner_email || p.owner_name || '').toLowerCase();
    return title.includes(q) || owner.includes(q);
  });

  const filteredAdminUsers = adminUsers.filter((u) => {
    const q = adminUserSearch.toLowerCase();
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    return name.includes(q) || email.includes(q) || role.includes(q);
  });

  // User Dashboard Computed metrics (Isolated to current user)
  const totalPapersCount = papers.length;
  const analyzedPapersCount = papers.filter((p) => p.status === 'completed' || p.status === 'Completed').length;
  const totalReferencesCount = papers.reduce((sum, p) => sum + (p.reference_count || 0), 0);
  const totalRecommendationsCount = Math.max(papers.length * 6, papers.length > 0 ? 6 : 0);

  // =========================================================================
  // VIEW: AUTHENTICATION / LOGIN SCREEN (FEATURE 2 & FEATURE 12)
  // =========================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/30">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">Initializing ScholarPulse Security...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between text-slate-100 antialiased font-sans p-6 sm:p-12 relative overflow-hidden">
        {/* Toast */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navbar */}
        <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Scholar<span className="text-indigo-400">Pulse</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Research Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{backendOnline ? 'API Connected' : 'API Offline'}</span>
          </div>
        </header>

        {/* Main Authentication Card */}
        <main className="relative z-10 max-w-md mx-auto w-full my-auto py-8">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/70 space-y-6">
            {/* ScholarPulse Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-1 ring-white/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {authMode === 'login' ? 'Welcome back to ScholarPulse' : 'Create Account'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                {authMode === 'login'
                  ? 'AI-Powered Academic Research Intelligence'
                  : 'Join ScholarPulse Academic Research Intelligence'}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 text-left animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            {authMode === 'login' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@academic.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isSubmittingAuth}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="loginPassword"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isSubmittingAuth}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="signInBtn"
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingAuth ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer underline underline-offset-2"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : (
              /* CREATE ACCOUNT / REGISTRATION FORM */
              <form onSubmit={handleCreateAccount} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="registerName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Dr. Jane Doe"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    disabled={isSubmittingAuth}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    id="registerEmail"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@academic.org"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isSubmittingAuth}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="registerPassword"
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={isSubmittingAuth}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="registerConfirmPassword"
                      type={showRegisterConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      disabled={isSubmittingAuth}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                      aria-label={showRegisterConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showRegisterConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="createAccountBtn"
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingAuth ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

                <div className="pt-2 text-center text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer underline underline-offset-2"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center text-xs text-slate-400">
          ScholarPulse Academic Intelligence &bull; Secure Email Authentication &bull; Role-Based Access Control
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW: AUTHENTICATED APPLICATION
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 antialiased font-sans">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Delete Confirmation Modal (FEATURE 1 & FEATURE 9) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete this research paper?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All paper-owned records including metadata, uploaded PDF, summary, keywords, references, citation analysis, and recommendations for <span className="font-semibold text-slate-800">"{deleteConfirm.title}"</span> will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePaper}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Delete Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavClick(currentUser.role === 'superuser' ? 'admin' : 'dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Scholar<span className="text-indigo-400">Pulse</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Academic Intelligence</p>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Menu */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {currentUser.role === 'superuser' ? 'Superuser Console' : 'Researcher Workspace'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Super'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Profile Area (FEATURE 13) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3">
          <div className="flex items-center gap-3">
            {currentUser.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border border-slate-700 object-cover shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                {currentUser.name
                  ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'SP'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name || 'Scholar'}</p>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
              <div className="pt-0.5">
                {currentUser.role === 'superuser' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Shield className="w-3 h-3 text-amber-400" />
                    Superuser
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    <User className="w-3 h-3 text-indigo-400" />
                    User
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/80 text-xs font-semibold text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                ScholarPulse Intelligence System
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 font-medium">
                Multi-Agent Academic Paper Analyzer & Citation Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                backendOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{backendOnline ? 'API Connected' : 'API Offline'}</span>
            </div>

            {/* Quick Upload action */}
            <button
              onClick={() => handleNavClick('upload')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Paper</span>
            </button>

            {/* User Profile Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="User Profile Menu"
              >
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.name
                      ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'SP'}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                  {currentUser.name || 'Scholar'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fade-in text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{currentUser.name || 'Scholar'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1">
                      {currentUser.role === 'superuser' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Shield className="w-3 h-3" /> Superuser
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          <User className="w-3 h-3" /> User
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => handleNavClick('profile')}
                      className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('settings')}
                      className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {/* ============================================================= */}
          {/* VIEW: SUPERUSER ADMIN DASHBOARD & RESEARCH WORKSPACE          */}
          {/* ============================================================= */}
          {currentView === 'admin' && currentUser.role === 'superuser' && (
            <AdminDashboard
              currentUser={currentUser}
              onNavigate={handleNavClick}
              onViewPaper={handleViewPaper}
              showToast={showToast}
              userPapers={papers}
              loadUserPapers={loadUserPapers}
            />
          )}

          {/* ============================================================= */}
          {/* VIEW: USER MANAGEMENT (FEATURE 8)                             */}
          {/* ============================================================= */}
          {currentView === 'admin-users' && currentUser.role === 'superuser' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    User Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Inspect registered user accounts, active roles, and total uploaded papers.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={adminUserSearch}
                    onChange={(e) => setAdminUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-64 shadow-subtle"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Created Date</th>
                        <th className="py-3.5 px-4">Last Login</th>
                        <th className="py-3.5 px-4 text-center">Papers</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center shrink-0">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                              <span className="font-bold text-slate-900">{u.name || 'Anonymous User'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'superuser'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {u.role === 'superuser' && <Shield className="w-3 h-3 text-amber-500" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            {u.paper_count || 0}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredAdminUsers.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-xs text-slate-400 italic">
                            No users found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW: ADMIN PAPER MANAGEMENT (FEATURE 9)                      */}
          {/* ============================================================= */}
          {currentView === 'admin-papers' && currentUser.role === 'superuser' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    System Paper Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Global view of all uploaded academic papers across all researchers with administrative deletion.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search papers by title or owner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-64 shadow-subtle"
                  />
                </div>
              </div>

              {/* Papers Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Paper</th>
                        <th className="py-3.5 px-4">Owner</th>
                        <th className="py-3.5 px-4">Uploaded</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">References</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminPapers.map((paper) => (
                        <tr key={paper.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 truncate">{paper.title || paper.filename}</p>
                              <p className="text-[11px] text-slate-400 truncate">{paper.filename}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            <span className="font-mono text-[11px]">{paper.owner_email || 'Unassigned'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {paper.uploaded_at ? new Date(paper.uploaded_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {paper.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            {paper.reference_count || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewPaper(paper.id)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => promptDeletePaper(paper.id, paper.title || paper.filename, true)}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredAdminPapers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-xs text-slate-400 italic">
                            No research papers found in the global registry.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW 1: NORMAL USER DASHBOARD (FEATURE 4 & 5 DATA ISOLATION)  */}
          {/* ============================================================= */}
          {currentView === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Personal Workspace
                    </span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-500">{currentUser.name}'s Dashboard</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                    Research Intelligence Dashboard
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time synthesis of your uploaded academic literature, citation frequencies, and recommendations
                  </p>
                </div>

                <button
                  onClick={() => handleNavClick('upload')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Research Paper</span>
                </button>
              </div>

              {/* 4 Isolated Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Papers</p>
                    <p className="text-2xl font-extrabold text-slate-900">{totalPapersCount}</p>
                    <p className="text-[11px] text-slate-500 font-medium">In your library</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analyzed Papers</p>
                    <p className="text-2xl font-extrabold text-slate-900">{analyzedPapersCount}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Ready for exploration</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">References Found</p>
                    <p className="text-2xl font-extrabold text-slate-900">{totalReferencesCount}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Parsed bibliography references</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Related Papers</p>
                    <p className="text-2xl font-extrabold text-slate-900">{totalRecommendationsCount}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Semantic recommendations</p>
                  </div>
                </div>
              </div>

              {/* Recent Papers Table for Current User */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Your Recent Academic Papers</h3>
                    <p className="text-xs text-slate-500">Only papers uploaded by your account ({currentUser.email}) appear here.</p>
                  </div>
                  <button
                    onClick={() => handleNavClick('papers')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {papers.slice(0, 5).map((paper) => (
                    <div
                      key={paper.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {paper.title || paper.filename}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>{Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || 'Authors parsed')}</span>
                          <span>&bull;</span>
                          <span>{paper.reference_count || 0} references</span>
                          <span>&bull;</span>
                          <span>{paper.page_count || 1} pages</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleViewPaper(paper.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          View Analysis
                        </button>
                        <button
                          onClick={() => promptDeletePaper(paper.id, paper.title || paper.filename, false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {papers.length === 0 && (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-500">You haven't uploaded any papers yet.</p>
                      <button
                        onClick={() => handleNavClick('upload')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 transition-colors"
                      >
                        Upload Your First PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW 2: UPLOAD PAPER                                          */}
          {/* ============================================================= */}
          {currentView === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Upload Academic Paper
                </h2>
                <p className="text-xs text-slate-500">
                  Select a research paper (PDF) to run full multi-agent structural and citation analysis
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors text-center space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  id="pdfUploadInput"
                />

                {!selectedFile ? (
                  <div className="space-y-3 py-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <label
                        htmlFor="pdfUploadInput"
                        className="cursor-pointer text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Click to browse PDF
                      </label>
                      <span className="text-xs text-slate-500"> or drag and drop file here</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Maximum file size: 35MB &bull; Standard PDF documents with text stream
                    </p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-left">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Academic PDF
                        </p>
                      </div>
                    </div>

                    {/* FEATURE 11: Remove Selected PDF Button */}
                    <button
                      onClick={handleRemoveFile}
                      disabled={isAnalyzing}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                      title="Remove selected file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {selectedFile && (
                  <button
                    onClick={handleExecuteAnalysis}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{analysisStage}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Execute Multi-Agent Analysis</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW 3: MY PAPERS (WITH SEARCH & COMPLETE DELETE)            */}
          {/* ============================================================= */}
          {currentView === 'papers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    My Analyzed Papers
                  </h2>
                  <p className="text-xs text-slate-500">
                    Repository of research papers owned and analyzed by your account ({currentUser.email})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search your papers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-64 shadow-subtle"
                    />
                  </div>
                  <button
                    onClick={loadUserPapers}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-subtle"
                    title="Refresh papers"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPapers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Papers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUserPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {paper.journal || 'Academic Paper'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {paper.uploaded_at ? new Date(paper.uploaded_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                        {paper.title || paper.filename}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || 'Authors parsed')}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        {paper.reference_count || 0} references &bull; {paper.page_count || 1} pages
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewPaper(paper.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => promptDeletePaper(paper.id, paper.title || paper.filename, false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUserPapers.length === 0 && (
                <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No papers found in your workspace.</p>
                  <p className="text-xs text-slate-400">Upload a paper to see it listed in your personal repository.</p>
                  <button
                    onClick={() => handleNavClick('upload')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    Upload Paper
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW 4: PAPER ANALYSIS DOSSIER                                */}
          {/* ============================================================= */}
          {currentView === 'analysis' && (
            <PaperAnalysis
              paperId={selectedPaperId}
              initialPaperData={currentAnalysisData}
              onBack={() => handleNavClick('papers')}
              showToast={showToast}
            />
          )}

          {/* ============================================================= */}
          {/* VIEW: CITATION INTELLIGENCE                                   */}
          {/* ============================================================= */}
          {currentView === 'citations' && (
            <div className="animate-fade-in">
              <CitationIntelligence
                papers={papers}
                onViewPaper={handleViewPaper}
                onNavigate={handleNavClick}
              />
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW: RECOMMENDATIONS                                         */}
          {/* ============================================================= */}
          {currentView === 'recommendations' && (
            <div className="animate-fade-in">
              <Recommendations
                papers={papers}
                onViewPaper={handleViewPaper}
                onNavigate={handleNavClick}
              />
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW 6: SETTINGS                                              */}
          {/* ============================================================= */}
          {currentView === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  ScholarPulse Settings & Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Account identity, security configuration, and multi-agent pipeline parameters
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Current Authenticated Identity</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Account Name</span>
                    <span className="font-bold text-slate-900">{currentUser.name || 'Scholar'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Email Address</span>
                    <span className="font-mono text-slate-900">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Assigned Role</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        currentUser.role === 'superuser'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">FastAPI Connection</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        backendOnline ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                      }`}
                    >
                      {backendOnline ? 'Connected (http://127.0.0.1:8000)' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW: USER PROFILE                                            */}
          {/* ============================================================= */}
          {currentView === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  User Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Manage your authenticated ScholarPulse account and session
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                  {currentUser.picture ? (
                    <img
                      src={currentUser.picture}
                      alt={currentUser.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                      {currentUser.name
                        ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                        : 'SP'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{currentUser.name || 'Scholar'}</h3>
                    <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {currentUser.role === 'superuser' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Shield className="w-3.5 h-3.5" /> Superuser Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          <User className="w-3.5 h-3.5" /> Academic Researcher (User)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">My Uploaded Papers</p>
                    <p className="text-xl font-extrabold text-slate-900">{papers.length}</p>
                    <p className="text-[10px] text-slate-400">Strictly isolated to your account</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase">Authentication Provider</p>
                    <p className="text-sm font-bold text-slate-900">
                      {currentUser.role === 'superuser' ? 'Designated Superuser' : 'Email & Password'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">Session Active & Secured</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => handleNavClick(currentUser.role === 'superuser' ? 'admin-papers' : 'papers')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View My Papers
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW: SYSTEM ANALYTICS (SUPERUSER ONLY)                       */}
          {/* ============================================================= */}
          {currentView === 'admin-analytics' && currentUser.role === 'superuser' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    System Analytics & Telemetry
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive multi-agent pipeline performance, global user counts, and platform storage metrics.
                  </p>
                </div>
                <button
                  onClick={loadAdminData}
                  disabled={loadingAdminData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-subtle cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAdminData ? 'animate-spin' : ''}`} />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {adminStats?.total_users ?? adminUsers.length}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Active accounts</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Papers</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {adminStats?.total_papers ?? adminPapers.length}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Across all users</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Analyses</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {adminStats?.total_analyses ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Multi-agent dossiers</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total References</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {adminStats?.total_references ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Parsed bibliography items</p>
                  </div>
                </div>
              </div>

              {/* System Management Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => handleNavClick('admin-users')}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle hover:border-indigo-300 transition-colors cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">User Management</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500">
                    Inspect all registered researcher accounts, email identities, and active paper counts.
                  </p>
                </div>

                <div
                  onClick={() => handleNavClick('admin-papers')}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle hover:border-indigo-300 transition-colors cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Paper Management</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500">
                    Global view of papers uploaded by all researchers with administrative deletion controls.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
