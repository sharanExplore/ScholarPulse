import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  UploadCloud,
  Network,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Server,
  Database,
  Lock,
  FileCheck,
  ExternalLink,
  ChevronDown,
  X,
  AlertTriangle,
  Calendar,
  Share2,
  HardDrive
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard({
  currentUser,
  onNavigate,
  onViewPaper,
  showToast,
  userPapers = [],
  loadUserPapers
}) {
  // Top-level stats & metrics
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Time range filters for charts
  const [loginDays, setLoginDays] = useState(7);
  const [dailyLogins, setDailyLogins] = useState([]);
  const [loadingLogins, setLoadingLogins] = useState(false);

  const [regDays, setRegDays] = useState(7);
  const [regTrend, setRegTrend] = useState([]);
  const [loadingRegTrend, setLoadingRegTrend] = useState(false);

  // System Health
  const [systemHealth, setSystemHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Activity logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // All Users Table State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userDateFilter, setUserDateFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // All Papers Table State
  const [systemPapers, setSystemPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [paperStatusFilter, setPaperStatusFilter] = useState('all');
  const [paperDateFilter, setPaperDateFilter] = useState('all');
  const [paperSearch, setPaperSearch] = useState('');

  // Global Search State
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState(null); // { id, title }
  const [isDeleting, setIsDeleting] = useState(false);

  // Tooltip states for SVG charts
  const [loginTooltip, setLoginTooltip] = useState(null);
  const [regTooltip, setRegTooltip] = useState(null);

  // Initial Data Load
  useEffect(() => {
    loadAllDashboardData();
  }, []);

  // Reload charts on filter changes
  useEffect(() => {
    loadDailyLogins(loginDays);
  }, [loginDays]);

  useEffect(() => {
    loadRegistrationTrend(regDays);
  }, [regDays]);

  // Reload filtered users
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFilteredUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [userRoleFilter, userDateFilter, userSearch]);

  // Reload filtered papers
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFilteredPapers();
    }, 250);
    return () => clearTimeout(timer);
  }, [paperStatusFilter, paperDateFilter, paperSearch]);

  const loadAllDashboardData = async () => {
    setLoadingStats(true);
    try {
      const [statsData, healthData, actData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminHealth().catch(() => null),
        api.getAdminActivity(25).catch(() => ({ activity: [] }))
      ]);

      if (statsData) {
        setStats(statsData);
        if (statsData.daily_logins) setDailyLogins(statsData.daily_logins);
        if (statsData.registration_trend) setRegTrend(statsData.registration_trend);
      }

      if (healthData) {
        setSystemHealth(healthData);
      } else if (statsData?.system_health) {
        setSystemHealth(statsData.system_health);
      }

      if (actData?.activity) {
        setActivityLogs(actData.activity);
      }

      await Promise.all([loadFilteredUsers(), loadFilteredPapers()]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast?.({
        type: 'error',
        message: 'Failed to load live database monitoring metrics.'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadDailyLogins = async (days) => {
    setLoadingLogins(true);
    try {
      const res = await api.getDailyLogins(days);
      if (res && res.logins) {
        setDailyLogins(res.logins);
      }
    } catch (err) {
      console.error('Failed to load daily logins:', err);
    } finally {
      setLoadingLogins(false);
    }
  };

  const loadRegistrationTrend = async (days) => {
    setLoadingRegTrend(true);
    try {
      const res = await api.getRegistrationTrend(days);
      if (res && res.trend) {
        setRegTrend(res.trend);
      }
    } catch (err) {
      console.error('Failed to load registration trend:', err);
    } finally {
      setLoadingRegTrend(false);
    }
  };

  const loadFilteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getAdminUsers({
        role: userRoleFilter,
        date_filter: userDateFilter,
        search: userSearch
      });
      if (res && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadFilteredPapers = async () => {
    setLoadingPapers(true);
    try {
      const res = await api.getAdminPapers({
        status: paperStatusFilter,
        date_filter: paperDateFilter,
        search: paperSearch
      });
      if (res && res.papers) {
        setSystemPapers(res.papers);
      }
    } catch (err) {
      console.error('Failed to load system papers:', err);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleRefreshHealth = async () => {
    setLoadingHealth(true);
    try {
      const healthData = await api.getAdminHealth();
      setSystemHealth(healthData);
      showToast?.({
        type: 'success',
        message: 'System health check completed.'
      });
    } catch (err) {
      console.error('Health check failed:', err);
      showToast?.({
        type: 'error',
        message: 'Health diagnostic failed.'
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!globalQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchAdmin(globalQuery.trim());
      setGlobalResults(res);
    } catch (err) {
      console.error('Global search error:', err);
      showToast?.({
        type: 'error',
        message: 'Search request failed.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await api.adminDeletePaper(deleteModal.id);
      showToast?.({
        type: 'success',
        message: `Paper "${deleteModal.title}" deleted from system.`
      });
      setDeleteModal(null);
      await Promise.all([
        loadFilteredPapers(),
        loadAllDashboardData(),
        loadUserPapers?.()
      ]);
    } catch (err) {
      console.error('Delete paper failed:', err);
      showToast?.({
        type: 'error',
        message: err.message || 'Failed to delete research paper.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Safe KPI formatter
  const formatStat = (val) => {
    if (val === undefined || val === null) return '--';
    if (typeof val === 'number') return val.toLocaleString();
    return val;
  };

  // SVG Chart Geometry Calculators
  const maxLoginCount = useMemo(() => {
    if (!dailyLogins.length) return 1;
    const maxVal = Math.max(...dailyLogins.map((d) => d.unique_users || 0));
    return maxVal > 0 ? maxVal : 5;
  }, [dailyLogins]);

  const maxRegCount = useMemo(() => {
    if (!regTrend.length) return 1;
    const maxVal = Math.max(...regTrend.map((d) => d.new_users || 0));
    return maxVal > 0 ? maxVal : 5;
  }, [regTrend]);

  // Compute superuser's personal research papers
  const myPapers = useMemo(() => {
    return userPapers || [];
  }, [userPapers]);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & WORKSPACE BANNER                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Shield className="w-3.5 h-3.5" />
              ScholarPulse Superuser
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Database Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Monitoring & Research Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Monitor real-time application health, user login trends, and audit activity across the entire platform while utilizing ScholarPulse's full multi-agent academic research pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold border border-slate-700 transition-all shadow-subtle hover:scale-[1.02]"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Global Registry Search</span>
          </button>
          <button
            onClick={loadAllDashboardData}
            disabled={loadingStats}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP-LEVEL STATS: 8 REAL DATABASE KPI METRIC CARDS                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.total_users)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Registered user accounts</p>
        </div>

        {/* Active Users Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Users Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.active_users_today)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Unique logins since 00:00 UTC</p>
        </div>

        {/* Total Papers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Papers</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.total_papers)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Uploaded research documents</p>
        </div>

        {/* Papers Analyzed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Papers Analyzed</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.papers_analyzed)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Completed analysis jobs</p>
        </div>

        {/* Total References */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total References</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.total_references)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Indexed bibliographies</p>
        </div>

        {/* Total Recommendations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recommendations</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.total_recommendations)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Related literature matches</p>
        </div>

        {/* Failed Analyses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Failed Analyses</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.failed_analyses)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Errored analysis jobs</p>
        </div>

        {/* Active Sessions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle transition-all hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Sessions</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatStat(stats?.active_sessions)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Recent authenticated sessions</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ROW 2: USER ACTIVITY & DAILY LOGIN CHART + SYSTEM HEALTH PANEL         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: User Activity & Daily User Login Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">User Activity & Daily Login Monitoring</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Unique authenticated users per day calculated strictly from database authentication logs
              </p>
            </div>

            {/* Timeframe Buttons: 7 Days, 30 Days, 90 Days */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: '90 Days', val: 90 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setLoginDays(btn.val)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    loginDays === btn.val
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Granular User Activity Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 py-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Users</p>
              <p className="text-lg font-extrabold text-slate-900">
                {formatStat(stats?.user_activity?.total_registered_users ?? stats?.total_users)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">New Today</p>
              <p className="text-lg font-extrabold text-indigo-600">
                {formatStat(stats?.user_activity?.new_users_today)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">New This Week</p>
              <p className="text-lg font-extrabold text-slate-800">
                {formatStat(stats?.user_activity?.new_users_this_week)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">New This Month</p>
              <p className="text-lg font-extrabold text-slate-800">
                {formatStat(stats?.user_activity?.new_users_this_month)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Active Today</p>
              <p className="text-lg font-extrabold text-emerald-600">
                {formatStat(stats?.user_activity?.active_users_today ?? stats?.active_users_today)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Active Week</p>
              <p className="text-lg font-extrabold text-emerald-700">
                {formatStat(stats?.user_activity?.active_users_this_week)}
              </p>
            </div>
          </div>

          {/* Interactive Daily Login Activity SVG Chart */}
          <div className="relative pt-2">
            {loadingLogins ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400 space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Aggregating login activity records...</span>
              </div>
            ) : dailyLogins.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-xs text-slate-400">
                <Activity className="w-8 h-8 text-slate-300 mb-1" />
                <p>No user login activity recorded for this date range.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-56 w-full relative flex items-end gap-1 sm:gap-2 px-2 border-b border-slate-200">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                  </div>

                  {dailyLogins.map((item, idx) => {
                    const heightPercent = Math.max(
                      (item.unique_users / maxLoginCount) * 100,
                      item.unique_users > 0 ? 12 : 3
                    );
                    return (
                      <div
                        key={item.date || idx}
                        className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                        onMouseEnter={() => setLoginTooltip(item)}
                        onMouseLeave={() => setLoginTooltip(null)}
                      >
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                            item.unique_users > 0
                              ? 'bg-gradient-to-t from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400 group-hover:shadow-lg shadow-indigo-500/20'
                              : 'bg-slate-100 group-hover:bg-slate-200'
                          }`}
                        />
                        {/* X-axis label (sparse on 30/90 days) */}
                        {(loginDays === 7 ||
                          (loginDays === 30 && idx % 4 === 0) ||
                          (loginDays === 90 && idx % 10 === 0)) && (
                          <span className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-full">
                            {item.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Hover Tooltip / Status Display */}
                <div className="min-h-[24px] text-xs flex items-center justify-between text-slate-500 px-2">
                  {loginTooltip ? (
                    <span className="font-semibold text-slate-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {loginTooltip.date}: <strong className="text-indigo-600">{loginTooltip.unique_users} unique user{loginTooltip.unique_users === 1 ? '' : 's'}</strong> logged in
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Hover over any bar to inspect daily unique users (deduplicated by user ID per day)
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">Peak: {maxLoginCount} unique users</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: System Health Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-base font-bold text-slate-900">System Health</h2>
              </div>
              <button
                onClick={handleRefreshHealth}
                disabled={loadingHealth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                title="Run diagnostic"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Health components */}
            <div className="divide-y divide-slate-100 mt-2">
              {[
                {
                  id: 'backend',
                  name: 'Backend API',
                  icon: Server,
                  info: systemHealth?.components?.backend
                },
                {
                  id: 'database',
                  name: 'Database',
                  icon: Database,
                  info: systemHealth?.components?.database
                },
                {
                  id: 'auth',
                  name: 'Authentication',
                  icon: Lock,
                  info: systemHealth?.components?.auth
                },
                {
                  id: 'pdf_processing',
                  name: 'PDF Processing',
                  icon: FileCheck,
                  info: systemHealth?.components?.pdf_processing
                },
                {
                  id: 'ai_analysis',
                  name: 'AI Analysis',
                  icon: Sparkles,
                  info: systemHealth?.components?.ai_analysis
                },
              ].map((comp) => {
                const status = comp.info?.status || (systemHealth?.status === 'healthy' ? 'Healthy' : 'Healthy');
                const isHealthy = status === 'Healthy';
                const isWarning = status === 'Warning';
                const IconComponent = comp.icon;

                return (
                  <div key={comp.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{comp.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {comp.info?.detail || 'Operational'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isHealthy
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isWarning
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Overall System Status:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {systemHealth?.status ? systemHealth.status.toUpperCase() : 'HEALTHY'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROW 3: USER REGISTRATION TREND + APPLICATION MONITORING                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trend Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                <h2 className="text-base font-bold text-slate-900">User Registration Trend</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                New user registrations per day calculated from database timestamps
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: '90 Days', val: 90 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => setRegDays(btn.val)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    regDays === btn.val
                      ? 'bg-white text-violet-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Registration Trend SVG Chart */}
          <div className="relative pt-2">
            {loadingRegTrend ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400 space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
                <span>Aggregating account creation trend...</span>
              </div>
            ) : regTrend.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-xs text-slate-400">
                <Users className="w-8 h-8 text-slate-300 mb-1" />
                <p>No user registrations recorded in this window.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-56 w-full relative flex items-end gap-1 sm:gap-2 px-2 border-b border-slate-200">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                  </div>

                  {regTrend.map((item, idx) => {
                    const heightPercent = Math.max(
                      (item.new_users / maxRegCount) * 100,
                      item.new_users > 0 ? 12 : 3
                    );
                    return (
                      <div
                        key={item.date || idx}
                        className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                        onMouseEnter={() => setRegTooltip(item)}
                        onMouseLeave={() => setRegTooltip(null)}
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                            item.new_users > 0
                              ? 'bg-gradient-to-t from-violet-600 to-fuchsia-500 group-hover:from-violet-500 group-hover:to-fuchsia-400 group-hover:shadow-lg shadow-violet-500/20'
                              : 'bg-slate-100 group-hover:bg-slate-200'
                          }`}
                        />
                        {(regDays === 7 ||
                          (regDays === 30 && idx % 4 === 0) ||
                          (regDays === 90 && idx % 10 === 0)) && (
                          <span className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-full">
                            {item.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="min-h-[24px] text-xs flex items-center justify-between text-slate-500 px-2">
                  {regTooltip ? (
                    <span className="font-semibold text-slate-800 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                      {regTooltip.date}: <strong className="text-violet-600">{regTooltip.new_users} new registration{regTooltip.new_users === 1 ? '' : 's'}</strong>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Hover over any bar to inspect daily new accounts created
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">Peak: {maxRegCount} new users</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Activity / Application Monitoring */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
              <h2 className="text-base font-bold text-slate-900">Application Monitoring (System Activity)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live volume of system requests, PDF ingestions, analytical cycles, and operational events
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label: 'API Requests',
                val: stats?.system_activity?.api_requests,
                icon: Activity,
                color: 'text-indigo-600 bg-indigo-50'
              },
              {
                label: 'Successful Analyses',
                val: stats?.system_activity?.successful_analyses,
                icon: CheckCircle2,
                color: 'text-emerald-600 bg-emerald-50'
              },
              {
                label: 'Failed Analyses',
                val: stats?.system_activity?.failed_analyses,
                icon: AlertCircle,
                color: 'text-rose-600 bg-rose-50'
              },
              {
                label: 'PDF Uploads',
                val: stats?.system_activity?.pdf_uploads,
                icon: UploadCloud,
                color: 'text-violet-600 bg-violet-50'
              },
              {
                label: 'Paper Deletions',
                val: stats?.system_activity?.paper_deletions,
                icon: Trash2,
                color: 'text-slate-600 bg-slate-100'
              },
              {
                label: 'User Registrations',
                val: stats?.system_activity?.user_registrations,
                icon: Users,
                color: 'text-cyan-600 bg-cyan-50'
              },
              {
                label: 'User Logins',
                val: stats?.system_activity?.user_logins,
                icon: UserCheck,
                color: 'text-teal-600 bg-teal-50'
              },
              {
                label: 'Logout Events',
                val: stats?.system_activity?.logout_events,
                icon: Lock,
                color: 'text-amber-600 bg-amber-50'
              },
              {
                label: 'System Errors',
                val: stats?.system_activity?.errors,
                icon: AlertTriangle,
                color: 'text-rose-600 bg-rose-50'
              },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 truncate">{item.label}</p>
                    <p className="text-base font-extrabold text-slate-900">{formatStat(item.val)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ROW 4: RECENT ACTIVITY TIMELINE                                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Recent Activity Timeline</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological audit stream of all user actions and system pipeline executions
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {activityLogs.length} recent events
          </span>
        </div>

        <div className="space-y-3">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                    log.action.includes('fail') || log.status === 'failed'
                      ? 'bg-rose-100 text-rose-700'
                      : log.action.includes('upload') || log.action.includes('paper')
                      ? 'bg-violet-100 text-violet-700'
                      : log.action.includes('login')
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {log.action.includes('upload') ? (
                    <UploadCloud className="w-4 h-4" />
                  ) : log.action.includes('login') ? (
                    <UserCheck className="w-4 h-4" />
                  ) : log.action.includes('fail') ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{log.title}</p>
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {log.details || 'System event'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    User: <span className="font-medium text-slate-600">{log.user_display}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 text-[11px] text-slate-400">
                {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
              </div>
            </div>
          ))}

          {activityLogs.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-8">
              No recent audit activity recorded.
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. ROW 5: RESEARCH WORKSPACE SECTION (SUPERUSER CAN USE FOR RESEARCH)     */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-300">
                Superuser Research Workspace
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Academic Research Suite
            </h2>
            <p className="text-xs text-indigo-200 max-w-xl">
              Conduct academic investigations, upload PDFs, extract references, verify CrossRef registries, and synthesize citation intelligence directly from your administrator workspace.
            </p>
          </div>

          {/* Research Workspace Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Research Paper</span>
            </button>
            <button
              onClick={() => onNavigate('papers')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>My Research ({myPapers.length})</span>
            </button>
            <button
              onClick={() => onNavigate('recommendations')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Recommendations</span>
            </button>
            <button
              onClick={() => onNavigate('citations')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Network className="w-4 h-4 text-emerald-300" />
              <span>Citation Intelligence</span>
            </button>
          </div>
        </div>

        {/* Superuser's Personal Papers Preview (Separated from System Papers) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>My Research Papers (Superuser Private Library)</span>
            </h3>
            <button
              onClick={() => onNavigate('papers')}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-semibold"
            >
              <span>View Full Library</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {myPapers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
              <p className="text-xs text-indigo-200">
                You have not uploaded any personal research papers yet under your superuser account.
              </p>
              <button
                onClick={() => onNavigate('upload')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Paper</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPapers.slice(0, 3).map((paper) => (
                <div
                  key={paper.id}
                  className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 space-y-3 hover:bg-white/15 transition-all"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white truncate">{paper.title || paper.filename}</p>
                    <p className="text-[11px] text-indigo-200 truncate">
                      {Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || 'Authors parsed')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-indigo-300 border-t border-white/10 pt-2.5">
                    <span>{paper.reference_count || 0} references</span>
                    <button
                      onClick={() => onViewPaper(paper.id)}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. ROW 6: ALL USERS (USER MONITORING TABLE WITH FILTERS & SEARCH)         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">All Registered Users</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect registered researcher accounts, role permissions, and publication activity
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users or emails..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Role Filter */}
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="superuser">Superuser</option>
            </select>

            {/* Date Filter */}
            <select
              value={userDateFilter}
              onChange={(e) => setUserDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-center">Papers</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingUsers ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-indigo-500" />
                    Loading registered user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-xs text-slate-400 italic">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {u.picture ? (
                          <img src={u.picture} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                        )}
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
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. ROW 7: ALL RESEARCH PAPERS (GLOBAL PAPER MONITORING + ACTIONS)         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              <h2 className="text-base font-bold text-slate-900">All Research Papers (System Registry)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Global repository of all uploaded academic literature across all researchers with administrative governance
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, owner, or authors..."
                value={paperSearch}
                onChange={(e) => setPaperSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={paperStatusFilter}
              onChange={(e) => setPaperStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            {/* Date Filter */}
            <select
              value={paperDateFilter}
              onChange={(e) => setPaperDateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Global Papers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Paper Title</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">References</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingPapers ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-violet-500" />
                    Loading system papers...
                  </td>
                </tr>
              ) : systemPapers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-slate-400 italic">
                    No research papers found in the global registry.
                  </td>
                </tr>
              ) : (
                systemPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{paper.title || paper.filename}</p>
                      <p className="text-[11px] text-slate-400 truncate">{paper.filename}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <p className="font-bold text-slate-800 text-[11px]">{paper.owner_name || 'Academic Scholar'}</p>
                      <p className="font-mono text-[10px] text-slate-400 truncate">{paper.owner_email || 'Unassigned'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {paper.uploaded_at ? new Date(paper.uploaded_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          paper.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : paper.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            paper.status === 'completed'
                              ? 'bg-emerald-500'
                              : paper.status === 'failed'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {paper.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {paper.reference_count || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewPaper(paper.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setDeleteModal({ id: paper.id, title: paper.title || paper.filename })}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. GLOBAL SEARCH MODAL                                                    */}
      {/* ========================================================================= */}
      {globalSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Global System Search</h3>
              </div>
              <button
                onClick={() => setGlobalSearchOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGlobalSearch} className="p-4 sm:p-6 border-b border-slate-100 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search Users, Emails, Paper Titles, Authors, References..."
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !globalQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {!globalResults && !isSearching && (
                <div className="text-center py-10 text-xs text-slate-400">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Type a search term and press Search to query all registered accounts, paper manuscripts, and reference records.</p>
                </div>
              )}

              {globalResults && (
                <div className="space-y-6">
                  {/* Users Matches */}
                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">
                      Matching Users ({globalResults.users?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {globalResults.users?.map((u) => (
                        <div key={u.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{u.role}</span>
                        </div>
                      ))}
                      {(!globalResults.users || globalResults.users.length === 0) && (
                        <p className="text-xs text-slate-400 italic">No users matched query.</p>
                      )}
                    </div>
                  </div>

                  {/* Papers Matches */}
                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">
                      Matching Papers ({globalResults.papers?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {globalResults.papers?.map((p) => (
                        <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-3">
                            <p className="font-bold text-slate-900 truncate">{p.title || p.filename}</p>
                            <p className="text-[11px] text-slate-500">Owner: {p.owner_email || 'Unassigned'}</p>
                          </div>
                          <button
                            onClick={() => {
                              setGlobalSearchOpen(false);
                              onViewPaper(p.id);
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors shrink-0"
                          >
                            View
                          </button>
                        </div>
                      ))}
                      {(!globalResults.papers || globalResults.papers.length === 0) && (
                        <p className="text-xs text-slate-400 italic">No papers matched query.</p>
                      )}
                    </div>
                  </div>

                  {/* References Matches */}
                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">
                      Matching References ({globalResults.references?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {globalResults.references?.map((r) => (
                        <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-3">
                            <p className="font-bold text-slate-900 truncate">{r.title || r.raw_text}</p>
                            <p className="text-[11px] text-slate-500">From Paper: {r.paper_title || 'Document'}</p>
                          </div>
                          <button
                            onClick={() => {
                              setGlobalSearchOpen(false);
                              onViewPaper(r.document_id);
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors shrink-0"
                          >
                            Inspect
                          </button>
                        </div>
                      ))}
                      {(!globalResults.references || globalResults.references.length === 0) && (
                        <p className="text-xs text-slate-400 italic">No references matched query.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. DELETE CONFIRMATION MODAL                                             */}
      {/* ========================================================================= */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete this research paper?</h3>
              <p className="text-xs text-slate-500">
                You are about to permanently remove <strong className="text-slate-800">"{deleteModal.title}"</strong> and all associated child analyses, references, summaries, and physical storage files from the system.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePaper}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
