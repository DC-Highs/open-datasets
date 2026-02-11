import { Dbgames, DragonRarity, extractDragonPageSlug, FullDataDragon, PreviewDragon } from "@dchighs/dbgames"
import { Localization } from "@dchighs/dc-localization"
import random from "@marcuth/random"
import path from "node:path"
import fs from "node:fs"

import { dbgamesDir, createLogger } from "../helpers"
import { delay } from "../utils"

const logger = createLogger("dbgames")

async function scrapePreviewDragons(localization: Localization) {
    const dbgames = new Dbgames({ localization: localization })

    const allRarities = [
        DragonRarity.Common,
        DragonRarity.Rare,
        DragonRarity.VeryRare,
        DragonRarity.Epic,
        DragonRarity.Legendary,
        DragonRarity.Heroic
    ]

    const dragons: PreviewDragon[] = []

    for (const rarity of allRarities) {
        let currentDragons = await dbgames.getDragons({ rarities: [rarity] })

        logger.info(`Scraped ${currentDragons.data.length} ${rarity} dragons`)

        dragons.push(...currentDragons.data)

        while (currentDragons.meta.next) {
            currentDragons = await dbgames.getDragons({ rarities: [rarity], page: currentDragons.meta.next })

            logger.info(`Scraped ${currentDragons.data.length} ${rarity} dragons`)

            dragons.push(...currentDragons.data)

            const delayTime = random.int(500, 1500)

            logger.debug(`Waiting ${delayTime}ms before scraping next page`)

            await delay(delayTime)
        }
    }

    const outputDir = path.join(dbgamesDir, "json")

    if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true })
    }

    logger.info("Writing preview dragons to file")

    const outputFilePath = path.join(outputDir, "preview-dragons.json")
    const dragonsData = dragons.map(dragon => dragon.data)

    await fs.promises.writeFile(outputFilePath, JSON.stringify(dragonsData))

    logger.debug("Writing preview dragons finished")

    return dragons
}

type FullDataDragonType = {
    data: Omit<FullDataDragon<false>["data"], "attacks" | "trainable_attacks"> & {
        attacks: FullDataDragon<true>["data"]["attacks"] | null
        trainable_attacks: FullDataDragon<true>["data"]["trainable_attacks"] | null
    }
    meta: FullDataDragon<false>["meta"]
}

async function scrapeFullDataDragons(localization: Localization, dragons: PreviewDragon[]) {
    const dbgames = new Dbgames({ localization: localization })
    const fullDataDragons: FullDataDragonType[] = []

    for (const dragon of dragons) {
        try {
            const fullDataDragon = await dbgames.getDragon({ slug: extractDragonPageSlug(dragon.meta.pageUrl) })

            fullDataDragons.push(fullDataDragon)
        } catch (error: any) {
            logger.error(`Failed to scrape dragon ${dragon.data.id}: ${error.message}`)
            logger.info(`PageUrl: ${dragon.meta.pageUrl}`)

            fullDataDragons.push({
                data: {
                    ...dragon.data,
                    attacks: null,
                    trainable_attacks: null
                },
                meta: dragon.meta
            })
        }

        const delayTime = random.int(1000, 3000)

        logger.debug(`Waiting ${delayTime}ms before scraping next dragon`)

        await delay(delayTime)
    }

    const outputDir = path.join(dbgamesDir, "json")

    if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true })
    }

    logger.info("Writing full data dragons to file")

    const outputFilePath = path.join(outputDir, "full-data-dragons.json")
    const dragonsData = fullDataDragons.map(dragon => dragon.data)

    await fs.promises.writeFile(outputFilePath, JSON.stringify(dragonsData))

    logger.debug("Writing full data dragons finished")
}

async function main() {
    logger.info("Starting to scrape preview dragons")
    const timer = logger.startTimer()

    const localization = await Localization.create("en")

    const dragons = await scrapePreviewDragons(localization)
    await scrapeFullDataDragons(localization, dragons)

    timer.done({ message: "Scraping finished" })
}

if (require.main === module) {
    main()
}