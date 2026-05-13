'use client'

import { createContext, useContext } from 'react'

type PublicSymbolsContextValue = {
  category: string
}

const PublicSymbolsContext = createContext<PublicSymbolsContextValue | null>(null)

export function PublicSymbolsProvider({
  category,
  children,
}: {
  category: string
  children: React.ReactNode
}) {
  return (
    <PublicSymbolsContext.Provider value={{ category }}>
      {children}
    </PublicSymbolsContext.Provider>
  )
}

export function usePublicSymbols() {
  return useContext(PublicSymbolsContext)
}
