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

// Firebase config (restored to previous project)
const firebaseConfig = {
  apiKey: "AIzaSyB5W49RWXOiPfcukUDAmOUqz3KFo3sY8qw",
  authDomain: "lost-found-portal-985c1.firebaseapp.com",
  projectId: "lost-found-portal-985c1",
  storageBucket: "lost-found-portal-985c1.firebasestorage.app",
  messagingSenderId: "305248670862",
  appId: "1:305248670862:web:a2c34d987f41b0f38525df",
  measurementId: "G-LFX4M69HSF",
}

// Firebase Initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : undefined
const db = getFirestore(app)
const itemsCollection = () => collection(db, "items")
const storage = getStorage(app)

// Debug: print the effective Firebase project + storage bucket at runtime so
// it's easy to verify which project the deployed app is using.
try {
  // Avoid noisy logs in test environments, but helpful when debugging deployed site.
  // eslint-disable-next-line no-console
  console.info("[firestore-client] Firebase project:", firebaseConfig.projectId, "storageBucket:", firebaseConfig.storageBucket)
} catch {}

// Add item
export async function addItem(payload) {
  // Prefer ownerId provided by the caller (app-level user id). If none is
  // provided, fall back to Firebase Auth uid when available. This keeps the
  // application's local user ids as the authoritative owner id for items so
  // owner detection in the UI (user.id === item.ownerId) works as expected.
  let ownerId = payload?.ownerId
  try {
    const auth = getAuth()
    if ((!ownerId || ownerId === null) && auth && auth.currentUser && auth.currentUser.uid) {
      ownerId = auth.currentUser.uid
    }
  } catch {}

  const raw = {
    ...payload,
    ownerId,
    imageUrl: null,
    date: payload?.date || new Date().toISOString(),
    // Default to 'approved' so items show up in admin/feeds by default.
    status: payload?.status || "approved",
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
        // We successfully uploaded to Storage, avoid storing large inline base64 in Firestore
        // to prevent field-size issues and to keep documents small.
        try { delete raw.imageDataUrl } catch {}
      } catch (err) {
        // upload failed — record inline but warn in console with extra detail.
        try {
          const eMsg = err && err.message ? err.message : (typeof err === "string" ? err : String(err))
          // eslint-disable-next-line no-console
          console.error(`[firestore-client] Storage upload failed, falling back to inline imageDataUrl. project: ${firebaseConfig.projectId} bucket: ${firebaseConfig.storageBucket} error: ${eMsg}`)
        } catch {}
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
  // If sender included a recipientId and an itemId, update the recipient's
  // notification document so the owner can see a notification on the item card.
  try {
    const recipientId = extra && (extra.recipientId || extra.recipient)
    const itemId = extra && (extra.itemId)
    if (recipientId && itemId) {
      try {
        const notifRef = doc(db, "notifications", recipientId, "items", itemId)
        await setDoc(
          notifRef,
          {
            // increment unread count
            count: increment(1),
            senderId: senderId,
            senderName: extra.senderName || null,
            itemId: itemId,
            read: false,
            lastMessage: text,
            lastAt: serverTimestamp(),
          },
          { merge: true },
        )
      } catch (e) {
        try { console.error("sendMessage: failed to update notification", e) } catch {}
      }
    }
  } catch {}

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
    await setDoc(ref, { read: true, count: 0 }, { merge: true })
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

// Debug helper: log readItems once when called to help debug missing images
try {
  // Only attach when running in Node/Dev server environment
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    const _origReadItems = readItems
    readItems = async function () {
      const items = await _origReadItems()
      try {
        // eslint-disable-next-line no-console
        console.info("[firestore-client][debug] readItems count:", items.length, "sample imageUrls:", items.slice(0, 5).map(i => i.imageUrl || i.imageDataUrl))
      } catch {}
      return items
    }
  }
} catch {}

// Real-time listener
export function listenToItems(onChange) {
  const q = query(itemsCollection(), orderBy("createdAt", "desc"))

  // Defensive pre-check: attempt a lightweight read to surface permission errors
  // synchronously and avoid an unhandled snapshot listener exception.
  try {
    // Try a quick getDocs with limit 1 to check read permissions.
    // If this fails with permission error, we return a no-op unsubscribe.
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
        try {
          // eslint-disable-next-line no-console
          console.error("[firestore-client] listenToItems permission check failed. project:", firebaseConfig.projectId, "error:", err)
        } catch {}
        // Optionally inform caller that no items are available due to permission.
        try {
          if (typeof onChange === "function") onChange([])
        } catch {}
      })
  } catch (err) {
    // Fail-safe: if getDocs throws synchronously, log and return a no-op.
    // eslint-disable-next-line no-console
    try { console.error("[firestore-client] listenToItems startup failure:", err) } catch {}
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

