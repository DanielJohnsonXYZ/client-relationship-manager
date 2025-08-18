import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          company_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          company: string | null;
          phone: string | null;
          status: 'active' | 'inactive' | 'at_risk' | 'churned';
          health_score: number;
          total_revenue: number;
          last_contact_date: string | null;
          next_follow_up: string | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          company?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'at_risk' | 'churned';
          health_score?: number;
          total_revenue?: number;
          last_contact_date?: string | null;
          next_follow_up?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          company?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'at_risk' | 'churned';
          health_score?: number;
          total_revenue?: number;
          last_contact_date?: string | null;
          next_follow_up?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      communications: {
        Row: {
          id: string;
          client_id: string;
          user_id: string;
          type: 'email' | 'call' | 'meeting' | 'slack' | 'other';
          subject: string | null;
          content: string | null;
          direction: 'inbound' | 'outbound' | null;
          sentiment_score: number | null;
          sentiment_label: 'positive' | 'neutral' | 'negative' | null;
          communication_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          user_id: string;
          type: 'email' | 'call' | 'meeting' | 'slack' | 'other';
          subject?: string | null;
          content?: string | null;
          direction?: 'inbound' | 'outbound' | null;
          sentiment_score?: number | null;
          sentiment_label?: 'positive' | 'neutral' | 'negative' | null;
          communication_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          user_id?: string;
          type?: 'email' | 'call' | 'meeting' | 'slack' | 'other';
          subject?: string | null;
          content?: string | null;
          direction?: 'inbound' | 'outbound' | null;
          sentiment_score?: number | null;
          sentiment_label?: 'positive' | 'neutral' | 'negative' | null;
          communication_date?: string;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          type: 'payment_risk' | 'low_engagement' | 'opportunity' | 'follow_up_needed' | 'contract_renewal';
          title: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical';
          status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          type: 'payment_risk' | 'low_engagement' | 'opportunity' | 'follow_up_needed' | 'contract_renewal';
          title: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          type?: 'payment_risk' | 'low_engagement' | 'opportunity' | 'follow_up_needed' | 'contract_renewal';
          title?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
          created_at?: string;
          resolved_at?: string | null;
        };
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          type: 'gmail' | 'slack' | 'zoom' | 'calendly' | 'stripe';
          name: string;
          status: 'active' | 'inactive' | 'error';
          config: any;
          last_sync: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'gmail' | 'slack' | 'zoom' | 'calendly' | 'stripe';
          name: string;
          status?: 'active' | 'inactive' | 'error';
          config?: any;
          last_sync?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'gmail' | 'slack' | 'zoom' | 'calendly' | 'stripe';
          name?: string;
          status?: 'active' | 'inactive' | 'error';
          config?: any;
          last_sync?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Client-side Supabase client
export const createClientSupabase = () =>
  createClientComponentClient<Database>();

// Server-side Supabase client
export const createServerSupabase = () =>
  createServerComponentClient<Database>({ cookies });

// Admin client (for server actions)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);