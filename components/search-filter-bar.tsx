"use client"

import type { Category, ItemType } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const categories: Category[] = ["Electronics", "Books", "ID Cards", "Clothing", "Bags & Backpacks", "Accessories", "Stationery", "Sports Equipment", "Others"]


export type SearchFilters = {
  q: string
  category: Category | "All"
  location: string
  from?: string
  to?: string
}

export function SearchFilterBar({
  filters,
  onChange,
  showType = false,
  type,
  onTypeChange,
}: {
  filters: SearchFilters
  onChange: (f: SearchFilters) => void
  showType?: boolean
  type?: ItemType
  onTypeChange?: (t: ItemType) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-6">
      {showType && onTypeChange && (
        <div className="grid gap-2 md:col-span-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={(val) => onTypeChange(val as ItemType)}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="found">Found</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          placeholder="Name..."
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
        />
      </div>

      <div className="grid gap-2 md:col-span-1">
        <Label>Category</Label>
        <Select value={filters.category} onValueChange={(val) => onChange({ ...filters, category: val as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 md:col-span-1">
        <Label htmlFor="loc">Location</Label>
        <Input
          id="loc"
          placeholder="Location..."
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
        />
      </div>

      <div className="grid gap-2 md:col-span-1">
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          type="date"
          value={filters.from || ""}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
        />
      </div>
      <div className="grid gap-2 md:col-span-1">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="date"
          value={filters.to || ""}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
        />
      </div>
    </div>
  )
}
