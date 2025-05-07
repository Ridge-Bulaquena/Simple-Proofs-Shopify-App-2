import { Database } from './supabase'

export type Store = Database['public']['Tables']['stores']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Proof = Database['public']['Tables']['proofs']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Artist = Database['public']['Tables']['artists']['Row']
export type StoreSettings = Database['public']['Tables']['store_settings']['Row']
export type CannedReply = Database['public']['Tables']['canned_replies']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']
export type StorePlan = Database['public']['Tables']['store_plans']['Row']

export type OrderWithDetails = Order & {
  proof?: Proof | null
  artist?: Artist | null
}

export type ProofWithComments = Proof & {
  comments: Comment[]
}

export type OnboardingStep = {
  id: string
  title: string
  description: string
  isCompleted: boolean
}

export type OnboardingData = {
  storeInfo: {
    name: string
    slug: string
    logoUrl?: string
  }
  branding: {
    accentColor: string
    emailBanner?: string
  }
  publicUrl: {
    slug: string
  }
  emailSetup: {
    senderName: string
    subject: string
    template: string
  }
  planSelection: {
    planId: string
  }
  teamMembers: {
    members: {
      name: string
      email: string
      role: string
    }[]
  }
  integrations: {
    shopify?: {
      apiKey: string
      storeUrl: string
    }
    etsy?: {
      apiKey: string
      storeId: string
    }
  }
}

export type DashboardTab = 'orders' | 'run-sheet' | 'proof-history' | 'settings'
export type SettingsTab = 'general' | 'email' | 'canned-replies' | 'proof-page' | 'artists' | 'integrations'

export type EmailTemplate = {
  subject: string
  body: string
}

export type RunSheetItem = {
  orderId: string
  orderNumber: string
  customerName: string
  proofFileUrl: string
  approvedAt: string
  notes: string
}
