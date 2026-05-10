import { useState } from "react"
import { 
  Upload, 
  Link as LinkIcon, 
  File,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  Brain,
  Zap,
  Type
} from "lucide-react"
import { Button } from "../components/ui/button.tsx"
import { Card, CardContent } from "../components/ui/card.tsx"
import { Input } from "../components/ui/input.tsx"
import { Label } from "../components/ui/label.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
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
  const [status, setStatus] = useState("")
  const [customInstructions, setCustomInstructions] = useState("")
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

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
    setStatus("Extracting content...")

    try {
      let text = ""
      let title = "URL Content"
      
      if (activeTab === 'file' && file) {
        text = await processFile(file)
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
          // Try multiple proxies if one fails
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
                // Check if we got actual content, not just a small string or error page
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
          
          // Get title
          const pageTitle = htmlDoc.querySelector('title')?.textContent || htmlDoc.querySelector('h1')?.textContent
          if (pageTitle) title = pageTitle

          // Remove non-content elements
          htmlDoc.querySelectorAll('script, style, nav, footer, header, ads, .ads, .sidebar, #sidebar, .menu, footer').forEach(el => el.remove())
          
          // Try to get content from main article if possible
          const mainContent = htmlDoc.querySelector('article, main, .content, #content, .post-content')
          text = (mainContent as HTMLElement || htmlDoc.body)?.innerText.replace(/\s+/g, ' ').trim() || ""
          
          if (text.length < 150) {
             // Fallback to body if selector failed or text is too short
             text = htmlDoc.body?.innerText.replace(/\s+/g, ' ').trim() || ""
          }

          if (text.length < 100) throw new Error("Could not extract enough text from the URL. Please try copying the text manually.")
          
          // Truncate if too long for AI context
          text = text.slice(0, 15000)
        } catch (e: any) {
          console.error("Link extraction failed:", e)
          throw new Error(e.message || "Failed to extract content from the URL.")
        }
      }

      setStatus("Saving to database...")
      
      // Ensure profile exists for older accounts that bypassed the new signup trigger
      if (user) {
        await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })
      }

      const { data: doc, error: docError } = await supabase.from('documents').insert({
        user_id: user?.id,
        title: title,
        content: text,
        file_type: file ? (file.name.split('.').pop() || 'file') : 'link',
        metadata: { status: 'processing' }
      }).select().single()

      if (docError) throw docError

      setStatus("Generating Topper-Style notes...")
      const notesPrompt = `Generate comprehensive "Cheat Sheet" style notes from the following content: ${text}. 
      Follow this STRICT formatting to match a high-fidelity academic guide:
      - Use Markdown for all formatting.
      - Main Title: # Cheat Sheet: [Topic Name]
      - Section Headers: ## [Section Name] (e.g., Key Concepts, Exam Focus)
      - Key Terms: Use **bold** for keywords followed by their definition.
      - Tables: ALWAYS use Markdown tables for "Key Events / Concepts" with columns: | Period / Event | Definition / Concept | Relevance to Exams |
      - Cause and Effect: Use bullet points with arrows.
      - Footer: Use a separator --- and *Generated by Topper AI*.
      
      Make it look exactly like a professional study guide. ${customInstructions ? `Additional Instructions: ${customInstructions}` : ""}`
      
      const notesResponse = await generateAIResponse([{ role: 'user', content: notesPrompt }])
      
      const { error: nError } = await supabase.from('notes').insert({
        document_id: doc.id,
        user_id: user?.id,
        content: notesResponse,
        title: `Notes: ${doc.title}`
      })
      if (nError) throw nError

      setStatus("Generating Summary...")
      const summaryPrompt = `Generate a concise, high-fidelity summary of the following content: ${text}. 
      Follow this STRICT formatting:
      - Title: # Summary: [Topic Name]
      - Use ## Section Headers.
      - Use **bold** for important terms.
      - Include a ## Conclusion section.
      ${customInstructions ? `Additional Instructions: ${customInstructions}` : ""}`
      
      const summaryResponse = await generateAIResponse([{ role: 'user', content: summaryPrompt }])

      const { error: sError } = await supabase.from('notes').insert({
        document_id: doc.id,
        user_id: user?.id,
        content: summaryResponse,
        title: `Summary: ${doc.title}`
      })
      if (sError) throw sError

      const extractJSON = (str: string) => {
        try {
          const jsonMatch = str.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
          return JSON.parse(str);
        } catch (e) {
          return null;
        }
      }

      setStatus("Generating Flashcards...")
      try {
        const flashcardsPrompt = `Generate ${questionCount} high-quality flashcards (Question and Answer format) from this content: ${text}. Format your response strictly as a JSON array: [{"question": "...", "answer": "..."}]`
        const flashcardsResponse = await generateAIResponse([{ role: 'user', content: flashcardsPrompt }])
        
        const flashcardsData = extractJSON(flashcardsResponse)
        if (Array.isArray(flashcardsData)) {
          const { error: fError } = await supabase.from('flashcards').insert(
            flashcardsData.map((f: any) => ({
              document_id: doc.id,
              user_id: user?.id,
              question: f.question,
              answer: f.answer
            }))
          )
          if (fError) console.error("Flashcard insert error:", fError)
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
          const { error: qError } = await supabase.from('quizzes').insert({
            document_id: doc.id,
            user_id: user?.id,
            title: `Quiz: ${doc.title}`,
            questions: quizData
          })
          if (qError) console.error("Quiz insert error:", qError)
        }
      } catch (e) {
        console.error("Quiz generation failed:", e)
      }

      setStatus("Generating Mind Map...")
      try {
        const mindMapPrompt = `Generate a mind map from this content: ${text}. Format your response strictly as a JSON object with "nodes" and "edges". 
        Nodes should be: {"id": "1", "position": {"x": 250, "y": 0}, "data": {"label": "Topic"}, "type": "input"}
        Edges should be: {"id": "e1-2", "source": "1", "target": "2"}
        Provide at least 5 nodes with logical coordinates.`
        const mindMapResponse = await generateAIResponse([{ role: 'user', content: mindMapPrompt }])
        
        const mindMapData = extractJSON(mindMapResponse)
        if (mindMapData && mindMapData.nodes) {
          const { error: mError } = await supabase.from('mind_maps').insert({
            document_id: doc.id,
            user_id: user?.id,
            flow_data: mindMapData
          })
          if (mError) console.error("Mind map insert error:", mError)
        }
      } catch (e) {
        console.error("Mind map generation failed:", e)
      }

      toast({
        title: "Success!",
        description: "Your study materials have been generated. Redirecting to your notes...",
      })
      
      setFile(null)
      setLink("")
      setPastedText("")
      setCustomInstructions("")
      
      // Short delay for the user to see the success state
      setTimeout(() => {
        navigate("/dashboard/notes")
      }, 1500)
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
    <div className="max-w-4xl mx-auto py-4 md:py-6 px-4 md:px-0">
      <div className="mb-6 md:mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black mb-2 md:mb-4">Upload Center</h1>
        <p className="text-muted-foreground text-lg">
          Upload your materials to instantly generate study guides.
        </p>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-card/50 backdrop-blur-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-16 bg-muted/50 rounded-none border-b">
            <TabsTrigger value="file" className="text-base md:text-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
              <File size={18} className="shrink-0" />
              <span>File</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="text-base md:text-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
              <LinkIcon size={18} className="shrink-0" />
              <span>Link</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="text-base md:text-lg font-bold data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
              <Type size={18} className="shrink-0" />
              <span>Paste</span>
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-4 md:p-10">
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
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle size={14} />
                    Best for Wikipedia, educational blogs, and news articles.
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    This is the most reliable way if the link extraction fails.
                  </p>
               </div>
            </TabsContent>

            <div className="mt-8 space-y-4">
              <Label htmlFor="instructions" className="text-lg font-bold">Custom Instructions (Optional)</Label>
              <Input 
                id="instructions" 
                placeholder="e.g. Focus on key definitions, simplify complex terms, or emphasize math formulas..." 
                className="h-14 rounded-2xl text-lg border-muted-foreground/20"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground italic">
                These instructions will guide how the AI generates your notes, flashcards, and quizzes.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-bold">Number of Questions/Flashcards</Label>
                <span className="text-primary font-black text-xl">{questionCount}</span>
              </div>
              <div className="flex flex-col gap-4">
                 <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                   {[5, 10, 20, 30, 50].map((n) => (
                     <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestionCount(n)}
                      className={`w-12 h-10 rounded-xl font-bold ${questionCount === n ? 'bg-primary text-primary-foreground border-primary' : ''}`}
                     >
                       {n}
                     </Button>
                   ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Choose how many questions and flashcards the AI should generate from your material.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Label className="text-lg font-bold">Difficulty Level for Test</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                 {[
                   { id: 'easy', label: 'Easy', color: 'border-green-500/20 text-green-600 bg-green-50' },
                   { id: 'medium', label: 'Medium', color: 'border-yellow-500/20 text-yellow-600 bg-yellow-50' },
                   { id: 'hard', label: 'Hard', color: 'border-red-500/20 text-red-600 bg-red-50' }
                 ].map((d) => (
                   <Button
                    key={d.id}
                    type="button"
                    variant="outline"
                    onClick={() => setDifficulty(d.id as any)}
                    className={`h-12 md:h-14 rounded-2xl border-2 font-bold transition-all ${
                      difficulty === d.id ? `${d.color} border-current ring-4 ring-current/5` : 'border-muted-foreground/10 opacity-60'
                    }`}
                   >
                     {d.label}
                   </Button>
                 ))}
              </div>
              <p className="text-xs text-muted-foreground">Adjusting the difficulty will change the complexity of generated quiz questions.</p>
            </div>

            <div className="mt-10">
               <Button 
                 className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 gap-3 group"
                 onClick={handleUpload}
                 disabled={isProcessing}
               >
                 {isProcessing ? (
                   <>
                     <Loader2 size={24} className="animate-spin" />
                     {status}
                   </>
                 ) : (
                   <>
                     Start AI Generation
                     <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                   </>
                 )}
               </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
               {[
                 { icon: FileText, label: "Topper Notes", color: "text-blue-500" },
                 { icon: Brain, label: "Flashcards", color: "text-purple-500" },
                 { icon: Zap, label: "Quizzes", color: "text-yellow-500" }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/30">
                    <item.icon size={20} className={item.color} />
                    <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
