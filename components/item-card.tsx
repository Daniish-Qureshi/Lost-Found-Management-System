"use client"
import type { Item } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "./providers/auth-provider"
import { Heart, Pencil, Trash2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"

// small helper to display relative time
function timeAgo(isoDateOrString?: string) {
  if (!isoDateOrString) return "some time ago"
  const then = new Date(isoDateOrString)
  if (isNaN(then.getTime())) return "some time ago"
  const diff = Date.now() - then.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hrs = Math.floor(min / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hrs > 0) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  if (min > 0) return `${min} minute${min > 1 ? "s" : ""} ago`
  return `${sec} second${sec > 1 ? "s" : ""} ago`
}

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleResolved,
  showOwnerActions = false,
}: {
  item: Item
  onEdit?: (item: Item) => void
  onDelete?: (id: string) => void
  onToggleResolved?: (id: string) => void
  showOwnerActions?: boolean
}) {
  const { user, toggleFavorite } = useAuth()
  const isFavorite = !!user?.favorites.includes(item.id)
  const isOwner = user?.id === item.ownerId
  const [open, setOpen] = useState(false)

  return (
      <Card className={cn(item.resolved && "opacity-80 relative")}>
        {/* status badge */}
        <div className="absolute top-2 right-2">
          {item.status === "approved" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
          )}
          {item.status === "rejected" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>
          )}
          {(!item.status || item.status === "pending") && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>
          )}
        </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <CardHeader>
          <div className="flex items-start justify-between w-full gap-3">
            <div className="flex-1 min-w-0">
              <button
                type="button"
                className="hover:underline truncate max-w-full text-left text-base font-semibold"
                onClick={() => setOpen(true)}
                aria-label={`Open details for ${item.name}`}
              >
                {item.name}
              </button>
              <div className="mt-1 text-sm text-muted-foreground">
                {/* Time since posted */}
                {item.createdAt ? (
                  <span>Posted {timeAgo(item.createdAt)}</span>
                ) : (
                  <span>Posted {item.date ? timeAgo(item.date) : "Recently"}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status badge: Lost (red) / Found (green) */}
              <Badge className={item.type === "lost" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                {item.type === "lost" ? "Lost" : "Found"}
              </Badge>
              <Badge variant="secondary">{item.category}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <button
            type="button"
            className="relative w-full overflow-hidden rounded-md bg-muted h-40 md:h-56"
            onClick={() => setOpen(true)}
            aria-label="Open item details"
          >
            {item.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageDataUrl || "/no-image.png"}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/no-image.png" alt="" className="h-full w-full object-cover" />
            )}
          </button>
          <p className="text-sm text-muted-foreground">{item.description}</p>

          {/* Optional condition/details: size, color, brand */}
          {(item.size || item.color || item.brand) && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              {item.size && (
                <div>
                  <span className="font-medium">Size:</span> {item.size}
                </div>
              )}
              {item.color && (
                <div>
                  <span className="font-medium">Color:</span> {item.color}
                </div>
              )}
              {item.brand && (
                <div>
                  <span className="font-medium">Brand:</span> {item.brand}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Location:</span> {item.location}
            </div>
            <div>
              <span className="font-medium">Date:</span> {new Date(item.date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Type:</span> {item.type}
            </div>
            <div>
              <span className="font-medium">Contact:</span>{" "}
              <div className="flex flex-col">
                {item.contact && (
                  <a className="text-primary hover:underline break-words max-w-full" href={`mailto:${item.contact}`}>
                    {item.contact}
                  </a>
                )}
                {item.contactPhone && (
                  <a className="text-primary hover:underline break-words max-w-full" href={`tel:${item.contactPhone}`}>
                    {item.contactPhone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Poster / Posted by info (if present) */}
          {item.poster && (
            <div className="mt-2 rounded border p-2 text-sm">
              <div className="font-medium">Posted by</div>
              <div className="text-sm text-muted-foreground">{item.poster.name}</div>
              <div className="text-xs text-muted-foreground">{item.poster.collegeId || item.poster.roll}</div>
              <div className="text-xs text-muted-foreground">{item.poster.course} • {item.poster.year}</div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <Button
            variant={isFavorite ? "default" : "outline"}
            size="sm"
            onClick={() => user && toggleFavorite(item.id)}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("mr-2 h-4 w-4", isFavorite && "fill-current")} />
            {isFavorite ? "Favorited" : "Favorite"}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {showOwnerActions && isOwner && (
              <>
                <Button size="sm" variant="outline" onClick={() => onEdit?.(item)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete?.(item.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => onToggleResolved?.(item.id)}
                  variant={item.resolved ? "secondary" : "default"}
                >
                  <CheckCircle2 className="mr-2 h-2 w-2" /> {item.resolved ? "Unresolve" : "Mark Resolved"}
                </Button>
              </>
            )}
          </div>
        </CardFooter>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-pretty">{item.name}</DialogTitle>
            <DialogDescription>
              {item.type === "lost" ? "Lost item details" : "Found item details"} • {item.category}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative w-full overflow-hidden rounded-md bg-muted h-56 md:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageDataUrl || "/no-image.png"}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Location:</span> {item.location}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(item.date).toLocaleDateString()}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Contact:</span>{" "}
                <a className="text-primary hover:underline break-words max-w-full" href={`mailto:${item.contact}`}>
                  {item.contact}
                </a>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
