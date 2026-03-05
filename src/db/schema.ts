import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// 公司表
export const company = sqliteTable('company', {
  company_id: integer('company_id').primaryKey({ autoIncrement: true }),
  company_name: text('company_name').notNull().unique(),
});

// 投票表
export const vote = sqliteTable('vote', {
  vote_id: integer('vote_id').primaryKey({ autoIncrement: true }),
  name_mask: text('name_mask').notNull(),
  company_id: integer('company_id').notNull(),
  vote_details: text('vote_details').notNull(), // JSON string
  shits: integer('shits').notNull().default(0),
  score: integer('score').notNull().default(0), // 投票总分
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// 汇总表
export const summary = sqliteTable('summary', {
  summary_id: integer('summary_id').primaryKey({ autoIncrement: true }),
  company_id: integer('company_id').notNull(),
  company_name: text('company_name').notNull(),
  name_mask: text('name_mask').notNull(),
  vote_id_count: integer('vote_id_count').notNull().default(0),
  shits_count: integer('shits_count').notNull().default(0),
  vote_details: text('vote_details'), // 合并后的投票详情 JSON
  max_score: integer('max_score').notNull().default(0), // 该公司下该人的最高分
});

export type Company = typeof company.$inferSelect;
export type Vote = typeof vote.$inferSelect;
export type Summary = typeof summary.$inferSelect;
