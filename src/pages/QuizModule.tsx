import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { HelpCircle, Timer, Award } from "lucide-react"

export default function QuizModule() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*, documents(title)')
      .eq('user_id', user?.id)
    
    if (data) setQuizzes(data)
  }

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index)
    if (index === currentQuiz.questions[currentQuestion].correct) {
      setScore((s) => s + 1)
    }

    setTimeout(() => {
      if (currentQuestion + 1 < currentQuiz.questions.length) {
        setCurrentQuestion((q) => q + 1)
        setSelectedAnswer(null)
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!currentQuiz ? (
        <>
          <div className="mb-10">
             <h1 className="text-3xl font-black">Practice Quizzes</h1>
             <p className="text-muted-foreground">Test your knowledge with AI-generated questions.</p>
          </div>
          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="border-none shadow-md hover:scale-[1.02] transition-all cursor-pointer overflow-hidden group">
                   <div className="h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                   <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                         <HelpCircle size={20} className="text-primary" />
                         {quiz.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Source: {quiz.documents?.title}</p>
                   </CardHeader>
                   <CardContent>
                      <div className="flex justify-between items-center mb-6">
                         <div className="flex gap-4">
                            <div className="text-center">
                               <p className="text-lg font-bold">{quiz.questions.length}</p>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Qns</p>
                            </div>
                            <div className="text-center">
                               <p className="text-lg font-bold">10</p>
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Mins</p>
                            </div>
                         </div>
                         <Button onClick={() => setCurrentQuiz(quiz)} className="rounded-xl px-6">Start Quiz</Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
               <HelpCircle size={48} className="mx-auto text-muted-foreground mb-4" />
               <h3 className="text-xl font-bold">No practice quizzes available</h3>
               <p className="text-muted-foreground">Upload study materials in the Upload Center to generate your first quiz.</p>
            </div>
          )}
        </>
      ) : showResult ? (
        <Card className="border-none shadow-2xl text-center p-12 rounded-[2.5rem]">
           <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={40} />
           </div>
           <h2 className="text-4xl font-black mb-2">Quiz Completed!</h2>
           <p className="text-muted-foreground text-lg mb-8">You scored {score} out of {currentQuiz.questions.length}</p>
           
           <div className="flex justify-center gap-4">
              <Button onClick={() => {
                setCurrentQuiz(null)
                setShowResult(false)
                setScore(0)
                setCurrentQuestion(0)
              }} size="lg" className="rounded-2xl px-8 h-14 text-lg">Back to List</Button>
              <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-lg">Review Answers</Button>
           </div>
        </Card>
      ) : (
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-xl font-bold">{currentQuiz.title}</h2>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Timer size={14} /> 08:45 left</span>
                    <span>Question {currentQuestion + 1} of {currentQuiz.questions.length}</span>
                 </div>
              </div>
              <Button variant="ghost" onClick={() => setCurrentQuiz(null)}>Exit</Button>
           </div>

           <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%` }}
              />
           </div>

           <Card className="border-none shadow-xl rounded-[2rem] p-8 md:p-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-10 leading-tight">
                {currentQuiz.questions[currentQuestion].question}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {currentQuiz.questions[currentQuestion].options.map((option: string, i: number) => (
                  <Button 
                    key={i}
                    variant={selectedAnswer === i ? "default" : "outline"}
                    className={`min-h-[4.5rem] h-auto justify-start px-8 text-lg rounded-2xl border-2 transition-all py-4 whitespace-normal text-left ${
                      selectedAnswer === i 
                        ? 'border-primary' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-4 text-sm font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </Button>
                ))}
              </div>
           </Card>
        </div>
      )}
    </div>
  )
}
