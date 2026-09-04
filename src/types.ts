export interface FirebaseConfig {
  apiKey: string
  databaseURL: string
  projectId: string
}

export interface Relay {
  id: number
  label: string
  description: string
  path: string
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export interface CommandLog {
  relay: string
  timestamp: Date
  success: boolean
}
