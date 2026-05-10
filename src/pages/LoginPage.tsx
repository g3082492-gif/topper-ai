import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from "../components/ui/button.tsx"
import { Input } from "../components/ui/input.tsx"
import { Label } from "../components/ui/label.tsx"
import { GraduationCap, ArrowLeft, Mail, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from "../hooks/use-toast.ts"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      let errorMessage = error.message
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Your email has not been verified yet. Please check your inbox for the verification link.'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again or create a new account.'
      }

      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Image/Promotion */}
      <div className="hidden lg:block relative bg-primary overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" 
            alt="Students studying"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-60" />
        </motion.div>
        
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-4xl font-black mb-6">"Study smarter, not harder. Let AI do the heavy lifting."</h2>
            <div className="flex gap-12">
               <div className="space-y-1">
                 <p className="text-3xl font-black">10k+</p>
                 <p className="text-primary-foreground/80 text-sm uppercase tracking-widest">Students</p>
               </div>
               <div className="space-y-1">
                 <p className="text-3xl font-black">50k+</p>
                 <p className="text-primary-foreground/80 text-sm uppercase tracking-widest">Notes</p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col p-8 md:p-12 lg:p-16 justify-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-12 transition-colors">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
              <GraduationCap size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Topper AI</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Enter your credentials to access your study portal.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-10 h-11 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" title="Forgot password?" className="text-sm text-primary font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
