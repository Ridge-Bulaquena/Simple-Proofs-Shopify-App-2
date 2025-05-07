"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link2, ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import Link from "next/link"

// Define form schemas
const shopifySchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().min(1, "API Key is required").or(z.literal("")),
  storeUrl: z.string().url("Please enter a valid URL").or(z.literal("")),
})

const etsySchema = z.object({
  enabled: z.boolean().default(false),
  apiKey: z.string().min(1, "API Key is required").or(z.literal("")),
  storeId: z.string().min(1, "Store ID is required").or(z.literal("")),
})

const zapierSchema = z.object({
  enabled: z.boolean().default(false),
})

export default function IntegrationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [storeId, setStoreId] = useState<string>("")
  const [currentTab, setCurrentTab] = useState("shopify")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  // Initialize Shopify form
  const shopifyForm = useForm<z.infer<typeof shopifySchema>>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      enabled: false,
      apiKey: "",
      storeUrl: "",
    },
  })
  
  // Initialize Etsy form
  const etsyForm = useForm<z.infer<typeof etsySchema>>({
    resolver: zodResolver(etsySchema),
    defaultValues: {
      enabled: false,
      apiKey: "",
      storeId: "",
    },
  })
  
  // Initialize Zapier form
  const zapierForm = useForm<z.infer<typeof zapierSchema>>({
    resolver: zodResolver(zapierSchema),
    defaultValues: {
      enabled: false,
    },
  })
  
  useEffect(() => {
    const fetchIntegrations = async () => {
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
          
          // Get integrations
          const { data: integrations, error: integError } = await supabase
            .from('integrations')
            .select('*')
            .eq('store_id', store.id)
            
          if (integError) throw integError
          
          if (integrations) {
            // Process Shopify integration
            const shopifyInteg = integrations.find(i => i.type === 'shopify')
            if (shopifyInteg) {
              shopifyForm.reset({
                enabled: true,
                apiKey: shopifyInteg.config.apiKey || "",
                storeUrl: shopifyInteg.config.storeUrl || "",
              })
            }
            
            // Process Etsy integration
            const etsyInteg = integrations.find(i => i.type === 'etsy')
            if (etsyInteg) {
              etsyForm.reset({
                enabled: true,
                apiKey: etsyInteg.config.apiKey || "",
                storeId: etsyInteg.config.storeId || "",
              })
            }
            
            // Process Zapier integration
            const zapierInteg = integrations.find(i => i.type === 'zapier')
            if (zapierInteg) {
              zapierForm.reset({
                enabled: true,
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching integrations:', error)
        toast({
          title: 'Error',
          description: 'Failed to load integration settings',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchIntegrations()
  }, [supabase, router, toast, shopifyForm, etsyForm, zapierForm])
  
  const onShopifySubmit = async (values: z.infer<typeof shopifySchema>) => {
    setIsSaving(true)
    try {
      // Get existing integration
      const { data: existingInteg, error: checkError } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', storeId)
        .eq('type', 'shopify')
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError
      
      if (values.enabled) {
        // Validate that required fields are filled if enabled
        if (!values.apiKey || !values.storeUrl) {
          throw new Error("API Key and Store URL are required when integration is enabled")
        }
        
        // Either update or insert
        if (existingInteg) {
          const { error } = await supabase
            .from('integrations')
            .update({
              config: {
                apiKey: values.apiKey,
                storeUrl: values.storeUrl,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInteg.id)
            
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('integrations')
            .insert({
              store_id: storeId,
              type: 'shopify',
              config: {
                apiKey: values.apiKey,
                storeUrl: values.storeUrl,
              },
            })
            
          if (error) throw error
        }
      } else if (existingInteg) {
        // If disabled and exists, delete the integration
        const { error } = await supabase
          .from('integrations')
          .delete()
          .eq('id', existingInteg.id)
          
        if (error) throw error
      }
      
      toast({
        title: 'Shopify Integration Saved',
        description: values.enabled 
          ? 'Your Shopify integration has been set up successfully' 
          : 'Shopify integration has been disabled',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Shopify integration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const onEtsySubmit = async (values: z.infer<typeof etsySchema>) => {
    setIsSaving(true)
    try {
      // Get existing integration
      const { data: existingInteg, error: checkError } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', storeId)
        .eq('type', 'etsy')
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError
      
      if (values.enabled) {
        // Validate that required fields are filled if enabled
        if (!values.apiKey || !values.storeId) {
          throw new Error("API Key and Store ID are required when integration is enabled")
        }
        
        // Either update or insert
        if (existingInteg) {
          const { error } = await supabase
            .from('integrations')
            .update({
              config: {
                apiKey: values.apiKey,
                storeId: values.storeId,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInteg.id)
            
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('integrations')
            .insert({
              store_id: storeId,
              type: 'etsy',
              config: {
                apiKey: values.apiKey,
                storeId: values.storeId,
              },
            })
            
          if (error) throw error
        }
      } else if (existingInteg) {
        // If disabled and exists, delete the integration
        const { error } = await supabase
          .from('integrations')
          .delete()
          .eq('id', existingInteg.id)
          
        if (error) throw error
      }
      
      toast({
        title: 'Etsy Integration Saved',
        description: values.enabled 
          ? 'Your Etsy integration has been set up successfully' 
          : 'Etsy integration has been disabled',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Etsy integration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const onZapierSubmit = async (values: z.infer<typeof zapierSchema>) => {
    setIsSaving(true)
    try {
      // Get existing integration
      const { data: existingInteg, error: checkError } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', storeId)
        .eq('type', 'zapier')
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError
      
      if (values.enabled) {
        // Either update or insert
        if (existingInteg) {
          const { error } = await supabase
            .from('integrations')
            .update({
              config: {
                enabled: true,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInteg.id)
            
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('integrations')
            .insert({
              store_id: storeId,
              type: 'zapier',
              config: {
                enabled: true,
              },
            })
            
          if (error) throw error
        }
      } else if (existingInteg) {
        // If disabled and exists, delete the integration
        const { error } = await supabase
          .from('integrations')
          .delete()
          .eq('id', existingInteg.id)
          
        if (error) throw error
      }
      
      toast({
        title: 'Zapier Integration Saved',
        description: values.enabled 
          ? 'Your Zapier integration has been set up successfully' 
          : 'Zapier integration has been disabled',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Zapier integration',
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
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connect Your Services
          </CardTitle>
          <CardDescription>
            Integrate with e-commerce platforms and other services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="shopify" onValueChange={setCurrentTab} value={currentTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shopify">Shopify</TabsTrigger>
              <TabsTrigger value="etsy">Etsy</TabsTrigger>
              <TabsTrigger value="zapier">Zapier</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shopify" className="pt-6">
              <Form {...shopifyForm}>
                <form id="shopify-form" onSubmit={shopifyForm.handleSubmit(onShopifySubmit)} className="space-y-6">
                  <FormField
                    control={shopifyForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Shopify Integration
                          </FormLabel>
                          <FormDescription>
                            Connect to your Shopify store to import orders automatically
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
                  
                  {shopifyForm.watch("enabled") && (
                    <>
                      <FormField
                        control={shopifyForm.control}
                        name="storeUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shopify Store URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your-store.myshopify.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your Shopify store URL
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={shopifyForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shopify API Key</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="shpat_..." 
                                type="password"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your Shopify API access token
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Alert variant="default" className="bg-muted">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          To get your Shopify API key: Go to your Shopify admin → Settings → Apps and sales channels → Develop apps → 
                          Create an app → Configure Admin API access and select the appropriate scopes (orders, customers).
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isSaving || (shopifyForm.watch("enabled") && (!shopifyForm.watch("apiKey") || !shopifyForm.watch("storeUrl")))}
                  >
                    {isSaving ? "Saving..." : "Save Shopify Settings"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="etsy" className="pt-6">
              <Form {...etsyForm}>
                <form id="etsy-form" onSubmit={etsyForm.handleSubmit(onEtsySubmit)} className="space-y-6">
                  <FormField
                    control={etsyForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Etsy Integration
                          </FormLabel>
                          <FormDescription>
                            Connect to your Etsy shop to import orders automatically
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
                  
                  {etsyForm.watch("enabled") && (
                    <>
                      <FormField
                        control={etsyForm.control}
                        name="storeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etsy Shop ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="YourEtsyShop" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your Etsy shop ID (the name in your shop URL)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={etsyForm.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Etsy API Key</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="etsyapikey123..." 
                                type="password"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your Etsy API key
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Alert variant="default" className="bg-muted">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          To get your Etsy API key: Go to etsy.com/developers → Create a New App → 
                          Set the required scopes (Transactions_r, Listings_r) → Copy your API key.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isSaving || (etsyForm.watch("enabled") && (!etsyForm.watch("apiKey") || !etsyForm.watch("storeId")))}
                  >
                    {isSaving ? "Saving..." : "Save Etsy Settings"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="zapier" className="pt-6">
              <Form {...zapierForm}>
                <form id="zapier-form" onSubmit={zapierForm.handleSubmit(onZapierSubmit)} className="space-y-6">
                  <FormField
                    control={zapierForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Zapier Integration
                          </FormLabel>
                          <FormDescription>
                            Connect Simpler Proofs to thousands of apps via Zapier
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
                  
                  {zapierForm.watch("enabled") && (
                    <div className="space-y-4">
                      <div className="rounded-md border p-4">
                        <h3 className="font-medium mb-2">Zapier Webhook URL</h3>
                        <div className="bg-muted p-2 rounded-md text-sm font-mono break-all">
                          https://simpler-proofs.com/api/webhooks/{storeId}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Use this URL in your Zapier triggers to receive events from Simpler Proofs
                        </p>
                      </div>
                      
                      <Alert variant="default" className="bg-muted">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Available triggers:
                          <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>Proof created</li>
                            <li>Proof approved</li>
                            <li>Revision requested</li>
                            <li>New order imported</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Zapier Settings"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
