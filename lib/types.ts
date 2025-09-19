export type Category = "Electronics" | "Books" | "ID Cards" | "Clothing" | "Bags & Backpacks" | "Accessories" | "Stationery" | "Sports Equipment" | "Others"
export type ItemType = "lost" | "found"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  favorites: string[] // item ids
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
}
