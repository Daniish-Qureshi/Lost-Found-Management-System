// Firestore client utilities (ES6)
import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB5W49RWXOiPfcukUDAmOUqz3KFo3sY8qw",
  authDomain: "lost-found-portal-985c1.firebaseapp.com",
  projectId: "lost-found-portal-985c1",
  storageBucket: "lost-found-portal-985c1.firebasestorage.app",
  messagingSenderId: "305248670862",
  appId: "1:305248670862:web:a2c34d987f41b0f38525df",
  measurementId: "G-LFX4M69HSF",
}

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getFirestore(app)

// Collection reference
const itemsCollection = () => collection(db, "items")

// Dev-only logs to help debugging across devices
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("[firestore-client] firebaseConfig.projectId:", firebaseConfig.projectId)
}

// Add item
export async function addItem(payload) {
  // payload can contain arbitrary item fields (name, type, location, date, ownerId, etc.)
  const data = {
    ...payload,
    date: payload?.date || new Date().toISOString(),
    // default status to 'approved' unless caller set otherwise
    status: payload?.status || "approved",
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(itemsCollection(), data)
  return { id: ref.id }
}

// Delete item
export async function deleteItem(id) {
  if (!id) throw new Error("Missing document id")
  await deleteDoc(doc(db, "items", id))
  return { ok: true }
}

export async function readItems() {
  const q = query(itemsCollection(), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const raw = { id: d.id, ...d.data() }
    if (raw.createdAt && typeof raw.createdAt.toDate === "function") {
      try { raw.createdAt = raw.createdAt.toDate().toISOString() } catch {}
    }
    if (raw.updatedAt && typeof raw.updatedAt.toDate === "function") {
      try { raw.updatedAt = raw.updatedAt.toDate().toISOString() } catch {}
    }
    return raw
  })
}

// Update item status (approve/reject)
export async function updateItemStatus(id, status) {
  if (!id) throw new Error("Missing document id")
  const ref = doc(db, "items", id)
  await setDoc(ref, { status, updatedAt: serverTimestamp() }, { merge: true })
  return { ok: true }
}

// Real-time listener
export function listenToItems(onChange) {
  const q = query(itemsCollection(), orderBy("createdAt", "desc"))
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const raw = { id: d.id, ...d.data() }
        // Normalize Firestore Timestamp fields to ISO strings if present
        if (raw.createdAt && typeof raw.createdAt.toDate === "function") {
          try {
            raw.createdAt = raw.createdAt.toDate().toISOString()
          } catch (e) {
            // leave as-is on error
          }
        }
        if (raw.updatedAt && typeof raw.updatedAt.toDate === "function") {
          try {
            raw.updatedAt = raw.updatedAt.toDate().toISOString()
          } catch (e) {
            // leave as-is on error
          }
        }
        return raw
      })
      if (typeof onChange === "function") onChange(items)
    },
    (err) => {
      // propagate or log
      // eslint-disable-next-line no-console
      console.error("listenToItems snapshot error:", err)
    },
  )
  return unsub
}
