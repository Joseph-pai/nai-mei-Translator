'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import NaimeIcon from '@/components/NamiIcon'
import { useAppStore } from '@/lib/store'
import { AIAdapter } from '@/lib/ai-service'
import { speechService } from '@/lib/speech'
import { Mic, MicOff, Play, Square, Settings, Volume2, Sparkles, Languages, Award } from 'lucide-react'

export default function Home() {
  const {
    selectedProvider,
    apiKeys,
    isValidating,
    validationError,
    setSelectedProvider,
    validateApiKey,
    setValidationError,
    difficultyLevel,
    setDifficultyLevel,
    isPlaying,
    isRecording,
    setPlaying,
    setRecording,
    startSession
  } = useAppStore()

  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')
  const [currentThought, setCurrentThought] = useState<string | null>(null)
  const [practiceResult, setPracticeResult] = useState<{
    original: string,
    translated: string,
    examples: string[],
    score?: any
  } | null>(null)
  const [isStarted, setIsStarted] = useState(false)

  // 監聽播放狀態
  useEffect(() => {
    // 初始互動解鎖語音引擎 (解決 Autoplay 政策限制)
    const handleFirstInteraction = () => {
      speechService.unlock()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
      speechService.stopSpeaking()
      speechService.stopListening()
    }
  }, [])

  const handleProviderSelect = async (provider: string) => {
    const providerKey = provider as 'DeepSeek' | 'Gemini' | 'GPT' | 'Grok'
    setSelectedProvider(providerKey)
    setValidationError(null)

    if (!apiKeys[providerKey]) {
      setShowApiKeyInput(true)
    } else {
      setShowApiKeyInput(false)
    }
  }

  const handleApiKeySubmit = async () => {
    if (!selectedProvider || !tempApiKey.trim()) return

    const isValid = await validateApiKey(selectedProvider, tempApiKey.trim())
    if (isValid) {
      setShowApiKeyInput(false)
      setTempApiKey('')
    }
  }

  const handleNaimeChat = async () => {
    if (!selectedProvider || !apiKeys[selectedProvider]) {
      setValidationError('請先設置 AI 平台與 API Key 哦 🌸')
      return
    }

    startSession('chat', difficultyLevel)
    setPlaying(true)
    setCurrentThought('奈美正在思考話題...')

    try {
      const topic = AIAdapter.generateChatTopic()
      const lengthHint = difficultyLevel === 'easy' ? '非常簡短（不超過15個單詞）' : difficultyLevel === 'medium' ? '適中長度（30個單詞左右）' : '詳細生動'
      const prompt = `你現在是 naime。請根據這個話題跟用戶聊天，用簡單且地道的英語（適合${difficultyLevel}程度，長度請限制在${lengthHint}）：${topic}。請直接輸出對話內容，不要有其他廢話。`

      const response = await AIAdapter.generateResponse(
        selectedProvider,
        apiKeys[selectedProvider],
        prompt
      )

      setCurrentThought(response)
      await speechService.textToSpeech(response, 'en')
    } catch (error) {
      console.error('Chat error:', error)
      setValidationError('哎呀，奈美斷網了，請檢查 API Key 或是網絡狀況。')
    } finally {
      setPlaying(false)
    }
  }

  const handleStop = () => {
    speechService.stopSpeaking()
    setPlaying(false)
  }

  const [selectedPracticeText, setSelectedPracticeText] = useState<string | null>(null)
  const [diffResult, setDiffResult] = useState<{ word: string, match: boolean, type: 'hit' | 'miss' | 'extra' }[] | null>(null)

  const handleWantToSay = async () => {
    if (!selectedProvider || !apiKeys[selectedProvider]) {
      setValidationError('設置好 API Key 才能開始哦 🌸')
      return
    }

    setPracticeResult(null)
    setDiffResult(null)
    setSelectedPracticeText(null)
    setRecording(true)
    startSession('practice', difficultyLevel)

    try {
      const userChinese = await speechService.speechToText('zh')
      setRecording(false)
      setCurrentThought(`你說的是：「${userChinese}」... 奈美正在翻譯中...`)

      const lengthHint = difficultyLevel === 'easy' ? '不超過10個單詞' : difficultyLevel === 'medium' ? '20個單詞左右' : '地道長句'
      const prompt = `用戶說了中文：「${userChinese}」。請將其翻譯為地道的英文（適合${difficultyLevel}難度，長度${lengthHint}），並提供2-3個語義相同但表達不同的例句。格式嚴格要求：[翻譯]\n例句1:...\n例句2:...`

      const aiResponse = await AIAdapter.generateResponse(
        selectedProvider,
        apiKeys[selectedProvider],
        prompt
      )

      const lines = aiResponse.split('\n').filter(l => l.trim())
      const translated = lines[0].replace('[翻譯]', '').trim()
      const examples = lines.slice(1).map(l => l.replace(/例句\d:?/, '').trim())

      setPracticeResult({
        original: userChinese,
        translated,
        examples
      })
      setSelectedPracticeText(translated)
      setCurrentThought(null)
      await speechService.textToSpeech(translated, 'en')
    } catch (error: any) {
      console.error('Practice error:', error)
      setValidationError(error.message || '哎呀，錄音出了點問題，請重試 🌸')
      setRecording(false)
      setCurrentThought(null)
    }
  }

  const calculateDiff = (target: string, user: string) => {
    const targetWords = target.toLowerCase().replace(/[.,!?;]/g, '').split(/\s+/)
    const userWords = user.toLowerCase().replace(/[.,!?;]/g, '').split(/\s+/)

    return targetWords.map((word, i) => ({
      word,
      match: userWords.includes(word),
      type: userWords[i] === word ? 'hit' as const : (userWords.includes(word) ? 'extra' as const : 'miss' as const)
    }))
  }

  const handleSpeakingPractice = async () => {
    if (!selectedPracticeText) {
      setValidationError('請先用「我想要說」生成句子，或選擇下面的句子哦 🌸')
      return
    }

    setRecording(true)
    setDiffResult(null)
    setCurrentThought(`正在聆聽您的發音：${selectedPracticeText}`)

    try {
      const transcript = await speechService.speechToText('en')
      setRecording(false)

      if (!transcript) {
        setValidationError('沒聽清楚您說什麼，請再試一次 🌸')
        setCurrentThought(null)
        return
      }

      // 比對差異
      const diff = calculateDiff(selectedPracticeText, transcript)
      setDiffResult(diff)

      // 評分
      const score = await speechService.evaluatePronunciation(new Blob(), selectedPracticeText)
      setPracticeResult(prev => prev ? { ...prev, score } : null)

      setCurrentThought(`你說的是：「${transcript}」`)
    } catch (error: any) {
      setValidationError(error.message || '錄音檢測失敗，請再試一次 🌸')
      setRecording(false)
      setCurrentThought(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] bg-gradient-to-br from-[#E0F2FE] via-[#FDFCF0] to-[#FAF5FF] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center py-6 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-white/40 blur-2xl rounded-full animate-pulse"></div>
            <NaimeIcon size={120} animated={isPlaying} />
            <div className="absolute -bottom-2 -right-2 bg-pink-400 text-white p-2 rounded-full shadow-lg">
              <Sparkles size={20} />
            </div>
          </div>
          <h1 className="text-5xl font-black text-[#1E293B] tracking-tight mb-2">奈美聊天</h1>
          <p className="text-xl text-[#64748B] font-medium">✨ 讓英語練習像拿鐵般絲滑 ✨</p>
        </header>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-[#334155] flex items-center gap-3">
                <Settings className="text-blue-500" /> AI 平台設定
              </CardTitle>
              <Badge variant="outline" className="border-pink-200 text-pink-500 px-3 py-1 rounded-full">
                {selectedProvider || '未選擇'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#64748B]">選擇您的 AI 夥伴</Label>
                <Select onValueChange={handleProviderSelect} value={selectedProvider || ''}>
                  <SelectTrigger className="w-56 bg-white border-blue-50 shadow-sm rounded-xl">
                    <SelectValue placeholder="請選擇平台" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="DeepSeek">DeepSeek (推薦)</SelectItem>
                    <SelectItem value="Gemini">Gemini (Google)</SelectItem>
                    <SelectItem value="GPT">ChatGPT (OpenAI)</SelectItem>
                    <SelectItem value="Grok">Grok (xAI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedProvider && (
                <div className="pt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  >
                    {showApiKeyInput ? '👁️ 隱藏 Key' : '🔑 設置 Key'}
                  </Button>
                </div>
              )}
            </div>

            {selectedProvider && (
              <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-2xl w-fit">
                <Badge variant={apiKeys[selectedProvider] ? "default" : "secondary"} className={apiKeys[selectedProvider] ? "bg-green-500 text-white" : ""}>
                  {apiKeys[selectedProvider] ? '✅ 已授權' : '⚠️ 需配置'}
                </Badge>
                <a
                  href={AIAdapter.getApiKeyUrl(selectedProvider)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-500 hover:underline"
                >
                  獲取 API Key →
                </a>
              </div>
            )}

            {showApiKeyInput && selectedProvider && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 p-5 bg-[#F8FAFC] border border-blue-100 rounded-2xl">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">輸入 API Key</Label>
                <div className="flex gap-3">
                  <Input
                    type="password"
                    placeholder="貼上您的金鑰..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="bg-white border-blue-100 rounded-xl"
                  />
                  <Button onClick={handleApiKeySubmit} disabled={isValidating} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 text-white">
                    {isValidating ? '驗證中...' : '提交'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDifficultyLevel(level)}
              className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${difficultyLevel === level
                ? 'bg-[#1E293B] text-white shadow-xl scale-105'
                : 'bg-white text-[#64748B] hover:bg-blue-50 shadow-sm'
                }`}
            >
              {level === 'easy' ? '🧸 簡單' : level === 'medium' ? '☕ 中等' : '🚀 高級'}
            </button>
          ))}
        </div>

        {currentThought && (
          <div className="relative bg-white p-8 rounded-[2rem] shadow-sm border border-pink-50 animate-bounce-subtle">
            <div className="absolute -top-4 left-10 w-8 h-8 bg-white rotate-45 border-l border-t border-pink-50"></div>
            <p className="text-xl text-[#334155] italic leading-relaxed">「 {currentThought} 」</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Button
            onClick={isPlaying ? handleStop : handleNaimeChat}
            disabled={!selectedProvider || !apiKeys[selectedProvider] || isRecording}
            className={`h-32 rounded-[2.5rem] text-2xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-white ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-[#10B981] hover:bg-[#059669]'}`}
          >
            <div className="flex flex-col items-center gap-2">
              {isPlaying ? <Square size={32} /> : <Volume2 size={32} />}
              <span>{isPlaying ? '停止播放' : '奈美說說'}</span>
              <span className="text-xs font-normal opacity-80 underline">隨機話題聊天</span>
            </div>
          </Button>

          <Button
            onClick={isRecording ? () => speechService.stopListening() : handleWantToSay}
            disabled={!selectedProvider || !apiKeys[selectedProvider] || isPlaying}
            className={`h-32 rounded-[2.5rem] text-2xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-white ${isRecording ? 'bg-orange-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            <div className="flex flex-col items-center gap-2">
              {isRecording ? <div className="w-8 h-8 rounded-full bg-white animate-ping" /> : <Mic size={32} />}
              <span>{isRecording ? '聆聽中...' : '我想要說'}</span>
              <span className="text-xs font-normal opacity-80 underline">說中文，奈美教你說英語</span>
            </div>
          </Button>

          <Button
            onClick={isRecording ? () => speechService.stopListening() : handleSpeakingPractice}
            disabled={!selectedProvider || !apiKeys[selectedProvider] || isPlaying || !practiceResult}
            className={`h-32 md:col-span-2 rounded-[2.5rem] text-2xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 text-white ${isRecording ? 'bg-pink-500 animate-pulse' : 'bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <Languages size={32} />
              <span>{isRecording ? '正在錄音並比對...' : '口語練習'}</span>
              <span className="text-xs font-normal opacity-80 underline">練習選中的句子，奈美為你糾音</span>
            </div>
          </Button>
        </div>

        {practiceResult && (
          <Card className="border-none shadow-xl bg-white/90 rounded-[2rem] p-6 space-y-6 animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-600"><Languages /></div>
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase">翻譯結果 (點選下句開始在上面按「口語練習」)</h3>
                <p className="text-xl font-bold text-gray-700">{practiceResult.original}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 主翻譯 */}
              <div
                onClick={() => { setSelectedPracticeText(practiceResult.translated); speechService.textToSpeech(practiceResult.translated, 'en'); }}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedPracticeText === practiceResult.translated ? 'border-blue-500 bg-blue-50' : 'border-blue-50 bg-white'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-black text-2xl tracking-tight">{practiceResult.translated}</span>
                  <Volume2 className="text-blue-300" />
                </div>
              </div>

              {/* 例句 */}
              <div className="grid gap-3">
                {practiceResult.examples.map((ex, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelectedPracticeText(ex); speechService.textToSpeech(ex, 'en'); }}
                    className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border-2 transition-all cursor-pointer ${selectedPracticeText === ex ? 'border-purple-500 bg-purple-50' : 'border-gray-50 bg-white'
                      }`}
                  >
                    <span className="text-gray-600 font-medium">{ex}</span>
                    <Volume2 className="text-gray-300 size-4" />
                  </div>
                ))}
              </div>
            </div>

            {diffResult && (
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                <Label className="text-xs font-bold text-slate-400 uppercase">發音比對結果</Label>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {diffResult.map((res, i) => (
                    <span
                      key={i}
                      className={`text-xl font-bold rounded-lg px-1 ${res.type === 'hit' ? 'text-green-600' :
                        res.type === 'miss' ? 'text-red-500 underline decoration-wavy' :
                          'text-orange-400 italic'
                        }`}
                    >
                      {res.word}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400">💡 綠色：正確 | 紅色：未識別出 | 橙色：部分匹配</p>
              </div>
            )}

            {practiceResult.score && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-3xl border border-green-100 flex items-center gap-4">
                <div className="text-4xl font-black text-green-600">{practiceResult.score.score}</div>
                <div>
                  <div className="font-bold text-green-800">奈美評分：{practiceResult.score.feedback}</div>
                  <div className="text-sm text-green-600">{practiceResult.score.improvements.join(' | ')}</div>
                </div>
              </div>
            )}
          </Card>
        )}

        {validationError && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
            <span className="font-bold">{validationError}</span>
            <button className="text-white hover:bg-white/20 p-1 rounded-full" onClick={() => setValidationError(null)}>✕</button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>

      {/* 初次點擊授權覆蓋層 */}
      {!isStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF0]/80 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="text-center p-8 max-w-sm w-full space-y-8 animate-in zoom-in-95 duration-500">
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-pink-200/50 blur-2xl rounded-full animate-pulse"></div>
              <NaimeIcon size={160} animated={true} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-[#1E293B]">奈美準備好了 🌸</h2>
              <p className="text-[#64748B] font-medium leading-relaxed">
                點擊下方按鈕，開始與奈美進行絲滑的英語對話練習吧！
              </p>
            </div>
            <Button
              onClick={() => {
                speechService.unlock()
                setIsStarted(true)
              }}
              className="w-full h-16 rounded-2xl text-xl font-bold bg-[#1E293B] hover:bg-[#334155] text-white shadow-2xl hover:scale-105 transition-all"
            >
              點擊開始練習 ✨
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
