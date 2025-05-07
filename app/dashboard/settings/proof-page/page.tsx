"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Layout, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import Link from "next/link"

// Define form schema
const formSchema = z.object({
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  showTimer: z.boolean().default(true),
  timerDuration: z.coerce.number().min(1, "Timer must be at least 1 minute"),
  showLogo: z.boolean().default(true),
  thanksMessage: z.string().min(10, "Thank you message must be at least 10 characters"),
  revisionMessage: z.string().min(10, "Revision request message must be at least 10 characters"),
  enableUndoApproval: z.boolean().default(true),
  undoApprovalTime: z.coerce.number().min(1, "Undo time must be at least 1 minute").max(1440, "Undo time cannot exceed 24 hours"),
})

export default function ProofPageSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeId, setStoreId] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instructions: "Please review your proof carefully. Once approved, we'll begin production.",
      showTimer: true,
      timerDuration: 60,
      showLogo: true,
      thanksMessage: "Thank you for approving your proof! We'll begin production right away.",
      revisionMessage: "We've received your revision request. We'll get to work on the changes and send you an updated proof soon.",
      enableUndoApproval: true,
      undoApprovalTime: 30,
    },
  })
  
  useEffect(() => {
    const fetchProofPageSettings = async () => {
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
          
          // Get store settings
          const { data: settings, error: settingsError } = await supabase
            .from('store_settings')
            .select('*')
            .eq('store_id', store.id)
            .single()
            
          if (settingsError && settingsError.code !== 'PGRST116') {
            // PGRST116 is "row not found" - we ignore this as it just means default settings
            throw settingsError
          }
          
          if (settings) {
            form.reset({
              instructions: settings.proof_page_instructions || "Please review your proof carefully. Once approved, we'll begin production.",
              showTimer: settings.show_timer !== undefined ? settings.show_timer : true,
              timerDuration: settings.timer_duration || 60,
              showLogo: settings.show_logo !== undefined ? settings.show_logo : true,
              thanksMessage: settings.thanks_message || "Thank you for approving your proof! We'll begin production right away.",
              revisionMessage: settings.revision_message || "We've received your revision request. We'll get to work on the changes and send you an updated proof soon.",
              enableUndoApproval: settings.enable_undo_approval !== undefined ? settings.enable_undo_approval : true,
              undoApprovalTime: settings.undo_approval_time || 30,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching proof page settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load proof page settings',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProofPageSettings()
  }, [supabase, router, toast, form])
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true)
    try {
      const { data: existingSettings, error: checkError } = await supabase
        .from('store_settings')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError
      
      let saveError
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('store_settings')
          .update({
            proof_page_instructions: values.instructions,
            show_timer: values.showTimer,
            timer_duration: values.timerDuration,
            show_logo: values.showLogo,
            thanks_message: values.thanksMessage,
            revision_message: values.revisionMessage,
            enable_undo_approval: values.enableUndoApproval,
            undo_approval_time: values.undoApprovalTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSettings.id)
          
        saveError = error
      } else {
        // Create new settings
        const { error } = await supabase
          .from('store_settings')
          .insert({
            store_id: storeId,
            proof_page_instructions: values.instructions,
            show_timer: values.showTimer,
            timer_duration: values.timerDuration,
            show_logo: values.showLogo,
            thanks_message: values.thanksMessage,
            revision_message: values.revisionMessage,
            enable_undo_approval: values.enableUndoApproval,
            undo_approval_time: values.undoApprovalTime,
          })
          
        saveError = error
      }
      
      if (saveError) throw saveError
      
      toast({
        title: 'Settings Saved',
        description: 'Your proof page settings have been updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save proof page settings',
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
        <h1 className="text-3xl font-bold tracking-tight">Proof Page Settings</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Customize Proof Page
              </CardTitle>
              <CardDescription>
                Configure how your proof pages appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proof Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Please review your proof carefully..." 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Instructions displayed to customers on the proof approval page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="showTimer"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Display Countdown Timer
                        </FormLabel>
                        <FormDescription>
                          Show a timer to encourage customers to respond promptly
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timerDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timer Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                          disabled={!form.watch("showTimer")}
                        />
                      </FormControl>
                      <FormDescription>
                        Set how long the countdown timer should run
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="showLogo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Display Store Logo
                      </FormLabel>
                      <FormDescription>
                        Show your store logo on the proof page
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thanksMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Thank You Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Thank you for approving your proof..." 
                      />
                    </FormControl>
                    <FormDescription>
                      Message shown to customers after they approve a proof
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="revisionMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Request Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="We've received your revision request..." 
                      />
                    </FormControl>
                    <FormDescription>
                      Message shown to customers after they request revisions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="enableUndoApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Undo Approval
                        </FormLabel>
                        <FormDescription>
                          Let customers undo their approval within a time limit
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="undoApprovalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Undo Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={1440} 
                          {...field} 
                          disabled={!form.watch("enableUndoApproval")}
                        />
                      </FormControl>
                      <FormDescription>
                        How long customers can undo their approval
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
