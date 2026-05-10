import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { supabase } from "../lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.tsx"
import { Button } from "../components/ui/button.tsx"
import { Input } from "../components/ui/input.tsx"
import { Label } from "../components/ui/label.tsx"
import { useToast } from "../hooks/use-toast.ts"
import { User, Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")

  const handleUpdatePassword = async () => {
    if (!password) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully."
      })
      setPassword("")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <Card className="border-none shadow-md bg-primary/5 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <User size={20} className="text-primary" />
              <span className="font-bold">Account</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm opacity-50 cursor-not-allowed">
            <CardContent className="p-4 flex items-center gap-4">
              <Bell size={20} />
              <span>Notifications</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm opacity-50 cursor-not-allowed">
            <CardContent className="p-4 flex items-center gap-4">
              <Shield size={20} />
              <span>Privacy</span>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="flex gap-4">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter new password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button onClick={handleUpdatePassword} disabled={loading || !password}>
                    {loading ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
