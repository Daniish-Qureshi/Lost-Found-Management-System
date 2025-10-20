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
  increment,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Firebase config - keep this in sync with your Firebase Console web app
const firebaseConfig = {
  apiKey: "AIzaSyBMmjLQGF25p-jhTV22c-zkSBgR_ZkfYL8",
  authDomain: "lost-and-found-portal-985c1.firebaseapp.com",
  projectId: "lost-found-portal-985c1",
  storageBucket: "lost-found-portal-985c1.firebasestorage.app",
  messagingSenderId: "305248670862",
  appId: "1:305248670862:web:a2c34d987f41b0f38525df",
  measurementId: "G-LFX4M69HSF",
}

// Initialize Firebase app (idempotent)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getFirestore(app)

// Collection reference helper
const itemsCollection = () => collection(db, "items")

// Dev-only logs
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("[firestore-client] firebaseConfig.projectId:", firebaseConfig.projectId)
}

// Add item
export async function addItem(payload) {
  // Prefer Firebase Auth uid as ownerId when available
  let ownerId = payload?.ownerId
  try {
    const auth = getAuth()
    if (auth && auth.currentUser && auth.currentUser.uid) ownerId = auth.currentUser.uid
  } catch {}

  const raw = {
    ...payload,
    ownerId,
    date: payload?.date || new Date().toISOString(),
    status: payload?.status || "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const data = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined))
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

export async function updateItemStatus(id, status) {
  if (!id) throw new Error("Missing document id")
  const ref = doc(db, "items", id)
  await setDoc(ref, { status, updatedAt: serverTimestamp() }, { merge: true })
  return { ok: true }
}

export function listenToItems(onChange) {
  const q = query(itemsCollection(), orderBy("createdAt", "desc"))
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const raw = { id: d.id, ...d.data() }
        if (raw.createdAt && typeof raw.createdAt.toDate === "function") {
          try { raw.createdAt = raw.createdAt.toDate().toISOString() } catch {}
        }
        if (raw.updatedAt && typeof raw.updatedAt.toDate === "function") {
          try { raw.updatedAt = raw.updatedAt.toDate().toISOString() } catch {}
        }
        return raw
      })
      if (typeof onChange === "function") onChange(items)
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error("listenToItems snapshot error:", err)
    },
  )
  return unsub
}

// Chat helpers
export function chatIdFor(userA, userB, itemId) {
  if (!userA || !userB) throw new Error("Missing user ids for chatId")
  const pair = [userA, userB].sort().join("_")
  if (itemId) return `chat_${itemId}_${pair}`
  return `chat_${pair}`
}

export async function sendMessage(chatId, senderId, text, extra = {}) {
  if (!chatId) throw new Error("Missing chatId")
  if (!senderId) throw new Error("Missing senderId")
  if (!text || typeof text !== "string") throw new Error("Missing text")
  const messagesRef = collection(db, "chats", chatId, "messages")
  const payload = { senderId, text, timestamp: serverTimestamp(), ...extra }
  const docRef = await addDoc(messagesRef, payload)

  try {
    const recipientId = extra?.recipientId
    const itemId = extra?.itemId
    if (recipientId && itemId) {
      const notifRef = doc(db, "notifications", recipientId, "items", itemId)
      await setDoc(notifRef, { count: increment(1), lastMessage: text, senderId, senderName: extra?.senderName || null, updatedAt: serverTimestamp() }, { merge: true })
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("updateNotification failed:", e)
  }
  return { id: docRef.id }
}

export async function clearNotificationForUserItem(userId, itemId) {
  if (!userId || !itemId) throw new Error("Missing args for clearNotificationForUserItem")
  const notifRef = doc(db, "notifications", userId, "items", itemId)
  await setDoc(notifRef, { count: 0, updatedAt: serverTimestamp() }, { merge: true })
}

export function listenToNotification(userId, itemId, onChange) {
  if (!userId || !itemId) throw new Error("Missing args for listenToNotification")
  const ref = doc(db, "notifications", userId, "items", itemId)
  const unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      if (typeof onChange === "function") onChange(null)
      return
    }
    const data = { id: snap.id, ...snap.data() }
    if (typeof onChange === "function") onChange(data)
  }, (err) => {
    // eslint-disable-next-line no-console
    console.error("listenToNotification error:", err)
  })
  return unsub
}

export function listenToChatMessages(chatId, onChange) {
  if (!chatId) throw new Error("Missing chatId for listenToChatMessages")
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((d) => {
        const raw = { id: d.id, ...d.data() }
        if (raw.timestamp && typeof raw.timestamp.toDate === "function") {
          try { raw.timestamp = raw.timestamp.toDate().toISOString() } catch (e) {}
        }
        return raw
      })
      if (typeof onChange === "function") onChange(msgs)
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error("listenToChatMessages snapshot error:", err)
    },
  )
  return unsub
}

// Debug helper (dev-only)
export async function debugWrite(payload = { _test: true }) {
  const ref = collection(db, "__debug__")
  const data = { ...payload, createdAt: serverTimestamp() }
  const docRef = await addDoc(ref, data)
  return { id: docRef.id }
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log('[firestore-client] attaching debugWrite to window.debugWrite (dev only)')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.debugWrite = async (p) => {
    try {
      return await debugWrite(p)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('debugWrite error:', e)
      throw e
    }
  }
}