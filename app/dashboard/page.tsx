"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers/auth-provider"
import { ItemCard } from "@/components/item-card"
import { AddItemForm } from "@/components/add-item-form"
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"

type TabVal = "my" | "add" | "profile"
function tabFromParams(params: URLSearchParams): TabVal {
  const tab = params.get("tab")
  const legacyType = params.get("type")
  if (tab === "add-item" || legacyType === "found") return "add"
  if (tab === "profile") return "profile"
  return "my"
}
function tabToParam(tab: TabVal): string {
  if (tab === "add") return "add-item"
  if (tab === "profile") return "profile"
  return "my-items"
}

export default function DashboardPage() {
  const { user, items, updateItem, deleteItem, toggleResolved, updateProfile, changePassword, deleteAccount } =
    useAuth()

  // My items belong to the current user's `id` (not `uid`) in the app's user model
  const myItems = useMemo(() => items.filter((i) => i.ownerId === user?.id), [items, user?.id])

  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarDataUrl)
  const [oldPass, setOldPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const params = useSearchParams()
  const router = useRouter()

  const [tab, setTab] = useState<TabVal>(() => tabFromParams(params as unknown as URLSearchParams))
  useEffect(() => {
    // keep URL synced when tab state changes
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tabToParam(tab))
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false })
  }, [tab, router])

  return (
    <div>
      <Navbar />
      <ProtectedRoute>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabVal)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my">My Items</TabsTrigger>
              <TabsTrigger value="add">Add Item</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* My Items Tab */}
            <TabsContent value="my" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {myItems.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
                {myItems.map((item) =>
                  editing === item.id ? (
                    <div key={item.id} className="rounded-lg border p-4">
                      <p className="mb-2 text-sm font-medium">Edit: {item.name}</p>
                      <AddItemForm initial={item} onSaved={() => setEditing(null)} />
                      <Button className="mt-2 bg-transparent" variant="outline" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <ItemCard
                      key={item.id}
                      item={item}
                      showOwnerActions
                      onEdit={() => setEditing(item.id)}
                      onDelete={deleteItem}
                      onToggleResolved={toggleResolved}
                    />
                  ),
                )}
              </div>
            </TabsContent>

            {/* Add Item Tab */}
            <TabsContent value="add" className="mt-6">
              <div className="mx-auto max-w-2xl rounded-lg border p-4">
                <AddItemForm />
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h2 className="mb-4 text-lg font-semibold">Edit Profile</h2>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="avatar">Profile Image</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 overflow-hidden rounded-full border">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">No image</div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files && e.target.files[0]
                              if (!f) return
                              const reader = new FileReader()
                              reader.onload = () => setAvatarPreview(reader.result as string)
                              reader.readAsDataURL(f)
                            }}
                          />
                          <div className="text-sm text-muted-foreground">Max ~1MB recommended</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <Button onClick={() => updateProfile({ name, email, avatarDataUrl: avatarPreview })}>
                      Save
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h2 className="mb-4 text-lg font-semibold">Change Password</h2>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="old">Old Password</Label>
                      <Input id="old" type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new">New Password</Label>
                      <Input id="new" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                    </div>
                    <Button onClick={() => oldPass && newPass && changePassword(oldPass, newPass)}>
                      Update Password
                    </Button>
                  </div>
                  <div className="mt-6">
                    <Button variant="destructive" onClick={() => deleteAccount()}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </ProtectedRoute>
      <Footer />
    </div>
  )
}
