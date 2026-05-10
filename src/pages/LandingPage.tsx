import { motion } from "framer-motion"
import { Button } from "../components/ui/button.tsx"
import { Navbar } from "../components/layout/Navbar.tsx"
import { 
  FileText, 
  Brain, 
  Layout, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Trophy,
  Users
} from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles size={16} />
              AI-Powered Learning Revolution
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-6 md:mb-8">
              Become a <span className="text-primary">Topper</span> with <br />
              Personalized AI Study.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Upload your study materials and let our AI generate notes, flashcards, 
              quizzes, and mind maps in seconds. The ultimate study companion for students.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 text-lg rounded-2xl gap-2 shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                  Start Learning Free
                  <ArrowRight size={20} />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl transition-transform hover:scale-105">
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to excel</h2>
            <p className="text-muted-foreground">Modern tools built for the modern student.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Smart Notes", desc: "Instantly convert PDFs into structured, topper-style notes." },
              { icon: Brain, title: "AI Flashcards", desc: "Automated active recall tools to help you remember longer." },
              { icon: Layout, title: "Mock Exams", desc: "Generate board-level questions based on your specific syllabus." },
              { icon: MessageSquare, title: "Study Chatbot", desc: "24/7 AI tutor to answer any academic doubts instantly." },
              { icon: Zap, title: "Mind Maps", desc: "Visualize complex topics with AI-generated hierarchy charts." },
              { icon: Trophy, title: "Gamification", desc: "Earn points and badges as you hit your study goals." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl border bg-card/50 hover:border-primary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-2xl font-bold mb-12 flex items-center justify-center gap-2">
             <Users className="text-primary" />
             Trusted by 10,000+ Students
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-background p-8 rounded-3xl shadow-sm border text-left italic">
                "Topper AI reduced my note-taking time by 70%. I can focus more on understanding concepts now."
                <div className="mt-4 not-italic font-bold text-primary">— Aryan, IIT Aspirant</div>
              </div>
              <div className="bg-background p-8 rounded-3xl shadow-sm border text-left italic">
                "The AI-generated quizzes are surprisingly accurate to my board exam patterns. Highly recommended!"
                <div className="mt-4 not-italic font-bold text-primary">— Sarah, Medical Student</div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-black mb-6">Ready to transform your study habits?</h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
            Join the community of toppers today. No credit card required to start.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-2xl shadow-2xl transition-transform hover:scale-105">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 size={18} />
            </div>
            <span className="font-bold text-lg">Topper AI</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Support</a>
            <a href="#" className="hover:text-primary">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Topper AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
