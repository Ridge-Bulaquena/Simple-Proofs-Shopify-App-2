"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Store } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FileUploader } from "@/components/file-uploader"
import { generateSlug } from "@/lib/utils"
import { createBrowserSupabaseClient } from "@/lib/supabase"

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
})

interface StoreInfoProps {
  onComplete: (data: any) => void
  data: {
    name: string
    slug: string
    logoUrl?: string
  }
}

export default function StoreInfoStep({ onComplete, data }: StoreInfoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(data.logoUrl || "")
  const supabase = createBrowserSupabaseClient()
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data.name || "",
      slug: data.slug || "",
    },
  })
  
  // Check if slug is unique
  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return true
    
    const { data, error } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
      
    if (error) {
      console.error("Error checking slug availability:", error)
      return false
    }
    
    return !data
  }
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if slug is available
    const isSlugAvailable = await checkSlugAvailability(values.slug)
    
    if (!isSlugAvailable) {
      form.setError("slug", {
        type: "manual",
        message: "This slug is already taken. Please choose another one."
      })
      return
    }
    
    // Pass the data to the parent component
    onComplete({
      storeInfo: {
        name: values.name,
        slug: values.slug,
        logoUrl: logoUrl || undefined,
      }
    })
  }
  
  // Generate slug from store name
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue("name", name)
    
    // Only auto-generate slug if it's empty or matches the previous auto-generated value
    if (!form.getValues("slug") || form.getValues("slug") === generateSlug(form.getValues("name"))) {
      form.setValue("slug", generateSlug(name))
    }
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Store className="h-6 w-6" />
          Store Information
        </CardTitle>
        <CardDescription>
          Let's start by setting up your store's basic information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="store-info-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Awesome Store" 
                      {...field} 
                      onChange={handleStoreNameChange}
                    />
                  </FormControl>
                  <FormDescription>
                    This is how your store will be displayed to customers.
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
                  <FormLabel>Store Slug</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="my-awesome-store" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be used in your store's URL: simpler-proofs.com/{field.value}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Store Logo (Optional)</FormLabel>
              <FileUploader
                storeId="onboarding"
                bucketName="logos"
                acceptedFileTypes={["image/jpeg", "image/png", "image/svg+xml"]}
                maxSizeMB={2}
                onUploadComplete={(url) => setLogoUrl(url)}
              />
              <FormDescription>
                Upload your store logo. Recommended size: 250x250px.
              </FormDescription>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button type="submit" form="store-info-form">
          Next Step
        </Button>
      </CardFooter>
    </Card>
  )
}
