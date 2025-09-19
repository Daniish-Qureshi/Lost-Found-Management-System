"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { readItems, readSession, readUsers, writeItems, writeSession, writeUsers } from "@/lib/storage"
import type { Item, User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

type AuthContextType = {
  user: User | null
  users: User[]
  items: Item[]
  register: (name: string, email: string, password: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void

  updateProfile: (data: { name?: string; email?: string }) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  deleteAccount: () => Promise<void>

  addItem: (data: Omit<Item, "id" | "ownerId" | "resolved" | "createdAt" | "updatedAt">) => Promise<string | null>
  updateItem: (id: string, data: Partial<Item>) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  toggleResolved: (id: string) => Promise<boolean>

  toggleFavorite: (itemId: string) => void
  clearItems: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [user, setUser] = useState<User | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const skipWriteRef = useRef(false)

  // Initialize from localStorage
  useEffect(() => {
    const u = readUsers()
    const it = readItems()
    setUsers(u)
    setItems(it)
    const sessionId = readSession()
    if (sessionId) {
      const current = u.find((x) => x.id === sessionId) || null
      setUser(current)
    }
  }, [])

  // Persist on change
  useEffect(() => {
    writeUsers(users)
  }, [users])

  useEffect(() => {
    // Allow skipping the next write when clearing items explicitly
    if (skipWriteRef.current) {
      skipWriteRef.current = false
      return
    }
    writeItems(items)
  }, [items])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase())
      if (exists) {
        toast({ title: "Registration failed", description: "Email already registered", variant: "destructive" })
        return false
      }
      const id = crypto.randomUUID()
      const passwordHash = await hashPassword(password)
      const newUser: User = {
        id,
        name,
        email,
        passwordHash,
        favorites: [],
        createdAt: new Date().toISOString(),
      }
      const next = [...users, newUser]
      setUsers(next)
      setUser(newUser)
      writeSession(id)
      toast({ title: "Welcome!", description: "Account created successfully." })
      return true
    },
    [users, toast],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase())
      if (!u) {
        toast({ title: "Login failed", description: "User not found", variant: "destructive" })
        return false
      }
      const hash = await hashPassword(password)
      if (u.passwordHash !== hash) {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" })
        return false
      }
      setUser(u)
      writeSession(u.id)
      toast({ title: "Logged in", description: `Welcome back, ${u.name}` })
      return true
    },
    [users, toast],
  )

  const logout = useCallback(() => {
    setUser(null)
    writeSession(null)
    toast({ title: "Logged out" })
    router.push("/")
  }, [router, toast])

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string }) => {
      if (!user) return
      const updated: User = { ...user, ...data }
      const next = users.map((u) => (u.id === user.id ? updated : u))
      setUsers(next)
      setUser(updated)
      toast({ title: "Profile updated" })
    },
    [user, users, toast],
  )

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!user) return false
      const oldHash = await hashPassword(oldPassword)
      if (user.passwordHash !== oldHash) {
        toast({ title: "Password change failed", description: "Old password incorrect", variant: "destructive" })
        return false
      }
      const newHash = await hashPassword(newPassword)
      const updated: User = { ...user, passwordHash: newHash }
      const next = users.map((u) => (u.id === user.id ? updated : u))
      setUsers(next)
      setUser(updated)
      toast({ title: "Password updated" })
      return true
    },
    [user, users, toast],
  )

  const deleteAccount = useCallback(async () => {
    if (!user) return
    // Remove user's items
    setItems((prev) => prev.filter((i) => i.ownerId !== user.id))
    // Remove user
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    setUser(null)
    writeSession(null)
    toast({ title: "Account deleted" })
    router.push("/")
  }, [user, toast, router])

  const clearItems = useCallback(() => {
    // Prevent the writeItems effect from immediately re-creating the key
    skipWriteRef.current = true
    setItems([])
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("lf_items")
      } catch {}
    }
    toast({ title: "All items cleared" })
  }, [toast])

  const addItem = useCallback(
    async (data: Omit<Item, "id" | "ownerId" | "resolved" | "createdAt" | "updatedAt">) => {
      if (!user) {
        toast({ title: "Not authorized", description: "Please log in to add items", variant: "destructive" })
        return null
      }
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const newItem: Item = {
        ...data,
        id,
        ownerId: user.id,
        resolved: false,
        createdAt: now,
        updatedAt: now,
      }
      setItems((prev) => [newItem, ...prev])
      toast({ title: "Item added", description: `${data.type === "lost" ? "Lost" : "Found"} item created.` })
      return id
    },
    [user, toast],
  )

  const updateItem = useCallback(
    async (id: string, data: Partial<Item>) => {
      let ok = false
      setItems((prev) => {
        const next = prev.map((i) => {
          if (i.id === id) {
            ok = true
            return { ...i, ...data, updatedAt: new Date().toISOString() }
          }
          return i
        })
        return next
      })
      if (ok) toast({ title: "Item updated" })
      return ok
    },
    [toast],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      let existed = false
      setItems((prev) => {
        const before = prev.length
        const next = prev.filter((i) => i.id !== id)
        existed = next.length !== before
        return next
      })
      if (existed) toast({ title: "Item deleted" })
      return existed
    },
    [toast],
  )

  const toggleResolved = useCallback(
    async (id: string) => {
      let ok = false
      setItems((prev) => {
        const next = prev.map((i) => {
          if (i.id === id) {
            ok = true
            return { ...i, resolved: !i.resolved, updatedAt: new Date().toISOString() }
          }
          return i
        })
        return next
      })
      if (ok) toast({ title: "Status updated" })
      return ok
    },
    [toast],
  )

  const toggleFavorite = useCallback(
    (itemId: string) => {
      if (!user) return
      const updated: User = {
        ...user,
        favorites: user.favorites.includes(itemId)
          ? user.favorites.filter((id) => id !== itemId)
          : [...user.favorites, itemId],
      }
      setUser(updated)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    },
    [user],
  )

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      users,
      items,
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      addItem,
      updateItem,
      deleteItem,
      toggleResolved,
      toggleFavorite,
      clearItems,
    }),
    [
      user,
      users,
      items,
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      addItem,
      updateItem,
      deleteItem,
      toggleResolved,
      toggleFavorite,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
