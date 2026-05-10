import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { Card } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { Timer, AlertCircle, CheckCircle2, ChevronRight, GraduationCap } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useToast } from "../hooks/use-toast.ts"

export default function ExamMode() {
  const [searchParams] = useSearchParams()
  const quizId = searchParams.get('id')
  const customTime = parseInt(searchParams.get('time') || '30')
  const questionLimit = parseInt(searchParams.get('limit') || '999')
  
  const [exam, setExam] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(customTime * 60)
  const [isFinished, setIsFinished] = useState(false)
  const [score, setScore] = useState(0)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (quizId) fetchExam()
  }, [quizId])

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit()
    }
  }, [timeLeft, isFinished])

  const fetchExam = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*, documents(title)')
      .eq('id', quizId)
      .single()
    
    if (data) {
      // Limit questions based on user preference
      const limitedQuestions = data.questions.slice(0, questionLimit)
      setExam({ ...data, questions: limitedQuestions })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = () => {
    let s = 0
    exam.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correct) s++
    })
    setScore(s)
    setIsFinished(true)
    toast({ title: "Exam Submitted", description: "Your results are ready." })
  }

  if (!exam) return <div className="flex items-center justify-center h-screen">Loading Exam Engine...</div>

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full border-none shadow-2xl rounded-[3rem] p-12 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <GraduationCap size={48} />
          </div>
          <h2 className="text-4xl font-black mb-4">Exam Results</h2>
          <p className="text-xl text-muted-foreground mb-10">
            {exam.title}
          </p>
          
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="p-8 rounded-[2rem] bg-muted/50 border">
              <p className="text-4xl font-black text-primary">{Math.round((score / exam.questions.length) * 100)}%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-2">Accuracy</p>
            </div>
            <div className="p-8 rounded-[2rem] bg-muted/50 border">
              <p className="text-4xl font-black">{score}/{exam.questions.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-2">Score</p>
            </div>
          </div>

          <Button onClick={() => navigate('/dashboard/mock-exams')} size="lg" className="h-16 px-12 rounded-2xl text-xl font-bold">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-20 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <h1 className="font-black text-lg line-clamp-1">{exam.title}</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-tighter font-bold">Official Mock Session</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-6 py-2 rounded-full font-mono text-xl font-black ${timeLeft < 300 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'}`}>
            <Timer size={20} />
            {formatTime(timeLeft)}
          </div>
          <Button variant="destructive" onClick={handleSubmit} className="rounded-xl font-bold px-6 h-11 shadow-lg shadow-destructive/20">
            Finish Exam
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-32">
        <div className="mb-10 flex items-center justify-between">
           <div className="flex gap-2">
             {exam.questions.map((_: any, i: number) => (
               <div 
                key={i} 
                onClick={() => setCurrentQuestion(i)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all border-2 font-bold text-sm ${
                  currentQuestion === i ? 'border-primary bg-primary text-primary-foreground' : 
                  answers[i] !== undefined ? 'border-primary/30 bg-primary/5 text-primary' : 'border-muted text-muted-foreground hover:border-muted-foreground'
                }`}
               >
                 {i + 1}
               </div>
             ))}
           </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden bg-card/80">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
          <h2 className="text-2xl md:text-4xl font-black mb-12 leading-tight">
            {exam.questions[currentQuestion].question}
          </h2>
          
          <div className="grid grid-cols-1 gap-5">
            {exam.questions[currentQuestion].options.map((option: string, i: number) => (
              <button 
                key={i}
                onClick={() => setAnswers({...answers, [currentQuestion]: i})}
                className={`flex items-center gap-6 p-6 rounded-2xl border-2 text-left transition-all group ${
                  answers[currentQuestion] === i ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black transition-colors ${
                  answers[currentQuestion] === i ? 'bg-primary text-primary-foreground' : 'bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary'
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-lg font-medium flex-1">{option}</span>
                {answers[currentQuestion] === i && <CheckCircle2 size={24} className="text-primary" />}
              </button>
            ))}
          </div>
        </Card>

        <div className="fixed bottom-0 left-0 w-full p-8 flex justify-center pointer-events-none">
           <div className="max-w-5xl w-full flex justify-between pointer-events-auto">
              <Button 
                variant="ghost" 
                size="lg" 
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(q => q - 1)}
                className="h-16 px-10 rounded-2xl text-lg font-bold gap-2"
              >
                Previous
              </Button>
              <Button 
                size="lg"
                onClick={() => {
                  if (currentQuestion + 1 < exam.questions.length) {
                    setCurrentQuestion(q => q + 1)
                  } else {
                    handleSubmit()
                  }
                }}
                className="h-16 px-10 rounded-2xl text-lg font-bold gap-2 shadow-2xl shadow-primary/20"
              >
                {currentQuestion + 1 === exam.questions.length ? 'Submit Exam' : 'Next Question'}
                <ChevronRight size={24} />
              </Button>
           </div>
        </div>
      </main>
    </div>
  )
}
