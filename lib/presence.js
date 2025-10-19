// Presence helpers using Firebase Realtime Database (modular SDK)
import { getApp } from 'firebase/app'
import { getDatabase, ref, set, onDisconnect, onValue, serverTimestamp } from 'firebase/database'

let db
try {
  const app = getApp()
  db = getDatabase(app)
} catch (e) {
  // If firebase app isn't initialized yet, callers must initialize Firebase first.
  // eslint-disable-next-line no-console
  console.error('[presence] Firebase app not initialized:', e)
}

export async function goOnline(userId) {
  if (!db) return
  if (!userId) return
  try {
    const r = ref(db, `presence/${userId}`)
    // set online now
    await set(r, { state: 'online', lastSeen: serverTimestamp() })
    // ensure onDisconnect sets offline
    const od = onDisconnect(r)
    await od.set({ state: 'offline', lastSeen: serverTimestamp() })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[presence] goOnline failed', e)
  }
}

export async function goOffline(userId) {
  if (!db) return
  if (!userId) return
  try {
    const r = ref(db, `presence/${userId}`)
    await set(r, { state: 'offline', lastSeen: serverTimestamp() })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[presence] goOffline failed', e)
  }
}

export function listenToPresence(userId, onChange) {
  if (!db) return () => {}
  if (!userId) return () => {}
  const r = ref(db, `presence/${userId}`)
  const unsub = onValue(r, (snapshot) => {
    if (!snapshot.exists()) {
      if (typeof onChange === 'function') onChange(null)
      return
    }
    try {
      const data = snapshot.val()
      if (typeof onChange === 'function') onChange(data)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[presence] listenToPresence callback failed', e)
    }
  })
  return () => unsub()
}
