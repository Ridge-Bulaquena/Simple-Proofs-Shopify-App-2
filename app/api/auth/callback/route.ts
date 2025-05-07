import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get session to check if user has a store
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Check if user has a store
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', session.user.id)
          .single()
        
        if (store) {
          // User has a store, redirect to dashboard
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
        } else {
          // User doesn't have a store, redirect to onboarding
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
        }
      }
    }
  }
  
  // If something went wrong or no code, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
