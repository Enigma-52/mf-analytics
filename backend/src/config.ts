function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  app: {
    port: Number(must("PORT")),
  },
  pg: {
    host: must("PG_HOST"),
    port: Number(must("PG_PORT")),
    user: must("PG_USER"),
    password: must("PG_PASSWORD"),
    database: must("PG_DATABASE"),
  },
  redis: {
    host: must("REDIS_HOST"),
    port: Number(must("REDIS_PORT")),
  },
};
