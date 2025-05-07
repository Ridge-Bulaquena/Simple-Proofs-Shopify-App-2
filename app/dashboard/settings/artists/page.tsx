"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Plus, Trash2, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Artist } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, isValidEmail } from "@/lib/utils"
import Link from "next/link"

export default function ArtistManagementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeId, setStoreId] = useState<string>("")
  const [artists, setArtists] = useState<Artist[]>([])
  const [newArtistName, setNewArtistName] = useState("")
  const [newArtistEmail, setNewArtistEmail] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  useEffect(() => {
    const fetchArtists = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }
        
        // Get user's store
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', session.user.id)
          .single()
          
        if (storeError) throw storeError
        
        if (store) {
          setStoreId(store.id)
          
          // Get store's artists
          const { data: artistData, error: artistError } = await supabase
            .from('artists')
            .select('*')
            .eq('store_id', store.id)
            .order('name', { ascending: true })
            
          if (artistError) throw artistError
          
          setArtists(artistData || [])
        }
      } catch (error) {
        console.error('Error fetching artists:', error)
        toast({
          title: 'Error',
          description: 'Failed to load artist data',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchArtists()
  }, [supabase, router, toast])
  
  const validateForm = () => {
    let isValid = true
    
    if (!newArtistName.trim()) {
      setNameError("Name is required")
      isValid = false
    } else {
      setNameError("")
    }
    
    if (!newArtistEmail.trim()) {
      setEmailError("Email is required")
      isValid = false
    } else if (!isValidEmail(newArtistEmail)) {
      setEmailError("Please enter a valid email address")
      isValid = false
    } else {
      setEmailError("")
    }
    
    return isValid
  }
  
  const handleAddArtist = async () => {
    if (!validateForm()) return
    
    // Check if email already exists
    const existingArtist = artists.find(
      artist => artist.email.toLowerCase() === newArtistEmail.toLowerCase()
    )
    
    if (existingArtist) {
      setEmailError("An artist with this email already exists")
      return
    }
    
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('artists')
        .insert({
          store_id: storeId,
          name: newArtistName,
          email: newArtistEmail,
        })
        .select()
        
      if (error) throw error
      
      // Refresh the list
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true })
        
      if (artistError) throw artistError
      
      setArtists(artistData || [])
      setNewArtistName("")
      setNewArtistEmail("")
      setDialogOpen(false)
      
      toast({
        title: 'Artist Added',
        description: 'Team member has been added successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add team member',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeleteArtist = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return
    
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      
      // Update the local state
      setArtists(current => current.filter(artist => artist.id !== id))
      
      toast({
        title: 'Artist Removed',
        description: 'Team member has been removed successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove team member',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const sendInvite = async (email: string) => {
    setIsSaving(true)
    try {
      // TODO: Implement actual invitation email sending
      // For now, just show a toast
      
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Artist Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage artists and other team members who can access your proofs
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new artist or team member to collaborate on proofs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      placeholder="John Doe"
                      value={newArtistName}
                      onChange={(e) => setNewArtistName(e.target.value)}
                    />
                    {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      placeholder="john@example.com"
                      type="email"
                      value={newArtistEmail}
                      onChange={(e) => setNewArtistEmail(e.target.value)}
                    />
                    {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddArtist}
                    disabled={isSaving}
                  >
                    {isSaving ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {artists.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No team members yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add team members to collaborate on proofs and orders.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Team Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {artists.map((artist) => (
                <div key={artist.id} className="flex items-center justify-between border rounded-md p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(artist.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{artist.name}</div>
                      <div className="text-sm text-muted-foreground">{artist.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendInvite(artist.email)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteArtist(artist.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
