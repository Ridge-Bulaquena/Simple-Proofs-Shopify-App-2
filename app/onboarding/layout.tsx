import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // If not authenticated, redirect to login
    redirect('/login')
  }
  
  return (
    <div>
      {children}
    </div>
  )
}
