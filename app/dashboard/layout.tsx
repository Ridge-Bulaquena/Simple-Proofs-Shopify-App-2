import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from '@/components/mobile-nav'
import Link from 'next/link'
import { Package, FileText, Layout, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export default async function DashboardLayout({
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
  
  // Get user's store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  
  if (!store) {
    // If user has no store, redirect to onboarding
    redirect('/onboarding')
  }
  
  const handleSignOut = async () => {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Navigation */}
      <MobileNav storeName={store.name} />
      
      {/* Desktop Layout */}
      <div className="flex-grow flex flex-row">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 border-r h-screen sticky top-0">
          <div className="p-6 border-b">
            <Link href="/dashboard" className="font-bold text-xl truncate block">
              {store.name}
            </Link>
          </div>
          <nav className="p-4 space-y-2">
            <Link 
              href="/dashboard/orders" 
              className={cn(
                buttonVariants({ variant: "ghost" }), 
                "w-full justify-start gap-2"
              )}
            >
              <Package className="h-5 w-5" />
              Orders
            </Link>
            <Link 
              href="/dashboard/run-sheet" 
              className={cn(
                buttonVariants({ variant: "ghost" }), 
                "w-full justify-start gap-2"
              )}
            >
              <FileText className="h-5 w-5" />
              Run Sheet
            </Link>
            <Link 
              href="/dashboard/proof-history" 
              className={cn(
                buttonVariants({ variant: "ghost" }), 
                "w-full justify-start gap-2"
              )}
            >
              <Layout className="h-5 w-5" />
              Proof History
            </Link>
            <Link 
              href="/dashboard/settings" 
              className={cn(
                buttonVariants({ variant: "ghost" }), 
                "w-full justify-start gap-2"
              )}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            
            <form action={handleSignOut}>
              <button className={cn(
                buttonVariants({ variant: "ghost" }), 
                "w-full justify-start gap-2 text-muted-foreground"
              )}>
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </form>
          </nav>
          
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <ThemeToggle />
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
