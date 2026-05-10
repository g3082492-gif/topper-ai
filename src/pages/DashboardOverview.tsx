import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { 
  Zap, 
  Trophy, 
  FileText, 
  Clock, 
  ChevronRight,
  TrendingUp,
  BarChart2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { Progress } from "../components/ui/progress.tsx"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { useNavigate } from "react-router-dom"

const data = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 30 },
  { day: 'Wed', minutes: 60 },
  { day: 'Thu', minutes: 45 },
  { day: 'Fri', minutes: 90 },
  { day: 'Sat', minutes: 120 },
  { day: 'Sun', minutes: 15 },
]

const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
  <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    streak: 0,
    points: 0,
    notes: 0,
    improvement: 0
  })
  const [activities, setActivities] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('points, streak')
      .eq('id', user.id)
      .single()

    const { count: notesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data: recentDocs } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    setStats({
      streak: profile?.streak || 0,
      points: profile?.points || 0,
      notes: notesCount || 0,
      improvement: 5
    })
    setActivities(recentDocs || [])
  }

  const navigate = useNavigate()

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your study progress for this week.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={() => navigate('/dashboard/mock-exams')} variant="outline" className="gap-2 rounded-xl">
             <Clock size={16} />
             Session History
           </Button>
           <Button onClick={() => navigate('/dashboard/upload')} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
             <Zap size={16} />
             Start Quick Study
           </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Study Streak" 
          value={`${stats.streak} Days`} 
          icon={Zap} 
          color="bg-yellow-500/10 text-yellow-500"
          description="Keep it up!"
        />
        <StatCard 
          title="Topper Points" 
          value={stats.points.toLocaleString()} 
          icon={Trophy} 
          color="bg-primary/10 text-primary"
          description="Level 4: Advanced Learner"
        />
        <StatCard 
          title="Notes Generated" 
          value={stats.notes.toString()} 
          icon={FileText} 
          color="bg-blue-500/10 text-blue-500"
          description="Total generated"
        />
        <StatCard 
          title="Average Score" 
          value={`${80 + stats.improvement}%`} 
          icon={TrendingUp} 
          color="bg-green-500/10 text-green-500"
          description="+5% improvement"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 size={20} className="text-primary" />
              Study Activity
            </CardTitle>
            <CardDescription>Daily minutes spent studying this week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Goals</CardTitle>
            <CardDescription>You're almost there!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                   <span>Generate 10 Notes</span>
                   <span className="text-primary">{stats.notes}/10</span>
                </div>
                <Progress value={Math.min((stats.notes / 10) * 100, 100)} className="h-2" />
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                   <span>Points Goal</span>
                   <span className="text-primary">{stats.points}/5000</span>
                </div>
                <Progress value={Math.min((stats.points / 5000) * 100, 100)} className="h-2" />
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                   <span>Study Streak</span>
                   <span className="text-primary">{stats.streak}/30</span>
                </div>
                <Progress value={Math.min((stats.streak / 30) * 100, 100)} className="h-2" />
             </div>
             
             <Button onClick={() => navigate('/dashboard/leaderboard')} className="w-full mt-4 border group rounded-xl" variant="outline">
                View All Achievements
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_type === 'link' ? 'Website Link' : 'Uploaded File'} • {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent activity. Start by uploading a document!
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
