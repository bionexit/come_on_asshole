import { createClient, Client as LibsqlClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// 创建 Turso 客户端
function createTursoClient(): LibsqlClient {
  const url = import.meta.env.VITE_TURSO_DATABASE_URL || 'file:local.db';
  const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;
  
  return createClient({
    url,
    authToken,
  });
}

const client = createTursoClient();
export const db = drizzle(client, { schema });

// 导出客户端以便直接执行 SQL
export { client };
