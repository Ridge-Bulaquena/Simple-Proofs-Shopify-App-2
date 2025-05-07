"use client"

import { useState } from "react"
import { CreditCard, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Make sure to call loadStripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  popular?: boolean
}

interface PlanSelectionStepProps {
  onComplete: (data: any) => void
  data: {
    planId: string
  }
}

export default function PlanSelectionStep({ onComplete, data }: PlanSelectionStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(data.planId || "free")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      features: [
        "10 proofs per month",
        "Basic email notifications",
        "100MB storage",
        "1 team member"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      features: [
        "Unlimited proofs",
        "Advanced email templates",
        "SMS notifications",
        "5GB storage",
        "5 team members",
        "Shopify & Etsy integrations"
      ],
      popular: true
    }
  ]
  
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }
  
  const handleContinue = async () => {
    try {
      setIsProcessing(true)
      
      if (selectedPlan === "free") {
        // For free plan, just continue
        onComplete({
          planSelection: {
            planId: selectedPlan
          }
        })
      } else {
        // For paid plans, redirect to checkout/subscription
        const { data } = await supabase.auth.getUser()
        
        if (!data.user) {
          throw new Error("User not found")
        }
        
        // For paid plan, we would normally redirect to Stripe checkout
        // Since this is onboarding and we don't have a store ID yet,
        // we'll just save the plan selection and handle payment later
        
        toast({
          title: "Pro Plan Selected",
          description: "You'll be asked to set up payment after completing onboarding.",
        })
        
        onComplete({
          planSelection: {
            planId: selectedPlan
          }
        })
      }
    } catch (error: any) {
      toast({
        title: "Error selecting plan",
        description: error.message || "There was an error selecting your plan.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Choose Your Plan
        </CardTitle>
        <CardDescription>
          Select the plan that fits your needs. You can upgrade or downgrade anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 cursor-pointer relative overflow-hidden transition-all ${
                selectedPlan === plan.id 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "hover:border-primary/50"
              }`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                  Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-medium">{plan.name}</h3>
                <div className="flex items-baseline mt-1">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">/month</span>
                  )}
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => history.back()}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Next Step"}
        </Button>
      </CardFooter>
    </Card>
  )
}
