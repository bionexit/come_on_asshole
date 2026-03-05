import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.VITE_TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  },
});
