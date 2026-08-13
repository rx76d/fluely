import { useState, useEffect } from 'react';
import { useStore } from '../useStore';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Search, User, Trash2, Edit2, Check, X as CloseIcon, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { Settings } from '../Settings';
import { Help } from '../Help';
import { Profile } from '../Profile';

interface Session {
  id: number;
  title: string;
  date: string;
  transcript: string;
}

function safeDate(dStr: string): Date {
  if (!dStr) return new Date();
  const isoStr = dStr.includes(' ') && !dStr.includes('T') ? dStr.replace(' ', 'T') : dStr;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function HomeView() {
  const { setAppState, appState } = useStore();
  const appWindow = getCurrentWindow();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSessions = async () => {
    try {
      const data = await invoke<Session[]>('get_sessions');
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [appState]);

  const handleStartSession = async () => {
    try {
      useStore.getState().resetSession();
      const now = new Date();
      const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const title = `Session - ${dateStr} at ${timeStr}`;

      const newId = await invoke<number>('create_session', { title });
      useStore.getState().setActiveSessionId(newId);

      await invoke('set_overlay_mode');
      setAppState('SESSION');
    } catch (e) {
      console.error("Failed to start session:", e);
      setAppState('SESSION');
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await invoke('delete_session', { id });
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const startEditing = (session: Session) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    try {
      await invoke('update_session_title', { id: editingId, title: editTitle });
      setSessions(sessions.map(s => s.id === editingId ? { ...s, title: editTitle } : s));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update session title:", err);
    }
  };

  const filteredSessions = sessions.filter(s =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 flex flex-col font-sans select-none overflow-hidden text-sm border border-gray-200 dark:border-white/5 rounded-xl relative text-gray-800 dark:text-zinc-200 shadow-2xl">


      <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">


        <div className="flex items-center gap-2 mr-6 z-10 pointer-events-auto flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer border border-red-600/10 shadow-sm" onClick={() => appWindow.close()}></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer border border-yellow-600/10 shadow-sm" onClick={() => appWindow.minimize()}></div>
          <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer border border-green-600/10 shadow-sm" onClick={() => appWindow.toggleMaximize()}></div>
        </div>

        <div data-tauri-drag-region className="flex-1 h-full cursor-move"></div>


        <div className="hidden sm:flex flex-1 max-w-[420px] items-center bg-gray-100 dark:bg-white/5 border border-transparent focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-blue-500/30 rounded-xl px-4 py-2 transition-all duration-200 z-10 shadow-inner group">
          <Search size={16} className="text-gray-400 mr-3 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            className="bg-transparent border-none outline-none text-gray-700 dark:text-zinc-300 text-[13px] w-full placeholder:text-gray-400 font-medium"
          />
        </div>

        <div data-tauri-drag-region className="flex-1 h-full cursor-move"></div>


        <div className="flex items-center gap-3 z-10 relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all outline-none cursor-pointer shadow-sm group"
          >
            <User size={18} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-3 w-48 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl py-2 overflow-hidden font-medium z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { setShowProfile(true); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-3 text-xs text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-3"
              >
                Profile
              </button>
              <button
                onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-3 text-xs text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-3 border-t border-gray-50 dark:border-white/5"
              >
                Settings
              </button>
              <button
                onClick={() => { setShowHelp(true); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-3 text-xs text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-3 border-t border-gray-50 dark:border-white/5"
              >
                Help
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 md:p-12 bg-gray-900/20 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-[90vh] rounded-[24px] sm:rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden relative flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User size={20} className="text-blue-500" />
                Interview Profile
              </h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Profile />
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 md:p-12 bg-gray-900/20 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-[90vh] rounded-[24px] sm:rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden relative flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SettingsIcon size={20} className="text-blue-500" />
                App Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Settings />
            </div>
          </div>
        </div>
      )}
      {showHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 md:p-12 bg-gray-900/20 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl h-[90vh] rounded-[24px] sm:rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden relative flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HelpCircle size={20} className="text-blue-500" />
                Help & Documentation
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Help />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col px-4 sm:px-8 md:px-12 lg:px-20 pt-6 sm:pt-10 overflow-hidden bg-gradient-to-b from-gray-50/50 dark:from-white/5 to-white dark:to-zinc-950 transition-all duration-300">

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Fluely</h1>
              <p className="text-gray-500 dark:text-zinc-400 text-[11px] sm:text-[13px] mt-1 font-medium line-clamp-1 sm:line-clamp-none">Capture insights from your system audio.</p>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="px-6 sm:px-10 py-3 sm:py-4 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-200 text-white dark:text-gray-900 font-bold rounded-2xl shadow-xl shadow-black/5 transition-all text-[13px] sm:text-[15px] tracking-wide active:scale-95 flex items-center gap-3"
          >
            Start <span className="hidden sm:inline">Session</span>
          </button>
        </div>


        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase">Meeting History</h3>
            <span className="text-gray-300 text-[11px] font-medium">{filteredSessions.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-3">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between px-6 py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md rounded-2xl transition-all group relative">
                  <div className="flex-1 mr-4">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="bg-gray-50 dark:bg-zinc-900 border border-blue-200 dark:border-blue-500/30 rounded-lg px-3 py-1 text-gray-900 dark:text-white font-medium text-[13px] w-full outline-none focus:ring-2 ring-blue-500/20"
                        />
                        <button onClick={saveEdit} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-zinc-400 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                          <CloseIcon size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-zinc-100 font-semibold text-[14px]">{session.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                            {safeDate(session.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-white/10"></span>
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                            {safeDate(session.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => startEditing(session)}
                        className="p-2 text-gray-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:border-blue-100 dark:group-hover:border-blue-500/20 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all">
                      {session.transcript.split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-gray-300 dark:text-zinc-700">
                  <Search size={24} />
                </div>
                <p className="text-gray-400 dark:text-zinc-500 font-medium">No meetings found.</p>
                <button onClick={() => setSearchQuery('')} className="text-blue-500 dark:text-blue-400 text-xs font-bold mt-2 hover:underline">Clear search</button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
