'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import NamiIcon from '@/components/NamiIcon'
import { useAppStore } from '@/lib/store'
import { AIAdapter } from '@/lib/ai-service'
import { speechService } from '@/lib/speech'
import { Mic, MicOff, Play, Pause, Settings, Volume2, VolumeX } from 'lucide-react'

export default function Home() {
  const {
    selectedProvider,
    apiKeys,
    isValidating,
    validationError,
    setSelectedProvider,
    setApiKey,
    validateApiKey,
    setValidationError,
    setMode,
    difficultyLevel,
    setDifficultyLevel,
    isPlaying,
    isRecording,
    setPlaying,
    setRecording,
    startSession,
    endSession
  } = useAppStore()

  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')

  const handleProviderSelect = async (provider: string) => {
    const providerKey = provider as 'DeepSeek' | 'Gemini' | 'GPT' | 'Grok'
    setSelectedProvider(providerKey)
    setValidationError(null)
    
    if (apiKeys[providerKey]) {
      // 驗證已有的API Key
      const isValid = await validateApiKey(providerKey, apiKeys[providerKey])
      if (!isValid) {
        setShowApiKeyInput(true)
      }
    } else {
      setShowApiKeyInput(true)
    }
  }

  const handleApiKeySubmit = async () => {
    if (!selectedProvider || !tempApiKey.trim()) return

    const isValid = await validateApiKey(selectedProvider, tempApiKey.trim())
    if (isValid) {
      setApiKey(selectedProvider, tempApiKey.trim())
      setShowApiKeyInput(false)
      setTempApiKey('')
    }
  }

  const handleNamiChat = async () => {
    if (!selectedProvider || !apiKeys[selectedProvider]) {
      setValidationError('請先選擇AI平台並設置API Key')
      return
    }

    startSession('chat', difficultyLevel)
    setPlaying(true)

    try {
      const topic = AIAdapter.generateChatTopic()
      const response = await AIAdapter.generateResponse(
        selectedProvider,
        apiKeys[selectedProvider],
        `請用簡單友善的英語回應這個話題：${topic}`
      )

      await speechService.textToSpeech(response, 'en')
    } catch (error) {
      console.error('Chat error:', error)
      setValidationError('聊天功能暫時無法使用')
    } finally {
      setPlaying(false)
    }
  }

  const handlePracticeMode = () => {
    if (!selectedProvider || !apiKeys[selectedProvider]) {
      setValidationError('請先選擇AI平台並設置API Key')
      return
    }

    startSession('practice', difficultyLevel)
    setMode('practice')
  }

  const handleRecording = async () => {
    if (isRecording) {
      setRecording(false)
      // 停止錄音並處理
      try {
        const userSpeech = await speechService.speechToText('zh')
        console.log('User said:', userSpeech)
        // 這裡會調用AI進行翻譯和評分
      } catch (error) {
        console.error('Speech recognition error:', error)
      }
    } else {
      setRecording(true)
      try {
        await speechService.speechToText('zh')
      } catch (error) {
        console.error('Speech recognition error:', error)
        setRecording(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center py-8">
          <div className="flex justify-center mb-4">
            <NamiIcon size={80} animated={true} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">奈美聊天</h1>
          <p className="text-lg text-gray-600">中英文口語練習助手</p>
        </header>

        {/* AI Provider Selection */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              AI平台設定
            </CardTitle>
            <CardDescription>
              選擇您喜歡的AI平台並設置API Key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="ai-provider">選擇AI平台：</Label>
              <Select onValueChange={handleProviderSelect} value={selectedProvider || ''}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="選擇AI平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DeepSeek">DeepSeek</SelectItem>
                  <SelectItem value="Gemini">Gemini</SelectItem>
                  <SelectItem value="GPT">ChatGPT</SelectItem>
                  <SelectItem value="Grok">Grok</SelectItem>
                </SelectContent>
              </Select>

              {selectedProvider && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                >
                  {showApiKeyInput ? '隱藏' : '顯示'} API Key
                </Button>
              )}
            </div>

            {selectedProvider && (
              <div className="flex items-center gap-2">
                <Badge variant={apiKeys[selectedProvider] ? "default" : "secondary"}>
                  {apiKeys[selectedProvider] ? '已配置' : '未配置'}
                </Badge>
                <a
                  href={AIAdapter.getApiKeyUrl(selectedProvider)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  獲取API Key →
                </a>
              </div>
            )}

            {showApiKeyInput && selectedProvider && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <Label htmlFor="api-key">API Key：</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="輸入您的API Key"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApiKeySubmit}
                    disabled={isValidating}
                    size="sm"
                  >
                    {isValidating ? '驗證中...' : '驗證'}
                  </Button>
                </div>
                {validationError && (
                  <p className="text-sm text-red-600">{validationError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Difficulty Selection */}
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle>難度選擇</CardTitle>
            <CardDescription>選擇適合您的練習難度</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <Button
                  key={level}
                  variant={difficultyLevel === level ? "default" : "outline"}
                  onClick={() => setDifficultyLevel(level)}
                  className="flex-1"
                >
                  {level === 'easy' ? '簡單' : level === 'medium' ? '中等' : '高級'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Functions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Nami Chat */}
          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                奈美說說
              </CardTitle>
              <CardDescription>
                隨機英語聊天話題，提升聽力理解
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <NamiIcon size={60} animated={false} />
              </div>
              <Button
                onClick={handleNamiChat}
                disabled={!selectedProvider || !apiKeys[selectedProvider] || isPlaying}
                className="w-full"
                size="lg"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    聊天中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    開始聊天
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Practice Mode */}
          <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                口語練習
              </CardTitle>
              <CardDescription>
                中文輸入，英文回應，發音評分
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <NamiIcon size={60} animated={false} />
              </div>
              <Button
                onClick={handlePracticeMode}
                disabled={!selectedProvider || !apiKeys[selectedProvider]}
                className="w-full"
                size="lg"
              >
                開始練習
              </Button>
              {isRecording && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <MicOff className="w-4 h-4" />
                  錄音中...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Messages */}
        {validationError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{validationError}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
