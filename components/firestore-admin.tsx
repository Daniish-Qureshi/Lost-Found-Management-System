"use client"

import React, { useEffect, useState } from "react"
import { addItem, deleteItem, listenToItems, readItems } from "@/lib/firestore-client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function FirestoreAdmin() {
  const [name, setName] = useState("")
  const [type, setType] = useState("lost")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [delId, setDelId] = useState("")
  const [items, setItems] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    let unsub: (() => void) | null = null
    try {
      unsub = listenToItems((list: any[]) => setItems(list))
    } catch (err: any) {
      console.error(err)
    }
    // initial read as fallback
    readItems().then((list) => setItems(list)).catch(() => {})
    return () => {
      if (typeof unsub === "function") unsub()
    }
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Background add for quick admin UX
      addItem({ name, type, location, date }).then(() => {
        toast({ title: "Item added" })
      }).catch((err: any) => {
        console.error(err)
        toast({ title: "Add failed", description: (err && err.message) || String(err), variant: "destructive" })
      })
      setName("")
      setLocation("")
      setDate(new Date().toISOString().slice(0, 10))
    } catch (err: any) {
      console.error(err)
      toast({ title: "Add failed", description: (err && err.message) || String(err), variant: "destructive" })
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    try {
      await deleteItem(delId)
      setDelId("")
      toast({ title: "Item deleted" })
    } catch (err: any) {
      console.error(err)
      toast({ title: "Delete failed", description: (err && err.message) || String(err), variant: "destructive" })
    }
  }

  return (
    <div className="rounded-lg border p-4 mt-6">
      <h3 className="mb-3 text-lg font-semibold">Firestore Admin (dev)</h3>
      <form className="grid gap-2" onSubmit={handleAdd}>
        <div className="grid gap-1">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid gap-1">
          <Label>Type</Label>
          <select className="rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Add Item</Button>
        </div>
      </form>

      <hr className="my-4" />

      <form className="grid gap-2" onSubmit={handleDelete}>
        <Label>Delete by ID</Label>
        <Input value={delId} onChange={(e) => setDelId(e.target.value)} placeholder="document id" />
        <div className="flex gap-2">
          <Button type="submit" variant="destructive">Delete</Button>
        </div>
      </form>

      <hr className="my-4" />

      <h4 className="mb-2 font-medium">Realtime Items</h4>
      <div className="space-y-2 max-h-72 overflow-auto">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded border p-2 flex items-center gap-3">
            <div className="w-16 h-12 overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl || it.imageDataUrl || "/no-image.png"} alt={it.name} className="w-full h-full object-cover" onError={(e) => {
                try {
                  const src = (e.currentTarget && (e.currentTarget as HTMLImageElement).src) || "unknown"
                  // eslint-disable-next-line no-console
                  console.warn("[AdminRealtime] image failed to load:", src, "for item", it.id)
                  e.currentTarget.src = "/no-image.png"
                } catch {}
              }} />
            </div>
            <div className="flex-1">
              <div className="text-sm"><strong>{it.name}</strong> — {it.type} — {it.location} — {it.date}</div>
              <div className="text-xs text-muted-foreground">ID: {it.id}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
