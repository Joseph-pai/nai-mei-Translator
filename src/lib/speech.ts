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

  /**
   * 解鎖語音引擎 (通常在第一次使用者點擊時呼叫)
   */
  unlock(): void {
    if (typeof window === 'undefined' || !this.synthesis) return

    // 播放一個極短的空音來觸發瀏覽器的語音合成權限
    try {
      this.synthesis.resume()
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      this.synthesis.speak(utterance)
    } catch (e) {
      console.warn('Speech unlock failed:', e)
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
      // 移動端與某些瀏覽器：嘗試解鎖語音引擎並清理目前的隊列
      try {
        // 使用更強壯的序列確保引擎活躍
        this.synthesis.pause()
        this.synthesis.cancel()
        this.synthesis.resume()
      } catch (e) {
        console.warn('Speech synthesis reset failed:', e)
      }

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

      try { this.recognition.abort() } catch (e) { }

      this.recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US'
      this.recognition.continuous = true // 改為連續識別，支持手動停止
      this.recognition.interimResults = true

      let finalTranscript = ''

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
      }

      this.recognition.onerror = (event: any) => {
        const errorMessages: Record<string, string> = {
          'no-speech': '未檢測到聲音',
          'audio-capture': '找不到麥克風',
          'not-allowed': '請開啟麥克風權限',
          'network': '網絡連線失敗'
        }
        reject(new Error(errorMessages[event.error] || `識別錯誤: ${event.error}`))
      }

      this.recognition.onend = () => {
        // 只有在 end 時才 resolve，由外部調用 stop() 觸發
        resolve(finalTranscript.trim())
      }

      try {
        this.recognition.start()
      } catch (e) {
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
