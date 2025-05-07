"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { OnboardingStep, OnboardingData } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

// Import step components
import StoreInfoStep from "./components/StoreInfoStep"
import BrandingStep from "./components/BrandingStep"
import PublicURLStep from "./components/PublicURLStep"
import EmailSetupStep from "./components/EmailSetupStep"
import PlanSelectionStep from "./components/PlanSelectionStep"
import InviteTeamStep from "./components/InviteTeamStep"
import IntegrationsStep from "./components/IntegrationsStep"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    storeInfo: {
      name: "",
      slug: "",
    },
    branding: {
      accentColor: "#0f172a", // Default accent color (slate-900)
    },
    publicUrl: {
      slug: "",
    },
    emailSetup: {
      senderName: "",
      subject: "Your proof is ready for review",
      template: "<p>Hello {{customer_name}},</p><p>Your proof is ready for review. Please click the button below to view and approve your proof or request changes.</p><p>Thank you for your business!</p>",
    },
    planSelection: {
      planId: "free",
    },
    teamMembers: {
      members: [],
    },
    integrations: {},
  })

  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: "store-info", title: "Store Info", description: "Basic store details", isCompleted: false },
    { id: "branding", title: "Branding", description: "Customize look & feel", isCompleted: false },
    { id: "public-url", title: "Public URL", description: "Set your store URL", isCompleted: false },
    { id: "email-setup", title: "Email Setup", description: "Configure email templates", isCompleted: false },
    { id: "plan-selection", title: "Plan", description: "Choose your plan", isCompleted: false },
    { id: "team-members", title: "Team", description: "Invite team members", isCompleted: false },
    { id: "integrations", title: "Integrations", description: "Connect your store", isCompleted: false },
  ])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // If not logged in, redirect to login page
        router.push("/login")
      } else {
        setIsReady(true)
      }
    }
    
    checkSession()
  }, [supabase, router])

  const updateStep = (index: number, isCompleted: boolean) => {
    setSteps((prevSteps) => 
      prevSteps.map((step, i) => 
        i === index ? { ...step, isCompleted } : step
      )
    )
  }

  const handleStepComplete = (data: Partial<OnboardingData>) => {
    // Update the onboarding data with the new data
    setOnboardingData((prev) => ({
      ...prev,
      ...data,
    }))

    // Mark the current step as completed
    updateStep(currentStep, true)

    // Move to the next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinalSubmit()
    }
  }

  const jumpToStep = (index: number) => {
    // Only allow jumping to completed steps or the current step + 1
    if (steps[index].isCompleted || index === currentStep) {
      setCurrentStep(index)
    }
  }

  const handleFinalSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const userId = session.user.id

      // Create the store
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .insert({
          user_id: userId,
          name: onboardingData.storeInfo.name,
          slug: onboardingData.storeInfo.slug,
          logo_url: onboardingData.storeInfo.logoUrl || null,
          accent_color: onboardingData.branding.accentColor,
        })
        .select()
        .single()

      if (storeError) throw storeError

      // Create store settings
      const { error: settingsError } = await supabase
        .from("store_settings")
        .insert({
          store_id: store.id,
          email_template: onboardingData.emailSetup.template,
          email_subject: onboardingData.emailSetup.subject,
          email_sender_name: onboardingData.emailSetup.senderName,
          proof_page_instructions: "Please review your proof carefully. Once approved, we'll begin production.",
        })

      if (settingsError) throw settingsError

      // Create plan if selected
      const { error: planError } = await supabase
        .from("store_plans")
        .insert({
          store_id: store.id,
          plan_id: onboardingData.planSelection.planId,
          starts_at: new Date().toISOString(),
        })

      if (planError) throw planError

      // Add team members if any
      if (onboardingData.teamMembers.members.length > 0) {
        const artists = onboardingData.teamMembers.members.map(member => ({
          store_id: store.id,
          name: member.name,
          email: member.email,
        }))

        const { error: artistsError } = await supabase
          .from("artists")
          .insert(artists)

        if (artistsError) throw artistsError
      }

      // Add integrations if any
      if (onboardingData.integrations.shopify || onboardingData.integrations.etsy) {
        if (onboardingData.integrations.shopify) {
          const { error: shopifyError } = await supabase
            .from("integrations")
            .insert({
              store_id: store.id,
              type: "shopify",
              config: onboardingData.integrations.shopify,
            })

          if (shopifyError) throw shopifyError
        }

        if (onboardingData.integrations.etsy) {
          const { error: etsyError } = await supabase
            .from("integrations")
            .insert({
              store_id: store.id,
              type: "etsy",
              config: onboardingData.integrations.etsy,
            })

          if (etsyError) throw etsyError
        }
      }

      toast({
        title: "Onboarding complete!",
        description: "Your store is now set up and ready to use.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error setting up your store",
        description: error.message || "There was an error completing the onboarding process.",
        variant: "destructive",
      })
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StoreInfoStep onComplete={handleStepComplete} data={onboardingData.storeInfo} />
      case 1:
        return <BrandingStep onComplete={handleStepComplete} data={onboardingData.branding} />
      case 2:
        return <PublicURLStep onComplete={handleStepComplete} data={onboardingData.publicUrl} storeSlug={onboardingData.storeInfo.slug} />
      case 3:
        return <EmailSetupStep onComplete={handleStepComplete} data={onboardingData.emailSetup} />
      case 4:
        return <PlanSelectionStep onComplete={handleStepComplete} data={onboardingData.planSelection} />
      case 5:
        return <InviteTeamStep onComplete={handleStepComplete} data={onboardingData.teamMembers} />
      case 6:
        return <IntegrationsStep onComplete={handleStepComplete} data={onboardingData.integrations} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-12">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={cn(
                  "step-item",
                  currentStep === i && "active",
                  step.isCompleted && "complete"
                )}
                onClick={() => jumpToStep(i)}
              >
                <div
                  className={cn(
                    "step",
                    currentStep === i && "active",
                    step.isCompleted && "complete"
                  )}
                >
                  {step.isCompleted ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <div className="hidden md:block text-center mt-2">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {renderStep()}
      </div>
    </div>
  )
}
