import { createClient } from '@/lib/supabase'
import { ProofCard } from '@/components/proof-card'
import { Store, ProofWithComments, Order } from '@/lib/types'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, AlertTriangle, Clock } from 'lucide-react'

interface ProofPageProps {
  params: {
    storeSlug: string
    orderId: string
  }
}

export default async function ProofPage({ params }: ProofPageProps) {
  const { storeSlug, orderId } = params
  const supabase = createClient()
  
  // Get store by slug
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', storeSlug)
    .single()
  
  if (storeError || !store) {
    // Store not found
    redirect('/not-found')
  }
  
  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('store_id', store.id)
    .single()
  
  if (orderError || !order) {
    // Order not found
    redirect('/not-found')
  }
  
  // Get proof with comments
  const { data: proofData, error: proofError } = await supabase
    .from('proofs')
    .select(`
      *,
      comments (*)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (proofError || !proofData) {
    // No proof found for this order
    return (
      <NoProofAvailable store={store} order={order} />
    )
  }
  
  // Get store settings for the proof page
  const { data: settings, error: settingsError } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', store.id)
    .single()
  
  const proof = proofData as ProofWithComments
  
  // Sort comments by creation date
  if (proof.comments) {
    proof.comments.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }
  
  // Handle the case where the proof is already approved or changes requested
  if (proof.status === 'approved') {
    return (
      <ProofAlreadyApproved store={store} settings={settings} />
    )
  }
  
  if (proof.status === 'changes_requested') {
    return (
      <ProofChangesRequested store={store} settings={settings} />
    )
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center">
          {store.logo_url && settings?.show_logo !== false ? (
            <img 
              src={store.logo_url} 
              alt={store.name} 
              className="h-10 mr-3"
            />
          ) : (
            <span className="font-bold text-xl mr-3">{store.name}</span>
          )}
          
          <div className="ml-auto text-right">
            <div className="text-sm text-muted-foreground">Order</div>
            <div className="font-medium">
              {order.external_id || `#${orderId.substring(0, 8)}`}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Hi {order.customer_name},</h1>
            <p className="text-muted-foreground">
              {settings?.proof_page_instructions || 
                "Please review your proof carefully. Once approved, we'll begin production."}
            </p>
          </div>
          
          {settings?.show_timer && (
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6 flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                  Please review and respond to this proof within {settings.timer_duration || 24} hours 
                  to ensure timely production of your order.
                </div>
              </CardContent>
            </Card>
          )}
          
          <div>
            <ProofCard
              proof={proof}
              orderId={orderId}
              isCustomer={true}
              onApprove={() => {/* This is handled server-side */}}
              onRequestChanges={() => {/* This is handled server-side */}}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form action={`/api/proofs/${proof.id}/approve`} method="POST">
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                <Check className="mr-2 h-5 w-5" />
                Approve Proof
              </Button>
            </form>
            
            <form action={`/api/proofs/${proof.id}/request-changes`} method="POST">
              <Button 
                className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950" 
                variant="outline"
                size="lg"
              >
                <X className="mr-2 h-5 w-5" />
                Request Changes
              </Button>
            </form>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {store.name} • Powered by Simpler Proofs
          </p>
        </div>
      </footer>
    </div>
  )
}

function NoProofAvailable({ store, order }: { store: Store, order: Order }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center">
          {store.logo_url ? (
            <img 
              src={store.logo_url} 
              alt={store.name} 
              className="h-10 mr-3"
            />
          ) : (
            <span className="font-bold text-xl mr-3">{store.name}</span>
          )}
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>No Proof Available Yet</CardTitle>
            <CardDescription>
              We're still working on your proof.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <p className="mb-4">
              Hello {order.customer_name}, your proof is not ready yet.
              We'll notify you as soon as it's available for review.
            </p>
            <p className="text-sm text-muted-foreground">
              Order: {order.external_id || `#${order.id.substring(0, 8)}`}
            </p>
          </CardContent>
        </Card>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {store.name} • Powered by Simpler Proofs
          </p>
        </div>
      </footer>
    </div>
  )
}

function ProofAlreadyApproved({ store, settings }: { store: Store, settings: any }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center">
          {store.logo_url && settings?.show_logo !== false ? (
            <img 
              src={store.logo_url} 
              alt={store.name} 
              className="h-10 mr-3"
            />
          ) : (
            <span className="font-bold text-xl mr-3">{store.name}</span>
          )}
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              <Check className="mx-auto h-12 w-12 mb-2" />
              Proof Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              {settings?.thanks_message || 
                "Thank you for approving your proof! We'll begin production right away."}
            </p>
            
            {settings?.enable_undo_approval && (
              <div className="mt-6">
                <form action="/api/proofs/undo-approval" method="POST">
                  <Button variant="outline" size="sm">
                    Undo Approval
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can undo your approval for the next {settings?.undo_approval_time || 30} minutes.
                  </p>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {store.name} • Powered by Simpler Proofs
          </p>
        </div>
      </footer>
    </div>
  )
}

function ProofChangesRequested({ store, settings }: { store: Store, settings: any }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center">
          {store.logo_url && settings?.show_logo !== false ? (
            <img 
              src={store.logo_url} 
              alt={store.name} 
              className="h-10 mr-3"
            />
          ) : (
            <span className="font-bold text-xl mr-3">{store.name}</span>
          )}
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-orange-500">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
              Changes Requested
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              {settings?.revision_message || 
                "We've received your revision request. We'll get to work on the changes and send you an updated proof soon."}
            </p>
          </CardContent>
        </Card>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {store.name} • Powered by Simpler Proofs
          </p>
        </div>
      </footer>
    </div>
  )
}
