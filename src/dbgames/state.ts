import fs from "node:fs"

import { dbgamesStatePath, stateDir } from "../helpers"

export interface DbgamesBlacklistEntry {
    id: number
    name?: string
    reason?: string
    failedAt: string
    attempts: number
}

export interface DbgamesState {
    blacklist: DbgamesBlacklistEntry[]
    updatedAt?: string
    lastSyncAt?: string
}

export async function loadDbgamesState(): Promise<DbgamesState> {
    try {
        if (!fs.existsSync(dbgamesStatePath)) {
            return { blacklist: [] }
        }

        const rawContent = await fs.promises.readFile(dbgamesStatePath, "utf-8")
        if (!rawContent.trim()) {
            return { blacklist: [] }
        }

        const parsed = JSON.parse(rawContent)

        const blacklist: DbgamesBlacklistEntry[] = Array.isArray(parsed?.blacklist)
            ? parsed.blacklist.map((item: any) => {
                  if (typeof item === "number") {
                      return {
                          id: item,
                          failedAt: new Date().toISOString(),
                          attempts: 1,
                      }
                  }
                  return item
              })
            : []

        return {
            ...parsed,
            blacklist,
        }
    } catch {
        return { blacklist: [] }
    }
}

export async function saveDbgamesState(state: DbgamesState): Promise<void> {
    if (!fs.existsSync(stateDir)) {
        await fs.promises.mkdir(stateDir, { recursive: true })
    }

    state.updatedAt = new Date().toISOString()
    await fs.promises.writeFile(dbgamesStatePath, JSON.stringify(state, null, 2), "utf-8")
}

export function getBlacklistIds(state: DbgamesState): number[] {
    if (!Array.isArray(state.blacklist)) return []
    return state.blacklist
        .map((entry: any) => (typeof entry === "number" ? entry : entry?.id))
        .filter((id): id is number => typeof id === "number" && !isNaN(id))
}

export function addDragonToBlacklist(
    state: DbgamesState,
    dragon: { id: number; name?: string },
    reason?: string
): void {
    if (!Array.isArray(state.blacklist)) {
        state.blacklist = []
    }

    const index = state.blacklist.findIndex(
        (entry: any) => (typeof entry === "number" ? entry : entry.id) === dragon.id
    )

    const prevEntry = index > -1 ? state.blacklist[index] : null
    const prevAttempts = prevEntry && typeof prevEntry === "object" ? prevEntry.attempts || 1 : 0

    const updatedEntry: DbgamesBlacklistEntry = {
        id: dragon.id,
        name: dragon.name || (prevEntry && typeof prevEntry === "object" ? prevEntry.name : undefined),
        reason: reason || (prevEntry && typeof prevEntry === "object" ? prevEntry.reason : undefined),
        failedAt: new Date().toISOString(),
        attempts: prevAttempts + 1,
    }

    if (index > -1) {
        state.blacklist[index] = updatedEntry
    } else {
        state.blacklist.push(updatedEntry)
    }
}

export function removeDragonFromBlacklist(state: DbgamesState, id: number): boolean {
    if (!Array.isArray(state.blacklist)) return false

    const initialLength = state.blacklist.length
    state.blacklist = state.blacklist.filter(
        (entry: any) => (typeof entry === "number" ? entry : entry.id) !== id
    )

    return state.blacklist.length < initialLength
}
