import * as React from "react"
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Brain, 
  HelpCircle, 
  MessageSquare, 
  User, 
  Settings,
  GraduationCap,
  LogOut,
  ClipboardCheck,
  Trophy,
  Plus
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "../ui/sidebar.tsx"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { supabase } from "../../lib/supabase"
import { Button } from "../ui/button.tsx"

const menuItems = [
  { title: "Overview", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Upload", icon: Upload, url: "/dashboard/upload" },
  { title: "Notes", icon: FileText, url: "/dashboard/notes" },
  { title: "Summaries", icon: FileText, url: "/dashboard/summaries" },
  { title: "Flashcards", icon: Brain, url: "/dashboard/flashcards" },
  { title: "Quizzes", icon: HelpCircle, url: "/dashboard/quizzes" },
  { title: "Mock Exams", icon: ClipboardCheck, url: "/dashboard/mock-exams" },
  { title: "Leaderboard", icon: Trophy, url: "/dashboard/leaderboard" },
  { title: "Chatbot", icon: MessageSquare, url: "/dashboard/chatbot" },
]

export function AppSidebar() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [recentDocs, setRecentDocs] = React.useState<any[]>([])

  React.useEffect(() => {
    if (user) {
      fetchRecentDocs()
    }
  }, [user])

  const fetchRecentDocs = async () => {
    const { data } = await supabase
      .from('documents')
      .select('id, title')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) setRecentDocs(data)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <GraduationCap size={22} />
          </div>
          <span className="font-black text-xl tracking-tight">Topper AI</span>
        </Link>
        <Link to="/dashboard/upload">
          <Button className="w-full justify-start gap-2 h-11 rounded-xl shadow-sm border-none bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
            <Plus size={18} />
            <span className="font-bold">New Study</span>
          </Button>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu className="px-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.url}
                  tooltip={item.title}
                  className="h-11 rounded-xl data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-all px-3"
                >
                  <Link to={item.url} className="gap-3">
                    <item.icon size={20} className={location.pathname === item.url ? "text-primary" : "text-muted-foreground"} />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recent Study</SidebarGroupLabel>
          <SidebarMenu className="px-2">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <SidebarMenuItem key={doc.id}>
                  <SidebarMenuButton asChild className="h-9 rounded-lg text-xs">
                    <Link to="/dashboard/notes" className="truncate">
                      <FileText size={14} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{doc.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <p className="px-3 py-2 text-[10px] text-muted-foreground italic">No recent materials</p>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Profile">
                <Link to="/dashboard/profile">
                  <User size={20} />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link to="/dashboard/settings">
                  <Settings size={20} />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
               <User size={16} />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
