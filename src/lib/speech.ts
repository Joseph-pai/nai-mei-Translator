import { SpeechService, PronunciationScore } from '@/types'

class WebSpeechService implements SpeechService {
  private synthesis: SpeechSynthesis
  private recognition: any = null

  constructor() {
    this.synthesis = window.speechSynthesis
    
    // 初始化語音識別
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      this.recognition = new SpeechRecognition()
      this.setupRecognition()
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.maxAlternatives = 1
  }

  async textToSpeech(text: string, language: 'zh' | 'en'): Promise<void> {
    return new Promise((resolve, reject) => {
      // 取消之前的語音
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // 選擇合適的語音
      const voices = this.synthesis.getVoices()
      const voice = voices.find(voice => 
        voice.lang.includes(language === 'zh' ? 'zh' : 'en')
      )
      if (voice) {
        utterance.voice = voice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`語音合成錯誤: ${event.error}`))

      this.synthesis.speak(utterance)
    })
  }

  async speechToText(language: 'zh' | 'en'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('瀏覽器不支持語音識別'))
        return
      }

      this.recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US'

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(`語音識別錯誤: ${event.error}`))
      }

      this.recognition.start()
    })
  }

  async evaluatePronunciation(userAudio: Blob, targetText: string): Promise<PronunciationScore> {
    // 模擬發音評分 - 實際應用中需要使用專業的語音評分服務
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模擬評分邏輯
    const baseScore = Math.floor(Math.random() * 30) + 70 // 70-100分
    const accuracy = Math.floor(Math.random() * 20) + 80
    const fluency = Math.floor(Math.random() * 15) + 85
    const pronunciation = Math.floor(Math.random() * 25) + 75

    const improvements = []
    if (accuracy < 85) improvements.push('注意發音準確性')
    if (fluency < 90) improvements.push('提升語句流暢度')
    if (pronunciation < 80) improvements.push('改善語調和重音')

    return {
      score: baseScore,
      feedback: this.generateFeedback(baseScore),
      improvements
    }
  }

  private generateFeedback(score: number): string {
    if (score >= 90) return '發音非常棒！幾乎是母語水平！'
    if (score >= 80) return '發音很好！繼續保持！'
    if (score >= 70) return '不錯的表現！多加練習會更好！'
    if (score >= 60) return '還可以，需要多練習發音。'
    return '需要多加練習，建議跟讀模仿。'
  }

  // 停止語音合成
  stopSpeaking(): void {
    this.synthesis.cancel()
  }

  // 停止語音識別
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  // 檢查瀏覽器支持
  static isSupported(): boolean {
    return !!(window.speechSynthesis && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
  }
}

export const speechService = new WebSpeechService()
