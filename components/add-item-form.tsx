"use client"

import type React from "react"

import { useState } from "react"
import type { ItemType, Category, Item } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useAuth } from "./providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

const categories: Category[] = ["Electronics", "Books", "ID Cards", "Clothing", "Bags & Backpacks", "Accessories", "Stationery", "Sports Equipment", "Others"]


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
        const id = await addItem({ type, name, description, location, date, category, contact, imageDataUrl } as any)
        if (!id) return
      }
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

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
      </div>

      <Button type="submit" disabled={saving}>
        {initial?.id ? "Update Item" : "Add Item"}
      </Button>
    </form>
  )
}
