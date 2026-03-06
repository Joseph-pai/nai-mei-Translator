import { SpeechService, PronunciationScore } from '@/types'

class WebSpeechService implements SpeechService {
  private synthesis: SpeechSynthesis
  private recognition: any = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis

      // 監聽語音加載
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices()
      }
      loadVoices()
      if ('onvoiceschanged' in this.synthesis) {
        this.synthesis.onvoiceschanged = loadVoices
      }

      // 初始化語音識別
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
    } else {
      this.synthesis = {} as SpeechSynthesis
    }
  }

  private setupRecognition() {
    if (!this.recognition) return
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.maxAlternatives = 1
  }

  async textToSpeech(text: string, language: 'zh' | 'en'): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()

    return new Promise((resolve, reject) => {
      // 移動端：嘗試解鎖語音引擎
      if (this.synthesis.paused) {
        this.synthesis.resume()
      }
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US'
      // 適度調整語速，避免「奇怪」的聲音
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // 優先選擇高品質的女聲 (例如 Google, Apple, Microsoft 的女聲)
      const voices = this.voices.length > 0 ? this.voices : this.synthesis.getVoices()
      const targetLang = language === 'zh' ? 'zh' : 'en'

      const isFemale = (name: string) =>
        name.includes('Female') || name.includes('Woman') || name.includes('Girl') ||
        name.includes('Zhiyu') || name.includes('Hanhan') || name.includes('Samantha') ||
        name.includes('Victoria') || name.includes('Meijia') || name.includes('Huihui') || name.includes('Xiaoxiao')

      let selectedVoice = voices.find(v =>
        v.lang.includes(targetLang) && isFemale(v.name) && (v.name.includes('Google') || v.name.includes('Premium'))
      ) || voices.find(v => v.lang.includes(targetLang) && isFemale(v.name))
        || voices.find(v => v.lang.includes(targetLang))

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`語音合成錯誤: ${event.error}`))

      // 處理 Chrome 語音過長自動停止的 Bug
      const timer = setTimeout(() => {
        if (this.synthesis.speaking) {
          this.synthesis.pause()
          this.synthesis.resume()
        }
      }, 5000)

      utterance.onend = () => {
        clearTimeout(timer)
        resolve()
      }

      this.synthesis.speak(utterance)
    })
  }

  async speechToText(language: 'zh' | 'en'): Promise<string> {
    if (typeof window === 'undefined') return Promise.resolve('')

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('瀏覽器不支持語音識別'))
        return
      }

      // 1. 先停掉之前可能存在的實例，徹底清理
      try { this.recognition.abort() } catch (e) { }

      this.recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US'
      this.recognition.continuous = false
      this.recognition.interimResults = true // 開啟中間結果，讓用戶看到正在輸入，減少焦慮

      let finalTranscript = ''

      // 2. 設置更彈性的超時 (例如 12秒)
      const timeout = setTimeout(() => {
        this.recognition.stop()
        if (!finalTranscript) {
          reject(new Error('語音識別超時，請檢查麥克風權限或網絡'))
        }
      }, 12000)

      this.recognition.onresult = (event: any) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        // 如果有 Final 結果，或是已經識別出長度且停止
        if (finalTranscript) {
          clearTimeout(timeout)
          resolve(finalTranscript)
        }
      }

      this.recognition.onerror = (event: any) => {
        clearTimeout(timeout)
        const errorMessages: Record<string, string> = {
          'no-speech': '未檢測到聲音',
          'audio-capture': '找不到麥克風',
          'not-allowed': '請開啟麥克風權限',
          'network': '網絡連線失敗'
        }
        reject(new Error(errorMessages[event.error] || `識別錯誤: ${event.error}`))
      }

      this.recognition.onend = () => {
        // onend 不代表超時，可能是用戶說完了
        if (finalTranscript) {
          clearTimeout(timeout)
          resolve(finalTranscript)
        }
      }

      try {
        this.recognition.start()
      } catch (e) {
        clearTimeout(timeout)
        reject(new Error('啟動識辨失敗，請檢查權限'))
      }
    })
  }

  async evaluatePronunciation(userAudio: Blob, targetText: string): Promise<PronunciationScore> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const baseScore = Math.floor(Math.random() * 20) + 80 // 80-100分
    return {
      score: baseScore,
      feedback: baseScore >= 90 ? '發音非常專業！' : '發音不錯，細節可加強。',
      improvements: baseScore >= 90 ? [] : ['注意部分元音的飽滿度']
    }
  }

  stopSpeaking(): void {
    if (typeof window !== 'undefined') this.synthesis.cancel()
  }

  stopListening(): void {
    if (this.recognition) {
      try { this.recognition.stop() } catch (e) { }
    }
  }

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return !!(window.speechSynthesis &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
  }
}

export const speechService = new WebSpeechService()
