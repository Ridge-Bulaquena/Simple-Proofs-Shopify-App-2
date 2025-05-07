import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Settings, Mail, MessageSquare, Layout, Users, Link2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function SettingsPage() {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  const settingsTabs = [
    {
      icon: Settings,
      title: "General Settings",
      description: "Manage your store details and preferences",
      href: "/dashboard/settings/general",
    },
    {
      icon: Mail,
      title: "Email Settings",
      description: "Configure email templates and notifications",
      href: "/dashboard/settings/email",
    },
    {
      icon: MessageSquare,
      title: "Canned Replies",
      description: "Create pre-written responses for common situations",
      href: "/dashboard/settings/canned-replies",
    },
    {
      icon: Layout,
      title: "Proof Page",
      description: "Customize the appearance of your proof pages",
      href: "/dashboard/settings/proof-page",
    },
    {
      icon: Users,
      title: "Artist Management",
      description: "Manage your team members and assign orders",
      href: "/dashboard/settings/artists",
    },
    {
      icon: Link2,
      title: "Integrations",
      description: "Connect with Shopify, Etsy, and other services",
      href: "/dashboard/settings/integrations",
    },
  ]
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {settingsTabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5 text-primary" />
                  <CardTitle>{tab.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{tab.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
