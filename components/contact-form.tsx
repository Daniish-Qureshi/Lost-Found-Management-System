"use client"

import type React from "react"
import { useState } from "react"
import emailjs from "@emailjs/browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    const toEmail = process.env.NEXT_PUBLIC_CONTACT_TO || "danishwork29@gmail.com"

    // Ensure the EmailJS client is initialized with the public key so errors are clearer
    try {
      if (publicKey && typeof emailjs.init === "function") {
        // init is idempotent — calling repeatedly is safe
        // @ts-ignore - emailjs types are forgiving here
        emailjs.init(publicKey)
      }
    } catch (initErr) {
      console.warn("EmailJS init warning:", initErr)
    }

    if (!serviceId || !templateId || !publicKey) {
      toast({ title: "Email not configured", description: "EmailJS keys are missing (NEXT_PUBLIC_*).", variant: "destructive" })
      setLoading(false)
      return
    }

    try {
      const templateParams = {
        from_name: name,
        from_email: email,
        message,
        to_email: toEmail,
      }

      const res = await emailjs.send(serviceId, templateId, templateParams, publicKey)

      // emailjs-browser typically returns an object like { status: 200, text: 'OK' }
      if (!res || res?.status !== 200) {
        console.error("EmailJS unexpected response:", res)
        toast({ title: "Failed to send", description: "Email provider returned an unexpected response.", variant: "destructive" })
      } else {
        toast({ title: "Message sent", description: "We will get back to you soon." })
        setName("")
        setEmail("")
        setMessage("")
        setTimeout(() => router.push("/"), 900)
      }
      setName("")
      setEmail("")
      setMessage("")
      setTimeout(() => router.push("/"), 900)
    } catch (err: any) {
      // Show more helpful console info for debugging
      try {
        // err can be an object from the network layer — surface common fields
        const status = (err && (err as any).status) || (err && (err as any).statusCode)
        const text = (err && (err as any).text) || (err && (err as any).response) || JSON.stringify(err)
        console.error("EmailJS client error:", { err, status, text })
        const desc = status ? `Status ${status}: ${text}` : (err?.message || text || "Please try again later.")
        toast({ title: "Failed to send", description: desc, variant: "destructive" })
      } catch (logErr) {
        console.error("Error logging EmailJS failure:", logErr)
        toast({ title: "Failed to send", description: "Please try again later.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  )
}
