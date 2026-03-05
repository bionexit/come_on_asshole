-- 添加 company_name 字段到 summary 表
-- SQLite 不支持直接 ALTER TABLE ADD COLUMN 设置 NOT NULL，所以创建新表并迁移数据

-- 1. 创建新的 summary 表（带 company_name 字段）
CREATE TABLE `summary_new` (
	`summary_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`company_name` text NOT NULL DEFAULT '未知公司',
	`name_mask` text NOT NULL,
	`vote_id_count` integer DEFAULT 0 NOT NULL,
	`shits_count` integer DEFAULT 0 NOT NULL
);

-- 2. 从旧表复制数据，并根据 company_id 关联 company 表获取 company_name
INSERT INTO `summary_new` (summary_id, company_id, company_name, name_mask, vote_id_count, shits_count)
SELECT 
	s.summary_id,
	s.company_id,
	COALESCE(c.company_name, '未知公司'),
	s.name_mask,
	s.vote_id_count,
	s.shits_count
FROM `summary` s
LEFT JOIN `company` c ON s.company_id = c.company_id;

-- 3. 删除旧表
DROP TABLE `summary`;

-- 4. 重命名新表
ALTER TABLE `summary_new` RENAME TO `summary`;
