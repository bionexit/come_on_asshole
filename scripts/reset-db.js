#!/usr/bin/env node
/**
 * 数据库重置脚本
 * 用于清空并重新初始化本地 SQLite 数据库
 * ⚠️ 警告: 此操作会删除所有数据！
 */

import { createClient } from '@libsql/client';
import { unlinkSync, existsSync } from 'fs';
import { initDatabase } from './init-db.js';

const DB_PATH = process.env.VITE_TURSO_DATABASE_URL || 'file:local.db';

async function resetDatabase() {
  console.log('⚠️  警告: 即将重置数据库！');
  console.log(`📁 目标数据库: ${DB_PATH}`);
  
  // 解析文件路径 (移除 file: 前缀)
  const dbFile = DB_PATH.replace('file:', '');
  
  if (existsSync(dbFile)) {
    console.log('🗑️  正在删除现有数据库...');
    try {
      unlinkSync(dbFile);
      console.log('✅ 旧数据库已删除');
    } catch (error) {
      console.error('❌ 删除数据库失败:', error.message);
      process.exit(1);
    }
  } else {
    console.log('ℹ️  数据库文件不存在，将创建新数据库');
  }
  
  // 重新初始化
  console.log('\n🔄 重新初始化数据库...\n');
  await initDatabase();
}

// 确认提示
console.log('========================================');
console.log('  ⚠️  数据库重置工具');
console.log('========================================');
console.log('');

// 检查是否有 --force 参数
if (process.argv.includes('--force') || process.argv.includes('-f')) {
  resetDatabase();
} else {
  console.log('此操作将删除所有数据！');
  console.log('如需强制执行，请使用: node scripts/reset-db.js --force');
  console.log('');
}
