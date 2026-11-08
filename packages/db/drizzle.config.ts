import type { Config } from 'drizzle-kit';

export default {
  schema: './schema/index.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/sharvic.db',
  },
} satisfies Config;
