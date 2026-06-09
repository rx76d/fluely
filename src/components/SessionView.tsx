import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../useStore';
import { GlassPanel } from './GlassPanel';
import { Settings as SettingsPanel } from '../Settings';
import { Mic, MicOff, Send, Clock, Settings as SettingsIcon, ArrowRight, XSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { register } from '@tauri-apps/plugin-global-shortcut';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export function SessionView() {
  const appWindow = getCurrentWindow();
  const { isMicActive, toggleMic, liveInsights, aiResponses, addAiResponse, updateAiResponse, liveTranscript, setAppState, provider, model, isVisionEnabled, settingsVersion, setConnectionStatus, connectionStatus, isNotificationEnabled, userProfile } = useStore();
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');


  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const scroll = () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: isLoading ? 'smooth' : 'auto'
        });
      };
      requestAnimationFrame(scroll);
    }
  }, [aiResponses.length, streamingResponse, isLoading]);



  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = (n: number) => String(n).padStart(2, '0');
  const hours = fmt(Math.floor(elapsed / 3600));
  const mins = fmt(Math.floor((elapsed % 3600) / 60));
  const secs = fmt(elapsed % 60);

  useEffect(() => {
    invoke('set_mic_active', { active: isMicActive }).catch(console.error);
  }, [isMicActive]);

  useEffect(() => {
    const setupShortcut = async () => {
      try {
        await register('CommandOrControl+Space', async (shortcut) => {
          if (shortcut.state === "Pressed") {
            const win = getCurrentWindow();
            const isVisible = await win.isVisible();
            if (isVisible) {
              await win.hide();
            } else {
              await win.show();
              await win.setFocus();
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        });
      } catch (err) {
        console.error("Failed to register shortcut", err);
      }
    };
    setupShortcut();

    let unlisten: () => void;
    const setupAudioListener = async () => {
      try {
        const unlistener = await listen<string>('transcript', (event) => {
          try {


            const data = JSON.parse(event.payload);
            useStore.getState().addTranscript({
              speaker: data.speaker || 'System',
              text: data.text,
              timestamp: Date.now()
            });
          } catch (e) {


            useStore.getState().addTranscript({
              speaker: 'System Mic',
              text: event.payload,
              timestamp: Date.now()
            });
          }
        });
        unlisten = unlistener;
      } catch (err) {
        console.error("Failed to hook into audio listener:", err);
      }
    };
    setupAudioListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    const verifyConnection = async () => {
      setConnectionStatus('verifying');
      try {
        let apiKey = "LOCAL_INFERENCE";
        const isLocal = provider.toLowerCase().includes('ollama') || provider.toLowerCase().includes('local');

        if (!isLocal) {
          try {
            const active: [string, string] | null = await invoke('db_get_active_key');
            if (!active) {
              updateAiResponse(1, `**System:** API Key not found! Please configure it in Settings.`);
              setConnectionStatus('error');
              return;
            }
            apiKey = active[0];
          } catch (e) {
            updateAiResponse(1, `**System:** Database error. Please check Settings.`);
            setConnectionStatus('error');
            return;
          }
        }

        
        await invoke('ask_llm', {
          prompt: "Connection test. Response with 'OK' if you can hear me. Keep it extremely brief.",
          imageBase64: "",
          transcriptContext: "Connection test.",
          apiKey,
          provider,
          model
        });

        updateAiResponse(1, `**System:** Connection to **${provider}** is successful. Using model **${model}**.`);
        setConnectionStatus('connected');


      } catch (err) {
        console.error("Connection check failed:", err);
        updateAiResponse(1, `**System:** Failed to connect to **${provider}**: \`${err}\``);
        setConnectionStatus('error');
      }
    };

    verifyConnection();
  }, [provider, model, settingsVersion]);

  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (isMicActive) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text) {
              useStore.getState().addTranscript({
                speaker: 'You',
                text,
                timestamp: Date.now()
              });
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          if (isMicActive && recognition) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart speech recognition:', e);
            }
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to start speech recognition:', e);
        }
      }
    } else {
      console.warn('SpeechRecognition API is not supported in this browser.');
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        try {
          recognition.stop();
        } catch (e) {
          console.error('Failed to stop speech recognition:', e);
        }
      }
    };
  }, [isMicActive]);



  useEffect(() => {
    if (!isNotificationEnabled) return;

    const notify = async () => {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      if (permissionGranted && aiResponses.length > 0) {
        const lastResponse = aiResponses[aiResponses.length - 1];
        if (!lastResponse.includes('System:') && !lastResponse.includes('Establishing connection')) {
          sendNotification({
            title: 'New AI Insight',
            body: lastResponse.replace(/\*\*|#|\*/g, '').slice(0, 100) + '...',
          });
        }
      }
    };

    notify();
  }, [aiResponses.length]);



  const { setLiveInsights } = useStore();
  const lastProcessedTranscriptLength = useRef(0);
  const liveTranscriptRef = useRef(liveTranscript);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  const generateInsights = async () => {
    const currentTranscript = liveTranscriptRef.current;
    if (currentTranscript.length === 0) return;

    setIsGeneratingInsights(true);
    try {
      const transcriptText = currentTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');

      let apiKey = "LOCAL_INFERENCE";
      const isLocal = provider.toLowerCase().includes('ollama') || provider.toLowerCase().includes('local');

      if (!isLocal) {
        const active: [string, string] | null = await invoke('db_get_active_key');
        if (active) {
          apiKey = active[0];
        } else {
          setIsGeneratingInsights(false);
          return;
        }
      }

      const userContext = userProfile.name ? `User: ${userProfile.name}, Role: ${userProfile.role}, Skills: ${userProfile.skills}, Goals: ${userProfile.goals}.` : "";

      const summaryResponse = await invoke<string>('ask_llm', {
        prompt: `Based on this transcript and the user's profile (${userContext}), please provide a concise 'summary' (1 paragraph), a list of 'actionItems' (array of strings), and a 'suggestedAnswer' (string, if the last speaker was 'Interviewer' and asked a question). Format strictly as JSON: { \"summary\": \"...\", \"actionItems\": [\"...\"], \"suggestedAnswer\": \"...\" }`,
        imageBase64: "",
        transcriptContext: transcriptText,
        apiKey,
        provider,
        model
      });

      const insights = JSON.parse(summaryResponse);
      setLiveInsights(insights);
      lastProcessedTranscriptLength.current = currentTranscript.length;
    } catch (err) {
      console.error("Failed to generate live insights:", err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (liveTranscript.length === 0 || liveTranscript.length === lastProcessedTranscriptLength.current) return;

    const timer = setTimeout(() => {
      generateInsights();
    }, 4000);

    return () => clearTimeout(timer);
  }, [liveTranscript, provider, model]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const currentQuery = query;
    setQuery('');
    setIsLoading(true);

    try {
      let apiKey = "LOCAL_INFERENCE";

      const isLocal = provider.toLowerCase().includes('ollama') || provider.toLowerCase().includes('local');

      if (!isLocal) {
        try {
          const active: [string, string] | null = await invoke('db_get_active_key');
          if (!active) {
            addAiResponse(`**System:** API Key not found! Please configure it in Settings.`);
            setIsLoading(false);
            return;
          }
          apiKey = active[0];
        } catch (e) {
          addAiResponse(`**System:** Database error. Please check Settings.`);
          setIsLoading(false);
          return;
        }
      }

      const imageBase64 = isVisionEnabled ? await invoke<string>('capture_screen') : "";

      const last10 = liveTranscript.slice(-10).map(i => `${i.speaker}: ${i.text}`).join('\n');
      const transcriptContext = last10.length > 0 ? last10 : "Meeting just started, no context yet.";
      const userContext = userProfile.name ? `User: ${userProfile.name}, Role: ${userProfile.role}, Skills: ${userProfile.skills}, Goals: ${userProfile.goals}.` : "";

      const response = await invoke<string>('ask_llm', {
        prompt: `${userContext}\n\nUser Question: ${currentQuery}`,
        imageBase64,
        transcriptContext,
        apiKey,
        provider,
        model
      });



      setIsLoading(false);
      let streamedText = `**Q: ${currentQuery}**\n\n`;
      setStreamingResponse(streamedText);

      for (let i = 0; i < response.length; i++) {
        streamedText += response[i];
        setStreamingResponse(streamedText);


        const delay = response.length > 500 ? 5 : 15;
        await new Promise(r => setTimeout(r, delay));
      }

      addAiResponse(streamedText);
      setStreamingResponse('');
    } catch (error) {
      console.error("Pipeline failure:", error);
      addAiResponse(`**Q: ${currentQuery}**\n\n*Error:* \`${error}\``);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleEndSession = async () => {
    try {
      const fullTranscriptText = liveTranscript.map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker}: ${t.text}`).join('\n');
      const title = `Insightful Session on ${new Date().toLocaleDateString()}`;
      const summary = liveInsights.summary;
      const actionItems = JSON.stringify(liveInsights.actionItems);
      await invoke('save_session', { title, transcript: fullTranscriptText, summary, action_items: actionItems });
    } catch (err) {
      console.error("Failed to save session", err);
    }

    try {
      await invoke('set_home_mode');
    } catch (err) {
      console.error("Failed to restore home window mode", err);
    } finally {
      setAppState('HOME');
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col font-sans text-zinc-200 text-sm relative p-8 gap-8"
      style={{


        backgroundColor: 'transparent',
      }}
    >

      {showSettings && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-black/40">
          <GlassPanel noBlur className="w-full max-w-sm p-8 flex flex-col gap-8 relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
              <SettingsIcon size={20} />
            </button>
            <SettingsPanel />
          </GlassPanel>
        </div>
      )}



      <div className="absolute top-5 left-5 flex gap-2.5 z-50 pointer-events-auto">
        <div className="w-3.5 h-3.5 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors cursor-pointer border border-red-600/10 shadow-sm" onClick={() => appWindow.close()}></div>
        <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80 hover:bg-yellow-500 transition-colors cursor-pointer border border-yellow-600/10 shadow-sm" onClick={() => appWindow.minimize()}></div>
        <div className="w-3.5 h-3.5 rounded-full bg-green-400/80 hover:bg-green-500 transition-colors cursor-pointer border border-green-600/10 shadow-sm" onClick={() => appWindow.toggleMaximize()}></div>
      </div>



      <GlassPanel
        noBlur
        className="h-12 px-[20px] select-none relative flex-shrink-0 mt-4"
      >
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-[20px] z-10">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock size={14} className="opacity-70" />
              <div className="flex items-center gap-3">
                <span className="font-mono text-[13px] tracking-tight font-bold text-zinc-300">{hours}:{mins}:{secs}</span>
                <span className="text-[9px] uppercase tracking-[1px] text-zinc-500 font-bold opacity-60">Session Live</span>
              </div>
            </div>
          </div>



          <div data-tauri-drag-region className="absolute inset-0 z-0 cursor-move"></div>

          <div className="flex items-center gap-4 z-10 pointer-events-auto">
            <button
              onClick={toggleMic}
              title={isMicActive ? 'Pause Mic' : 'Resume Mic'}
              className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${isMicActive ? 'text-red-400' : 'text-zinc-400 hover:text-white'
                }`}
            >
              {isMicActive ? (
                <Mic size={20} className="animate-pulse" />
              ) : (
                <MicOff size={20} />
              )}
            </button>

            <button
              onClick={handleEndSession}
              title="End Session"
              className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-white/10 transition-all duration-300"
            >
              <XSquare size={20} />
            </button>
          </div>
        </div>
      </GlassPanel>



      <div className="flex-1 flex gap-8 overflow-hidden">



        <GlassPanel noBlur className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-zinc-500 mb-1">Live Insights</h2>
              <div className="h-px w-24 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>
            {liveTranscript.length > 0 && (
              <button
                onClick={generateInsights}
                disabled={isGeneratingInsights}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 disabled:text-zinc-600 transition-colors flex items-center gap-1.5"
              >
                {isGeneratingInsights ? (
                  <>
                    <span className="w-2 h-2 rounded-full border border-blue-400 border-t-transparent animate-spin"></span>
                    Updating...
                  </>
                ) : (
                  'Update Now'
                )}
              </button>
            )}
          </div>

          <div className="space-y-8">
            {liveInsights.suggestedAnswer && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-[1px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                  Suggested Answer (For You)
                </h3>
                <div className="text-white leading-relaxed text-[15px] font-semibold bg-gradient-to-r from-green-500/10 to-blue-500/10 p-6 rounded-[24px] border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  {liveInsights.suggestedAnswer}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-[1px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                Executive Summary
              </h3>
              {!liveInsights.summary || liveInsights.summary === "Meeting just started. Establishing context..." ? (
                <div className="flex items-center gap-3 text-zinc-500 p-4 border border-dashed border-white/5 rounded-2xl animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-[13px] font-medium tracking-wide">Listening to conversation to generate summary...</span>
                </div>
              ) : (
                <div className="pl-4 border-l-2 border-blue-500/50 text-zinc-300 leading-relaxed text-[14px] font-medium transition-all duration-300">
                  {liveInsights.summary}
                </div>
              )}
            </div>

            {liveInsights.actionItems.length > 0 && (
              <div>
                <h3 className="text-[14px] font-semibold text-white mb-5 flex items-center gap-2 uppercase tracking-[1px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"></span>
                  Action Items
                </h3>
                <ul className="space-y-4 divide-y divide-white/5 pl-2">
                  {liveInsights.actionItems.map((item, idx) => (
                    <li key={idx} className={`${idx > 0 ? 'pt-4' : ''} flex items-start gap-3 text-[14px] text-zinc-300 transition-colors group`}>
                      <ArrowRight size={15} className="mt-1 text-purple-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4">
              <h3 className="text-[11px] font-bold tracking-[2px] uppercase text-zinc-500 mb-4">Live Transcript Feed</h3>
              <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar pl-1">
                {liveTranscript.slice(-10).map((t, idx) => (
                  <div 
                    key={idx} 
                    className={`pl-4 border-l-2 relative transition-all duration-300 ${
                      t.speaker === 'Interviewer' 
                        ? 'border-red-500/40 hover:border-red-500' 
                        : 'border-blue-500/40 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${t.speaker === 'Interviewer' ? 'text-red-400' : 'text-blue-400'}`}>
                        {t.speaker}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">{t.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold tracking-[1.5px] uppercase text-zinc-400">
                    Transcript Simulator
                  </h4>
                  <span className="text-[9px] text-zinc-500 font-medium">Test insights and suggested answers</span>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Type a simulated message..."
                    className="flex-1 bg-white/5 border border-white/5 hover:border-white/10 focus:border-blue-500/30 rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all font-medium"
                    id="simulator-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const text = input.value.trim();
                        if (text) {
                          useStore.getState().addTranscript({
                            speaker: 'You',
                            text,
                            timestamp: Date.now()
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('simulator-input') as HTMLInputElement;
                      const text = input?.value.trim();
                      if (text) {
                        useStore.getState().addTranscript({
                          speaker: 'You',
                          text,
                          timestamp: Date.now()
                        });
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 text-xs font-bold rounded-xl transition-all"
                  >
                    Send You
                  </button>
                  <button
                    onClick={() => {
                      const input = document.getElementById('simulator-input') as HTMLInputElement;
                      const text = input?.value.trim();
                      if (text) {
                        useStore.getState().addTranscript({
                          speaker: 'Interviewer',
                          text,
                          timestamp: Date.now()
                        });
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-400 text-xs font-bold rounded-xl transition-all"
                  >
                    Send Interviewer
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Tell me about yourself", speaker: "Interviewer", text: "Could you tell me a bit about yourself and your background?" },
                    { label: "Why do you want this role?", speaker: "Interviewer", text: "What makes you interested in this role and our company?" },
                    { label: "Your experience with React", speaker: "Interviewer", text: "Can you explain your experience building applications with React?" },
                    { label: "My background", speaker: "You", text: "I have over 4 years of experience as a software engineer, specializing in full-stack JavaScript applications." },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        useStore.getState().addTranscript({
                          speaker: item.speaker,
                          text: item.text,
                          timestamp: Date.now()
                        });
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                        item.speaker === 'Interviewer'
                          ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/10 text-red-400 hover:border-red-500/30'
                          : 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10 text-blue-400 hover:border-blue-500/30'
                      }`}
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel noBlur className="flex-1 flex flex-col p-8 relative overflow-hidden">
          <div className="mb-6 z-10 px-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-zinc-500">AI Assistant</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                    connectionStatus === 'verifying' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.4)]' :
                      'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  }`}></div>
                <span className={`text-[9px] uppercase tracking-wider font-bold ${connectionStatus === 'connected' ? 'text-green-500' :
                    connectionStatus === 'verifying' ? 'text-yellow-500' :
                      'text-red-500'
                  }`}>{connectionStatus}</span>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-blue-500/20 to-transparent"></div>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden z-10 space-y-6 pr-2 custom-scrollbar"
          >
            {aiResponses.map((res, idx) => (
              <div key={idx} className="transition-all break-words whitespace-pre-wrap">
                <ReactMarkdown className="text-[14px] text-zinc-200 leading-relaxed font-medium prose prose-sm max-w-none prose-headings:text-white prose-strong:text-blue-400 break-words">
                  {res}
                </ReactMarkdown>
              </div>
            ))}

            {streamingResponse && (
              <div className="transition-all break-words whitespace-pre-wrap">
                <ReactMarkdown className="text-[14px] text-zinc-200 leading-relaxed font-medium prose prose-sm max-w-none prose-headings:text-white prose-strong:text-blue-400 break-words">
                  {streamingResponse}
                </ReactMarkdown>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 px-6 py-4 text-zinc-500 text-[13px] font-medium animate-pulse">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[11px] uppercase tracking-[1.5px] text-zinc-500 ml-1 font-semibold">Analyzing...</span>
              </div>
            )}
          </div>
        </GlassPanel>

      </div>



      <GlassPanel noBlur className="h-20 flex-shrink-0 flex items-center px-6 shadow-lg group">
        <form onSubmit={handleAsk} className="w-full flex items-center h-full relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "Analyzing..." : "Ask the AI about the current insight..."}
            className="w-full h-full bg-transparent border-none outline-none text-white px-6 placeholder:text-zinc-600 text-[14px] focus:ring-0 focus:outline-none disabled:opacity-50 font-medium tracking-[0.5px]"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-3 p-3 bg-white hover:bg-zinc-200 disabled:bg-white/5 disabled:text-zinc-600 text-zinc-900 rounded-[16px] transition-all shadow-md flex items-center justify-center group/btn active:scale-90"
          >
            <Send size={20} className={`transition-transform ${!isLoading && 'group-hover/btn:translate-x-0.5'}`} />
          </button>
        </form>
      </GlassPanel>

    </div>
  );
}