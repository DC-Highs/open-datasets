import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { Dbgames, extractDragonPageSlug } from "@dchighs/dbgames"
import { Localization } from "@dchighs/dc-localization"
import random from "@marcuth/random"
import { env } from "@marcuth/env"
import path from "node:path"
import fs from "node:fs"

import { PrismaClient } from "../generated/dbgames-client/client"
import { dbgamesDir, createLogger } from "../helpers"
import { delay } from "../utils"

const logger = createLogger("dbgames-sync")

const adapter = new PrismaBetterSqlite3({ url: env("DBGAMES_DATABASE_URL") })
const prisma = new PrismaClient({ adapter })

const jsonDir = path.join(dbgamesDir, "json")
const previewFilePath = path.join(jsonDir, "preview-dragons.json")
const fullFilePath = path.join(jsonDir, "full-data-dragons.json")

async function main() {
    logger.info("Starting daily sync")

    try {
        if (!fs.existsSync(previewFilePath)) {
            logger.error("Preview dragons file not found. Run scrape first.")
            return
        }

        const previewData = JSON.parse(await fs.promises.readFile(previewFilePath, "utf-8"))

        let fullData: any[] = []

        if (fs.existsSync(fullFilePath)) {
            const fullDataFileContent = await fs.promises.readFile(fullFilePath, "utf-8")
            fullData = JSON.parse(fullDataFileContent)
        }

        const localization = await Localization.create("en")
        const dbgames = new Dbgames({ localization: localization })

        logger.info("Syncing preview baseline to database...")

        for (const p of previewData) {
            await prisma.dragon.upsert({
                where: { id: p.id },
                update: {},
                create: {
                    id: p.id,
                    name: p.name,
                    name_key: p.name_key,
                    group_type: p.group_type,
                    hatching_time: p.hatching_time,
                    breeding_time: p.breeding_time,
                    description: p.description,
                    description_key: p.description_key,
                    xp: p.xp,
                    starting_coins: p.starting_coins,
                    coins_added: p.coins_added,
                    dragon_rarity: p.dragon_rarity,
                    attributes: p.attributes ? p.attributes.join(",") : null,
                    img_name: p.img_name,
                    page_url: p.page_url,
                    isFullData: false
                }
            })
        }

        const targets = await prisma.dragon.findMany({
            where: { isFullData: false },
            take: 10,
            orderBy: { id: "asc" }
        })

        if (targets.length === 0) {
            logger.info("All dragons already have full data!")
            return
        }

        logger.info(`Scraping full data for ${targets.length} dragons...`)

        for (const target of targets) {
            try {
                const previewDragon = previewData.find((d: any) => d.id === target.id)
                
                const slug = previewDragon?.page_url 
                    ? extractDragonPageSlug(previewDragon.page_url)
                    : target.name.toLowerCase().replace(/ /g, "-") + "-dragon" 
                
                logger.info(`Fetching full data for: ${target.name} (${slug})`)

                const full = await dbgames.getDragon({ slug })

                await prisma.dragon.update({
                    where: { id: target.id },
                    data: {
                        ...full.data,
                        attributes: full.data.attributes ? full.data.attributes.join(",") : null,
                        attacks: JSON.stringify(full.data.attacks),
                        trainable_attacks: JSON.stringify(full.data.trainable_attacks),
                        isFullData: true
                    }
                })

                const idx = fullData.findIndex(f => f.id === target.id)

                const fullDataWithMeta = {
                    ...full.data,
                    page_url: full.meta.pageUrl
                }

                if (idx > -1) {
                    fullData[idx] = fullDataWithMeta
                } else {
                    fullData.push(fullDataWithMeta
                    )
                }

                logger.info(`Successfully updated ${target.name}`)
                
            } catch (err: any) {
                logger.error(`Failed to scrape ${target.name}: ${err.message}`)
            }

            const wait = random.int(2000, 5000)
            await delay(wait)
        }

        // Save updated JSON
        await fs.promises.writeFile(fullFilePath, JSON.stringify(fullData, null, 2))
        logger.info("Daily sync finished successfully")

    } catch (error: any) {
        logger.error(`Sync error: ${error.message}`)
    } finally {
        await prisma.$disconnect()
    }
}

main()
