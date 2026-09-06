import { Localization } from "@dchighs/dc-localization"
import fs from "node:fs"
import path from "node:path"

import { spTranslationsDir, spTranslationsEnPath, createLogger } from "../helpers"

const logger = createLogger("sp-translations-sync")

async function main() {
    logger.info("Starting daily sync for English localization (sp-translations)")
    const timer = logger.startTimer()

    try {
        if (!fs.existsSync(spTranslationsDir)) {
            await fs.promises.mkdir(spTranslationsDir, { recursive: true })
        }

        logger.info("Fetching English translations from SocialPoint...")
        const data = await Localization.fetch("en")

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Fetched translations data is empty or invalid.")
        }

        logger.info(`Fetched ${data.length} translation entries. Saving to ${path.relative(process.cwd(), spTranslationsEnPath)}...`)

        await fs.promises.writeFile(spTranslationsEnPath, JSON.stringify(data, null, 2), "utf-8")

        timer.done({ message: "English localization sync finished successfully" })
    } catch (error: any) {
        logger.error(`Sync error: ${error.message}`)
        process.exitCode = 1
    }
}

main()
