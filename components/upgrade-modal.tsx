"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, AlertTriangle } from "lucide-react"
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"
import { loadStripe } from "@stripe/stripe-js"

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  limitType: 'proofs' | 'storage' | 'team'
  currentUsage: number
  currentLimit: number
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  limitType, 
  currentUsage, 
  currentLimit 
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()
  
  const limitLabels = {
    proofs: {
      singular: 'proof',
      plural: 'proofs',
      title: 'Proof Limit Reached',
      description: `You've reached your monthly proof limit of ${currentLimit} proofs on the Free plan.`,
      upgradeText: 'Upgrade to Pro for unlimited proofs',
    },
    storage: {
      singular: 'MB',
      plural: 'MB',
      title: 'Storage Limit Reached',
      description: `You've used ${currentUsage} MB out of your ${currentLimit} MB storage limit.`,
      upgradeText: 'Upgrade to Pro for 5GB of storage',
    },
    team: {
      singular: 'team member',
      plural: 'team members',
      title: 'Team Limit Reached',
      description: `You can only add ${currentLimit} team member on the Free plan.`,
      upgradeText: 'Upgrade to Pro for up to 5 team members',
    },
  }
  
  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID || 'price_prod_proplan',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }
      
      const data = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Upgrade error:', error)
      toast({
        title: 'Upgrade failed',
        description: error.message || 'There was a problem upgrading your account.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-yellow-100 p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-center">{limitLabels[limitType].title}</DialogTitle>
          <DialogDescription className="text-center">
            {limitLabels[limitType].description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2 text-lg">Pro Plan Features</div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Unlimited proofs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>5GB file storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Up to 5 team members</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Advanced email templates</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Shopify & Etsy integrations</span>
              </li>
            </ul>
            <div className="mt-4 text-center text-xl font-bold">
              $29<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : limitLabels[limitType].upgradeText}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Continue with Free Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
