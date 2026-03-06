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

      // 優先選擇高品質語音 (例如 Google 或 Apple 的地道中文/英文)
      const voices = this.voices.length > 0 ? this.voices : this.synthesis.getVoices()
      const targetLang = language === 'zh' ? 'zh' : 'en'

      // 優先權：高品質(Google/Premium) > 匹配語言 > 首位
      let selectedVoice = voices.find(v =>
        (v.lang.includes(targetLang) && (v.name.includes('Google') || v.name.includes('Premium')))
      ) || voices.find(v => v.lang.includes(targetLang))

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

      // 防止重複啟動導致的卡死
      try {
        this.recognition.stop()
      } catch (e) { }

      this.recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US'

      // 設置超時保護，防止識別不返回結果導致卡死
      const timeout = setTimeout(() => {
        this.recognition.stop()
        reject(new Error('語音識別超時，請重試'))
      }, 8000)

      this.recognition.onresult = (event: any) => {
        clearTimeout(timeout)
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      this.recognition.onerror = (event: any) => {
        clearTimeout(timeout)
        if (event.error === 'no-speech') {
          reject(new Error('未檢測到聲音，請再說一次'))
        } else {
          reject(new Error(`語音識別錯誤: ${event.error}`))
        }
      }

      this.recognition.onend = () => {
        clearTimeout(timeout)
        // 如果還沒 resolve，說明沒識別到結果
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
