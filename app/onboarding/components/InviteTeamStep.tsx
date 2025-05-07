"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Users, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isValidEmail } from "@/lib/utils"

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  role: z.string().optional(),
})

interface TeamMember {
  name: string
  email: string
  role: string
}

interface InviteTeamStepProps {
  onComplete: (data: any) => void
  data: {
    members: TeamMember[]
  }
}

export default function InviteTeamStep({ onComplete, data }: InviteTeamStepProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(data.members || [])
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "artist",
    },
  })
  
  const addTeamMember = () => {
    const values = form.getValues()
    
    // Validate the form data
    if (!values.name || values.name.length < 2) {
      form.setError("name", {
        type: "manual",
        message: "Name is required"
      })
      return
    }
    
    if (!values.email || !isValidEmail(values.email)) {
      form.setError("email", {
        type: "manual",
        message: "Valid email is required"
      })
      return
    }
    
    if (!values.role) {
      form.setError("role", {
        type: "manual",
        message: "Role is required"
      })
      return
    }
    
    // Check if email already exists
    if (teamMembers.some(member => member.email === values.email)) {
      form.setError("email", {
        type: "manual",
        message: "This email is already in your team"
      })
      return
    }
    
    // Add the team member
    setTeamMembers([...teamMembers, {
      name: values.name!,
      email: values.email!,
      role: values.role!,
    }])
    
    // Reset the form
    form.reset({
      name: "",
      email: "",
      role: "artist",
    })
  }
  
  const removeTeamMember = (email: string) => {
    setTeamMembers(teamMembers.filter(member => member.email !== email))
  }
  
  const handleContinue = () => {
    onComplete({
      teamMembers: {
        members: teamMembers
      }
    })
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Users className="h-6 w-6" />
          Invite Team Members
        </CardTitle>
        <CardDescription>
          Invite your team members to collaborate on proofs. You can skip this step and add team members later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="artist">Artist</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addTeamMember}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Team Member
            </Button>
            
            {teamMembers.length > 0 ? (
              <div className="space-y-2 mt-6 border rounded-md p-4">
                <h3 className="font-medium">Team Members</h3>
                <div className="divide-y">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeTeamMember(member.email)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                No team members added yet
              </div>
            )}
          </div>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => history.back()}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          {teamMembers.length > 0 ? "Next Step" : "Skip for Now"}
        </Button>
      </CardFooter>
    </Card>
  )
}
