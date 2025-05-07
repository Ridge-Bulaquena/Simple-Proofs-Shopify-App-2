import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { RunSheetItem } from '@/lib/types'

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
    
    // Get the orders to include in the run sheet
    const { orders } = await request.json() as { orders: RunSheetItem[] }
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders provided' },
        { status: 400 }
      )
    }
    
    // Generate CSV header
    const csvHeader = 'Order Number,Customer Name,Approval Date,Notes,Proof URL\n'
    
    // Generate CSV rows
    const csvRows = orders.map(order => {
      // Escape any commas in the fields
      const orderNumber = `"${order.orderNumber}"`
      const customerName = `"${order.customerName.replace(/"/g, '""')}"`
      const approvalDate = `"${new Date(order.approvedAt).toLocaleDateString()}"`
      const notes = `"${(order.notes || '').replace(/"/g, '""')}"`
      const proofUrl = `"${order.proofFileUrl}"`
      
      return `${orderNumber},${customerName},${approvalDate},${notes},${proofUrl}`
    }).join('\n')
    
    // Combine header and rows
    const csvContent = csvHeader + csvRows
    
    // Return as CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="run-sheet-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Run sheet generation error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate run sheet' },
      { status: 500 }
    )
  }
}
