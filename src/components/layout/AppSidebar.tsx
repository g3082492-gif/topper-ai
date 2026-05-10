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
  Trophy
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
            <GraduationCap size={20} />
          </div>
          <span className="font-bold text-lg truncate">Topper AI</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.url}
                  tooltip={item.title}
                >
                  <Link to={item.url}>
                    <item.icon size={20} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
