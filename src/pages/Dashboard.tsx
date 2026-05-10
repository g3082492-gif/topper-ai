import { Routes, Route } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar.tsx"
import { AppSidebar } from "../components/layout/AppSidebar.tsx"
import DashboardOverview from "./DashboardOverview.tsx"
import UploadCenter from "./UploadCenter.tsx"
import NotesModule from "./NotesModule.tsx"
import FlashcardsModule from "./FlashcardsModule.tsx"
import QuizModule from "./QuizModule.tsx"
import SummaryModule from "./SummaryModule.tsx"
import ChatbotModule from "./ChatbotModule.tsx"
import MockExamModule from "./MockExamModule.tsx"
import ExamMode from "./ExamMode.tsx"
import LeaderboardModule from "./LeaderboardModule.tsx"
import ProfilePage from "./ProfilePage.tsx"
import SettingsPage from "./SettingsPage.tsx"

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl border bg-background shadow-sm" />
              <div className="h-6 w-px bg-border hidden md:block" />
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest hidden md:block">Topper Platform</h2>
            </div>
          </header>
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="upload" element={<UploadCenter />} />
              <Route path="notes" element={<NotesModule />} />
              <Route path="summaries" element={<SummaryModule />} />
              <Route path="flashcards" element={<FlashcardsModule />} />
              <Route path="quizzes" element={<QuizModule />} />
              <Route path="chatbot" element={<ChatbotModule />} />
              <Route path="mock-exams" element={<MockExamModule />} />
              <Route path="exam-session" element={<ExamMode />} />
              <Route path="leaderboard" element={<LeaderboardModule />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
