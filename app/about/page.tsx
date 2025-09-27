"use client"

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">About Lost&Found</h1>
      <section className="mt-4 space-y-4">
        <p>
          This project is a lightweight Lost & Found management system for students. It allows users to register, post
          lost or found items, contact posters, and for admins to moderate submissions. The app was built with Next.js and
          a small Firebase-backed realtime store for items.
        </p>
        <h2 className="text-lg font-semibold">Features</h2>
        <ul className="list-disc pl-6">
          <li>User registration and profile</li>
          <li>Post lost/found items with images</li>
          <li>Admin moderation (approve/reject/delete)</li>
          <li>Realtime updates across devices (Firestore)</li>
          <li>Simple spam protections and account blocking</li>
        </ul>
        <h2 className="text-lg font-semibold">How data is stored</h2>
        <p>
          User accounts and app state are stored locally in localStorage for simplicity. Items are mirrored to Firestore
          so they can be synced across devices. Profile images are stored as data URLs in localStorage by default; for
          cross-device profile images we recommend using Firebase Storage.
        </p>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For questions or feedback, use the contact form. Admins can be reached via the admin panel.
        </p>
      </section>
    </main>
  )
}
