import { Button } from "../ui/button"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"

export const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b"
    >
      <Link to="/" className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-primary text-primary-foreground">
          <GraduationCap size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight">Topper AI</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <a href="#features" className="hover:text-primary transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
        <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login">
          <Button variant="ghost" size="sm">Login</Button>
        </Link>
        <Link to="/signup">
          <Button size="sm" className="bg-primary hover:bg-primary/90">Sign Up</Button>
        </Link>
      </div>
    </motion.nav>
  )
}
