export interface AIProvider {
  name: 'DeepSeek' | 'Gemini' | 'GPT' | 'Grok'
  apiKey: string
  isValid: boolean
  getApiKeyUrl: () => string
}

export interface SpeechService {
  textToSpeech: (text: string, language: 'zh' | 'en') => Promise<void>
  speechToText: (language: 'zh' | 'en') => Promise<string>
  evaluatePronunciation: (userAudio: Blob, targetText: string) => Promise<PronunciationScore>
}

export interface PronunciationScore {
  score: number // 0-100
  feedback: string
  improvements: string[]
}

export interface ConversationMode {
  namiChat: () => void // 隨機話題生成
  practiceMode: (level: 'easy' | 'medium' | 'hard') => void
  evaluateRepetition: (userSpeech: string) => Promise<PracticeFeedback>
}

export interface PracticeFeedback {
  accuracy: number
  fluency: number
  pronunciation: number
  suggestions: string[]
  correctedText?: string
}

export interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  language: 'zh' | 'en'
  timestamp: Date
  audioUrl?: string
}

export interface PracticeSession {
  id: string
  level: 'easy' | 'medium' | 'hard'
  startTime: Date
  endTime?: Date
  messages: ChatMessage[]
  finalScore?: number
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type Language = 'zh' | 'en'
