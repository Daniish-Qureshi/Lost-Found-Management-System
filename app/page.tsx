"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StatsCard } from "@/components/stats-card"
import { ItemCard } from "@/components/item-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { useMemo, useState } from "react"
import { SearchFilterBar, type SearchFilters } from "@/components/search-filter-bar"

export default function HomePage() {
  const { items } = useAuth()
  const totalLost = items.filter((i) => i.type === "lost").length
  const totalFound = items.filter((i) => i.type === "found").length
  const matched = items.filter((i) => i.resolved).length
  const recent = items.slice(0, 6)

  const [filters, setFilters] = useState<SearchFilters>({ q: "", category: "All", location: "" })
  const [type, setType] = useState<"lost" | "found">("lost")
  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (i.type !== type) return false
      if (filters.q && !i.name.toLowerCase().includes(filters.q.toLowerCase())) return false
      if (filters.category && filters.category !== "All" && i.category !== filters.category) return false
      if (filters.location && !i.location.toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.from && new Date(i.date) < new Date(filters.from)) return false
      if (filters.to && new Date(i.date) > new Date(filters.to)) return false
      return true
    })
  }, [items, filters, type])

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4">
        <section className="py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <h1 className="text-pretty text-3xl font-bold md:text-4xl">Find lost items. Return found ones.</h1>
              <p className="text-pretty text-muted-foreground">
                A simple, student-friendly Lost & Found for your campus. Report items, explore recent posts, and connect quickly.
              </p>
              <div className="flex gap-3">
                <Link href="/dashboard?tab=my-items">
                  <Button>Report Lost Item</Button>
                </Link>
                <Link href="/dashboard?tab=add-item">
                  <Button variant="outline">Report Found Item</Button>
                </Link>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <p className="mb-3 text-sm text-muted-foreground">Quick Stats</p>
              <div className="grid gap-4 md:grid-cols-3">
                <StatsCard title="Total Lost" value={totalLost} />
                <StatsCard title="Total Found" value={totalFound} />
                <StatsCard title="Resolved" value={matched} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 py-8">
          <h2 className="text-xl font-semibold">Search Items</h2>
          <div className="rounded-lg border p-4">
            <SearchFilterBar showType type={type} onTypeChange={setType} filters={filters} onChange={setFilters} />
          </div>
          {/* Minimal container for Firestore realtime updates (optional) */}
          <div id="items-list" className="mt-4" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">No items match your search.</p>}
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4 py-8">
          <h2 className="text-xl font-semibold">Recent Items</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">No items yet. Be the first to post!</p>
            )}
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4 py-12">
          <h2 className="text-xl font-semibold">How It Works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">1. Report</p>
              <p className="text-sm text-muted-foreground">Post a lost or found item with details and a photo.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">2. Search & Match</p>
              <p className="text-sm text-muted-foreground">Browse and filter items by category, date, and location.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">3. Connect</p>
              <p className="text-sm text-muted-foreground">Email the owner or finder to return the item safely.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
