import path from "node:path"

export const rootDir = path.join(__dirname, "..", "..")
export const dbgamesDir = path.join(rootDir, "dbgames")
export const spTranslationsDir = path.join(rootDir, "sp-translations")
export const spTranslationsEnPath = path.join(spTranslationsDir, "en.json")
export const stateDir = path.join(rootDir, "state")
export const dbgamesStatePath = path.join(stateDir, "dbgames.state.json")