export function getSeoTitle(pageTitle: string): string {
  const suffix = " | NMC 2026" // 11 chars
  const candidate = pageTitle + suffix
  if (candidate.length >= 50 && candidate.length <= 60) {
    return candidate
  }
  if (candidate.length < 50) {
    const longerSuffix = " | NMC 2026 | Math Club DUET" // 28 chars
    const candidate2 = pageTitle + longerSuffix
    if (candidate2.length >= 50 && candidate2.length <= 60) {
      return candidate2
    }
    if (candidate2.length > 60) {
      return candidate2.slice(0, 60)
    }
    return (candidate2 + " - Register Now!").slice(0, 60).padEnd(50, '.').slice(0, 60)
  }
  const shorterSuffix = " | NMC 2026" // 11 chars
  const candidate3 = pageTitle + shorterSuffix
  if (candidate3.length >= 50 && candidate3.length <= 60) {
    return candidate3
  }
  if (candidate3.length > 60) {
    const maxPageTitleLen = 60 - shorterSuffix.length - 3
    return pageTitle.slice(0, maxPageTitleLen) + "..." + shorterSuffix
  }
  return candidate3.padEnd(50, '.').slice(0, 60)
}

export function getSeoDescription(description: string): string {
  const clean = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const brand = " Join the National Mathematics Carnival 2026, organized by the Math Club at DUET. Participate in competitions, workshops, and exhibitions."
  
  if (clean.length >= 140 && clean.length <= 160) {
    return clean
  }
  if (clean.length < 140) {
    const candidate = clean + brand
    if (candidate.length >= 140 && candidate.length <= 160) {
      return candidate
    }
    if (candidate.length > 160) {
      const allowedBrandLen = 150 - clean.length
      if (allowedBrandLen > 10) {
        return clean + brand.slice(0, allowedBrandLen - 3) + "..."
      }
      return candidate.slice(0, 150)
    }
    return candidate.padEnd(145, '.').slice(0, 160)
  }
  return clean.slice(0, 147) + "..."
}

export function getEventKeywords(title: string, category?: string, description?: string): string[] {
  const baseKeywords = [
    title,
    category || 'Mathematics',
    'National Mathematics Carnival',
    'NMC 2026',
    'NMC 26',
    'Math Club DUET',
    'DUET Math Club',
    'DUET',
    'DUET Gazipur',
    'duet campus',
    'DUET Campus Gazipur',
    'Dhaka University of Engineering & Technology',
    'Gazipur',
    'Dhaka University of Engineering & Technology, Gazipur',
    'Dhaka University of Engineering and Technology',
    'University of Engineering & Technology',
    'Math',
    'Carnival',
    'National Mathematics fest',
    'National Mathematics Carnival 2026',
    'National Mathematics Carnival 2026 DUET',
    'nmcbd',
    'nmcbd.app',
    'National Mathematics Carnival Bangladesh',
    'nmc bangladesh',
    'nmc',
    'nmc bd 2026',
    'Math Olympiad',
    'competition',
    'Mathematics Competition Bangladesh',
    'National Math Olympiad',
    'Bangladesh Math Olympiad',
    'BD Math Olympiad',
    'Math Competition in Bangladesh',
    'Math Contest',
    'Math Fest Bangladesh',
    'Math Festival',
    'Math Olympiad BD',
    'mohatamim',
    'mohatamim haque',
  ]

  const keywordsSet = new Set<string>()
  baseKeywords.forEach(kw => {
    if (kw) {
      keywordsSet.add(kw.trim())
      keywordsSet.add(kw.trim().toLowerCase())
    }
  })

  if (description) {
    const words = description.replace(/<[^>]*>/g, '').split(/\s+/)
    const stopWords = new Set(['about', 'their', 'there', 'would', 'could', 'should', 'under', 'these', 'those', 'where', 'which', 'event', 'competition', 'carnival'])
    words.forEach(word => {
      const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
      if (clean.length > 4 && !stopWords.has(clean)) {
        keywordsSet.add(clean)
      }
    })
  }

  return Array.from(keywordsSet).filter(Boolean).slice(0, 20)
}
