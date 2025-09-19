"use client"

import { useRouter } from "next/navigation"
const router = useRouter()

function goToContact() {
  // normalize any bad value to the correct route
  router.push("/contact")
}

// ... rest of code here ...
