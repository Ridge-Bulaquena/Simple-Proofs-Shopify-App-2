"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Package, ChevronRight, User, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { cn, formatDate, orderStatuses, orderStatusColors, orderStatusLabels } from "@/lib/utils"
import Link from "next/link"
import { OrderWithDetails } from "@/lib/types"

interface OrderListProps {
  storeId: string
  storeSlug: string
}

export function OrderList({ storeId, storeSlug }: OrderListProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>(Object.values(orderStatuses))
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            proof:proofs(*),
            artist:artists(*)
          `)
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })

        if (error) throw error
        setOrders(data || [])
        setFilteredOrders(data || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [storeId, supabase])

  useEffect(() => {
    // Filter orders based on search query and status filters
    const filtered = orders.filter((order) => {
      const matchesSearch =
        searchQuery === "" ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.external_id?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilters.includes(order.status)

      return matchesSearch && matchesStatus
    })

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilters, orders])

  const handleStatusFilterChange = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  if (isLoading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or order ID..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {Object.entries(orderStatusLabels).map(([status, label]) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilters.includes(status)}
                onCheckedChange={() => handleStatusFilterChange(status)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilters.length === Object.values(orderStatuses).length}
              onCheckedChange={() => {
                if (statusFilters.length === Object.values(orderStatuses).length) {
                  setStatusFilters([])
                } else {
                  setStatusFilters(Object.values(orderStatuses))
                }
              }}
            >
              {statusFilters.length === Object.values(orderStatuses).length ? "Unselect All" : "Select All"}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/50">
          <Package className="h-12 w-12 text-muted-foreground mb-2" />
          <h3 className="text-xl font-medium">No orders found</h3>
          <p className="text-muted-foreground mt-1">
            {orders.length === 0
              ? "You don't have any orders yet. Orders will appear here when they're created."
              : "No orders match your current search and filter criteria."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Link href={`/dashboard/orders/${order.id}`} key={order.id}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.customer_name}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", orderStatusColors[order.status])}>
                        {orderStatusLabels[order.status as keyof typeof orderStatusLabels]}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {order.external_id && (
                        <>
                          <Package className="h-3.5 w-3.5" />
                          <span>Order: {order.external_id}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>{order.customer_email}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
