import { Book, Github, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function Help() {
  const gettingStarted = `
Fluely is your private, local-first meeting assistant. It captures your system audio and uses AI to provide live insights, summaries, and action items without compromising your privacy.

1. **Set up your API Key** in Settings (Gemini, OpenAI, etc.).
2. **Click Start Session** to begin capturing a meeting.
3. **Use the Overlay** to interact with the AI assistant in real-time.
4. **View your Meeting History** on the home dashboard.
  `;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-10 custom-scrollbar">

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Book size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Getting Started</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown className="text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">
              {gettingStarted}
            </ReactMarkdown>
          </div>
        </section>

        
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Github size={18} className="text-gray-900 dark:text-white" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Open Source</h3>
          </div>
          <a 
            href="https://github.com/rx76d/fluely" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-6 bg-gray-900 hover:bg-black text-white rounded-3xl transition-all shadow-xl active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                <Github size={24} />
              </div>
              <div>
                <span className="block font-bold text-lg">rx76d / fluely</span>
                <span className="text-xs text-white/50 font-medium">Star the repo on GitHub</span>
              </div>
            </div>
            <ExternalLink size={20} className="text-white/30 group-hover:text-white transition-colors" />
          </a>
        </section>

      </div>
      
      <div className="p-6 border-t border-gray-50 dark:border-white/5 text-center">
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-300 dark:text-zinc-600 italic">
          Fluely v1.0 • Built for Cheating
        </p>
      </div>
    </div>
  );
}
