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
    <Card className={cn(item.resolved && "opacity-80")}>
      <Dialog open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-pretty">
            <button
              type="button"
              className="text-left hover:underline truncate max-w-full text-left"
              onClick={() => setOpen(true)}
              aria-label={`Open details for ${item.name}`}
            >
              {item.name}
            </button>
            <Badge variant="secondary">{item.category}</Badge>
          </CardTitle>
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
                src={item.imageDataUrl || "/placeholder.svg?height=320&width=480&query=item"}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/missing-image.png" alt="" className="h-full w-full object-cover" />
            )}
          </button>
          <p className="text-sm text-muted-foreground">{item.description}</p>
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
              <a className="text-primary hover:underline" href={`mailto:${item.contact}`}>
                {item.contact}
              </a>
            </div>
          </div>
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
                src={item.imageDataUrl || "/placeholder.svg?height=360&width=640&query=item details"}
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
                <a className="text-primary hover:underline" href={`mailto:${item.contact}`}>
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
