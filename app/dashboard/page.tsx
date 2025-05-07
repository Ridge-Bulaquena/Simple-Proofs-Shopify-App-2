import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react'
import { formatDate, orderStatuses, orderStatusColors, orderStatusLabels } from '@/lib/utils'

export default async function DashboardPage() {
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
  
  // Get order statistics
  const { data: orderStats } = await supabase
    .from('orders')
    .select('status')
    .eq('store_id', store.id)
  
  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      proof:proofs(*)
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Get team members (artists)
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .eq('store_id', store.id)
  
  // Calculate order statistics
  const orderCounts = {
    awaiting_proof: orderStats?.filter(o => o.status === orderStatuses.AWAITING_PROOF).length || 0,
    proof_sent: orderStats?.filter(o => o.status === orderStatuses.PROOF_SENT).length || 0,
    approved: orderStats?.filter(o => o.status === orderStatuses.APPROVED).length || 0,
    changes_requested: orderStats?.filter(o => o.status === orderStatuses.CHANGES_REQUESTED).length || 0,
    completed: orderStats?.filter(o => o.status === orderStatuses.COMPLETED).length || 0,
    total: orderStats?.length || 0
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/dashboard/orders/new">
          <Button className="space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Button>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.total}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Proof</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.awaiting_proof}</div>
            <p className="text-xs text-muted-foreground">
              Need to be processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proof Sent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.proof_sent}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for customer approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCounts.approved}</div>
            <p className="text-xs text-muted-foreground">
              Ready for production
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Your 5 most recent orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/dashboard/orders/${order.id}`} className="font-medium hover:underline">
                          {order.customer_name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {order.external_id || "No Order ID"}
                        </div>
                      </div>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        orderStatusColors[order.status as keyof typeof orderStatusColors]
                      )}>
                        {orderStatusLabels[order.status as keyof typeof orderStatusLabels]}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/orders">
                  <Button variant="outline" className="w-full">View All Orders</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No orders yet</p>
                <Link href="/dashboard/orders/new">
                  <Button variant="outline" className="mt-2">Create First Order</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Team Activity</CardTitle>
            <CardDescription>
              Your team's activity and members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Team Members ({artists?.length || 0})</span>
              </div>
              
              {artists && artists.length > 0 ? (
                <div className="space-y-3">
                  {artists.map((artist) => (
                    <div key={artist.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{artist.name}</div>
                        <div className="text-xs text-muted-foreground">{artist.email}</div>
                      </div>
                    </div>
                  ))}
                  <Link href="/dashboard/settings/artists">
                    <Button variant="outline" className="w-full">Manage Team</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No team members yet</p>
                  <Link href="/dashboard/settings/artists">
                    <Button variant="outline" className="mt-2">Add Team Members</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/orders/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
            <Link href="/dashboard/run-sheet">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Run Sheet
              </Button>
            </Link>
            <Link href={`/${store.slug}`} target="_blank">
              <Button variant="outline" className="w-full justify-start">
                <Layout className="mr-2 h-4 w-4" />
                View Public Page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
