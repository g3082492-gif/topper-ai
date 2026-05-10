import { useState } from "react"
import { 
  Upload, 
  Link as LinkIcon, 
  File,
  Loader2,
  Zap,
  Type,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { Button } from "../components/ui/button.tsx"
import { Card, CardContent } from "../components/ui/card.tsx"
import { Input } from "../components/ui/input.tsx"
import { Label } from "../components/ui/label.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { useSidebar } from "../components/ui/sidebar.tsx"
import { processFile } from "../services/fileService"
import { generateAIResponse } from "../services/aiService"
import { useToast } from "../hooks/use-toast.ts"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"

export default function UploadCenter() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState("")
  const [pastedText, setPastedText] = useState("")
  const [activeTab, setActiveTab] = useState("file")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState("")
  const [customInstructions, setCustomInstructions] = useState("")
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const { toast } = useToast()
  const { user } = useAuth()
  const { isMobile } = useSidebar()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const steps = [
    "Analyzing material",
    "Generating study notes",
    "Creating summary",
    "Building flashcards",
    "Finalizing results"
  ]

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload and generate study materials.",
        variant: "destructive"
      })
      return
    }

    if (!file && !link && !pastedText) {
      toast({
        title: "Missing input",
        description: "Please upload a file, provide a link, or paste some text.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    
    try {
      let text = ""
      let title = "URL Content"
      
      if (activeTab === 'file' && file) {
        setStatus("Reading file content...")
        text = await processFile(file)
        if (!text || text.trim().length < 50) {
          throw new Error("Could not extract enough text from the file. Please ensure it contains readable text (not just images).")
        }
        // Truncate to avoid context window issues
        text = text.slice(0, 15000)
        title = file.name
      } else if (activeTab === 'text' && pastedText) {
        text = pastedText
        title = pastedText.slice(0, 30) + (pastedText.length > 30 ? "..." : "")
      } else if (activeTab === 'link' && link) {
        setStatus("Fetching website content...")
        let targetUrl = link.trim()
        if (!targetUrl.startsWith('http')) {
          targetUrl = 'https://' + targetUrl
        }
        
        try {
          const proxies = [
            (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
            (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
          ]
          
          let html = ""
          
          for (const getProxyUrl of proxies) {
            try {
              const proxyUrl = getProxyUrl(targetUrl)
              const response = await fetch(proxyUrl)
              if (response.ok) {
                if (proxyUrl.includes('allorigins')) {
                  const data = await response.json()
                  html = data.contents
                } else {
                  html = await response.text()
                }
                if (html && html.length > 500) break
              }
            } catch (e) {
              console.warn("Proxy failed, trying next...")
            }
          }

          if (!html || html.length < 200) {
            throw new Error("Could not fetch meaningful content from this URL. The site might be protected or require JavaScript. Try copying the text manually.")
          }
          
          const parser = new DOMParser()
          const htmlDoc = parser.parseFromString(html, 'text/html')
          
          const pageTitle = htmlDoc.querySelector('title')?.textContent || htmlDoc.querySelector('h1')?.textContent
          if (pageTitle) title = pageTitle

          htmlDoc.querySelectorAll('script, style, nav, footer, header, ads, .ads, .sidebar, #sidebar, .menu, footer').forEach(el => el.remove())
          
          const mainContent = htmlDoc.querySelector('article, main, .content, #content, .post-content')
          text = (mainContent as HTMLElement || htmlDoc.body)?.innerText.replace(/\s+/g, ' ').trim() || ""
          
          if (text.length < 150) {
             text = htmlDoc.body?.innerText.replace(/\s+/g, ' ').trim() || ""
          }

          if (text.length < 100) throw new Error("Could not extract enough text from the URL. Please try copying the text manually.")
          
          text = text.slice(0, 15000)
        } catch (e: any) {
          console.error("Link extraction failed:", e)
          throw new Error(e.message || "Failed to extract content from the URL.")
        }
      }

      if (!text || text.trim().length < 50) {
        throw new Error("No readable content found. Please check your file, link, or pasted text. (Scanned PDFs are not supported)")
      }

      if (user) {
        await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })
      }

      const extractJSON = (str: string) => {
        try {
          const jsonMatch = str.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
          return JSON.parse(str);
        } catch (e) {
          return null;
        }
      }

      setCurrentStep(0)
      setStatus("Analyzing material...")
      const { data: doc, error: docError } = await supabase.from('documents').insert({
        user_id: user.id,
        title: title,
        content: text,
        file_type: file ? (file.name.split('.').pop() || 'file') : 'link',
        metadata: { status: 'processing' }
      }).select().single()

      if (docError) throw docError

      setCurrentStep(1)
      setStatus("Generating study notes...")
      const notesPrompt = `Generate comprehensive "Cheat Sheet" style notes from the following content: ${text}. 
      Follow this STRICT formatting:
      - Use Markdown for all formatting.
      - Main Title: # Cheat Sheet: [Topic Name]
      - Section Headers: ## [Section Name]
      - Key Terms: Use **bold** for keywords.
      - Tables: ALWAYS use Markdown tables for "Key Events / Concepts".
      - Footer: Use a separator --- and *Generated by Topper AI*.
      ${customInstructions ? `Additional Instructions: ${customInstructions}` : ""}`
      
      const notesResponse = await generateAIResponse([{ role: 'user', content: notesPrompt }])
      
      const { error: nError } = await supabase.from('notes').insert({
        document_id: doc.id,
        user_id: user.id,
        content: notesResponse,
        title: `Notes: ${doc.title}`
      })
      if (nError) throw nError

      setCurrentStep(2)
      setStatus("Creating summary...")
      const summaryPrompt = `Generate a concise, high-fidelity summary of the following content: ${text}. 
      Follow this STRICT formatting:
      - Title: # Summary: [Topic Name]
      - Use ## Section Headers.
      - Use **bold** for important terms.
      ${customInstructions ? `Additional Instructions: ${customInstructions}` : ""}`
      
      const summaryResponse = await generateAIResponse([{ role: 'user', content: summaryPrompt }])

      const { error: sError } = await supabase.from('notes').insert({
        document_id: doc.id,
        user_id: user.id,
        content: summaryResponse,
        title: `Summary: ${doc.title}`
      })
      if (sError) throw sError

      setCurrentStep(3)
      setStatus("Building flashcards...")
      try {
        const flashcardsPrompt = `Generate ${questionCount} high-quality flashcards (Question and Answer format) from this content: ${text}. Format your response strictly as a JSON array: [{"question": "...", "answer": "..."}]`
        const flashcardsResponse = await generateAIResponse([{ role: 'user', content: flashcardsPrompt }])
        
        const flashcardsData = extractJSON(flashcardsResponse)
        if (Array.isArray(flashcardsData)) {
          await supabase.from('flashcards').insert(
            flashcardsData.map((f: any) => ({
              document_id: doc.id,
              user_id: user.id,
              question: f.question,
              answer: f.answer
            }))
          )
        }
      } catch (e) {
        console.error("Flashcard generation failed:", e)
      }

      setStatus("Generating Quizzes...")
      try {
        const quizPrompt = `Generate a ${questionCount}-question multiple choice quiz with ${difficulty.toUpperCase()} difficulty level from this content: ${text}. Format your response strictly as a JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}]`
        const quizResponse = await generateAIResponse([{ role: 'user', content: quizPrompt }])

        const quizData = extractJSON(quizResponse)
        if (Array.isArray(quizData)) {
          await supabase.from('quizzes').insert({
            document_id: doc.id,
            user_id: user.id,
            title: `Quiz: ${doc.title}`,
            questions: quizData
          })
        }
      } catch (e) {
        console.error("Quiz generation failed:", e)
      }

      setCurrentStep(4)
      setStatus("Generation complete!")
      setShowSuccess(true)
      
      setFile(null)
      setLink("")
      setPastedText("")
      setCustomInstructions("")
      
      toast({
        title: "✨ Success!",
        description: "Your study materials are ready for review.",
      })
    } catch (error: any) {
      console.error("Upload error details:", error)
      toast({
        title: "Processing failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setStatus("")
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-2 md:py-6 px-3 md:px-0">
      <div className="flex flex-col gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2 mt-4 md:mt-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest animate-pulse">
             <Sparkles size={14} />
             Topper Engine v2.0
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Upload Center
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto px-4">
            Upload your materials to instantly generate high-fidelity study guides.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-card/50 backdrop-blur-xl border border-white/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-14 md:h-20 bg-muted/30 p-2 rounded-none border-b">
            <TabsTrigger 
              value="file" 
              className="flex-1 rounded-xl md:rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2 md:gap-3 text-sm md:text-lg font-bold"
            >
              <File size={isMobile ? 18 : 22} className="shrink-0" />
              <span>File</span>
            </TabsTrigger>
            <TabsTrigger 
              value="link" 
              className="flex-1 rounded-xl md:rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2 md:gap-3 text-sm md:text-lg font-bold"
            >
              <LinkIcon size={isMobile ? 18 : 22} className="shrink-0" />
              <span>Link</span>
            </TabsTrigger>
            <TabsTrigger 
              value="text" 
              className="flex-1 rounded-xl md:rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2 md:gap-3 text-sm md:text-lg font-bold"
            >
              <Type size={isMobile ? 18 : 22} className="shrink-0" />
              <span>Paste</span>
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-5 md:p-10">
            <TabsContent value="file" className="m-0">
                <div 
                  className={`relative border-2 border-dashed rounded-3xl p-6 md:p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                    file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
                  }`}
                >
                   <input 
                     type="file" 
                     className="absolute inset-0 opacity-0 cursor-pointer z-[100]" 
                     onChange={handleFileChange}
                     accept=".pdf,.docx,.txt"
                   />
                   <div className={`p-4 rounded-full ${file ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                     <Upload size={32} />
                   </div>
                   <div className="text-center">
                     <p className="text-lg md:text-xl font-bold">
                       {file ? file.name : "Drag and drop your file here"}
                     </p>
                     <p className="text-sm text-muted-foreground mt-1">
                       PDF, DOCX, or TXT up to 20MB
                     </p>
                   </div>
                </div>
            </TabsContent>

            <TabsContent value="link" className="m-0">
               <div className="space-y-4">
                  <Label htmlFor="url" className="text-lg font-bold">Paste URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                      id="url" 
                      placeholder="e.g. https://en.wikipedia.org/wiki/Physics" 
                      className="pl-12 h-14 rounded-2xl text-lg border-muted-foreground/20"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="text" className="m-0">
               <div className="space-y-4">
                  <Label htmlFor="manual-text" className="text-lg font-bold">Paste Study Material</Label>
                  <textarea 
                    id="manual-text" 
                    placeholder="Copy and paste text from your textbook, website, or notes here..." 
                    className="w-full min-h-[200px] p-6 rounded-2xl text-lg border-2 border-muted-foreground/20 bg-background/50 focus:ring-2 ring-primary outline-none transition-all"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
               </div>
            </TabsContent>

            <div className="mt-8 space-y-4">
              <Label htmlFor="instructions" className="text-lg font-bold">Custom Instructions (Optional)</Label>
              <Input 
                id="instructions" 
                placeholder="e.g. Focus on key definitions..." 
                className="h-14 rounded-2xl text-lg border-muted-foreground/20"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-bold">Number of Questions/Flashcards</Label>
                <span className="text-primary font-black text-xl">{questionCount}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="mt-8 space-y-4">
              <Label className="text-lg font-bold">Difficulty Level</Label>
              <div className="grid grid-cols-3 gap-3">
                 {['easy', 'medium', 'hard'].map((d) => (
                   <Button
                    key={d}
                    type="button"
                    variant="outline"
                    onClick={() => setDifficulty(d as any)}
                    className={`h-12 rounded-2xl capitalize font-bold ${difficulty === d ? 'bg-primary text-primary-foreground' : ''}`}
                   >
                     {d}
                   </Button>
                 ))}
              </div>
            </div>

            <div className="mt-10 space-y-6">
              <Button 
                className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={handleUpload}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap size={20} className="fill-current" />
                    Generate Study Guide
                  </div>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between text-sm font-bold px-1">
                    <span className="text-primary">{status}</span>
                    <span className="text-muted-foreground">{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden border shadow-inner">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                      style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Tabs>
      </Card>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
          <Card className="w-full max-w-lg border-none shadow-[0_0_50px_rgba(var(--primary),0.2)] rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-primary p-12 text-primary-foreground flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                   <CheckCircle2 size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-black mb-2">Generation Complete!</h2>
                <p className="opacity-90">Your high-quality study materials are ready.</p>
             </div>
             <CardContent className="p-8 space-y-4">
                <Button 
                  className="w-full h-14 rounded-xl text-lg font-bold gap-2"
                  onClick={() => navigate('/dashboard/notes')}
                >
                  View My Notes
                  <ArrowRight size={20} />
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-14 rounded-xl font-bold"
                    onClick={() => navigate('/dashboard/summaries')}
                  >
                    Summary
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-14 rounded-xl font-bold"
                    onClick={() => navigate('/dashboard/flashcards')}
                  >
                    Flashcards
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 rounded-xl text-muted-foreground"
                  onClick={() => setShowSuccess(false)}
                >
                  Upload Another
                </Button>
             </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}
