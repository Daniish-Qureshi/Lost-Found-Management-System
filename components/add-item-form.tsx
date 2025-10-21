"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { ItemType, Category, Item } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useAuth } from "./providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

const categories: Category[] = [
  "Electronics",
  "Books",
  "ID Cards",
  "Clothing",
  "Bags & Backpacks",
  "Accessories",
  "Stationery",
  "Sports Equipment",
  "Others",
]

export function AddItemForm({
  initial,
  onSaved,
}: {
  initial?: Partial<Item>
  onSaved?: () => void
}) {
  const [type, setType] = useState<ItemType>((initial?.type as ItemType) || "lost")
  const [name, setName] = useState(initial?.name || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [location, setLocation] = useState(initial?.location || "")
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<Category>((initial?.category as Category) || "Electronics")
  const [contact, setContact] = useState(initial?.contact || "")
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(initial?.imageDataUrl)
  const [saving, setSaving] = useState(false)

  const { addItem, updateItem } = useAuth()
  const { toast } = useToast()
  const [similar, setSimilar] = useState<Item[]>([])

  function onFileChange(file?: File) {
    if (!file) return setImageDataUrl(undefined)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageDataUrl((e.target?.result as string) || undefined)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !location || !contact) {
      toast({ title: "Missing fields", description: "Name, location and contact are required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      if (initial?.id) {
        await updateItem(initial.id, {
          type,
          name,
          description,
          location,
          date,
          category,
          contact,
          imageDataUrl,
        })
        toast({ title: "Item updated" })
      } else {
        // Fire-and-forget add for fast UX. addItem does the background upload and
        // updates optimistic item in-place when complete.
        const p = addItem({ type, name, description, location, date, category, contact, imageDataUrl } as any)
        p?.then(() => {
          // optionally: add a small in-app notification to localStorage for owner
          try {
            const usersRaw = localStorage.getItem("lf_users")
            if (usersRaw) {
              const users = JSON.parse(usersRaw)
              const owner = users.find((u: any) => u.id === localStorage.getItem("lf_session"))
              if (owner) {
                const notes = owner.notifications || []
                notes.push({ id: crypto.randomUUID(), title: "Post published", body: `Your item \"${name}\" was posted.`, createdAt: new Date().toISOString(), read: false })
                owner.notifications = notes
                localStorage.setItem("lf_users", JSON.stringify(users))
              }
            }
          } catch {}
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error("Background add failed:", err)
        })

        // Immediately call onSaved so parent can close the form — UX is fast because
        // optimistic item already appears in the list.
        onSaved?.()
      }
    } finally {
      setSaving(false)
    }
  }

  // compute similar items when name or description change (reads local cache)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lf_items")
      if (!raw) return setSimilar([])
      const items: Item[] = JSON.parse(raw)
      const q = (name + " " + description).toLowerCase().split(/\s+/).filter(Boolean)
      const matches = items
        .filter((it) => {
          const hay = (it.name + " " + (it.description || "")).toLowerCase()
          return q.some((t) => hay.includes(t))
        })
        .slice(0, 5)
      setSimilar(matches)
    } catch {
      setSimilar([])
    }
  }, [name, description])

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(val) => setType(val as ItemType)}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="found">Found</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Black Backpack" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Key features, brand, identifiers..."
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Library, Cafeteria..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(val) => setCategory(val as Category)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact">Contact Email</Label>
          <Input
            id="contact"
            type="email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="you@college.edu"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="image">Image</Label>
        <Input id="image" type="file" accept="image/*" onChange={(e) => onFileChange(e.target.files?.[0])} />
        {imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageDataUrl || "/placeholder.svg"}
            alt="Preview"
            className="mt-2 h-40 w-full rounded-md object-cover"
          />
        )}
        {similar.length > 0 && (
          <div className="mt-2 rounded border p-2">
            <div className="text-sm font-medium">Similar items on the site</div>
            <ul className="mt-2 text-sm">
              {similar.map((s) => (
                <li key={s.id} className="py-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.location} • {s.type}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving}>
        {initial?.id ? "Update Item" : "Add Item"}
      </Button>
    </form>
  )
}
