import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  CheckCheck, 
  Sliders, 
  Filter, 
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import notificationService from '../../services/notificationService';

const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, APPLICATION, SCRUTINY, ALLOCATION, DBT, BROADCAST
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getMyNotifications(unreadOnly);
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to fetch alerts. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab === 'UNREAD');
  }, [activeTab]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-300 animate-pulse">URGENT</span>;
      case 'HIGH':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">HIGH</span>;
      case 'NORMAL':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">NORMAL</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">INFO</span>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'SCRUTINY':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'DBT':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'ALLOCATION':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'APPLICATION':
        return <Info className="w-5 h-5 text-[#005696]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.is_read;
    if (activeTab !== 'ALL' && n.category !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (n.title && n.title.toLowerCase().includes(q)) || 
             (n.message && n.message.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Home</span>
              <span>/</span>
              <span className="text-[#005696]">Communication Hub</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Bell className="w-7 h-7 text-[#005696]" />
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Official statutory communications, application alerts, DBT status updates, and broadcast circulars.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark All Read
            </button>
            <Link
              to="/notifications/preferences"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#005696] hover:bg-[#00477D] rounded-lg shadow-xs transition"
            >
              <Sliders className="w-4 h-4" />
              Preferences & DND
            </Link>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'UNREAD', 'APPLICATION', 'SCRUTINY', 'ALLOCATION', 'DBT', 'BROADCAST'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#005696] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'UNREAD' ? `Unread (${unreadCount})` : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005696] w-full sm:w-56"
            />
            <button
              onClick={() => fetchNotifications(activeTab === 'UNREAD')}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Notification List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-[#005696] animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Loading statutory notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
              <p className="text-xs text-slate-500 mt-1">You are all caught up with official updates.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 rounded-xl border transition flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  notif.is_read
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-blue-50/50 border-blue-200 shadow-xs hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {notif.category}
                      </span>
                      {getPriorityBadge(notif.priority)}
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      )}
                    </div>

                    <h2 className="text-sm font-bold text-slate-900">
                      {notif.title}
                    </h2>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notif.is_read && notif.read_at && (
                        <span className="text-emerald-700 font-semibold">
                          Read {new Date(notif.read_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {notif.action_url && (
                    <button
                      onClick={() => {
                        if (!notif.is_read) handleMarkAsRead(notif.id);
                        navigate(notif.action_url);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#005696] hover:bg-[#00477D] text-white text-xs font-bold rounded-lg shadow-2xs transition"
                    >
                      <span>{notif.action_label || 'View'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterPage;
