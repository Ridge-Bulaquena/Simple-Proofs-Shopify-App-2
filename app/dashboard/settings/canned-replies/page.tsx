"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Plus, Trash2, Save, Edit, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { CannedReply } from "@/lib/types"
import Link from "next/link"

export default function CannedRepliesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeId, setStoreId] = useState<string>("")
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([])
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState<string>("")
  const [newContent, setNewContent] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  useEffect(() => {
    const fetchCannedReplies = async () => {
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
          
          // Get canned replies
          const { data: replies, error: repliesError } = await supabase
            .from('canned_replies')
            .select('*')
            .eq('store_id', store.id)
            .order('created_at', { ascending: true })
            
          if (repliesError) throw repliesError
          
          setCannedReplies(replies || [])
        }
      } catch (error) {
        console.error('Error fetching canned replies:', error)
        toast({
          title: 'Error',
          description: 'Failed to load canned replies',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCannedReplies()
  }, [supabase, router, toast])
  
  const handleAddReply = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both a title and content for your canned reply',
        variant: 'destructive',
      })
      return
    }
    
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('canned_replies')
        .insert({
          store_id: storeId,
          title: newTitle,
          content: newContent,
        })
        .select()
        
      if (error) throw error
      
      // Refresh the list
      const { data: replies, error: repliesError } = await supabase
        .from('canned_replies')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true })
        
      if (repliesError) throw repliesError
      
      setCannedReplies(replies || [])
      setNewTitle("")
      setNewContent("")
      setDialogOpen(false)
      
      toast({
        title: 'Reply Added',
        description: 'Your canned reply has been added successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add canned reply',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleEditReply = (id: string) => {
    const reply = cannedReplies.find(r => r.id === id)
    if (reply) {
      setIsEditing(id)
      setNewTitle(reply.title)
      setNewContent(reply.content)
    }
  }
  
  const handleSaveEdit = async () => {
    if (!isEditing) return
    
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both a title and content for your canned reply',
        variant: 'destructive',
      })
      return
    }
    
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('canned_replies')
        .update({
          title: newTitle,
          content: newContent,
        })
        .eq('id', isEditing)
        
      if (error) throw error
      
      // Update the local state
      setCannedReplies(current => 
        current.map(reply => 
          reply.id === isEditing 
            ? { ...reply, title: newTitle, content: newContent } 
            : reply
        )
      )
      
      setIsEditing(null)
      setNewTitle("")
      setNewContent("")
      
      toast({
        title: 'Reply Updated',
        description: 'Your canned reply has been updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update canned reply',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeleteReply = async (id: string) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('canned_replies')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      
      // Update the local state
      setCannedReplies(current => current.filter(reply => reply.id !== id))
      
      toast({
        title: 'Reply Deleted',
        description: 'Your canned reply has been deleted successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete canned reply',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCancelEdit = () => {
    setIsEditing(null)
    setNewTitle("")
    setNewContent("")
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
        <h1 className="text-3xl font-bold tracking-tight">Canned Replies</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Saved Responses
              </CardTitle>
              <CardDescription>
                Create pre-written responses to use when commenting on proofs
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Reply
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Canned Reply</DialogTitle>
                  <DialogDescription>
                    Create a reusable response that you can quickly insert when commenting on proofs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="e.g., Approval Confirmation"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      placeholder="e.g., Thank you for approving your proof! We'll begin production right away."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="min-h-[150px]"
                    />
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
                    onClick={handleAddReply}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Reply"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {cannedReplies.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No saved replies yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first canned reply to save time when responding to customers.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Reply
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cannedReplies.map((reply) => (
                <div key={reply.id} className="border rounded-md p-4">
                  {isEditing === reply.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{reply.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditReply(reply.id)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReply(reply.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
