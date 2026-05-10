import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { Brain, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function FlashcardsModule() {
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [_loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchFlashcards()
  }, [])

  const fetchFlashcards = async () => {
    const { data } = await supabase
      .from('flashcards')
      .select('*, documents(title)')
      .eq('user_id', user?.id)
    
    if (data) setFlashcards(data)
    setLoading(false)
  }

  const nextCard = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    }, 150)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    }, 150)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
          <Brain className="text-primary" size={40} />
          AI Flashcards
        </h1>
        <p className="text-muted-foreground text-lg">Master your topics with active recall.</p>
      </div>

      {flashcards.length > 0 ? (
        <div className="space-y-8">
          <div className="relative min-h-[400px] perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + (isFlipped ? '-back' : '-front')}
                initial={{ opacity: 0, rotateY: isFlipped ? -90 : 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: isFlipped ? 90 : -90 }}
                transition={{ duration: 0.3 }}
                className="w-full min-h-[400px] cursor-pointer h-full"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <Card className={`w-full min-h-[400px] h-full border-none shadow-2xl flex items-center justify-center p-8 md:p-12 text-center rounded-[2rem] transition-colors duration-500 ${
                  isFlipped ? 'bg-primary text-primary-foreground' : 'bg-card'
                }`}>
                  <CardContent className="w-full flex flex-col items-center justify-center py-10">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-60 mb-6">
                      {isFlipped ? 'Answer' : 'Question'}
                    </p>
                    <div className="w-full max-h-[250px] overflow-auto no-scrollbar">
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight px-2">
                        {isFlipped ? flashcards[currentIndex].answer : flashcards[currentIndex].question}
                      </h2>
                    </div>
                    <div className="mt-10 flex items-center gap-2 text-xs font-bold opacity-40">
                       <RotateCcw size={14} />
                       CLICK TO FLIP
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between px-4">
             <div className="flex gap-4">
                <Button variant="outline" size="icon" onClick={prevCard} className="w-12 h-12 rounded-full shadow-lg">
                   <ChevronLeft size={24} />
                </Button>
                <Button variant="outline" size="icon" onClick={nextCard} className="w-12 h-12 rounded-full shadow-lg">
                   <ChevronRight size={24} />
                </Button>
             </div>
             <div className="text-lg font-bold">
                {currentIndex + 1} <span className="text-muted-foreground">/ {flashcards.length}</span>
             </div>
             <Button variant="ghost" className="gap-2 font-bold">
                <Sparkles size={18} className="text-primary" />
                Mix All Sets
             </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
           <Brain size={48} className="mx-auto text-muted-foreground mb-4" />
           <h3 className="text-xl font-bold">No flashcards ready</h3>
           <p className="text-muted-foreground">Upload materials to generate new cards.</p>
        </div>
      )}
    </div>
  )
}
