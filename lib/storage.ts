"use client"

import type { Item, User } from "./types"

const USERS_KEY = "lf_users"
const ITEMS_KEY = "lf_items"
const SESSION_KEY = "lf_session"

export function readUsers(): User[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

export function writeUsers(users: User[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function readItems(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEMS_KEY)
    return raw ? (JSON.parse(raw) as Item[]) : []
  } catch {
    return []
  }
}

export function writeItems(items: Item[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
}

export function readSession(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SESSION_KEY)
}

export function writeSession(userId: string | null) {
  if (typeof window === "undefined") return
  if (userId) localStorage.setItem(SESSION_KEY, userId)
  else localStorage.removeItem(SESSION_KEY)
}
