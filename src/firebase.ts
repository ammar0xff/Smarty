import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, onValue, serverTimestamp } from "firebase/database"
import type { FirebaseConfig } from "./types"

const config: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://your-project-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
}

const app = initializeApp(config)
const db = getDatabase(app)

export function sendCommand(path: string, value: number = 1): Promise<void> {
  return set(ref(db, path), {
    value,
    timestamp: serverTimestamp(),
  })
}

export function listenConnection(
  callback: (online: boolean) => void,
): () => void {
  const connectedRef = ref(db, ".info/connected")
  return onValue(connectedRef, (snap) => {
    callback(snap.val() === true)
  })
}

export { db }
