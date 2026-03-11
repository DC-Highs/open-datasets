import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/dbgames/schema.prisma",
    migrations: {
        path: "prisma/dbgames/migrations",
    },
    datasource: {
        url: process.env["DBGAMES_DATABASE_URL"],
    },
});
