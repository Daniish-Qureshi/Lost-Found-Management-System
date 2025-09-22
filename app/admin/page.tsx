"use client"

import React, { useEffect, useState } from "react"
import type { Item } from "@/lib/types"
import { readItems, listenToItems, updateItemStatus, deleteItem as fsDeleteItem } from "@/lib/firestore-client"
import { Button } from "@/components/ui/button"

export default function AdminPanel() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub: (() => void) | null = null
    try {
      unsub = listenToItems((list: any[]) => {
        setItems(list)
        setLoading(false)
      })
    } catch (e) {
      console.error(e)
    }
    readItems()
      .then((list: any[]) => {
        setItems(list)
        setLoading(false)
      })
      .catch(() => {})
    return () => {
      if (typeof unsub === "function") unsub()
    }
  }, [])

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateItemStatus(id, status)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item permanently?")) return
    try {
      await fsDeleteItem(id)
    } catch (e) {
      console.error(e)
    }
  }

  const pending = items.filter((i) => (i.status || "pending") === "pending")
  const approved = items.filter((i) => i.status === "approved")
  const rejected = items.filter((i) => i.status === "rejected")

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="text-sm text-muted-foreground">Manage pending items</p>

      <section className="mt-6">
        <h2 className="font-semibold">Pending ({pending.length})</h2>
        {pending.map((it) => (
          <div key={it.id} className="my-2 rounded border p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.type} • {it.location}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleStatus(it.id, "approved")}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatus(it.id, "rejected")}>Reject</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(it.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Approved ({approved.length})</h2>
        {approved.map((it) => (
          <div key={it.id} className="my-2 rounded border p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.type} • {it.location}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => handleStatus(it.id, "rejected")}>Reject</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(it.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Rejected ({rejected.length})</h2>
        {rejected.map((it) => (
          <div key={it.id} className="my-2 rounded border p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.type} • {it.location}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleStatus(it.id, "approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(it.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
