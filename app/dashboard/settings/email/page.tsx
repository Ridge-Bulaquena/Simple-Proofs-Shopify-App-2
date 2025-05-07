"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { FileUploader } from "@/components/file-uploader"
import Link from "next/link"

// Define form schema
const formSchema = z.object({
  senderName: z.string().min(2, "Sender name must be at least 2 characters"),
  subject: z.string().min(4, "Subject must be at least 4 characters"),
  template: z.string().min(10, "Email template must be at least 10 characters"),
  emailBanner: z.string().optional(),
  sendCopyToAdmin: z.boolean().default(false),
})

export default function EmailSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [emailBannerUrl, setEmailBannerUrl] = useState<string>("")
  const [storeId, setStoreId] = useState<string>("")
  const [previewMode, setPreviewMode] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: "",
      subject: "Your proof is ready for review",
      template: "<p>Hello {{customer_name}},</p><p>Your proof is ready for review. Please click the button below to view and approve your proof or request changes.</p><p>Thank you for your business!</p>",
      emailBanner: "",
      sendCopyToAdmin: false,
    },
  })
  
  useEffect(() => {
    const fetchEmailSettings = async () => {
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
              senderName: settings.email_sender_name || '',
              subject: settings.email_subject || 'Your proof is ready for review',
              template: settings.email_template || '<p>Hello {{customer_name}},</p><p>Your proof is ready for review. Please click the button below to view and approve your proof or request changes.</p><p>Thank you for your business!</p>',
              emailBanner: settings.email_banner_url || '',
              sendCopyToAdmin: settings.send_copy_to_admin || false,
            })
            
            setEmailBannerUrl(settings.email_banner_url || '')
          }
        }
      } catch (error) {
        console.error('Error fetching email settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load email settings',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEmailSettings()
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
            email_sender_name: values.senderName,
            email_subject: values.subject,
            email_template: values.template,
            email_banner_url: emailBannerUrl,
            send_copy_to_admin: values.sendCopyToAdmin,
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
            email_sender_name: values.senderName,
            email_subject: values.subject,
            email_template: values.template,
            email_banner_url: emailBannerUrl,
            send_copy_to_admin: values.sendCopyToAdmin,
          })
          
        saveError = error
      }
      
      if (saveError) throw saveError
      
      toast({
        title: 'Settings Saved',
        description: 'Your email settings have been updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Get the template with variables replaced for preview
  const getPreviewTemplate = () => {
    const template = form.watch("template")
    return template
      .replace(/{{customer_name}}/g, "John Doe")
      .replace(/{{order_id}}/g, "ORD-12345")
      .replace(/{{proof_link}}/g, "https://example.com/proof/12345")
  }
  
  const sendTestEmail = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('You must be logged in to send a test email')
      }
      
      // First save the current settings
      await onSubmit(form.getValues())
      
      // Then send the test email
      const response = await fetch('/api/send-proof-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          recipientEmail: session.user.email,
          recipientName: 'Test User',
          subject: form.getValues('subject'),
          template: form.getValues('template'),
          senderName: form.getValues('senderName'),
          emailBanner: emailBannerUrl,
          orderId: 'test-order-id',
          proofLink: `${window.location.origin}/test-proof-link`,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send test email')
      }
      
      toast({
        title: 'Test Email Sent',
        description: `A test email has been sent to ${session.user.email}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
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
        <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Proof Email Configuration
              </CardTitle>
              <CardDescription>
                Configure the emails that are sent to customers when their proof is ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your Store Name" />
                    </FormControl>
                    <FormDescription>
                      This is the name that will appear in the "From" field in emails
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your proof is ready for review" />
                    </FormControl>
                    <FormDescription>
                      Subject line for proof notification emails
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Email Banner (Optional)</FormLabel>
                {emailBannerUrl && (
                  <div className="mb-4 border p-2 rounded-md inline-block max-w-full">
                    <img 
                      src={emailBannerUrl} 
                      alt="Email Banner" 
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                )}
                <FileUploader
                  storeId={storeId}
                  bucketName="email_banners"
                  acceptedFileTypes={["image/jpeg", "image/png", "image/svg+xml"]}
                  maxSizeMB={2}
                  onUploadComplete={(url) => {
                    setEmailBannerUrl(url)
                    form.setValue('emailBanner', url)
                  }}
                />
                <FormDescription>
                  This image will appear at the top of your proof emails. Recommended size: 600x200px.
                </FormDescription>
              </div>
              
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Email Template</FormLabel>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        {previewMode ? "Edit" : "Preview"}
                      </Button>
                    </div>
                    <FormControl>
                      {previewMode ? (
                        <div 
                          className="min-h-[200px] p-3 border rounded-md bg-background overflow-auto"
                          dangerouslySetInnerHTML={{ __html: getPreviewTemplate() }}
                        />
                      ) : (
                        <Textarea 
                          className="min-h-[200px] font-mono"
                          placeholder="<p>Hello {{customer_name}},</p><p>Your proof is ready...</p>" 
                          {...field} 
                        />
                      )}
                    </FormControl>
                    <FormDescription>
                      Use HTML to format your email. Available variables: {{customer_name}}, {{order_id}}, {{proof_link}}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border rounded-md p-4 bg-muted/50">
                <h3 className="font-medium text-sm mb-2">Email Variables</h3>
                <div className="space-y-2 text-xs">
                  <p className="text-muted-foreground">
                    <strong>{"{{customer_name}}"}</strong> - The customer's name
                  </p>
                  <p className="text-muted-foreground">
                    <strong>{"{{order_id}}"}</strong> - The order number/ID
                  </p>
                  <p className="text-muted-foreground">
                    <strong>{"{{proof_link}}"}</strong> - The link to view and approve the proof
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 items-start">
              <Button 
                type="button" 
                variant="outline"
                onClick={sendTestEmail}
                disabled={isSaving}
              >
                Send Test Email
              </Button>
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
