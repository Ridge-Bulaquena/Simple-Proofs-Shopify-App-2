"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Define the form schema
const formSchema = z.object({
  senderName: z.string().min(2, "Sender name must be at least 2 characters"),
  subject: z.string().min(4, "Subject must be at least 4 characters"),
  template: z.string().min(10, "Email template must be at least 10 characters"),
})

interface EmailSetupStepProps {
  onComplete: (data: any) => void
  data: {
    senderName: string
    subject: string
    template: string
  }
}

export default function EmailSetupStep({ onComplete, data }: EmailSetupStepProps) {
  const [previewMode, setPreviewMode] = useState(false)
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: data.senderName || "",
      subject: data.subject || "Your proof is ready for review",
      template: data.template || "<p>Hello {{customer_name}},</p><p>Your proof is ready for review. Please click the button below to view and approve your proof or request changes.</p><p>Thank you for your business!</p>",
    },
  })
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Pass the data to the parent component
    onComplete({
      emailSetup: {
        senderName: values.senderName,
        subject: values.subject,
        template: values.template,
      }
    })
  }
  
  // Get the template with variables replaced for preview
  const getPreviewTemplate = () => {
    const template = form.watch("template")
    return template
      .replace(/{{customer_name}}/g, "John Doe")
      .replace(/{{order_id}}/g, "ORD-12345")
      .replace(/{{proof_link}}/g, "https://example.com/proof/12345")
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email Setup
        </CardTitle>
        <CardDescription>
          Configure how your proof notification emails will look.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="email-setup-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your Store Name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This name will appear as the sender in proof notification emails.
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
                    <Input 
                      placeholder="Your proof is ready for review" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The subject line for proof notification emails.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                        className="min-h-[200px] p-3 border rounded-md bg-background"
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
                  <strong>{{customer_name}}</strong> - The customer's name
                </p>
                <p className="text-muted-foreground">
                  <strong>{{order_id}}</strong> - The order number/ID
                </p>
                <p className="text-muted-foreground">
                  <strong>{{proof_link}}</strong> - The link to view and approve the proof
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
        <Button type="submit" form="email-setup-form">
          Next Step
        </Button>
      </CardFooter>
    </Card>
  )
}
