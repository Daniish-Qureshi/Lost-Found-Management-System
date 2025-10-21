// Firebase SDKs import
import { initializeApp, getApps } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage"

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBMmjLQGF25p-jhTV22c-zkSBgR_ZkfYL8",
  authDomain: "lostandfoundwebsite-8aa51.firebaseapp.com",
  projectId: "lostandfoundwebsite-8aa51",
  storageBucket: "lostandfoundwebsite-8aa51.firebasestorage.app",
  messagingSenderId: "1048178763469",
  appId: "1:1048178763469:web:a552b00059891f11d6ab84",
  measurementId: "G-J2HMYVEEKM"
}

// Firebase Initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : undefined
const db = getFirestore(app)
const itemsCollection = () => collection(db, "items")
const storage = getStorage(app)

// Add item
export async function addItem(payload) {
  let ownerId = payload?.ownerId
  try {
    const auth = getAuth()
    if (auth && auth.currentUser && auth.currentUser.uid) ownerId = auth.currentUser.uid
  } catch {}

  const raw = {
    ...payload,
    ownerId,
    imageUrl: null,
    date: payload?.date || new Date().toISOString(),
    status: payload?.status || "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  // If imageDataUrl is provided and is a data URL, upload to Storage to avoid
  // Firestore field size limits. If upload fails, fall back to storing the
  // inline data (risking size limits) to avoid blocking the user.
  if (payload?.imageDataUrl && typeof payload.imageDataUrl === "string") {
    const d = payload.imageDataUrl
    if (d.startsWith("data:")) {
      try {
        const path = `items/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`
        const ref = storageRef(storage, path)
        await uploadString(ref, d, "data_url")
        const url = await getDownloadURL(ref)
        raw.imageUrl = url
      } catch (err) {
        // upload failed — record inline but warn in console
        // eslint-disable-next-line no-console
        console.error("Storage upload failed, falling back to inline imageDataUrl:", err)
        raw.imageUrl = payload.imageDataUrl
      }
    } else {
      // assume it's already a URL
      raw.imageUrl = payload.imageDataUrl
    }
  }

  const data = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined))
  const ref = await addDoc(itemsCollection(), data)
  return { id: ref.id, ...data }
}

// Chat helpers
export function chatIdFor(itemId, userA, userB) {
  const ids = [userA, userB].sort()
  return `chat_${itemId}_${ids[0]}_${ids[1]}`
}

export async function sendMessage(chatId, senderId, text, extra = {}) {
  const messagesRef = collection(db, "chats", chatId, "messages")
  const payload = {
    senderId,
    text,
    createdAt: serverTimestamp(),
    ...extra,
  }
  const msgRef = await addDoc(messagesRef, payload)
  return { id: msgRef.id, ...payload }
}

export function listenToChatMessages(chatId, onChange) {
  try {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"))
    // Permission pre-check
    getDocs(q)
      .then(() => {
        const unsub = onSnapshot(
          q,
          (snap) => {
            const msgs = snap.docs.map((d) => {
              const raw = { id: d.id, ...d.data() }
              if (raw.createdAt && typeof raw.createdAt.toDate === "function") {
                try { raw.timestamp = raw.createdAt.toDate().toISOString() } catch {}
              } else if (raw.createdAt && typeof raw.createdAt === "string") {
                raw.timestamp = raw.createdAt
              }
              return raw
            })
            if (typeof onChange === "function") onChange(msgs)
          },
          (err) => {
            // eslint-disable-next-line no-console
            console.error("listenToChatMessages error:", err)
          },
        )
        listenToChatMessages._unsub = unsub
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("listenToChatMessages permission check failed:", err)
        try { if (typeof onChange === "function") onChange([]) } catch {}
      })
    return () => {
      try {
        if (typeof listenToChatMessages._unsub === "function") {
          listenToChatMessages._unsub()
          listenToChatMessages._unsub = null
        }
      } catch {}
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("listenToChatMessages setup failed:", err)
    return () => {}
  }
}

// Notification helpers (user-scoped)
export function listenToNotification(userId, itemId, onChange) {
  try {
    const ref = doc(db, "notifications", userId, "items", itemId)
    // Permission pre-check: try to read the document once
    getDoc(ref)
      .then((snap) => {
        // attach real-time listener
        const unsub = onSnapshot(ref, (s) => {
          if (!s.exists()) return onChange(null)
          onChange({ id: s.id, ...s.data() })
        })
        listenToNotification._unsub = unsub
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("listenToNotification permission check failed:", err)
        try { if (typeof onChange === "function") onChange(null) } catch {}
      })
    return () => {
      try {
        if (typeof listenToNotification._unsub === "function") {
          listenToNotification._unsub()
          listenToNotification._unsub = null
        }
      } catch {}
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("listenToNotification failed:", err)
    return () => {}
  }
}

export async function clearNotificationForUserItem(userId, itemId) {
  try {
    const ref = doc(db, "notifications", userId, "items", itemId)
    await setDoc(ref, { read: true }, { merge: true })
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("clearNotificationForUserItem failed:", err)
    return false
  }
}

// Delete item
export async function deleteItem(itemId) {
  if (!itemId) throw new Error("MISSING_ITEM_ID: itemId is required for deleteItem")
  const ref = doc(db, "items", itemId)
  await deleteDoc(ref)
}

// Read items
export async function readItems() {
  const q = query(itemsCollection(), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const raw = { id: d.id, ...d.data() }
    // normalize timestamps to ISO strings
    if (raw.createdAt && typeof raw.createdAt.toDate === "function") {
      try { raw.createdAt = raw.createdAt.toDate().toISOString() } catch {}
    }
    if (raw.updatedAt && typeof raw.updatedAt.toDate === "function") {
      try { raw.updatedAt = raw.updatedAt.toDate().toISOString() } catch {}
    }
    if (!raw.imageDataUrl && raw.imageUrl) raw.imageDataUrl = raw.imageUrl
    return raw
  })
}

// Real-time listener
export function listenToItems(onChange) {
  const q = query(itemsCollection(), orderBy("createdAt", "desc"))

  // Defensive pre-check: attempt a lightweight read to surface permission errors
  // synchronously and avoid an unhandled snapshot listener exception.
  try {
    // Try a quick getDocs with limit 1 to check read permissions.
    // If this fails with permission error, we return a no-op unsubscribe.
    // Use dynamic import of getDocs and query helpers already available.
    // Note: getDocs returns a promise; we handle rejection below.
    getDocs(q)
      .then((snap) => {
        // permission ok -> attach real-time listener
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
              if (!raw.imageDataUrl && raw.imageUrl) raw.imageDataUrl = raw.imageUrl
              return raw
            })
            if (typeof onChange === "function") onChange(items)
          },
          (err) => {
            // Log the error but don't throw to the caller — keep app stable.
            // eslint-disable-next-line no-console
            console.error("listenToItems snapshot error:", err)
          },
        )
        // return unsub to caller by storing it on the function so caller can call it
        listenToItems._unsub = unsub
      })
      .catch((err) => {
        // permission denied or other read error -> do not attach snapshot listener.
        // eslint-disable-next-line no-console
        console.error("listenToItems permission check failed:", err)
        // Optionally inform caller that no items are available due to permission.
        try {
          if (typeof onChange === "function") onChange([])
        } catch {}
      })
  } catch (err) {
    // Fail-safe: if getDocs throws synchronously, log and return a no-op.
    // eslint-disable-next-line no-console
    console.error("listenToItems startup failure:", err)
    try {
      if (typeof onChange === "function") onChange([])
    } catch {}
  }

  // Return a safe unsubscribe function: if the real unsub was attached it will be called,
  // otherwise it's a no-op.
  return () => {
    try {
      if (typeof listenToItems._unsub === "function") {
        listenToItems._unsub()
        listenToItems._unsub = null
      }
    } catch {}
  }
}

// Update moderation/status of an item (admin convenience)
export async function updateItemStatus(itemId, status) {
  if (!itemId) throw new Error("MISSING_ITEM_ID: itemId is required for updateItemStatus")
  const ref = doc(db, "items", itemId)
  await setDoc(ref, { status, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

