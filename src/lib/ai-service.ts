import { AIProvider } from '@/types'

export class AIAdapter {
  private static getProviderConfig(provider: AIProvider['name']) {
    const configs = {
      DeepSeek: {
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        getApiKeyUrl: () => 'https://platform.deepseek.com/api_keys'
      },
      Gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
        getApiKeyUrl: () => 'https://makersuite.google.com/app/apikey'
      },
      GPT: {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        getApiKeyUrl: () => 'https://platform.openai.com/api-keys'
      },
      Grok: {
        baseUrl: 'https://api.x.ai/v1',
        model: 'grok-beta',
        getApiKeyUrl: () => 'https://console.x.ai/api-keys'
      }
    }
    return configs[provider]
  }

  static async generateResponse(
    provider: AIProvider['name'], 
    apiKey: string, 
    prompt: string,
    context?: string
  ): Promise<string> {
    const config = this.getProviderConfig(provider)
    
    try {
      let response: Response

      if (provider === 'Gemini') {
        // Gemini API 格式
        const requestBody = {
          contents: [{
            parts: [{
              text: this.buildPrompt(prompt, context)
            }]
          }]
        }

        response = await fetch(
          `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          }
        )

        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我無法生成回應。'
      } else {
        // OpenAI 格式 (DeepSeek, GPT, Grok)
        const requestBody = {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: '你是一個友善的英語學習助手，專門幫助用戶練習中英文口語對話。請用簡單、自然的英語回應。'
            },
            ...(context ? [{
              role: 'assistant',
              content: context
            }] : []),
            {
              role: 'user',
              content: this.buildPrompt(prompt, context)
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        }

        response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        const data = await response.json()
        return data.choices?.[0]?.message?.content || '抱歉，我無法生成回應。'
      }
    } catch (error) {
      console.error('AI API Error:', error)
      throw new Error('AI服務暫時無法使用，請稍後重試。')
    }
  }

  static async validateKey(provider: AIProvider['name'], apiKey: string): Promise<boolean> {
    const config = this.getProviderConfig(provider)
    
    try {
      if (provider === 'Gemini') {
        const response = await fetch(
          `${config.baseUrl}/models/${config.model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: 'Hello'
                }]
              }]
            })
          }
        )
        return response.ok
      } else {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
          })
        })
        return response.ok
      }
    } catch (error) {
      return false
    }
  }

  static getApiKeyUrl(provider: AIProvider['name']): string {
    const config = this.getProviderConfig(provider)
    return config.getApiKeyUrl()
  }

  private static buildPrompt(prompt: string, context?: string): string {
    if (context) {
      return `${context}\n\n${prompt}`
    }
    return prompt
  }

  // 生成隨機聊天話題
  static generateChatTopic(): string {
    const topics = [
      '請分享一個今天發生的有趣事情',
      '你喜歡什麼樣的天氣？為什麼？',
      '你最喜歡的食物是什麼？可以描述一下嗎？',
      '你週末通常做些什麼？',
      '你有什麼嗜好或興趣？',
      '你喜歡旅行嗎？去過哪些地方？',
      '你喜歡什麼類型的電影或音樂？',
      '你今天心情如何？',
      '你最近學到什麼新東西嗎？',
      '你理想的一天是什麼樣子的？'
    ]
    return topics[Math.floor(Math.random() * topics.length)]
  }

  // 生成練習句子的同義例句
  static generatePracticeExamples(originalSentence: string): string[] {
    // 這裡可以集成AI來生成更準確的同義句
    // 目前提供簡單的示例邏輯
    const examples = [
      `${originalSentence} - 這是基本的表達方式。`,
      `Let me say it another way: ${originalSentence} - 這是另一種說法。`,
      `In other words: ${originalSentence} - 換句話說。`
    ]
    return examples.slice(0, 3)
  }
}
