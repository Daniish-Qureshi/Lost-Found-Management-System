"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/components/providers/auth-provider"
import { ItemCard } from "@/components/item-card"
import { useMemo, useState } from "react"
import { SearchFilterBar, type SearchFilters } from "@/components/search-filter-bar"
import type { Item } from "@/lib/types"

function applyFilters(items: Item[], f: SearchFilters) {
  return items.filter((i) => {
    if (f.q && !i.name.toLowerCase().includes(f.q.toLowerCase())) return false
    if (f.category && f.category !== "All" && i.category !== f.category) return false
    if (f.location && !i.location.toLowerCase().includes(f.location.toLowerCase())) return false
    if (f.from && new Date(i.date) < new Date(f.from)) return false
    if (f.to && new Date(i.date) > new Date(f.to)) return false
    return true
  })
}

export default function LostPage() {
  const { items } = useAuth()
  const [filters, setFilters] = useState<SearchFilters>({ q: "", category: "All", location: "" })
  const list = useMemo(
    () =>
      applyFilters(
        items.filter((i) => i.type === "lost"),
        filters,
      ),
    [items, filters],
  )

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Lost Items</h1>
        <div className="mb-6 rounded-lg border p-4">
          <SearchFilterBar filters={filters} onChange={setFilters} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {list.length === 0 && <p className="text-sm text-muted-foreground">No lost items found.</p>}
          {list.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
