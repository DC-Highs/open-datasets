import fs from "node:fs"
import { dragoncitygameStatePath, stateDir } from "../helpers"

export interface DragonCityGameBlacklistEntry {
    slug: string
    title?: string
    reason?: string
    failedAt: string
    attempts: number
}

export interface DragonCityGameState {
    blacklist: DragonCityGameBlacklistEntry[]
    updatedAt?: string
    lastSyncAt?: string
}

export async function loadDragonCityGameState(): Promise<DragonCityGameState> {
    try {
        if (!fs.existsSync(dragoncitygameStatePath)) {
            return { blacklist: [] }
        }

        const rawContent = await fs.promises.readFile(dragoncitygameStatePath, "utf-8")
        if (!rawContent.trim()) {
            return { blacklist: [] }
        }

        const parsed = JSON.parse(rawContent)

        const blacklist: DragonCityGameBlacklistEntry[] = Array.isArray(parsed?.blacklist)
            ? parsed.blacklist.map((item: any) => {
                  if (typeof item === "string") {
                      return {
                          slug: item,
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

export async function saveDragonCityGameState(state: DragonCityGameState): Promise<void> {
    if (!fs.existsSync(stateDir)) {
        await fs.promises.mkdir(stateDir, { recursive: true })
    }

    state.updatedAt = new Date().toISOString()
    await fs.promises.writeFile(dragoncitygameStatePath, JSON.stringify(state, null, 2), "utf-8")
}

export function getBlacklistSlugs(state: DragonCityGameState): string[] {
    if (!Array.isArray(state.blacklist)) return []
    return state.blacklist
        .map((entry: any) => (typeof entry === "string" ? entry : entry?.slug))
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
}

export function addArticleToBlacklist(
    state: DragonCityGameState,
    article: { slug: string; title?: string },
    reason?: string
): void {
    if (!Array.isArray(state.blacklist)) {
        state.blacklist = []
    }

    const index = state.blacklist.findIndex(
        (entry: any) => (typeof entry === "string" ? entry : entry.slug) === article.slug
    )

    const prevEntry = index > -1 ? state.blacklist[index] : null
    const prevAttempts = prevEntry && typeof prevEntry === "object" ? prevEntry.attempts || 1 : 0

    const updatedEntry: DragonCityGameBlacklistEntry = {
        slug: article.slug,
        title: article.title || (prevEntry && typeof prevEntry === "object" ? prevEntry.title : undefined),
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

export function removeArticleFromBlacklist(state: DragonCityGameState, slug: string): boolean {
    if (!Array.isArray(state.blacklist)) return false

    const initialLength = state.blacklist.length
    state.blacklist = state.blacklist.filter(
        (entry: any) => (typeof entry === "string" ? entry : entry.slug) !== slug
    )

    return state.blacklist.length < initialLength
}
