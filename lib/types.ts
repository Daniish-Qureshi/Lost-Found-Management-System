export type Category = "Electronics" | "Books" | "ID Cards" | "Clothing" | "Bags & Backpacks" | "Accessories" | "Stationery" | "Sports Equipment" | "Others"
export type ItemType = "lost" | "found"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  favorites: string[] // item ids
  // Optional base64 data URL for avatar/profile image (stored in localStorage)
  avatarDataUrl?: string
  // Moderation fields
  strikes?: number
  // ISO string of date until the account is blocked (temporary block)
  blockedUntil?: string | null
  // When true, user is permanently blocked
  isPermanentlyBlocked?: boolean
  // Simple in-app notifications for the user (stored locally)
  notifications?: { id: string; title: string; body?: string; createdAt: string; read?: boolean }[]
  createdAt: string
}

export interface Item {
  id: string
  ownerId: string
  type: ItemType
  name: string
  description: string
  location: string
  date: string // ISO
  category: Category
  contact: string // email or phone
  imageDataUrl?: string
  resolved: boolean
  createdAt: string
  updatedAt: string
  // Optional metadata
  size?: string
  color?: string
  brand?: string
  contactPhone?: string
  poster?: {
    name?: string
    collegeId?: string
    roll?: string
    course?: string
    year?: string
  }
  // moderation status
  status?: "pending" | "approved" | "rejected"
}
