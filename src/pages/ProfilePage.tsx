import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { 
  Settings, 
  Trophy, 
  Zap, 
  Mail, 
  Shield, 
  Camera,
  Award,
  Star,
  FileText,
  X
} from "lucide-react"
import { Progress } from "../components/ui/progress.tsx"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar.tsx"
import { useToast } from "../hooks/use-toast.ts"
import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"
import { Input } from "../components/ui/input.tsx"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ notesCount: 0, docsCount: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStats()
    }
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single()
    if (data) {
      setProfile(data)
      setNewName(data.full_name || "")
    }
  }

  const fetchStats = async () => {
    const { count: notesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    const { count: docsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    setStats({ notesCount: notesCount || 0, docsCount: docsCount || 0 })
  }

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user?.id)

      if (error) throw error

      toast({ title: "Profile Updated", description: "Your changes have been saved." })
      setIsEditing(false)
      fetchProfile()
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    }
  }

  const handleResetData = async () => {
    if (!confirm("Are you sure you want to delete ALL your data? This includes documents, notes, quizzes, and points. This cannot be undone.")) return

    try {
      const userId = user?.id
      if (!userId) return

      await supabase.from('notes').delete().eq('user_id', userId)
      await supabase.from('quizzes').delete().eq('user_id', userId)
      await supabase.from('flashcards').delete().eq('user_id', userId)
      await supabase.from('documents').delete().eq('user_id', userId)
      await supabase.from('profiles').update({ points: 0, streak: 0 }).eq('id', userId)

      toast({
        title: "Account Reset",
        description: "Your account data has been cleared. Welcome to your fresh start!",
      })
      
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Calculate Rank and Level
  const points = profile?.points || 0
  const streak = profile?.streak || 0
  const levelNames = ["Novice", "Scholar", "Master", "Legend"]
  const levelIdx = Math.min(Math.floor(points / 1000), levelNames.length - 1)
  const currentRank = levelNames[levelIdx]
  const nextLevelPts = (levelIdx + 1) * 1000
  const progressPercent = (points % 1000) / 10

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Profile Section */}
      <div className="relative">
        <div className="h-32 md:h-48 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-transparent rounded-[1.5rem] md:rounded-[2.5rem]" />
        <div className="absolute -bottom-12 left-4 md:left-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-full md:w-auto">
           <div className="relative group">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-2xl rounded-3xl">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl md:text-4xl font-black rounded-3xl">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-2 right-2 p-1.5 md:p-2 bg-background rounded-xl shadow-lg hover:text-primary transition-colors border">
                 <Camera size={14} />
              </button>
           </div>
           <div className="pb-0 md:pb-4 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-black">{profile?.full_name || user?.email?.split('@')[0]}</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                 <Mail size={14} />
                 {user?.email}
              </p>
           </div>
        </div>
        <div className="absolute top-4 right-4">
           <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm" className="gap-2 rounded-xl backdrop-blur-md bg-background/50">
              <Settings size={16} />
              <span className="hidden sm:inline">Edit Profile</span>
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10">
         {/* Gamification Stats */}
         <Card className="border-none shadow-2xl rounded-[2.5rem] bg-primary text-primary-foreground overflow-hidden relative">
            <CardHeader className="p-8 pb-4">
               <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy size={20} />
                  Your Rank
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
               <div>
                  <p className="text-5xl font-black mb-1">{currentRank}</p>
                  <p className="text-primary-foreground/80 font-medium">Top student of your league</p>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                     <span>Next Level: {levelNames[levelIdx + 1] || "Legend"}</span>
                     <span>{points} / {nextLevelPts} pts</span>
                  </div>
                  <Progress value={progressPercent} className="h-3 bg-white/20" />
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                     <p className="text-2xl font-black">{streak}</p>
                     <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Day Streak</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                     <p className="text-2xl font-black">{stats.notesCount}</p>
                     <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Notes Made</p>
                  </div>
               </div>
            </CardContent>
            <Star size={120} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
         </Card>

         {/* Badges & Achievements */}
         <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem]">
            <CardHeader className="p-8">
               <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <Award className="text-primary" />
                  Achievements
               </CardTitle>
               <CardDescription>Badges you've earned through consistent study.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <div className="flex flex-wrap gap-6">
                  {[
                     { name: "First Step", icon: Zap, color: "bg-blue-500", earned: true, date: "Unlocked" },
                     { name: "Quiz Master", icon: Trophy, color: "bg-yellow-500", earned: points > 1000, date: points > 1000 ? "Unlocked" : "Locked" },
                     { name: "Night Owl", icon: Star, color: "bg-purple-500", earned: points > 2000, date: points > 2000 ? "Unlocked" : "Locked" },
                     { name: "Note Ninja", icon: FileText, color: "bg-green-500", earned: stats.notesCount >= 5, date: stats.notesCount >= 5 ? "Unlocked" : "Locked" },
                     { name: "Top Ranker", icon: Award, color: "bg-red-500", earned: points > 5000, date: points > 5000 ? "Unlocked" : "Locked" },
                  ].map((badge, i) => (
                     <div key={i} className={`flex flex-col items-center gap-3 group ${!badge.earned && 'opacity-30 grayscale'}`}>
                        <div className={`w-16 h-16 rounded-3xl ${badge.color} text-white flex items-center justify-center shadow-lg transition-all ${badge.earned ? 'group-hover:scale-110 group-hover:rotate-6' : ''}`}>
                           <badge.icon size={28} />
                        </div>
                        <div className="text-center">
                           <p className="text-xs font-bold">{badge.name}</p>
                           <p className="text-[10px] text-muted-foreground">{badge.date}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between border-b p-6">
              <CardTitle className="text-xl font-black">Edit Profile</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full">
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Full Name</label>
                <Input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  className="rounded-xl h-12"
                />
              </div>
              <Button onClick={handleUpdateProfile} className="w-full h-12 rounded-xl font-bold">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
         {/* Account Info */}
         <Card className="md:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-md">
            <CardHeader className="p-8">
               <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Shield size={20} className="text-primary" />
                  Account Security
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
               <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer border">
                  <div className="flex items-center gap-4">
                     <Mail size={18} className="text-muted-foreground" />
                     <div>
                        <p className="text-sm font-bold">Email Address</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary text-xs font-bold">Change</Button>
               </div>
               <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer border">
                  <div className="flex items-center gap-4">
                     <Shield size={18} className="text-muted-foreground" />
                     <div>
                        <p className="text-sm font-bold">Password</p>
                        <p className="text-xs text-muted-foreground">Last changed 2 months ago</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary text-xs font-bold">Update</Button>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] bg-destructive/5 border border-destructive/20 mt-12 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-10 gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black text-destructive">Danger Zone</h3>
            <p className="text-sm md:text-base text-muted-foreground">Wipe your account clean to start fresh. This will delete all your study materials and reset your rank.</p>
          </div>
          <Button 
            variant="destructive" 
            className="w-full md:w-auto h-12 md:h-14 px-10 rounded-2xl font-bold shadow-lg shadow-destructive/20"
            onClick={handleResetData}
          >
            Reset My Progress
          </Button>
        </div>
      </Card>
    </div>
  )
}
