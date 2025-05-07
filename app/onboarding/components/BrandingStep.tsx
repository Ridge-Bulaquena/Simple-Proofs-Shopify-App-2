"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FileUploader } from "@/components/file-uploader"

// Define the form schema
const formSchema = z.object({
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color code")
})

interface BrandingStepProps {
  onComplete: (data: any) => void
  data: {
    accentColor: string
    emailBanner?: string
  }
}

export default function BrandingStep({ onComplete, data }: BrandingStepProps) {
  const [emailBannerUrl, setEmailBannerUrl] = useState<string>(data.emailBanner || "")
  const [previewColor, setPreviewColor] = useState<string>(data.accentColor || "#0f172a")
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accentColor: data.accentColor || "#0f172a",
    },
  })
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Pass the data to the parent component
    onComplete({
      branding: {
        accentColor: values.accentColor,
        emailBanner: emailBannerUrl || undefined,
      }
    })
  }
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    form.setValue("accentColor", color)
    setPreviewColor(color)
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Branding
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your proofing experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="branding-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="#0f172a" 
                        {...field} 
                        onChange={handleColorChange}
                      />
                    </FormControl>
                    <div 
                      className="w-10 h-10 rounded-full border" 
                      style={{ backgroundColor: previewColor }}
                    />
                    <Input 
                      type="color"
                      className="w-14 h-10 p-1"
                      value={previewColor}
                      onChange={(e) => {
                        const color = e.target.value
                        setPreviewColor(color)
                        form.setValue("accentColor", color)
                      }}
                    />
                  </div>
                  <FormDescription>
                    Choose a brand color that will be used throughout your proofing site.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2 pt-4">
              <FormLabel>Email Banner (Optional)</FormLabel>
              <FileUploader
                storeId="onboarding"
                bucketName="email_banners"
                acceptedFileTypes={["image/jpeg", "image/png", "image/svg+xml"]}
                maxSizeMB={2}
                onUploadComplete={(url) => setEmailBannerUrl(url)}
              />
              <FormDescription>
                Upload a banner image that will be shown at the top of your proof emails. Recommended size: 600x200px.
              </FormDescription>
            </div>
            
            <div className="mt-8 p-4 border rounded-md">
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full" style={{ backgroundColor: previewColor }}></div>
                  <div className="font-medium">Your Brand</div>
                </div>
                <Button style={{ backgroundColor: previewColor }}>
                  Call-to-Action Button
                </Button>
                <div className="h-1 w-24 rounded" style={{ backgroundColor: previewColor }}></div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => history.back()}>
          Back
        </Button>
        <Button type="submit" form="branding-form">
          Next Step
        </Button>
      </CardFooter>
    </Card>
  )
}
