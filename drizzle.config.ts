import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './apps/api/src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: '.wrangler/state/v3/d1',
  },
})
