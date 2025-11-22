import { useMemo } from "react"

export type BrandTier = "basic" | "pro" | "enterprise" | string

export interface BrandContextValue {
  brandId: string
  brandName: string
  tier?: BrandTier
}

// Mock: replace with real auth context wiring when available
function getAuthBrandIdFallback(): string | undefined {
  // If an app-level context attaches a brand ID to window, read it safely
  try {
    const anyWin = globalThis as any
    return anyWin?.__brandId ?? undefined
  } catch {
    return undefined
  }
}

export function useBrandContext(): BrandContextValue {
  const envId = (import.meta as any)?.env?.VITE_DEMO_BRAND_ID as string | undefined
  const authId = getAuthBrandIdFallback()
  const brandId = authId || envId || "demo-brand"

  return useMemo(
    () => ({ brandId, brandName: "Demo Brand", tier: "pro" }),
    [brandId]
  )
}

export default useBrandContext
