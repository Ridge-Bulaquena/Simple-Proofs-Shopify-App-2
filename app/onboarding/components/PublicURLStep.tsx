"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Globe } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"

// Define the form schema
const formSchema = z.object({
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
})

interface PublicURLStepProps {
  onComplete: (data: any) => void
  data: {
    slug: string
  }
  storeSlug: string
}

export default function PublicURLStep({ onComplete, data, storeSlug }: PublicURLStepProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const supabase = createBrowserSupabaseClient()
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: data.slug || storeSlug,
    },
  })
  
  useEffect(() => {
    // If slug is initialized from the store slug and no custom slug was previously saved
    if (!data.slug && storeSlug) {
      form.setValue("slug", storeSlug)
    }
  }, [storeSlug, data.slug, form])
  
  // Check if slug is unique
  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return false
    
    setIsChecking(true)
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .maybeSingle()
        
      if (error) throw error
      
      const available = !data
      setIsAvailable(available)
      return available
    } catch (error) {
      console.error("Error checking slug availability:", error)
      setIsAvailable(false)
      return false
    } finally {
      setIsChecking(false)
    }
  }
  
  // Handle slug change
  const handleSlugChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
    form.setValue("slug", slug)
    
    if (slug.length >= 2) {
      await checkSlugAvailability(slug)
    } else {
      setIsAvailable(null)
    }
  }
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check slug availability again before submitting
    const available = await checkSlugAvailability(values.slug)
    
    if (!available) {
      form.setError("slug", {
        type: "manual",
        message: "This URL is already taken. Please choose another one."
      })
      return
    }
    
    // Pass the data to the parent component
    onComplete({
      publicUrl: {
        slug: values.slug,
      }
    })
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Public URL
        </CardTitle>
        <CardDescription>
          Choose a custom URL for your public proofing page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="public-url-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store URL</FormLabel>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">simpler-proofs.com/</span>
                    <FormControl>
                      <Input 
                        placeholder="my-store" 
                        {...field} 
                        onChange={handleSlugChange}
                      />
                    </FormControl>
                  </div>
                  {isChecking && (
                    <p className="text-sm text-muted-foreground mt-2">Checking availability...</p>
                  )}
                  {isAvailable === true && !isChecking && field.value && (
                    <p className="text-sm text-green-600 dark:text-green-500 mt-2">✓ This URL is available</p>
                  )}
                  {isAvailable === false && !isChecking && field.value && (
                    <p className="text-sm text-red-600 dark:text-red-500 mt-2">✗ This URL is already taken</p>
                  )}
                  <FormDescription>
                    This will be the URL where your customers can view their proofs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-6 border rounded-md p-4 bg-muted/50">
              <h3 className="font-medium text-sm mb-2">Example URLs</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground break-all">
                  Proof page: simpler-proofs.com/{form.watch("slug")}/abc123
                </p>
                <p className="text-muted-foreground break-all">
                  Customer approval: simpler-proofs.com/{form.watch("slug")}/orders/xyz456
                </p>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => history.back()}>
          Back
        </Button>
        <Button 
          type="submit" 
          form="public-url-form"
          disabled={isChecking || isAvailable === false}
        >
          Next Step
        </Button>
      </CardFooter>
    </Card>
  )
}
