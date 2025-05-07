"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Settings, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { FileUploader } from "@/components/file-uploader"
import Link from "next/link"

// Define form schema
const formSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters"),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color code"),
  darkMode: z.boolean().default(false),
})

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [storeId, setStoreId] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      logoUrl: "",
      accentColor: "#0f172a",
      darkMode: false,
    },
  })
  
  useEffect(() => {
    const fetchStoreData = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }
        
        const { data: store, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        if (error) {
          throw error
        }
        
        if (store) {
          form.reset({
            name: store.name,
            slug: store.slug,
            logoUrl: store.logo_url || '',
            accentColor: store.accent_color || '#0f172a',
            darkMode: false, // This would typically be a user preference stored elsewhere
          })
          
          setLogoUrl(store.logo_url || '')
          setStoreId(store.id)
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load store settings',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStoreData()
  }, [supabase, router, toast, form])
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true)
    try {
      // Check if slug is already taken (unless it's unchanged)
      if (values.slug !== form.getValues('slug')) {
        const { data: existingStore, error: slugCheckError } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', values.slug)
          .neq('id', storeId)
          .maybeSingle()
          
        if (slugCheckError) throw slugCheckError
        
        if (existingStore) {
          form.setError('slug', {
            type: 'manual',
            message: 'This URL is already taken. Please choose another one.'
          })
          return
        }
      }
      
      // Update store in Supabase
      const { error } = await supabase
        .from('stores')
        .update({
          name: values.name,
          slug: values.slug,
          logo_url: logoUrl,
          accent_color: values.accentColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId)
        
      if (error) throw error
      
      toast({
        title: 'Settings Saved',
        description: 'Your store settings have been updated successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
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
        <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Store Information
              </CardTitle>
              <CardDescription>
                Update your store details and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how your store will appear to customers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store URL</FormLabel>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">simpler-proofs.com/</span>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </div>
                    <FormDescription>
                      This will be the URL where your customers can view their proofs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Store Logo</FormLabel>
                {logoUrl && (
                  <div className="mb-4 border p-2 rounded-md inline-block">
                    <img 
                      src={logoUrl} 
                      alt="Store Logo" 
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                )}
                <FileUploader
                  storeId={storeId}
                  bucketName="logos"
                  acceptedFileTypes={["image/jpeg", "image/png", "image/svg+xml"]}
                  maxSizeMB={2}
                  onUploadComplete={(url) => {
                    setLogoUrl(url)
                    form.setValue('logoUrl', url)
                  }}
                />
                <FormDescription>
                  Upload your store logo. Recommended size: 250x250px.
                </FormDescription>
              </div>
              
              <FormField
                control={form.control}
                name="accentColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Color</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <div
                        className="w-10 h-10 rounded-full border"
                        style={{ backgroundColor: field.value }}
                      />
                      <Input
                        type="color"
                        className="w-14 h-10 p-1"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value)
                        }}
                      />
                    </div>
                    <FormDescription>
                      Choose a brand color that will be used throughout your proofing site
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="darkMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Default to Dark Mode
                      </FormLabel>
                      <FormDescription>
                        When enabled, your proof pages will default to dark mode
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
