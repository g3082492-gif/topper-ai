import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { FileText, Download, Share2, Search, Plus, X } from "lucide-react"
import { Input } from "../components/ui/input.tsx"
import { jsPDF } from "jspdf"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from "../hooks/use-toast.ts"

export default function NotesModule() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) fetchNotes()
  }, [user])

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*, documents(title)')
      .eq('user_id', user?.id)
      .not('title', 'like', 'Summary:%')
      .order('created_at', { ascending: false })
    
    if (data) setNotes(data)
    setLoading(false)
  }

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) {
      toast({ title: "Error", description: "Please fill in both title and content", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase.from('notes').insert({
        user_id: user?.id,
        title: newNote.title,
        content: newNote.content
      })

      if (error) throw error

      toast({ title: "Success", description: "Manual note saved!" })
      setIsAdding(false)
      setNewNote({ title: "", content: "" })
      fetchNotes()
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" })
    }
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
          <h1 className="text-3xl font-black">Topper Notes</h1>
          <p className="text-muted-foreground">Access all your AI-generated study guides.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2 rounded-xl h-11">
          <Plus size={18} />
          Manual Entry
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search your notes..." 
          className="pl-10 h-12 rounded-2xl bg-card border-none shadow-sm"
          onChange={(e) => {
            const query = e.target.value.toLowerCase()
            setNotes(prev => prev.map(n => ({
              ...n,
              hidden: !(n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
            })))
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.filter(n => !n.hidden).map((note) => (
          <Card 
            key={note.id} 
            className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col h-[280px]"
            onClick={() => setSelectedNote(note)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                 <FileText size={20} className="text-primary" />
                 {note.title.replace('Notes: ', '')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">Source: {note.documents?.title || 'Manual Entry'}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground line-clamp-4 flex-1">
                {note.content.replace(/[#*]/g, '')}
              </p>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                 <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 hover:bg-primary/10" onClick={(e) => downloadPDF(e, note)}>
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

      {notes.length === 0 && !loading && (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
           <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
           <h3 className="text-xl font-bold">No notes yet</h3>
           <p className="text-muted-foreground">Upload a file in the Upload Center to get started.</p>
        </div>
      )}

      {/* Manual Entry Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[2rem] my-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4 md:p-6">
              <CardTitle className="text-2xl font-black">Manual Entry</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full">
                <X size={24} />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Title</label>
                <Input 
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  placeholder="Note title..."
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Content (Markdown supported)</label>
                <textarea 
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className="w-full min-h-[300px] p-4 rounded-xl bg-muted/50 border-none focus:ring-2 ring-primary resize-none"
                  placeholder="Write your study notes here..."
                />
              </div>
              <Button onClick={handleAddNote} className="w-full h-14 rounded-xl text-lg font-bold">
                Save Note
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md md:p-4">
          <Card className="w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col border-none shadow-2xl md:rounded-[2rem] bg-background">
            <CardHeader className="flex flex-row items-center justify-between border-b px-4 md:px-8 py-3 md:py-6 shrink-0 bg-card/50">
              <div>
                <CardTitle className="text-2xl font-black">{selectedNote.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Source: {selectedNote.documents?.title || 'Manual Entry'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={(e) => downloadPDF(e, selectedNote)}>
                  <Download size={16} /> Download PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNote(null)} className="rounded-full">
                  <X size={24} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="h-full px-5 md:px-12 py-6 md:py-10">
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed text-base prose-headings:font-black prose-p:text-muted-foreground prose-strong:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedNote.content}
                  </ReactMarkdown>
                </div>
                <div className="h-20" /> {/* Spacer for bottom scroll padding */}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
