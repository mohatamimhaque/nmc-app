import type { AboutPage, PageSection } from '@/types/database'
import { ABOUT_PAGE_ID } from './siteSettings'

export const DEFAULT_ABOUT_PAGE: AboutPage = {
  id: ABOUT_PAGE_ID,
  hero_title: 'About NMC 2026',
  hero_subtitle: 'Learn about the Math Club at DUET and the people building NMC 2026.',
  overview_section_title: 'Organisation Overview',
  overview_section_subtitle: 'Building a community for mathematics and problem solvers.',
  overview_title: 'Math Club, DUET',
  overview_body: 'Math Club, DUET is a student led community focused on discovery, contest preparation, and collaborative problem solving.',
  nmc_title: 'National Mathematics Carnival',
  nmc_eyebrow: 'NMC 2026',
  nmc_body: 'NMC 2026 brings together university, college, and school participants for a week of challenges, learning, and celebration of mathematical thinking.',
  nmc_cta_label: 'Explore Events',
  nmc_cta_url: '/events',
  mission_section_title: 'Mission and Vision',
  mission_title: 'Mission',
  mission_body: 'Equip students with rigorous problem solving skills, mentorship, and access to competitive mathematics experiences.',
  vision_title: 'Vision',
  vision_body: 'Grow a nationwide network of learners who use mathematics to explore, innovate, and lead in their communities.',
  team_title: 'Organizing Team',
  team_subtitle: 'Meet the students and mentors behind NMC 2026.',
  committee_cta_label: 'See Full Committee',
  committee_cta_url: '/committee',
  advisers_title: 'Faculty and Mentors',
  advisers_subtitle: 'Guidance from faculty and professional advisers.',
  advisers_cta_label: 'Meet the Advisers',
  advisers_cta_url: '/advisers',
  milestones_title: 'Milestones',
  milestones_subtitle: 'Key moments in the journey so far.',
  past_events_title: 'Past Events',
  past_events_subtitle: 'Highlights from previous programs and workshops.',
  past_events_cta_label: 'View Gallery',
  past_events_cta_url: '/gallery',
  updated_at: new Date().toISOString(),
}

export const DEFAULT_ABOUT_SECTIONS: PageSection[] = [
  { id: 'about_overview', page: 'about', section_key: 'about_overview', label: 'Organisation Overview', is_visible: true, sort_order: 1 },
  { id: 'about_mission', page: 'about', section_key: 'about_mission', label: 'Mission and Vision', is_visible: true, sort_order: 2 },
  { id: 'about_team_strip', page: 'about', section_key: 'about_team_strip', label: 'Team Strip', is_visible: true, sort_order: 3 },
  { id: 'about_milestones', page: 'about', section_key: 'about_milestones', label: 'Milestones Timeline', is_visible: true, sort_order: 4 },
  { id: 'about_advisers_strip', page: 'about', section_key: 'about_advisers_strip', label: 'Advisers Preview Strip', is_visible: true, sort_order: 5 },
  { id: 'about_past_events', page: 'about', section_key: 'about_past_events', label: 'Past Events Highlights', is_visible: true, sort_order: 6 },
]

export const DEFAULT_ABOUT_MILESTONES = [
  {
    year: '2019',
    title: 'Club Formation',
    description: 'Math Club, DUET begins campus wide workshops and olympiad training sessions.',
    is_visible: true,
    sort_order: 1,
  },
  {
    year: '2022',
    title: 'First National Event',
    description: 'Hosted inter university mathematics challenges with nationwide participation.',
    is_visible: true,
    sort_order: 2,
  },
  {
    year: '2024',
    title: 'Expanded Outreach',
    description: 'Launched mentorship programs with school and college partners across Bangladesh.',
    is_visible: true,
    sort_order: 3,
  },
]

export const DEFAULT_ABOUT_HIGHLIGHTS = [
  {
    title: 'Regional Math Olympiad',
    detail: 'Collaborative contests focused on problem solving and logic.',
    is_visible: true,
    sort_order: 1,
  },
  {
    title: 'Applied Math Workshops',
    detail: 'Hands on sessions on modeling, statistics, and competition prep.',
    is_visible: true,
    sort_order: 2,
  },
  {
    title: 'Faculty Lecture Series',
    detail: 'Guest lectures from academics and industry mentors.',
    is_visible: true,
    sort_order: 3,
  },
]
