"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define form schemas
const shopifySchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  storeUrl: z.string().url("Please enter a valid URL")
})

const etsySchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  storeId: z.string().min(1, "Store ID is required")
})

interface IntegrationsStepProps {
  onComplete: (data: any) => void
  data: {
    shopify?: {
      apiKey: string
      storeUrl: string
    }
    etsy?: {
      apiKey: string
      storeId: string
    }
  }
}

export default function IntegrationsStep({ onComplete, data }: IntegrationsStepProps) {
  const [currentTab, setCurrentTab] = useState("info")
  
  // Initialize Shopify form
  const shopifyForm = useForm<z.infer<typeof shopifySchema>>({
    resolver: zodResolver(shopifySchema),
    defaultValues: {
      apiKey: data.shopify?.apiKey || "",
      storeUrl: data.shopify?.storeUrl || "",
    },
  })
  
  // Initialize Etsy form
  const etsyForm = useForm<z.infer<typeof etsySchema>>({
    resolver: zodResolver(etsySchema),
    defaultValues: {
      apiKey: data.etsy?.apiKey || "",
      storeId: data.etsy?.storeId || "",
    },
  })
  
  const onShopifySubmit = (values: z.infer<typeof shopifySchema>) => {
    onComplete({
      integrations: {
        ...data,
        shopify: values,
      }
    })
  }
  
  const onEtsySubmit = (values: z.infer<typeof etsySchema>) => {
    onComplete({
      integrations: {
        ...data,
        etsy: values,
      }
    })
  }
  
  const handleSkip = () => {
    onComplete({
      integrations: data
    })
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          Integrations
        </CardTitle>
        <CardDescription>
          Connect your Shopify or Etsy store to automatically import orders. You can set this up later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info" onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
            <TabsTrigger value="etsy">Etsy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 pt-4">
            <Alert variant="default" className="bg-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Integrating with your Shopify or Etsy store allows you to automatically import orders and 
                send proof notifications directly to your customers. You can set up these integrations now or later.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 mt-4">
              <h3 className="font-medium">Benefits of Integrating:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Automatically import new orders</li>
                <li>Keep order statuses in sync</li>
                <li>Send proof approval notifications directly to customers</li>
                <li>Access order details without manual entry</li>
              </ul>
            </div>
            
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentTab("shopify")} 
                className="mr-2"
              >
                Set Up Shopify
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentTab("etsy")}
              >
                Set Up Etsy
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="shopify" className="pt-4">
            <Form {...shopifyForm}>
              <form id="shopify-form" onSubmit={shopifyForm.handleSubmit(onShopifySubmit)} className="space-y-4">
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
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="etsy" className="pt-4">
            <Form {...etsyForm}>
              <form id="etsy-form" onSubmit={etsyForm.handleSubmit(onEtsySubmit)} className="space-y-4">
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
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => history.back()}>
          Back
        </Button>
        
        {currentTab === "info" ? (
          <Button onClick={handleSkip}>
            Skip for Now
          </Button>
        ) : currentTab === "shopify" ? (
          <Button type="submit" form="shopify-form">
            Finish Setup
          </Button>
        ) : (
          <Button type="submit" form="etsy-form">
            Finish Setup
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
