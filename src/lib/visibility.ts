import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PageSection = Database['public']['Tables']['page_sections']['Row']
type SiteSettings = Database['public']['Tables']['site_settings']['Row']
type PageVisibility = Database['public']['Tables']['page_visibility']['Row']

/** Returns a map of section_key → is_visible for a given page */
export async function getSectionVisibility(page: string): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('page_sections')
    .select('section_key, is_visible')
    .eq('page', page)
    .order('sort_order')

  const map: Record<string, boolean> = {}
  for (const row of data ?? []) {
    map[row.section_key] = row.is_visible
  }
  return map
}

/** Returns page sections ordered by sort_order */
export async function getPageSections(page: string): Promise<PageSection[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page', page)
    .order('sort_order')
  return data ?? []
}

/** Returns global site settings (singleton) */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .single()
  return data ?? null
}

/** Returns all page visibility rows */
export async function getAllPageVisibility(): Promise<PageVisibility[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('page_visibility')
    .select('*')
    .order('label')
  return data ?? []
}

/** Returns true if a top-level page is visible */
export async function isPageVisible(pageKey: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('page_visibility')
    .select('is_visible')
    .eq('page_key', pageKey)
    .single()
  return data?.is_visible ?? true
}
