#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 用于创建/重置本地 SQLite 数据库
 */

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.VITE_TURSO_DATABASE_URL || 'file:local.db';

async function initDatabase() {
  console.log('🗄️  正在初始化数据库...');
  console.log(`📁 数据库路径: ${DB_PATH}`);

  try {
    // 创建客户端连接
    const client = createClient({
      url: DB_PATH,
    });

    // 读取 migration 文件
    const migrationPath = join(__dirname, '..', 'drizzle', '0000_fat_lady_vermin.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // 分割并执行 SQL 语句
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 发现 ${statements.length} 个表需要创建`);

    for (const statement of statements) {
      const sql = statement + ';';
      console.log(`📝 执行: ${sql.split('\n')[0].substring(0, 60)}...`);
      await client.execute(sql);
    }

    console.log('✅ 数据库初始化成功！');
    console.log('\n📊 已创建的表:');
    console.log('   • company - 公司表');
    console.log('   • vote - 投票表');
    console.log('   • summary - 汇总表');

    await client.close();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

export { initDatabase };
