"use client"

import React, { useEffect, useState } from "react"
import type { Item, User } from "@/lib/types"
import { readItems, listenToItems, updateItemStatus, deleteItem as fsDeleteItem, addItem as fsAddItem } from "@/lib/firestore-client"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
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
        try { console.info("[admin] readItems returned", (list || []).length) } catch {}
        // merge with localStorage items so admin sees locally-saved entries too
        let merged = list || []
        try {
          const raw = localStorage.getItem("lf_items")
          const local = raw ? (JSON.parse(raw) as Item[]) : []
          // add any local items that are missing from Firestore (by id)
          const ids = new Set(merged.map((i) => i.id))
          for (const li of local) {
            if (!ids.has(li.id)) merged = [li, ...merged]
          }
        } catch (e) {
          // ignore parse errors
        }
        setItems(merged)
        try { console.info("[admin] merged items length", merged.length) } catch {}
        setLoading(false)
      })
      .catch(() => {})
    // load users from localStorage
    try {
      const raw = localStorage.getItem("lf_users")
      setUsers(raw ? (JSON.parse(raw) as User[]) : [])
    } catch {}
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

  // User moderation actions
  function refreshUsers() {
    try {
      const raw = localStorage.getItem("lf_users")
      setUsers(raw ? (JSON.parse(raw) as User[]) : [])
    } catch {}
  }

  function addStrike(userId: string) {
    const next = users.map((u) => {
      if (u.id !== userId) return u
      const strikes = (u.strikes || 0) + 1
      let blockedUntil = u.blockedUntil
      let isPermanentlyBlocked = u.isPermanentlyBlocked
      // if strikes reach 3 -> temporary 3-day block
      if (strikes >= 3 && !isPermanentlyBlocked) {
        const until = new Date()
        until.setDate(until.getDate() + 3)
        blockedUntil = until.toISOString()
      }
      // if strikes exceed 9 (3 chances) then permanent block
      if (strikes >= 9) {
        isPermanentlyBlocked = true
      }
      return { ...u, strikes, blockedUntil, isPermanentlyBlocked }
    })
    localStorage.setItem("lf_users", JSON.stringify(next))
    setUsers(next)
  }

  function clearStrikes(userId: string) {
    const next = users.map((u) => (u.id === userId ? { ...u, strikes: 0, blockedUntil: null } : u))
    localStorage.setItem("lf_users", JSON.stringify(next))
    setUsers(next)
  }

  function deleteUserAccount(userId: string) {
    if (!confirm("Delete this user account? This action cannot be undone.")) return
    const next = users.filter((u) => u.id !== userId)
    localStorage.setItem("lf_users", JSON.stringify(next))
    setUsers(next)
  }

  const pending = items.filter((i) => (i.status || "pending") === "pending")
  const approved = items.filter((i) => (i.status === "approved" || i.status === "active"))
  const rejected = items.filter((i) => i.status === "rejected")

  // compute local-only items for sync: items present in localStorage but not in Firestore
  function localOnlyItems(): Item[] {
    try {
      const raw = localStorage.getItem("lf_items")
      const local = raw ? (JSON.parse(raw) as Item[]) : []
      const ids = new Set(items.map((i) => i.id))
      return local.filter((li) => !ids.has(li.id))
    } catch {
      return []
    }
  }

  async function handleSyncLocal() {
    const missing = localOnlyItems()
    if (missing.length === 0) return
    if (!confirm(`Sync ${missing.length} local item(s) to Firestore?`)) return
    for (const m of missing) {
      try {
        // call Firestore add; the server will create a new doc id — we keep local id in payload
        await fsAddItem({ ...m, ownerId: m.ownerId, date: m.createdAt, status: m.status || "approved" })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("failed to sync item", m.id, e)
      }
    }
    // refresh list after a short delay to allow listener to pick up changes
    setTimeout(() => {
      readItems().then((list: any[]) => setItems(list)).catch(() => {})
    }, 1200)
  }

  const isAdmin = true // simple gate; keep as-is for now

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="text-sm text-muted-foreground">Manage pending items</p>

      <section className="mt-6">
        <h2 className="font-semibold">Pending ({pending.length})</h2>
        {pending.map((it) => (
          <div key={it.id} className="my-2 rounded border p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-20 h-14 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.imageUrl || it.imageDataUrl || "/no-image.png"} alt={it.name} className="w-full h-full object-cover" onError={(e) => {
                    try {
                      const src = (e.currentTarget && (e.currentTarget as HTMLImageElement).src) || "unknown"
                      // eslint-disable-next-line no-console
                      console.warn("[Admin] image failed to load:", src, "for item", it.id)
                      e.currentTarget.src = "/no-image.png"
                    } catch {}
                  }} />
                </div>
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.type} • {it.location}</div>
                </div>
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
        <div className="grid gap-3 mt-3">
          {users.map((u) => (
            <div key={u.id} className="rounded border p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name} <span className="text-xs text-muted-foreground">({u.email})</span></div>
                <div className="text-xs text-muted-foreground">Created: {new Date(u.createdAt).toLocaleString()}</div>
                <div className="text-xs">Strikes: {u.strikes || 0} {u.isPermanentlyBlocked ? "• Permanently blocked" : u.blockedUntil ? `• Blocked until ${new Date(u.blockedUntil).toLocaleString()}` : ""}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addStrike(u.id)}>Add strike</Button>
                <Button size="sm" variant="outline" onClick={() => clearStrikes(u.id)}>Clear strikes</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteUserAccount(u.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Approved ({approved.length})</h2>
        {approved.map((it) => (
          <div key={it.id} className="my-2 rounded border p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-20 h-14 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.imageUrl || it.imageDataUrl || "/no-image.png"} alt={it.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.type} • {it.location}</div>
                </div>
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
              <div className="flex items-center gap-3">
                <div className="w-20 h-14 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.imageUrl || it.imageDataUrl || "/no-image.png"} alt={it.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.type} • {it.location}</div>
                </div>
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
