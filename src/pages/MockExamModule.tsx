import { ClipboardCheck, Timer, AlertTriangle, ArrowRight, Sparkles, Brain } from "lucide-react"
import { Button } from "../components/ui/button.tsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx"
import { Badge } from "../components/ui/badge.tsx"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"

export default function MockExamModule() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) fetchExams()
  }, [user])

  const fetchExams = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*, documents(title)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    
    if (data) setExams(data)
    setLoading(false)
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Mock Exam Engine</h1>
          <p className="text-muted-foreground text-lg">Simulate real board and competitive exam conditions.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/upload')} className="h-14 px-8 rounded-2xl text-lg font-bold gap-2 shadow-xl shadow-primary/20 transition-transform hover:scale-105">
           <Sparkles size={20} />
           Generate New Exam
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-md overflow-hidden">
            <CardHeader className="p-10 pb-4">
               <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1 rounded-full border-none font-bold">Recommended for you</Badge>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                     <Timer size={16} />
                     45 Minutes
                  </div>
               </div>
               <CardTitle className="text-3xl font-black mb-2">
                  {exams[0]?.title || "Ready to start?"}
               </CardTitle>
               <CardDescription className="text-base">
                  {exams[0] ? `Based on your document: ${exams[0].documents?.title}` : "Upload a document to generate your first mock exam."}
               </CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
               <div className="grid grid-cols-2 gap-6 my-10">
                  <div className="p-6 rounded-3xl bg-muted/50 border text-center">
                     <p className="text-2xl font-black">{exams[0]?.questions?.length || 0}</p>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Questions</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/50 border text-center">
                     <p className="text-2xl font-black">Medium</p>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Difficulty</p>
                  </div>
               </div>

               <div className="space-y-4 mb-10">
                  <h4 className="font-bold flex items-center gap-2">
                     <AlertTriangle size={18} className="text-yellow-500" />
                     Exam Rules
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                     <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        No external tabs or applications allowed.
                     </li>
                     <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        The exam will be automatically submitted when timer ends.
                     </li>
                  </ul>
               </div>

               <Button 
                disabled={!exams[0]} 
                onClick={() => navigate(`/dashboard/exam-session?id=${exams[0].id}`)}
                className="w-full h-16 rounded-2xl text-xl font-black group"
               >
                  Begin Examination
                  <ArrowRight size={24} className="ml-2 group-hover:translate-x-2 transition-transform" />
               </Button>
            </CardContent>
         </Card>

         <div className="space-y-6">
            <h3 className="text-xl font-bold px-2">Exam History</h3>
            {exams.slice(1, 4).map((exam, i) => (
               <Card key={i} className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer rounded-2xl p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-primary">
                        <ClipboardCheck size={24} />
                     </div>
                     <div>
                        <p className="font-bold group-hover:text-primary transition-colors line-clamp-1">{exam.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(exam.created_at).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-black">{exam.questions?.length} Qs</p>
                     <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/exam-session?id=${exam.id}`)} className="h-6 text-[10px] uppercase font-bold p-0 text-primary">Start</Button>
                  </div>
               </Card>
            ))}

            {exams.length <= 1 && !loading && (
               <div className="text-center py-10 opacity-50">
                  <p className="text-sm font-medium">No past exams found.</p>
               </div>
            )}
            
            <Card className="border-none shadow-md rounded-2xl p-8 bg-gradient-to-br from-primary to-blue-600 text-primary-foreground relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="text-lg font-bold mb-2">Need a study break?</h4>
                  <p className="text-sm opacity-80 mb-6">Take a quick 5-min cognitive quiz to refresh your brain.</p>
                  <Button variant="secondary" onClick={() => navigate('/dashboard/chatbot')} className="w-full rounded-xl font-bold">Chat with AI Tutor</Button>
               </div>
               <Brain size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
            </Card>
         </div>
      </div>
    </div>
  )
}
