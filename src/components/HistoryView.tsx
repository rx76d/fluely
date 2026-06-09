import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Clock, FileText, ChevronRight } from 'lucide-react';

interface Session {
  id: number;
  title: string;
  date: string;
  transcript: string;
  summary: string;
  action_items: string;
}

export function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await invoke<Session[]>('get_sessions');
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
          <Clock className="text-white/30" size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No past sessions</h3>
        <p className="text-sm text-white/50 max-w-sm">
          Your meeting history will appear here. Start a new session to record transcripts and get insights.
        </p>
      </div>
    );
  }

  const parseActionItems = (json: string): string[] => {
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  };

  return (
    <div className="p-6 h-full flex flex-col relative overflow-hidden">
      <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2 mb-6">
        <Clock size={20} className="text-blue-400" />
        Meeting History
      </h2>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setSelectedSession(session)}
            className="group bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <FileText size={16} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{session.title}</h4>
                <p className="text-xs text-white/50">{new Date(session.date).toLocaleString()}</p>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={18} className="text-white/40 group-hover:text-white/80" />
            </div>
          </div>
        ))}
      </div>

      
      {selectedSession && (
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl z-50 p-8 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedSession(null)}
              className="mb-8 text-sm text-white/40 hover:text-white flex items-center gap-2 transition-colors group"
            >
              <div className="rotate-180 group-hover:-translate-x-1 transition-transform">
                <ChevronRight size={18} />
              </div>
              Back to History
            </button>

            <header className="mb-10">
              <div className="flex items-center gap-3 text-blue-400 mb-2">
                <Clock size={16} />
                <span className="text-xs font-semibold uppercase tracking-widest">{new Date(selectedSession.date).toLocaleString()}</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">{selectedSession.title}</h1>
              <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
            </header>

            <div className="space-y-10">
              <section>
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-[2px] mb-4">Summary</h3>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-zinc-300 leading-relaxed text-[15px]">
                  {selectedSession.summary || "No summary available for this session."}
                </div>
              </section>

              {parseActionItems(selectedSession.action_items).length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-white/30 uppercase tracking-[2px] mb-4">Action Items</h3>
                  <ul className="space-y-3">
                    {parseActionItems(selectedSession.action_items).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-zinc-300 bg-white/5 border border-white/5 rounded-xl p-4">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[14px]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-[2px] mb-4">Transcript</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 font-mono text-[13px] text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {selectedSession.transcript}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
