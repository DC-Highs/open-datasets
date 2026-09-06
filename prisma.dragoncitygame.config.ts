import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/dragoncitygame/schema.prisma",
    migrations: {
        path: "prisma/dragoncitygame/migrations",
    },
    datasource: {
        url: process.env["DRAGONCITYGAME_DATABASE_URL"],
    },
});
