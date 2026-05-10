import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, Sparkles, Plus, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button.tsx"
import { Input } from "../components/ui/input.tsx"
import { ScrollArea } from "../components/ui/scroll-area.tsx"
import { Card } from "../components/ui/card.tsx"
import { generateAIResponse, type Message } from "../services/aiService"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"

export default function ChatbotModule() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am your Topper AI assistant. I can help you summarize your notes, explain complex topics, or prepare for exams. What are we studying today?' 
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState("")
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetchContext()
  }, [user])

  const fetchContext = async () => {
    if (!user) return
    const { data } = await supabase
      .from('documents')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (data && data.length > 0) {
      setContext(data.map(d => d.content).join("\n\n"))
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const promptContext = context ? `Context from uploaded documents:\n${context.slice(0, 10000)}\n\n` : ""
      const fullMessages = [
        { role: 'system', content: `${promptContext}You are a helpful study assistant. Use the provided context if available.` },
        ...messages,
        userMessage
      ]
      const response = await generateAIResponse(fullMessages as Message[])
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot size={28} />
           </div>
           <div>
              <h1 className="text-2xl font-black">AI Study Companion</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                 <Sparkles size={12} className="text-primary" />
                 Powered by Gemini 2.0 Flash
              </p>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="icon" className="rounded-xl">
              <Plus size={18} />
           </Button>
           <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl text-destructive hover:bg-destructive/10"
              onClick={() => setMessages([{ 
                role: 'assistant', 
                content: 'Chat cleared. How else can I help you with your studies?' 
              }])}
            >
              <Trash2 size={18} />
           </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-none shadow-2xl flex flex-col rounded-[2.5rem] bg-card/50 backdrop-blur-md">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10' 
                      : 'bg-background rounded-tl-none border shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center animate-pulse">
                      <Bot size={16} />
                   </div>
                   <div className="bg-background border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Thinking...</span>
                   </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-background/50">
          <div className="relative">
             <Input 
               placeholder="Ask anything about your study material..." 
               className="h-16 pl-6 pr-16 rounded-[1.5rem] border-2 border-muted focus-visible:border-primary transition-all text-lg shadow-inner bg-card"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <Button 
               className="absolute right-2 top-2 h-12 w-12 rounded-xl shadow-lg"
               onClick={handleSend}
               disabled={isLoading || !input.trim()}
             >
               <Send size={20} />
             </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold opacity-60">
             Topper AI can make mistakes. Verify important information.
          </p>
        </div>
      </Card>
    </div>
  )
}
