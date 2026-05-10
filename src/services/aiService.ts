export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const generateAIResponse = async (messages: Message[]) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error('Missing OpenRouter API Key')
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://topper-ai.vercel.app',
        'X-Title': 'Topper AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: 'You are an elite academic tutor named Topper AI. Your goal is to help students achieve top marks by providing extremely structured, clear, and comprehensive educational content. Use professional but encouraging tone.'
          },
          ...messages
        ],
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate AI response')
    }

    return data.choices[0].message.content
  } catch (error: any) {
    console.error('AI Service Error:', error)
    throw error
  }
}
