"use client"

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">🧭 Lost &amp; Found Management System</h1>
      <section className="mt-4 space-y-4 text-sm">
        <p>
          The Lost &amp; Found Management System is a smart, AI-integrated web and mobile platform built to help users
          easily report, search, and recover lost or found items in a fast, secure, and reliable way.
        </p>
        <p>
          Originally developed for college and university students, the platform is now open for public use, making it a
          community-driven system for anyone who loses or finds something valuable.
        </p>

        <h2 className="text-lg font-semibold">💡 Problem Statement</h2>
        <p>
          Every day, countless belongings like ID cards, wallets, phones, and documents are lost, but most remain
          unrecovered due to the lack of a structured communication system. This project solves that problem by
          providing a centralized online platform where users can report, track, and connect directly — ensuring lost
          items reach their rightful owners.
        </p>

        <h2 className="text-lg font-semibold">⚙️ Technologies Used</h2>
        <ul className="list-disc pl-6">
          <li>Frontend: Next.js (React Framework)</li>
          <li>Backend &amp; Database: Firebase + Firestore</li>
          <li>Styling: Tailwind CSS</li>
          <li>Email &amp; Authentication: EmailJS + Firebase Auth</li>
          <li>AI &amp; Communication: TensorFlow (AI Matching) + Real-time Chat System</li>
        </ul>

        <h2 className="text-lg font-semibold">✨ Key Features</h2>
        <ul className="list-disc pl-6">
          <li>Secure User Registration, Login &amp; Email Verification</li>
          <li>Forgot / Reset Password functionality</li>
          <li>Post Lost or Found items with image and detailed description</li>
          <li>AI-powered matching system that auto-suggests similar lost/found reports</li>
          <li>Real-time Chat System for direct communication between users</li>
          <li>Admin Dashboard to manage and approve posts</li>
          <li>Push Notifications for instant item updates and messages</li>
          <li>Mobile App Version (PWA + Play Store) for easy access anywhere</li>
          <li>Professional UI/UX design built with Tailwind CSS</li>
        </ul>

        <h2 className="text-lg font-semibold">🎯 Conclusion</h2>
        <p>
          The Lost &amp; Found Management System is a modern, secure, and user-friendly platform that brings technology
          and community together to solve real-world problems. With its integration of AI, chat, admin control, and
          mobile accessibility, the project stands as a complete digital solution for reconnecting people with their
          lost belongings efficiently and ethically.
        </p>
      </section>
    </main>
  )
}
