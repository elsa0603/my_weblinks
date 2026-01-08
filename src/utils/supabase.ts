import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Link {
  id: string
  url: string
  title: string
  thumbnail: string | null
  category: string
  color: string
  order: number
  created_at: string
  type: 'website' | 'youtube'
}

export interface Category {
  id: string
  name: string
  color: string
  order: number
}
