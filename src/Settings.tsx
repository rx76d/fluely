import { useState, useEffect } from 'react';
import { Key, Monitor, Moon, Sun, Volume2, Bell, Cpu, Layers, Eye, Trash2, CheckCircle2, Plus, Edit2, X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useStore, type Theme } from './useStore';

export function Settings() {
  const {
    theme, setTheme,
    provider, setProvider,
    model, setModel,
    isVisionEnabled, setIsVisionEnabled,
    isNotificationEnabled, setIsNotificationEnabled
  } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [savedKeys, setSavedKeys] = useState<{ id: string, name: string, provider: string }[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [newKeyProvider, setNewKeyProvider] = useState(provider);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editProvider, setEditProvider] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [skipNextRefresh, setSkipNextRefresh] = useState(false);

  const providers = [
    {
      name: 'Gemini',
      description: 'Gemini 3.1 & 2.5 Series - Next-generation Agentic Multimodal AI',
      models: [
        { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', description: 'Advanced intelligence, complex problem-solving skills, and powerful agentic and vibe coding capabilities.' },
        { id: 'gemini-3-flash', label: 'Gemini 3 Flash', description: 'Frontier-class performance rivaling larger models at a fraction of the cost.' },
        { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', description: 'Frontier-class performance rivaling larger models at a fraction of the cost.' },
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Best price-performance model for low-latency, high-volume tasks that require reasoning.' },
        { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', description: 'The fastest and most budget-friendly multimodal model in the 2.5 family.' },
        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Our most advanced model for complex tasks, featuring deep reasoning and coding capabilities.' },
      ]
    },
    {
      name: 'OpenAI',
      description: 'GPT-5.5 & GPT-5.4 - Frontier Intelligence for Coding & Agents',
      models: [
        { id: 'gpt-5.5', label: 'GPT-5.5', description: 'A new class of intelligence for coding and professional work.' },
        { id: 'gpt-5.5-pro', label: 'GPT-5.5 pro', description: 'Produces smarter and more precise responses.' },
        { id: 'gpt-5.4', label: 'GPT-5.4', description: 'More affordable model for coding and professional work.' },
        { id: 'gpt-5.4-pro', label: 'GPT-5.4 pro', description: 'Version of GPT-5.4 that produces smarter responses.' },
        { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini', description: 'Strongest mini model for coding and computer use.' },
        { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano', description: 'Cheapest GPT-5.4-class model for high-volume tasks.' },
        { id: 'gpt-5-mini', label: 'GPT-5 mini', description: 'Near-frontier intelligence for cost-sensitive workloads.' },
        { id: 'gpt-5-nano', label: 'GPT-5 nano', description: 'Fastest, most cost-efficient version of GPT-5.' },
        { id: 'gpt-5', label: 'GPT-5', description: 'Previous intelligent reasoning model for coding.' },
        { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Smartest non-reasoning model.' }
      ]
    },
    {
      name: 'Anthropic',
      description: 'Claude 4.7 & 4.6 - Adaptive Thinking & Agentic Coding',
      models: [
        { id: 'claude-opus-4-7', label: 'Claude 4.7 Opus', description: 'Most capable model for complex reasoning and agentic coding.' },
        { id: 'claude-sonnet-4-6', label: 'Claude 4.6 Sonnet', description: 'Best combination of speed and intelligence.' },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude 4.5 Haiku', description: 'Fastest model with near-frontier intelligence.' },
        { id: 'claude-opus-4-6', label: 'Claude 4.6 Opus', description: 'Advanced intelligence and vision processing.' },
        { id: 'claude-sonnet-4-5-20250929', label: 'Claude 4.5 Sonnet', description: 'High-performance multimodal intelligence.' },
        { id: 'claude-opus-4-5-20251101', label: 'Claude 4.5 Opus', description: 'Frontier reasoning and task execution.' }
      ]
    },
    {
      name: 'Grok',
      description: 'xAI Grok-4.3 - Industry Leading Instruction Following & Tool Use',
      models: [
        { id: 'grok-4.3', label: 'Grok-4.3', description: 'Most advanced flagship model, leading in non-hallucination rate and instruction following.' }
      ]
    },
    {
      name: 'Mistral',
      description: 'Mistral 3.5 & 4 - Unified Multimodal Reasoning Flagships',
      models: [
        { id: 'mistral-medium-3.5', label: 'Mistral Medium 3.5', description: 'Multimodal model optimized for agentic and coding use cases.' },
        { id: 'mistral-small-4', label: 'Mistral Small 4', description: 'Hybrid model unifying instruct, reasoning, and coding.' },
        { id: 'mistral-large-3', label: 'Mistral Large 3', description: 'State-of-the-art, open-weight general-purpose multimodal model.' },
        { id: 'mistral-medium-3.1', label: 'Mistral Medium 3.1', description: 'Frontier-class multimodal model released August 2025.' },
        { id: 'ministral-3-14b', label: 'Ministral 3 14B', description: 'Powerful model offering best-in-class text and vision.' },
        { id: 'ministral-3-8b', label: 'Ministral 3 8B', description: 'Powerful and efficient text and vision capabilities.' },
        { id: 'ministral-3-3b', label: 'Ministral 3 3B', description: 'Tiny and efficient model with best-in-class vision.' },
        { id: 'magistral-medium-1.2', label: 'Magistral Medium 1.2', description: 'Frontier-class multimodal reasoning model.' }
      ]
    },
    {
      name: 'DeepSeek',
      description: 'DeepSeek V4 - Native Multimodal Flagship',
      models: [
        { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', description: 'High-speed native multimodal performance.' },
        { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', description: 'Advanced native multimodal flagship.' }
      ]
    },
    {
      name: 'Qwen',
      description: 'Qwen 3.5 & 3 - Massive-scale Multimodal Reasoning',
      models: [
        { id: 'qwen3.5-plus', label: 'Qwen 3.5 Plus', description: '1M context. Inputs: Text, Image, Video.' },
        { id: 'qwen3.5-flash', label: 'Qwen 3.5 Flash', description: '1M context. Fast multimodal intelligence.' },
        { id: 'qwen3-max', label: 'Qwen 3 Max', description: '262k context. Flagship text-only model.' },
        { id: 'qwen3-vl-plus', label: 'Qwen 3 VL Plus', description: '131k context. Specialized vision flagship.' },
        { id: 'qwen3-vl-flash', label: 'Qwen 3 VL Flash', description: '131k context. Rapid visual reasoning.' },
        { id: 'qwen3-omni-flash', label: 'Qwen 3 Omni Flash', description: '65k context. Inputs: Text, Image, Audio, Video.' }
      ]
    },
    {
      name: 'Kimi',
      description: 'Moonshot AI Kimi K2.6 - Versatile Native Multimodal Flagship',
      models: [
        { id: 'kimi-k2.6', label: 'Kimi K2.6', description: "Kimi's most intelligent model. 256k context. Agent, code, and visual SOTA." },
        { id: 'kimi-k2.5', label: 'Kimi K2.5', description: "Previous flagship. 256k context. High performance in Agent and complex tasks." }
      ]
    },
    {
      name: 'ZAI',
      description: 'Zhipu AI GLM-5.1 - Reasoning & Agentic Foundation Flagship',
      models: [
        { id: 'glm-5.1', label: 'GLM-5.1', description: 'Flagship model, matches Claude Opus 4.6. Supports 8-hour autonomous work.' },
        { id: 'glm-5', label: 'GLM-5', description: 'Stronger coding and reliable multi-step reasoning/execution.' },
        { id: 'glm-4.7', label: 'GLM-4.7', description: 'Enhanced programming and stable reasoning performance.' },
        { id: 'glm-5-turbo', label: 'GLM-5-Turbo', description: 'Deeply optimized for complex, dynamic long-chain tasks.' },
        { id: 'glm-4.5-air', label: 'GLM-4.5 Air', description: 'Lightweight model with SOTA performance and cost-effectiveness.' },
        { id: 'glm-4.7-flash', label: 'GLM-4.7 Flash', description: '30B parameters. Efficient and high-performance.' },
        { id: 'glm-4-32b-0414-128k', label: 'GLM-4 32B', description: 'General-purpose cost-efficient LLM for advanced Q&A.' },
        { id: 'glm-asr-2512', label: 'GLM-ASR-2512', description: 'Speech recognition model with industry-leading performance.' }
      ]
    },
    {
      name: 'Local Server',
      description: 'Connect to llama-cpp, Ollama, LM Studio, vLLM, or any local OpenAI-compatible server.',
      models: [
        { id: 'moondream', label: 'Moondream', description: 'Small vision model' },
        { id: 'llava', label: 'LLaVA', description: 'Large Language and Vision Assistant' },
        { id: 'llama3', label: 'Llama 3', description: 'Meta Open Source model' },
        { id: 'mistral', label: 'Mistral', description: 'Mistral 7B / 8x7B' },
        { id: 'phi3', label: 'Phi-3', description: 'Microsoft Small Language Model' },
        { id: 'local-model', label: 'Local Model', description: 'Custom local model' },
        { id: 'default', label: 'Default', description: 'Default local server model' }
      ]
    },
  ];

  const currentProviderData = providers.find(p => p.name === provider) || providers[0];

  useEffect(() => {
    if (!currentProviderData.models.some(m => m.id === model)) {
      setModel(currentProviderData.models[0].id);
    }

    if (provider.toLowerCase().includes('local')) {
      setNewKeyProvider('Gemini');
    } else {
      setNewKeyProvider(provider);
    }

    if (skipNextRefresh) {
      setSkipNextRefresh(false);
    } else {
      loadSavedKeys();
    }
  }, [provider]);

  const loadSavedKeys = async () => {
    try {
      const data: any = await invoke('db_get_api_keys');
      setSavedKeys(data);
      const active = data.find((k: any) => k.isActive);
      if (active) {
        setActiveKeyId(active.id);
      }
    } catch (e) {
      console.error("Failed to load keys from database:", e);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiKeyName.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await invoke('db_save_api_key', {
        name: apiKeyName,
        provider: newKeyProvider,
        keyValue: apiKey
      });

      setApiKey('');
      setApiKeyName('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      await loadSavedKeys();
      setProvider(newKeyProvider);
      useStore.getState().incrementSettingsVersion();
    } catch (e: any) {
      console.error("Failed to save API key to database:", e);
      setError(e.message || String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await invoke('db_delete_api_key', { id });
      await loadSavedKeys();
    } catch (e: any) {
      console.error("Failed to delete key:", e);
      setError(e.message || String(e));
    }
  };

  const handleUseKey = async (id: string) => {
    setError(null);
    try {
      await invoke('db_set_active_key', { id });
      const keyInfo = savedKeys.find(k => k.id === id);
      if (keyInfo) {
        setProvider(keyInfo.provider);
      }
      setActiveKeyId(id);
      useStore.getState().incrementSettingsVersion();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error("Failed to use key:", e);
      setError(e.message || String(e));
    }
  };

  const startEditing = (key: { id: string, name: string, provider: string }) => {
    setEditingKeyId(key.id);
    setEditName(key.name);
    setEditProvider(key.provider);
  };

  const handleUpdateKey = async () => {

    setEditingKeyId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-10 custom-scrollbar">

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Monitor size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Appearance</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { id: 'system', icon: Monitor, label: 'System' },
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as Theme)}
                className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${theme === item.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 shadow-sm'
                    : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-400 hover:border-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
              >
                <item.icon size={18} className="mb-2" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Inference Provider</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {providers.map((p) => (
              <button
                key={p.name}
                onClick={() => setProvider(p.name)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${provider === p.name
                    ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/10 text-gray-900 dark:text-white'
                    : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 bg-white dark:bg-white/5 text-gray-500'
                  }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-bold">{p.name}</span>
                  <span className="text-[11px] opacity-70">{p.description}</span>
                </div>
                {provider === p.name && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                )}
              </button>
            ))}
          </div>
        </section>

        {!provider.toLowerCase().includes('local') && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Model Configuration</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentProviderData.models.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left group ${model === m.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 shadow-sm'
                      : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-400 hover:border-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                >
                  <span className={`text-[12px] font-bold ${model === m.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-zinc-300'}`}>
                    {m.label}
                  </span>
                  <span className="text-[10px] opacity-60 mt-1 line-clamp-1 group-hover:line-clamp-none">
                    {m.description}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              API Key Management
            </h3>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden">

            {error && (
              <div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider truncate">Error: {error}</span>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Add New Key</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    placeholder="Key Label (e.g. Work)"
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <select
                    value={newKeyProvider}
                    onChange={(e) => setNewKeyProvider(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    {providers.filter(p => !p.name.toLowerCase().includes('local')).map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter ${newKeyProvider} API Key...`}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all pr-12"
                />
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim() || !apiKeyName.trim() || isSaving}
                  className="absolute right-1 top-1 bottom-1 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center min-w-[44px]"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : saved ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </div>
            </div>

            {savedKeys.length > 0 && (
              <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">All Saved API Keys</label>
                <div className="space-y-2">
                  {savedKeys.map(k => (
                    <div
                      key={k.id}
                      onClick={() => !editingKeyId && handleUseKey(k.id)}
                      className={`group flex items-center justify-between p-3 border rounded-xl transition-all ${activeKeyId === k.id
                          ? 'bg-blue-500/5 border-blue-500/30'
                          : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                        } ${!editingKeyId ? 'cursor-pointer' : ''}`}
                    >
                      {editingKeyId === k.id ? (
                        <div className="flex-1 flex gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                          <select
                            value={editProvider}
                            onChange={(e) => setEditProvider(e.target.value)}
                            className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                          >
                            {providers.filter(p => !p.name.toLowerCase().includes('local')).map(p => (
                              <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${activeKeyId === k.id ? 'text-blue-500' : 'text-gray-700 dark:text-zinc-200'}`}>{k.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${k.provider === provider ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-400'
                              }`}>
                              {k.provider}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">••••••••••••••••</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {editingKeyId === k.id ? (
                          <>
                            <button
                              onClick={handleUpdateKey}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                              title="Save Changes"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => setEditingKeyId(null)}
                              className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-lg transition-all"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(k)}
                              className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-lg transition-all"
                              title="Edit Key Name/Provider"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                              title="Delete Key"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {provider.toLowerCase().includes('local') && (
              <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                <div className="flex flex-col items-center py-4 gap-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <Monitor size={24} className="text-blue-500" />
                  <div className="text-center px-4">
                    <p className="text-[12px] font-bold text-gray-800 dark:text-white leading-tight">Local Server Active</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                      Connecting to <code className="text-blue-500 font-bold">localhost:8080</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        <section className="space-y-4 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">General</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Eye size={18} className={isVisionEnabled ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Vision Context</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase tracking-wider leading-none">Recommended</span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 ml-7">Send periodic screen captures for better AI understanding.</p>
              </div>
              <div
                onClick={() => setIsVisionEnabled(!isVisionEnabled)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${isVisionEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isVisionEnabled ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Auto-start Microphones</span>
              </div>
              <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell size={18} className={isNotificationEnabled ? 'text-blue-500' : 'text-gray-400'} />
                <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Desktop Notifications</span>
              </div>
              <div
                onClick={() => setIsNotificationEnabled(!isNotificationEnabled)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${isNotificationEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white dark:bg-zinc-800 rounded-full transition-all ${isNotificationEnabled ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
