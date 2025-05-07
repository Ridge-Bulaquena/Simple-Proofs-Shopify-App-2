import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Define types for our database tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
      }
      stores: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          logo_url: string | null
          accent_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          logo_url?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          accent_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          store_id: string
          external_id: string | null
          customer_name: string
          customer_email: string
          status: string
          created_at: string
          updated_at: string
          artist_id: string | null
        }
        Insert: {
          id?: string
          store_id: string
          external_id?: string | null
          customer_name: string
          customer_email: string
          status: string
          created_at?: string
          updated_at?: string
          artist_id?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          external_id?: string | null
          customer_name?: string
          customer_email?: string
          status?: string
          created_at?: string
          updated_at?: string
          artist_id?: string | null
        }
      }
      proofs: {
        Row: {
          id: string
          order_id: string
          file_path: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          file_path: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          file_path?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          proof_id: string
          user_id: string | null
          content: string
          is_customer: boolean
          created_at: string
        }
        Insert: {
          id?: string
          proof_id: string
          user_id?: string | null
          content: string
          is_customer: boolean
          created_at?: string
        }
        Update: {
          id?: string
          proof_id?: string
          user_id?: string | null
          content?: string
          is_customer?: boolean
          created_at?: string
        }
      }
      artists: {
        Row: {
          id: string
          store_id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          store_id: string
          email_template: string | null
          email_subject: string | null
          email_sender_name: string | null
          proof_page_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          email_template?: string | null
          email_subject?: string | null
          email_sender_name?: string | null
          proof_page_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          email_template?: string | null
          email_subject?: string | null
          email_sender_name?: string | null
          proof_page_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      canned_replies: {
        Row: {
          id: string
          store_id: string
          title: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          title: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          title?: string
          content?: string
          created_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          store_id: string
          type: string
          config: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          type: string
          config: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          type?: string
          config?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          proof_limit: number
          file_storage_limit: number
          team_members_limit: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          proof_limit: number
          file_storage_limit: number
          team_members_limit: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          proof_limit?: number
          file_storage_limit?: number
          team_members_limit?: number
          created_at?: string
        }
      }
      store_plans: {
        Row: {
          id: string
          store_id: string
          plan_id: string
          starts_at: string
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          plan_id: string
          starts_at: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          plan_id?: string
          starts_at?: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Create a Supabase client for server components
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}

// Create a Supabase client for client components
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}
