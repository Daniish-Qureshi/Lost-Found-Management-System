"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"

export default function ContactPage() {
  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">Contact Us</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Send a message about a lost or found item. We&apos;ll get back to you shortly.
        </p>
        <div className="rounded-lg border p-4">
          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
