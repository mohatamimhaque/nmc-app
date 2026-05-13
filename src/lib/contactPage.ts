import type { ContactPage, PageSection } from '@/types/database'
import { CONTACT_PAGE_ID } from './siteSettings'

export const DEFAULT_CONTACT_PAGE: ContactPage = {
  id: CONTACT_PAGE_ID,
  hero_title: 'Contact Us',
  hero_subtitle: 'We would love to hear from you. Reach out with questions or collaboration ideas.',
  form_title: 'Send a Message',
  form_subtitle: 'We reply within 24-48 hours.',
  recipient_email: null,
  location_title: 'Visit the Campus',
  location_body: 'Dhaka University of Engineering & Technology, Gazipur, Bangladesh.',
  map_embed_url: null,
  social_title: 'Connect with us',
  updated_at: new Date().toISOString(),
}

export const DEFAULT_CONTACT_SECTIONS: PageSection[] = [
  { id: 'contact_form', page: 'contact', section_key: 'contact_form', label: 'Contact Form', is_visible: true, sort_order: 1 },
  { id: 'contact_persons', page: 'contact', section_key: 'contact_persons', label: 'Contact Persons', is_visible: true, sort_order: 2 },
  { id: 'contact_location', page: 'contact', section_key: 'contact_location', label: 'Location', is_visible: true, sort_order: 3 },
  { id: 'contact_social', page: 'contact', section_key: 'contact_social', label: 'Social Links', is_visible: true, sort_order: 4 },
]
