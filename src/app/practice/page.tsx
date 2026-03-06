'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import NamiIcon from '@/components/NamiIcon'
import { useAppStore } from '@/lib/store'
import { AIAdapter } from '@/lib/ai-service'
import { speechService } from '@/lib/speech'
import { Mic, MicOff, Play, Pause, RotateCcw, ArrowLeft, Volume2, CheckCircle, XCircle } from 'lucide-react'

export default function PracticePage() {
  const router = useRouter()
  const {
    selectedProvider,
    apiKeys,
    difficultyLevel,
    currentSession,
    isRecording,
    isPlaying,
    setRecording,
    setPlaying,
    endSession,
    addMessage
  } = useAppStore()

  const [currentSentence, setCurrentSentence] = useState('')
  const [examples, setExamples] = useState<string[]>([])
  const [userInput, setUserInput] = useState('')
  const [pronunciationScore, setPronunciationScore] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  useEffect(() => {
    if (!selectedProvider || !apiKeys[selectedProvider]) {
      router.push('/')
      return
    }
    generatePracticeSentence()
  }, [selectedProvider, apiKeys, router, difficultyLevel])

  const generatePracticeSentence = async () => {
    if (!selectedProvider || !apiKeys[selectedProvider]) return

    try {
      const difficultyPrompts = {
        easy: '請生成一個簡單的日常英語句子，適合初學者練習',
        medium: '請生成一個中等難度的英語句子，包含常用詞彙和語法',
        hard: '請生成一個較複雜的英語句子，包含進階詞彙和語法結構'
      }

      const response = await AIAdapter.generateResponse(
        selectedProvider,
        apiKeys[selectedProvider],
        difficultyPrompts[difficultyLevel]
      )

      setCurrentSentence(response.trim())
      setExamples(AIAdapter.generatePracticeExamples(response.trim()))
      setShowExamples(false)
      setPronunciationScore(null)
      setUserInput('')
    } catch (error) {
      console.error('Generate sentence error:', error)
    }
  }

  const handlePlaySentence = async () => {
    if (!currentSentence) return

    setPlaying(true)
    try {
      await speechService.textToSpeech(currentSentence, 'en')
    } catch (error) {
      console.error('Text to speech error:', error)
    } finally {
      setPlaying(false)
    }
  }

  const handleStartRecording = async () => {
    if (isRecording) {
      setRecording(false)
      return
    }

    setRecording(true)
    try {
      const userSpeech = await speechService.speechToText('zh')
      setUserInput(userSpeech)
      
      // 翻譯用戶輸入並生成英文回應
      await translateAndRespond(userSpeech)
    } catch (error) {
      console.error('Speech recognition error:', error)
    } finally {
      setRecording(false)
    }
  }

  const translateAndRespond = async (chineseInput: string) => {
    if (!selectedProvider || !apiKeys[selectedProvider]) return

    try {
      const translationPrompt = `請將以下中文翻譯成自然流暢的英語：${chineseInput}`
      
      const englishTranslation = await AIAdapter.generateResponse(
        selectedProvider,
        apiKeys[selectedProvider],
        translationPrompt
      )

      // 播放英文翻譯
      await speechService.textToSpeech(englishTranslation, 'en')
      
      // 生成同義例句
      const newExamples = AIAdapter.generatePracticeExamples(englishTranslation)
      setExamples(newExamples)
      setShowExamples(true)

      // 添加消息到會話
      addMessage({
        id: Date.now().toString(),
        type: 'user',
        content: chineseInput,
        language: 'zh',
        timestamp: new Date()
      })

      addMessage({
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: englishTranslation,
        language: 'en',
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Translation error:', error)
    }
  }

  const handleEvaluatePronunciation = async () => {
    if (!userInput) return

    setIsEvaluating(true)
    try {
      // 模擬發音評分
      const score = await speechService.evaluatePronunciation(
        new Blob(), // 實際應用中這裡是用戶錄音
        userInput
      )
      setPronunciationScore(score)
    } catch (error) {
      console.error('Pronunciation evaluation error:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handlePlayExample = async (example: string) => {
    setPlaying(true)
    try {
      await speechService.textToSpeech(example, 'en')
    } catch (error) {
      console.error('Text to speech error:', error)
    } finally {
      setPlaying(false)
    }
  }

  const handleBackToHome = () => {
    endSession()
    router.push('/')
  }

  const getDifficultyColor = () => {
    switch (difficultyLevel) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = () => {
    switch (difficultyLevel) {
      case 'easy': return '簡單'
      case 'medium': return '中等'
      case 'hard': return '高級'
      default: return '未知'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToHome}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
          <div className="flex items-center gap-4">
            <Badge className={getDifficultyColor()}>
              {getDifficultyText()}難度
            </Badge>
            <NamiIcon size={40} animated={true} />
          </div>
        </header>

        {/* Current Sentence */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              練習句子
            </CardTitle>
            <CardDescription>
              聽一聽，然後跟讀練習
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-medium text-blue-900">{currentSentence}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePlaySentence}
                disabled={!currentSentence || isPlaying}
                className="flex-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    播放中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    播放句子
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={generatePracticeSentence}
                disabled={isPlaying}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                換一句
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Input */}
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              說出中文
            </CardTitle>
            <CardDescription>
              用中文表達，AI會幫您翻譯成英文
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg min-h-[60px]">
              {userInput ? (
                <p className="text-lg text-green-900">{userInput}</p>
              ) : (
                <p className="text-gray-500">點擊下方按鈕開始說話...</p>
              )}
            </div>
            <Button
              onClick={handleStartRecording}
              disabled={isPlaying}
              className="w-full"
              size="lg"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  停止錄音
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  開始說話
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Examples */}
        {showExamples && examples.length > 0 && (
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle>例句練習</CardTitle>
              <CardDescription>
                聽聽不同的表達方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {examples.map((example, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <span className="flex-1 text-purple-900">{example}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayExample(example)}
                    disabled={isPlaying}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pronunciation Score */}
        {pronunciationScore && (
          <Card className="border-2 border-orange-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {pronunciationScore.score >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-orange-600" />
                )}
                發音評分
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold text-orange-600">
                  {pronunciationScore.score}分
                </div>
              </div>
              <p className="text-center text-gray-700">{pronunciationScore.feedback}</p>
              {pronunciationScore.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">改進建議：</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {pronunciationScore.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600">{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session Info */}
        {currentSession && (
          <Card className="border-2 border-gray-200">
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>練習時長：{Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)}分鐘</span>
                <span>對話次數：{currentSession.messages.length}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
