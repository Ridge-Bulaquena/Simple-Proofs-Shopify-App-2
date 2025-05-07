import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OrderList } from '@/components/order-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function OrdersPage() {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  // Get user's store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  
  if (!store) {
    redirect('/onboarding')
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <Link href="/dashboard/orders/new">
          <Button className="space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Button>
        </Link>
      </div>
      
      <OrderList storeId={store.id} storeSlug={store.slug} />
    </div>
  )
}
