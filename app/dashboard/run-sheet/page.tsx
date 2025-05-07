"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { FileDown, FileText, Download, Calendar, Check, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { RunSheetItem } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

export default function RunSheetPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [approvedOrders, setApprovedOrders] = useState<RunSheetItem[]>([])
  const [filteredOrders, setFilteredOrders] = useState<RunSheetItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<string>("all")
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchApprovedOrders = async () => {
      setIsLoading(true)
      try {
        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .single()

        if (!store) {
          router.push("/onboarding")
          return
        }

        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            external_id,
            customer_name,
            status,
            created_at,
            updated_at,
            proofs(id, file_path, status, created_at, updated_at)
          `)
          .eq("store_id", store.id)
          .eq("status", "approved")
          .order("updated_at", { ascending: false })

        if (error) throw error

        // Format the data as RunSheetItems
        const formattedData: RunSheetItem[] = data.map((order) => ({
          orderId: order.id,
          orderNumber: order.external_id || `ORD-${order.id.substring(0, 8)}`,
          customerName: order.customer_name,
          proofFileUrl: order.proofs && order.proofs[0] ? order.proofs[0].file_path : "",
          approvedAt: order.updated_at,
          notes: "",
        }))

        setApprovedOrders(formattedData)
        setFilteredOrders(formattedData)
        setSelectedOrders(formattedData.map(item => item.orderId))
      } catch (error: any) {
        console.error("Error fetching approved orders:", error)
        toast({
          title: "Error",
          description: "Could not load approved orders",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchApprovedOrders()
  }, [supabase, router, toast])

  useEffect(() => {
    // Filter orders based on search query and date filter
    let filtered = approvedOrders

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        order =>
          order.customerName.toLowerCase().includes(query) ||
          order.orderNumber.toLowerCase().includes(query)
      )
    }

    if (dateFilter !== "all") {
      const now = new Date()
      let filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter(
        order => new Date(order.approvedAt) >= filterDate
      )
    }

    setFilteredOrders(filtered)
  }, [searchQuery, dateFilter, approvedOrders])

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(order => order.orderId))
    }
  }

  const updateOrderNote = (orderId: string, note: string) => {
    setApprovedOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, notes: note }
          : order
      )
    )
  }

  const generateRunSheet = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to generate a run sheet.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // Get the selected orders with their notes
      const selectedOrdersData = approvedOrders
        .filter(order => selectedOrders.includes(order.orderId))
        .map(order => ({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          proofFileUrl: order.proofFileUrl,
          approvedAt: order.approvedAt,
          notes: order.notes,
        }))

      // Call the API to generate run sheet
      const response = await fetch("/api/generate-run-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orders: selectedOrdersData }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate run sheet")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `run-sheet-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast({
        title: "Run Sheet Generated",
        description: `Successfully generated run sheet for ${selectedOrders.length} orders.`,
      })
    } catch (error: any) {
      console.error("Error generating run sheet:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate run sheet",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Run Sheet</h1>
        <Button 
          onClick={generateRunSheet} 
          disabled={isGenerating || selectedOrders.length === 0}
          className="space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              <span>Generate Run Sheet</span>
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approved Orders
          </CardTitle>
          <CardDescription>
            Select orders to include in your run sheet export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Date</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={dateFilter === "all"}
                    onCheckedChange={() => setDateFilter("all")}
                  >
                    All time
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={dateFilter === "today"}
                    onCheckedChange={() => setDateFilter("today")}
                  >
                    Today
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={dateFilter === "week"}
                    onCheckedChange={() => setDateFilter("week")}
                  >
                    Last 7 days
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={dateFilter === "month"}
                    onCheckedChange={() => setDateFilter("month")}
                  >
                    Last 30 days
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Select</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={toggleAllOrders}
                  >
                    {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0
                      ? "Deselect All"
                      : "Select All"
                    }
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No approved orders found
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={toggleAllOrders}
                        />
                      </TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Approved Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell>
                          <Input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={selectedOrders.includes(order.orderId)}
                            onChange={() => toggleOrderSelection(order.orderId)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatDate(order.approvedAt)}</TableCell>
                        <TableCell>
                          <Input
                            placeholder="Add notes..."
                            value={order.notes}
                            onChange={(e) => updateOrderNote(order.orderId, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{selectedOrders.length} of {filteredOrders.length} orders selected</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateRunSheet}
                disabled={isGenerating || selectedOrders.length === 0}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    <span>Export CSV</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
