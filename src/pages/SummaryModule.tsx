import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { FileText, Download, Share2, Search, X } from "lucide-react"
import { Input } from "../components/ui/input.tsx"
import { jsPDF } from "jspdf"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function SummaryModule() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSummary, setSelectedSummary] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchSummaries()
  }, [user])

  const fetchSummaries = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*, documents(title)')
      .eq('user_id', user?.id)
      .like('title', 'Summary:%')
      .order('created_at', { ascending: false })
    
    if (data) setSummaries(data)
    setLoading(false)
  }

  const downloadPDF = (e: React.MouseEvent, note: any) => {
    e.stopPropagation()
    const doc = new jsPDF()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text(note.title, 20, 20)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(note.content, 170)
    doc.text(splitText, 20, 30)
    
    doc.save(`${note.title.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Summaries</h1>
          <p className="text-muted-foreground">Access AI-generated summaries of your materials.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search your summaries..." 
          className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm"
          onChange={(e) => {
            const query = e.target.value.toLowerCase()
            setSummaries(prev => prev.map(s => ({
              ...s,
              hidden: !(s.title.toLowerCase().includes(query) || s.content.toLowerCase().includes(query))
            })))
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.filter(s => !s.hidden).map((summary) => (
          <Card 
            key={summary.id} 
            className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col h-[280px]"
            onClick={() => setSelectedSummary(summary)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                 <FileText size={20} className="text-primary" />
                 {summary.title.replace('Summary: ', '')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Source: {summary.documents?.title}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground line-clamp-4 flex-1">
                {summary.content.replace(/[#*]/g, '')}
              </p>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                 <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 hover:bg-primary/10" onClick={(e) => downloadPDF(e, summary)}>
                    <Download size={14} />
                    PDF
                 </Button>
                 <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 hover:bg-primary/10" onClick={(e) => e.stopPropagation()}>
                    <Share2 size={14} />
                    Share
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {summaries.length === 0 && !loading && (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
           <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
           <h3 className="text-xl font-bold">No summaries yet</h3>
           <p className="text-muted-foreground">Upload a file in the Upload Center to get started.</p>
        </div>
      )}

      {selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md md:p-4">
          <Card className="w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col border-none shadow-2xl md:rounded-[2rem] bg-background">
            <CardHeader className="flex flex-row items-center justify-between border-b px-4 md:px-8 py-2 md:py-4 shrink-0 bg-card/50 relative">
              <div className="max-w-[70%]">
                <CardTitle className="text-lg md:text-2xl font-black line-clamp-1">{selectedSummary.title}</CardTitle>
                <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 line-clamp-1">Source: {selectedSummary.documents?.title}</p>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => downloadPDF(e, selectedSummary)} className="h-9 w-9 rounded-full">
                  <Download size={18} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={() => setSelectedSummary(null)} 
                  className="h-9 w-9 rounded-full shadow-md md:shadow-none"
                >
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="h-full px-5 md:px-12 py-6 md:py-10">
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed text-base prose-headings:font-black prose-p:text-muted-foreground prose-strong:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedSummary.content}
                  </ReactMarkdown>
                </div>
                <div className="h-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
