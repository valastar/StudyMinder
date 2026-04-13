import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  study_streak: number
  total_pomodoros: number
  created_at: string
}

export type QuickNote = {
  id: string
  user_id: string
  content: string
  color: string
  created_at: string
}

export type Event = {
  id: string
  user_id: string
  title: string
  description: string | null
  event_date: string
  color: string
}

export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  source: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  content: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type AudioTTS = {
  id: string
  user_id: string
  title: string
  text_content: string
  voice: string
  rate: number
  loop_enabled: boolean
  duration_estimate: number | null
  created_at: string
}