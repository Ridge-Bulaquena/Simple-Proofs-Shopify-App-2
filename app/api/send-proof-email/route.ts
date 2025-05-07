import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend client for email sending
const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get the session to ensure the user is authenticated (unless it's a test)
    const { data: { session } } = await supabase.auth.getSession()
    
    const {
      test,
      recipientEmail,
      recipientName,
      subject,
      template,
      senderName,
      emailBanner,
      orderId,
      proofLink,
    } = await request.json()
    
    // Only allow authenticated users unless it's a test
    if (!session && !test) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Validate required fields
    if (!recipientEmail || !recipientName || !subject || !template || !orderId || !proofLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Replace template variables
    let emailContent = template
      .replace(/{{customer_name}}/g, recipientName)
      .replace(/{{order_id}}/g, orderId)
      .replace(/{{proof_link}}/g, proofLink)
    
    // Add banner image if provided
    if (emailBanner) {
      emailContent = `<img src="${emailBanner}" alt="${senderName || 'Proof'}" style="max-width: 100%; margin-bottom: 20px;" />${emailContent}`
    }
    
    // Add proof button if not present in the template
    if (!emailContent.includes(proofLink)) {
      emailContent += `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${proofLink}" style="background-color: #0f172a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View and Approve Proof
          </a>
        </div>
      `
    }
    
    // Add footer
    emailContent += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666;">
        <p>This email was sent by ${senderName || 'your seller'} using Simpler Proofs.</p>
      </div>
    `
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'proofs@simplerproofs.com',
      to: recipientEmail,
      subject,
      html: emailContent,
      reply_to: session?.user?.email || process.env.RESEND_FROM_EMAIL || 'proofs@simplerproofs.com',
    })
    
    if (error) {
      console.error('Email sending error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      )
    }
    
    // If it's not a test, update the proof status
    if (!test) {
      const { error: updateError } = await supabase
        .from('proofs')
        .update({ status: 'proof_sent', updated_at: new Date().toISOString() })
        .eq('order_id', orderId)
      
      if (updateError) {
        console.error('Error updating proof status:', updateError)
      }
      
      // Also update the order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'proof_sent', updated_at: new Date().toISOString() })
        .eq('id', orderId)
      
      if (orderError) {
        console.error('Error updating order status:', orderError)
      }
    }
    
    return NextResponse.json({
      success: true,
      messageId: data?.id,
    })
  } catch (error: any) {
    console.error('Email sending error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
