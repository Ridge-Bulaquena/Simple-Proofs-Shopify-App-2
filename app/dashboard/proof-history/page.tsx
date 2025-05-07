"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Search, Filter, Calendar, Layout, Eye, Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { ProofWithComments } from "@/lib/types"
import Link from "next/link"

export default function ProofHistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [proofs, setProofs] = useState<(ProofWithComments & { order: any })[]>([])
  const [filteredProofs, setFilteredProofs] = useState<(ProofWithComments & { order: any })[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>(["approved", "changes_requested", "proof_sent"])
  const [dateFilter, setDateFilter] = useState<string>("all")
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProofs = async () => {
      setIsLoading(true)
      try {
        const { data: store } = await supabase
          .from("stores")
          .select("id, slug")
          .single()

        if (!store) {
          router.push("/onboarding")
          return
        }

        // First get all proofs with their orders and comments
        const { data, error } = await supabase
          .from("proofs")
          .select(`
            *,
            comments(*),
            order:orders(*)
          `)
          .eq("order.store_id", store.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        if (data) {
          setProofs(data)
          setFilteredProofs(data)
        }
      } catch (error: any) {
        console.error("Error fetching proofs:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load proof history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProofs()
  }, [supabase, router, toast])

  useEffect(() => {
    // Filter proofs based on search, status, and date
    let filtered = proofs

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        proof =>
          proof.order?.customer_name.toLowerCase().includes(query) ||
          proof.order?.customer_email.toLowerCase().includes(query) ||
          proof.order?.external_id?.toLowerCase().includes(query)
      )
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter(proof => statusFilter.includes(proof.status))
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
        proof => new Date(proof.created_at) >= filterDate
      )
    }

    setFilteredProofs(filtered)
  }, [searchQuery, statusFilter, dateFilter, proofs])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="h-4 w-4 text-green-500" />;
      case "changes_requested":
        return <X className="h-4 w-4 text-orange-500" />;
      case "proof_sent":
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "changes_requested":
        return "Changes Requested";
      case "proof_sent":
        return "Sent to Customer";
      default:
        return status;
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
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
        <h1 className="text-3xl font-bold tracking-tight">Proof History</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            All Proofs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by customer or order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Status</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("proof_sent")}
                    onCheckedChange={() => handleStatusFilterChange("proof_sent")}
                  >
                    Sent to Customer
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("approved")}
                    onCheckedChange={() => handleStatusFilterChange("approved")}
                  >
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("changes_requested")}
                    onCheckedChange={() => handleStatusFilterChange("changes_requested")}
                  >
                    Changes Requested
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.length === 3}
                    onCheckedChange={() => {
                      if (statusFilter.length === 3) {
                        setStatusFilter([])
                      } else {
                        setStatusFilter(["approved", "changes_requested", "proof_sent"])
                      }
                    }}
                  >
                    {statusFilter.length === 3 ? "Clear All" : "Select All"}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
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
            </div>

            {filteredProofs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No proofs found matching your filters
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProofs.map((proof) => (
                  <Card key={proof.id} className="card-hover">
                    <div className="relative p-2">
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {proof.file_path.endsWith('.pdf') ? (
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-4xl mb-2">📄</div>
                            <div className="text-xs text-muted-foreground">PDF Proof</div>
                          </div>
                        ) : (
                          <img
                            src={proof.file_path}
                            alt="Proof"
                            className="object-contain w-full h-full"
                          />
                        )}
                      </div>
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs">
                        {getStatusIcon(proof.status)}
                        <span>{getStatusLabel(proof.status)}</span>
                      </div>
                    </div>
                    <CardContent className="p-4 pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">
                            {proof.order?.customer_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(proof.created_at)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {proof.order?.external_id || `Order ${proof.order_id.substring(0, 8)}`}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>Comments: {proof.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Link href={`/dashboard/orders/${proof.order_id}`}>
                            <Button variant="outline" size="sm">
                              View Order
                            </Button>
                          </Link>
                          <Link href={`/${proof.order?.store_slug}/${proof.order_id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Public Link
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
