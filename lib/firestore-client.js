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
  // Build data and remove any fields that are `undefined` because
  // Firestore rejects documents with `undefined` field values.
  const raw = {
    ...payload,
    date: payload?.date || new Date().toISOString(),
    // default status to 'approved' unless caller set otherwise
    status: payload?.status || "approved",
    createdAt: serverTimestamp(),
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

// --- Chat helpers -------------------------------------------------
/**
 * Deterministic chat id for two users (lexical order)
 */
export function chatIdFor(userA, userB, itemId) {
  if (!userA || !userB) throw new Error("Missing user ids for chatId")
  // include item id so each item has its own chat thread between the two users
  const pair = [userA, userB].sort().join("_")
  if (itemId) return `chat_${itemId}_${pair}`
  return `chat_${pair}`
}

/**
 * sendMessage accepts optional extra meta (senderName, itemId, itemName, etc.)
 */
export async function sendMessage(chatId, senderId, text, extra = {}) {
  if (!chatId) throw new Error("Missing chatId")
  if (!senderId) throw new Error("Missing senderId")
  if (!text || typeof text !== "string") throw new Error("Missing text")
  const messagesRef = collection(db, "chats", chatId, "messages")
  const payload = { senderId, text, timestamp: serverTimestamp(), ...extra }
  const docRef = await addDoc(messagesRef, payload)

  // If extra.recipientId and extra.itemId present, increment recipient notification counter
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
  // reset count to 0 and update timestamp
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
          try {
            raw.timestamp = raw.timestamp.toDate().toISOString()
          } catch (e) {}
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
