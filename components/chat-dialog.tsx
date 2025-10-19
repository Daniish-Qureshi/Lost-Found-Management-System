"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "./providers/auth-provider"
import { chatIdFor, listenToChatMessages, sendMessage } from "@/lib/firestore-client"
import { format } from "date-fns"

export default function ChatDialog({ open, onOpenChange, otherUserId, otherUserName, itemId, itemName }: { open: boolean; onOpenChange: (v: boolean) => void; otherUserId: string; otherUserName?: string; itemId?: string; itemName?: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const chatId = useMemo(() => {
    try {
      if (!user) return null
      return chatIdFor(user.id, otherUserId, itemId)
    } catch (e) {
      return null
    }
  }, [user, otherUserId, itemId])

  useEffect(() => {
    if (!chatId) return
    let unsub: (() => void) | null = null
    try {
      unsub = listenToChatMessages(chatId, (msgs: any[]) => setMessages(msgs))
    } catch (err) {
      // console.error(err)
    }
    return () => {
      try {
        if (typeof unsub === "function") unsub()
      } catch {}
    }
  }, [chatId])

  useEffect(() => {
    // scroll to bottom when messages change
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!user) return
    if (!text.trim()) return
    try {
      await sendMessage(chatId, user.id, text.trim(), { senderName: user.name, itemId: itemId || null, itemName: itemName || null })
      setText("")
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("sendMessage failed", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-sm font-semibold">Chat with {otherUserName || "User"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-96">
          <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-white">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground">No messages yet — say hello 👋</div>
            )}
            {messages.map((m: any) => {
              const mine = user && m.senderId === user.id
              const time = m.timestamp ? format(new Date(m.timestamp), "p, MMM d") : ""
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`${mine ? "bg-primary text-white" : "bg-gray-100 text-gray-900"} max-w-[80%] p-2 rounded-lg` }>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{m.senderName || (m.senderId === user?.id ? "You" : otherUserName)}</div>
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    {m.itemName && (
                      <div className="text-xs text-muted-foreground mt-1">on: {m.itemName}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 text-right">{time}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t bg-gray-50 flex items-center gap-2">
            <input
              aria-label="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
              placeholder="Write a message..."
            />
            <Button type="submit" size="sm">Send</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
