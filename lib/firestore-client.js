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

const firebaseConfig = {
  apiKey: "AIzaSyBMmjLQGF25p-jhTV22c-zkSBgR_ZkfYL8",
  authDomain: "lostandfoundwebsite-8aa51.firebaseapp.com",
  projectId: "lostandfoundwebsite-8aa51",
  storageBucket: "lostandfoundwebsite-8aa51.firebasestorage.app",
  messagingSenderId: "1048178763469",
  appId: "1:1048178763469:web:a552b00059891f11d6ab84",
  measurementId: "G-J2HMYVEEKM"
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getFirestore(app)
const itemsCollection = () => collection(db, "items")

// (no storage upload in the original version)

// ======= CORRECTED ADD ITEM FUNCTION ========
export async function addItem(payload) {
  let ownerId = payload?.ownerId
  try {
    const auth = getAuth()
    if (auth && auth.currentUser && auth.currentUser.uid) ownerId = auth.currentUser.uid
  } catch {}

  const raw = {
    ...payload,
    ownerId,
    imageDataUrl: payload?.imageDataUrl,
    date: payload?.date || new Date().toISOString(),
    status: payload?.status || "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const data = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined))
  const ref = await addDoc(itemsCollection(), data)
  return { id: ref.id }
}

export async function deleteItem(itemId) {
  if (!itemId) throw new Error("MISSING_ITEM_ID: itemId is required for deleteItem")
  const ref = doc(db, "items", itemId)
  await deleteDoc(ref)
}

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
    // ensure components that expect imageDataUrl get a usable URL
    if (!raw.imageDataUrl && raw.imageUrl) raw.imageDataUrl = raw.imageUrl
    return raw
  })
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
        if (!raw.imageDataUrl && raw.imageUrl) raw.imageDataUrl = raw.imageUrl
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

