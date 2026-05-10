import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx"
import { Badge } from "../components/ui/badge.tsx"
import { Trophy, Flame, Medal, Award, TrendingUp, Star, Ghost, User } from "lucide-react"
import { motion } from "framer-motion"

export default function LeaderboardModule() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false })
      .limit(20)
    
    if (data) {
      setLeaders(data)
      const index = data.findIndex(l => l.id === user?.id)
      if (index !== -1) {
        setCurrentUserRank({ ...data[index], rank: index + 1 })
      }
    }
    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-400" size={32} />
      case 2: return <Medal className="text-gray-400" size={32} />
      case 3: return <Medal className="text-amber-600" size={32} />
      default: return <span className="text-xl font-black text-muted-foreground w-8 text-center">{rank}</span>
    }
  }

  const getBadgeColor = (points: number) => {
    if (points > 1000) return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    if (points > 500) return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    return "bg-slate-500/10 text-slate-500 border-slate-500/20"
  }

  const getRankTitle = (points: number) => {
    if (points > 1000) return "Grandmaster"
    if (points > 500) return "Elite Scholar"
    if (points > 200) return "Active Learner"
    return "Newbie"
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                 <Trophy size={24} />
              </div>
              <Badge variant="outline" className="rounded-full px-4 py-1 font-black uppercase tracking-widest text-[10px]">Global Rankings</Badge>
           </div>
           <h1 className="text-5xl font-black tracking-tighter">Leaderboard</h1>
           <p className="text-muted-foreground text-lg mt-2">See where you stand among the top scholars globally.</p>
        </div>

        {currentUserRank && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary text-primary-foreground p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-8 px-10 border-4 border-white/10"
          >
            <div className="text-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Your Rank</p>
              <p className="text-4xl font-black">#{currentUserRank.rank}</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Points</p>
              <p className="text-4xl font-black">{currentUserRank.points}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 3 Podium */}
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-card/50 backdrop-blur-xl border border-white/5">
          <CardHeader className="p-10 border-b border-white/5">
             <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Hall of Fame</CardTitle>
                  <CardDescription>Top contributors this month</CardDescription>
                </div>
                <TrendingUp className="text-primary" />
             </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-white/5">
                {leaders.map((leader, i) => (
                  <motion.div 
                    key={leader.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-6 px-10 hover:bg-primary/5 transition-colors group ${leader.id === user?.id ? 'bg-primary/10' : ''}`}
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-10 flex justify-center">
                        {getRankIcon(i + 1)}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-primary/30 transition-all">
                          {leader.avatar_url ? (
                            <img src={leader.avatar_url} alt={leader.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{leader.full_name || 'Anonymous User'} {leader.id === user?.id && <span className="text-primary text-xs ml-2">(You)</span>}</p>
                          <div className="flex items-center gap-3">
                             <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter rounded-full ${getBadgeColor(leader.points)}`}>
                               {getRankTitle(leader.points)}
                             </Badge>
                             <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                                <Flame size={12} fill="currentColor" />
                                {leader.streak || 0}d
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       <p className="text-2xl font-black tabular-nums">{leader.points}</p>
                       <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Points</p>
                    </div>
                  </motion.div>
                ))}
                {leaders.length === 0 && !loading && (
                  <div className="p-20 text-center opacity-30">
                    <Ghost size={48} className="mx-auto mb-4" />
                    <p className="text-xl font-bold">The board is empty...</p>
                    <p>Be the first to score points!</p>
                  </div>
                )}
             </div>
          </CardContent>
        </Card>

        {/* Sidebar Achievements */}
        <div className="space-y-8">
           <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <CardHeader className="p-8">
                 <div className="flex items-center gap-3 mb-2">
                    <Award size={24} className="text-white" />
                    <CardTitle className="text-xl font-black">Your Status</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                 <div className="space-y-6">
                    <div>
                       <p className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-1">Current Level</p>
                       <p className="text-3xl font-black">{getRankTitle(currentUserRank?.points || 0)}</p>
                    </div>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-white transition-all duration-1000" 
                        style={{ width: `${Math.min(((currentUserRank?.points || 0) % 500) / 5, 100)}%` }}
                       />
                    </div>
                    <p className="text-xs font-medium opacity-80">Next Rank: {currentUserRank?.points < 500 ? 'Elite Scholar' : 'Grandmaster'} ({(500 - (currentUserRank?.points % 500))} pts left)</p>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                Achievement Badges
              </h3>
              <div className="grid grid-cols-3 gap-4">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                   <div key={i} className="aspect-square rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center group cursor-help relative">
                      <Award size={24} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Locked Achievement
                      </div>
                   </div>
                 ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">Complete quizzes and mock exams to unlock badges.</p>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Flame size={32} fill="currentColor" />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-orange-600">Daily Streak</p>
                    <p className="text-3xl font-black">{currentUserRank?.streak || 0} Days</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
