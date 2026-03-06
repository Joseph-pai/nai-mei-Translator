import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIProvider, PracticeSession, DifficultyLevel } from '@/types'

interface AppState {
  // AI Provider Management
  selectedProvider: AIProvider['name'] | null
  apiKeys: Record<AIProvider['name'], string>
  isValidating: boolean
  validationError: string | null
  
  // App State
  currentMode: 'chat' | 'practice' | null
  difficultyLevel: DifficultyLevel
  isPlaying: boolean
  isRecording: boolean
  
  // Practice Session
  currentSession: PracticeSession | null
  sessions: PracticeSession[]
  
  // Actions
  setSelectedProvider: (provider: AIProvider['name']) => void
  setApiKey: (provider: AIProvider['name'], apiKey: string) => void
  validateApiKey: (provider: AIProvider['name'], apiKey: string) => Promise<boolean>
  setValidationError: (error: string | null) => void
  
  setMode: (mode: 'chat' | 'practice' | null) => void
  setDifficultyLevel: (level: DifficultyLevel) => void
  setPlaying: (playing: boolean) => void
  setRecording: (recording: boolean) => void
  
  startSession: (mode: 'chat' | 'practice', level: DifficultyLevel) => void
  endSession: () => void
  addMessage: (message: any) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      selectedProvider: null,
      apiKeys: {
        DeepSeek: '',
        Gemini: '',
        GPT: '',
        Grok: ''
      },
      isValidating: false,
      validationError: null,
      
      currentMode: null,
      difficultyLevel: 'medium',
      isPlaying: false,
      isRecording: false,
      
      currentSession: null,
      sessions: [],
      
      // Actions
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      
      setApiKey: (provider, apiKey) => set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: apiKey }
      })),
      
      validateApiKey: async (provider, apiKey) => {
        set({ isValidating: true, validationError: null })
        
        try {
          // 模擬API驗證
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // 簡單的API Key格式驗證
          const isValid = apiKey.length >= 20
          
          if (isValid) {
            set({ validationError: null })
            return true
          } else {
            set({ validationError: 'API Key格式不正確，請檢查後重試' })
            return false
          }
        } catch (error) {
          set({ validationError: '驗證失敗，請稍後重試' })
          return false
        } finally {
          set({ isValidating: false })
        }
      },
      
      setValidationError: (error) => set({ validationError: error }),
      
      setMode: (mode) => set({ currentMode: mode }),
      setDifficultyLevel: (level) => set({ difficultyLevel: level }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setRecording: (recording) => set({ isRecording: recording }),
      
      startSession: (mode, level) => {
        const session: PracticeSession = {
          id: Date.now().toString(),
          level,
          startTime: new Date(),
          messages: []
        }
        set({ currentSession: session, currentMode: mode })
      },
      
      endSession: () => {
        const { currentSession } = get()
        if (currentSession) {
          const endedSession = {
            ...currentSession,
            endTime: new Date()
          }
          set((state) => ({
            sessions: [...state.sessions, endedSession],
            currentSession: null,
            currentMode: null,
            isPlaying: false,
            isRecording: false
          }))
        }
      },
      
      addMessage: (message) => {
        const { currentSession } = get()
        if (currentSession) {
          set((state) => ({
            currentSession: {
              ...state.currentSession!,
              messages: [...state.currentSession!.messages, message]
            }
          }))
        }
      }
    }),
    {
      name: 'nami-chat-storage',
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        apiKeys: state.apiKeys,
        sessions: state.sessions
      })
    }
  )
)
