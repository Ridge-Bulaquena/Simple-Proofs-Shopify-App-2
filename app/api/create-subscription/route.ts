import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get the session to ensure the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get the user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', session.user.id)
      .single()
    
    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }
    
    // Get user profile to retrieve or create Stripe customer
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id, email')
      .eq('id', session.user.id)
      .single()
    
    if (userError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    // Check if user already has a subscription
    if (userProfile.stripe_subscription_id) {
      try {
        // Retrieve the existing subscription
        const subscription = await stripe.subscriptions.retrieve(userProfile.stripe_subscription_id)
        
        return NextResponse.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        })
      } catch (error) {
        // Subscription not found or invalid, continue to create a new one
        console.error('Failed to retrieve existing subscription:', error)
      }
    }
    
    // Create or get Stripe customer
    let customerId = userProfile.stripe_customer_id
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      })
      
      customerId = customer.id
      
      // Update the user record with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id)
    }
    
    // Get the selected plan price ID from the request
    const { planId } = await request.json()
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }
    
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: planId,
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })
    
    // Update user with subscription ID
    await supabase
      .from('users')
      .update({ stripe_subscription_id: subscription.id })
      .eq('id', session.user.id)
    
    // Update store plan
    await supabase
      .from('store_plans')
      .upsert({
        store_id: store.id,
        plan_id: subscription.id,
        starts_at: new Date().toISOString(),
      })
    
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    })
  } catch (error: any) {
    console.error('Subscription creation error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
