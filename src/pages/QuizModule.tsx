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
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes default
  const [isReviewing, setIsReviewing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (currentQuiz && !showResult && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && !showResult) {
      setShowResult(true)
    }
    return () => clearInterval(timer)
  }, [currentQuiz, showResult, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
                          <Button onClick={() => {
                            setCurrentQuiz(quiz)
                            setTimeLeft(quiz.questions.length * 60) // 1 min per question
                          }} className="rounded-xl px-6">Start Quiz</Button>
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
                 setIsReviewing(false)
               }} size="lg" className="rounded-2xl px-8 h-14 text-lg w-full md:w-auto">Back to List</Button>
               <Button onClick={() => {
                 setIsReviewing(true)
                 setShowResult(false)
                 setCurrentQuestion(0)
               }} variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-lg w-full md:w-auto">Review Answers</Button>
            </div>
        </Card>
      ) : (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
               <div className="space-y-1">
                  <h2 className="text-lg md:text-xl font-bold line-clamp-1">{currentQuiz.title}</h2>
                  <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                     <span className={`flex items-center gap-1 ${timeLeft < 60 ? 'text-red-500 animate-pulse font-bold' : ''}`}>
                        <Timer size={14} /> {formatTime(timeLeft)} left
                     </span>
                     <span>Question {currentQuestion + 1} of {currentQuiz.questions.length}</span>
                  </div>
               </div>
               <Button variant="ghost" size="sm" onClick={() => {
                 setCurrentQuiz(null)
                 setIsReviewing(false)
               }} className="rounded-xl">Exit</Button>
            </div>

           <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%` }}
              />
           </div>

            <Card className="border-none shadow-xl rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-12">
               <h3 className="text-xl md:text-3xl font-bold mb-6 md:mb-10 leading-tight">
                 {currentQuiz.questions[currentQuestion].question}
               </h3>
               <div className="grid grid-cols-1 gap-3 md:gap-4">
                 {currentQuiz.questions[currentQuestion].options.map((option: string, i: number) => {
                   const isCorrect = i === currentQuiz.questions[currentQuestion].correct
                   const isSelected = selectedAnswer === i
                   
                   return (
                     <Button 
                       key={i}
                       variant={isSelected ? "default" : "outline"}
                       className={`min-h-[3.5rem] md:min-h-[4.5rem] h-auto justify-start px-4 md:px-8 text-base md:text-lg rounded-xl md:rounded-2xl border-2 transition-all py-3 md:py-4 whitespace-normal text-left ${
                         isReviewing 
                           ? isCorrect 
                             ? 'border-green-500 bg-green-500/10 text-green-700' 
                             : isSelected ? 'border-red-500 bg-red-500/10 text-red-700' : 'border-muted'
                           : isSelected 
                             ? 'border-primary' 
                             : 'border-muted hover:border-primary/50'
                       }`}
                       onClick={() => !isReviewing && handleAnswer(i)}
                       disabled={selectedAnswer !== null && !isReviewing}
                     >
                       <span className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center mr-3 md:mr-4 text-xs md:text-sm font-bold shrink-0 ${
                         isReviewing && isCorrect ? 'bg-green-500 text-white' : 'bg-muted'
                       }`}>
                         {String.fromCharCode(65 + i)}
                       </span>
                       <span className="flex-1">{option}</span>
                     </Button>
                   )
                 })}
               </div>
               
               {isReviewing && (
                 <div className="mt-8 flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                      disabled={currentQuestion === 0}
                      className="rounded-xl"
                    >
                      Previous
                    </Button>
                    {currentQuestion + 1 < currentQuiz.questions.length ? (
                      <Button 
                        onClick={() => setCurrentQuestion(q => q + 1)}
                        className="rounded-xl"
                      >
                        Next Question
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          setIsReviewing(false)
                          setShowResult(true)
                        }}
                        className="rounded-xl"
                      >
                        Finish Review
                      </Button>
                    )}
                 </div>
               )}
            </Card>
        </div>
      )}
    </div>
  )
}
