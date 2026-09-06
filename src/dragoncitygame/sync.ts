import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { DragonCityGame, LanguagePrefix } from "@dchighs/dragoncitygame"
import random from "@marcuth/random"
import { env } from "@marcuth/env"
import path from "node:path"
import fs from "node:fs"

import { PrismaClient } from "../generated/dragoncitygame-client/client"
import { dragoncitygameDir, createLogger } from "../helpers"
import { delay } from "../utils"
import {
    loadDragonCityGameState,
    saveDragonCityGameState,
    getBlacklistSlugs,
    addArticleToBlacklist,
    removeArticleFromBlacklist
} from "./state"

const logger = createLogger("dragoncitygame-sync")

const adapter = new PrismaBetterSqlite3({ url: env("DRAGONCITYGAME_DATABASE_URL") })
const prisma = new PrismaClient({ adapter })

const jsonDir = path.join(dragoncitygameDir, "json")
const productsFilePath = path.join(jsonDir, "products.json")
const previewArticlesFilePath = path.join(jsonDir, "preview-articles.json")
const fullArticlesFilePath = path.join(jsonDir, "full-data-articles.json")

async function syncStoreProducts(game: DragonCityGame): Promise<void> {
    logger.info("Syncing store products from dragoncitygame.com...")
    try {
        const products = await game.store.getProducts()
        await fs.promises.writeFile(productsFilePath, JSON.stringify(products, null, 2), "utf-8")
        logger.info(`Successfully saved ${products.length} products to products.json`)
    } catch (err: any) {
        logger.error(`Failed to sync store products: ${err.message}`)
    }
}

async function syncNewsArticles(game: DragonCityGame): Promise<void> {
    logger.info("Fetching articles preview baseline from dragoncitygame.com...")

    const state = await loadDragonCityGameState()
    const blacklistedSlugs = getBlacklistSlugs(state)
    if (blacklistedSlugs.length > 0) {
        logger.info(`Loaded ${blacklistedSlugs.length} blacklisted article(s) from state`)
    }

    // 1. Fetch all preview pages
    const previewArticles: any[] = []
    let page = 1
    let lastPage = 1

    do {
        logger.info(`Fetching articles preview page ${page}...`)
        const res = await game.news.getManyArticles({ page })
        previewArticles.push(...res.data)
        lastPage = res.meta.lastPage
        page++
    } while (page <= lastPage)

    logger.info(`Fetched a total of ${previewArticles.length} preview articles across ${lastPage} pages`)

    // Save preview JSON
    await fs.promises.writeFile(previewArticlesFilePath, JSON.stringify(previewArticles, null, 2), "utf-8")

    // 2. Sync preview baseline to database
    logger.info("Syncing preview baseline to database...")
    for (const p of previewArticles) {
        await prisma.article.upsert({
            where: { slug: p.slug },
            update: {
                title: p.title,
                thumbnailUrl: p.thumbnailUrl,
                createdAt: p.createdAt,
            },
            create: {
                slug: p.slug,
                title: p.title,
                thumbnailUrl: p.thumbnailUrl,
                createdAt: p.createdAt,
                isFullData: false,
            }
        })
    }

    // 3. Load existing full data JSON
    let fullDataArticles: any[] = []
    if (fs.existsSync(fullArticlesFilePath)) {
        const fileContent = await fs.promises.readFile(fullArticlesFilePath, "utf-8")
        fullDataArticles = JSON.parse(fileContent)
    }

    // 4. Query pending articles (take 10 per day, excluding blacklist)
    const targets = await prisma.article.findMany({
        where: {
            isFullData: false,
            ...(blacklistedSlugs.length > 0 ? { slug: { notIn: blacklistedSlugs } } : {})
        },
        take: 10,
        orderBy: { createdAt: "desc" }
    })

    if (targets.length === 0) {
        logger.info("All articles already have full data or are blacklisted!")
    } else {
        logger.info(`Scraping full Markdown content for ${targets.length} articles...`)

        for (const target of targets) {
            try {
                logger.info(`Fetching full data for: ${target.title} (${target.slug})`)
                const fullArticle = await game.news.getOneArticle(target.slug)

                await prisma.article.update({
                    where: { slug: target.slug },
                    data: {
                        title: fullArticle.title,
                        thumbnailUrl: fullArticle.thumbnailUrl,
                        createdAt: fullArticle.createdAt,
                        body: fullArticle.body,
                        isFullData: true,
                    }
                })

                const idx = fullDataArticles.findIndex(a => a.slug === target.slug)
                if (idx > -1) {
                    fullDataArticles[idx] = fullArticle
                } else {
                    fullDataArticles.push(fullArticle)
                }

                removeArticleFromBlacklist(state, target.slug)
                logger.info(`Successfully updated article: ${target.title}`)
            } catch (err: any) {
                logger.error(`Failed to scrape article ${target.slug}: ${err.message}`)
                addArticleToBlacklist(state, { slug: target.slug, title: target.title }, err.message)
                await saveDragonCityGameState(state)
            }

            const wait = random.int(1000, 3000)
            await delay(wait)
        }

        // Save updated full data JSON
        await fs.promises.writeFile(fullArticlesFilePath, JSON.stringify(fullDataArticles, null, 2), "utf-8")
    }

    state.lastSyncAt = new Date().toISOString()
    await saveDragonCityGameState(state)
}

async function main() {
    logger.info("Starting daily sync for dragoncitygame.com")
    const timer = logger.startTimer()

    try {
        if (!fs.existsSync(jsonDir)) {
            await fs.promises.mkdir(jsonDir, { recursive: true })
        }

        const game = new DragonCityGame({ languagePrefix: LanguagePrefix.English })

        // 1. Sync store products
        await syncStoreProducts(game)

        // 2. Sync news articles
        await syncNewsArticles(game)

        timer.done({ message: "dragoncitygame daily sync finished successfully" })
    } catch (error: any) {
        logger.error(`Sync error: ${error.message}`)
        process.exitCode = 1
    } finally {
        await prisma.$disconnect()
    }
}

main()
