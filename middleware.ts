import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from './lib/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client for middleware
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Get the current path
  const path = req.nextUrl.pathname
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()
  
  // Protected routes: dashboard, onboarding, settings, api routes
  const protectedRoutes = [
    '/dashboard',
    '/onboarding',
    '/api/create-subscription',
    '/api/send-proof-email',
    '/api/generate-run-sheet',
  ]
  
  // Check if current path starts with any protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  if (isProtectedRoute) {
    const { data: { session } } = await supabase.auth.getSession()
    
    // If no session and on a protected route, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Public routes that don't need auth
  const publicRoutes = ['/', '/login', '/register', '/api/auth/callback']
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => path === route)
  
  // For routes that are not protected and not public, they might be store-specific routes
  // like /[storeSlug]/[orderId]
  if (!isProtectedRoute && !isPublicRoute && !path.startsWith('/_next') && !path.startsWith('/api/proofs')) {
    // Check if it's a valid store route pattern (/storeSlug/orderId)
    const segments = path.split('/').filter(Boolean)
    
    if (segments.length === 2) {
      const [storeSlug, orderId] = segments
      
      // Verify that the store exists
      const { data: store, error } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', storeSlug)
        .single()
      
      if (error || !store) {
        // If store not found, redirect to 404
        return NextResponse.redirect(new URL('/not-found', req.url))
      }
    }
  }
  
  return res
}

export const config = {
  // Skip middleware for static assets and api routes that don't need auth
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}
