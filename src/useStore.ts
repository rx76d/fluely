import { create } from 'zustand'

export interface TranscriptItem {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface LiveInsights {
  summary: string;
  actionItems: string[];
  suggestedAnswer: string;
}

export interface UserProfile {
  name: string;
  role: string;
  skills: string;
  experience: string;
  goals: string;
}

export type Theme = 'system' | 'light' | 'dark';

interface AppState {
  appState: 'HOME' | 'SESSION';
  setAppState: (state: 'HOME' | 'SESSION') => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  provider: string;
  setProvider: (provider: string) => void;

  model: string;
  setModel: (model: string) => void;

  isMicActive: boolean;
  toggleMic: () => void;
  
  liveTranscript: TranscriptItem[];
  addTranscript: (item: TranscriptItem) => void;

  aiResponses: string[];
  addAiResponse: (response: string) => void;
  updateAiResponse: (index: number, response: string) => void;
  setAiResponses: (responses: string[]) => void;

  liveInsights: LiveInsights;
  setLiveInsights: (insights: LiveInsights) => void;

  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;

  isVisionEnabled: boolean;
  setIsVisionEnabled: (enabled: boolean) => void;

  isNotificationEnabled: boolean;
  setIsNotificationEnabled: (enabled: boolean) => void;

  connectionStatus: 'idle' | 'verifying' | 'connected' | 'error';
  setConnectionStatus: (status: 'idle' | 'verifying' | 'connected' | 'error') => void;

  settingsVersion: number;
  incrementSettingsVersion: () => void;

  activeSessionId: number | null;
  setActiveSessionId: (id: number | null) => void;

  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;

  resetSession: () => void;
}

export const useStore = create<AppState>()((set) => ({
  appState: 'HOME',
  setAppState: (state) => set({ appState: state }),

  activeSessionId: null,
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

  theme: 'system',
  setTheme: (theme) => set({ theme }),

  provider: 'Gemini',
  setProvider: (provider) => set({ provider }),

  model: 'gemini-3.1-pro',
  setModel: (model) => set({ model }),

  isMicActive: false,
  toggleMic: () => set((state) => ({ isMicActive: !state.isMicActive })),
  
  liveTranscript: [],
  addTranscript: (item) => set((state) => ({ liveTranscript: [...state.liveTranscript, item] })),
  
  aiResponses: [],
  addAiResponse: (response) => set((state) => ({ aiResponses: [...state.aiResponses, response] })),
  updateAiResponse: (index, response) => set((state) => {
    const newResponses = [...state.aiResponses];
    newResponses[index] = response;
    return { aiResponses: newResponses };
  }),
  setAiResponses: (responses) => set({ aiResponses: responses }),
  
  liveInsights: {
    summary: "",
    actionItems: [],
    suggestedAnswer: ""
  },
  setLiveInsights: (liveInsights) => set({ liveInsights }),

  zoom: 1.0,
  setZoom: (zoom) => set((state) => ({ 
    zoom: typeof zoom === 'function' ? zoom(state.zoom) : zoom 
  })),

  isVisionEnabled: true,
  setIsVisionEnabled: (isVisionEnabled) => set({ isVisionEnabled }),

  isNotificationEnabled: false,
  setIsNotificationEnabled: (isNotificationEnabled) => set({ isNotificationEnabled }),

  connectionStatus: 'idle',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  settingsVersion: 0,
  incrementSettingsVersion: () => set((state) => ({ settingsVersion: state.settingsVersion + 1 })),

  userProfile: {
    name: '',
    role: '',
    skills: '',
    experience: '',
    goals: ''
  },
  setUserProfile: (userProfile) => set({ userProfile }),

  resetSession: () => set({
    activeSessionId: null,
    liveTranscript: [],
    aiResponses: [],
    liveInsights: {
      summary: "",
      actionItems: [],
      suggestedAnswer: ""
    },
    connectionStatus: 'idle'
  })
}))
