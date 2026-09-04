import "./style.css"
import { sendCommand, listenConnection } from "./firebase"
import type { Relay, ConnectionStatus, CommandLog } from "./types"

const RELAYS: Relay[] = [
  { id: 1, label: "Relay 1", description: "LED light control", path: "press1" },
  { id: 2, label: "Relay 2", description: "Secondary relay", path: "press2" },
]

const logs: CommandLog[] = []
let status: ConnectionStatus = "connecting"

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function renderStatus(): string {
  const labels: Record<ConnectionStatus, string> = {
    connecting: "Connecting…",
    connected: "Connected to Firebase",
    disconnected: "Disconnected",
    error: "Connection error",
  }
  return `
    <div class="status" data-status="${status}">
      <span class="status-dot"></span>
      ${labels[status]}
    </div>`
}

function renderRelayCard(relay: Relay): string {
  return `
    <div class="relay-card">
      <div class="relay-icon">
        <svg viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <h3>${relay.label}</h3>
      <span class="relay-desc">${relay.description}</span>
      <button
        class="trigger-btn"
        data-relay-id="${relay.id}"
        data-relay-path="${relay.path}"
      >
        ACTIVATE
      </button>
    </div>`
}

function renderLog(): string {
  if (logs.length === 0) {
    return `<div class="log-empty">No commands sent yet</div>`
  }
  return logs
    .map(
      (log) => `
    <div class="log-entry">
      <span style="display:flex;align-items:center">
        <span class="dot ${log.success ? "ok" : "fail"}"></span>
        <span class="relay-name">${log.relay}</span>
      </span>
      <span class="time">${formatTime(log.timestamp)}</span>
    </div>`,
    )
    .join("")
}

function render(): void {
  document.getElementById("app")!.innerHTML = `
    <div class="header">
      <h1>Smarty</h1>
      <p>ESP32 Cloud Command Center</p>
      ${renderStatus()}
    </div>
    <div class="relays">
      ${RELAYS.map(renderRelayCard).join("")}
    </div>
    <div class="log">
      <div class="log-title">Command Log</div>
      ${renderLog()}
    </div>`
}

async function handleTrigger(e: Event): Promise<void> {
  const btn = e.currentTarget as HTMLButtonElement
  const path = btn.dataset.relayPath!
  const relayId = btn.dataset.relayId!
  const relay = RELAYS.find((r) => r.id === Number(relayId))!

  btn.classList.add("sending")
  btn.textContent = "SENDING…"

  try {
    await sendCommand(path)
    btn.classList.remove("sending")
    btn.classList.add("sent")
    btn.textContent = "SENT ✓"

    logs.unshift({ relay: relay.label, timestamp: new Date(), success: true })
    render()
    bindButtons()

    setTimeout(() => {
      const sentBtn = document.querySelector(`[data-relay-id="${relayId}"]`) as HTMLButtonElement
      if (sentBtn) {
        sentBtn.classList.remove("sent")
        sentBtn.textContent = "ACTIVATE"
      }
    }, 2000)
  } catch {
    btn.classList.remove("sending")
    btn.textContent = "FAILED ✗"
    btn.style.borderColor = "var(--danger)"
    btn.style.color = "var(--danger)"

    logs.unshift({ relay: relay.label, timestamp: new Date(), success: false })
    render()
    bindButtons()

    setTimeout(() => {
      const failBtn = document.querySelector(`[data-relay-id="${relayId}"]`) as HTMLButtonElement
      if (failBtn) {
        failBtn.textContent = "ACTIVATE"
        failBtn.style.borderColor = ""
        failBtn.style.color = ""
      }
    }, 2000)
  }
}

function bindButtons(): void {
  document.querySelectorAll<HTMLButtonElement>(".trigger-btn").forEach((btn) => {
    btn.addEventListener("click", handleTrigger)
  })
}

function init(): void {
  render()
  bindButtons()

  listenConnection((online) => {
    status = online ? "connected" : "disconnected"
    render()
    bindButtons()
  })
}

init()
