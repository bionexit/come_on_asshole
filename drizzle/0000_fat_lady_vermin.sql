CREATE TABLE `company` (
	`company_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_company_name_unique` ON `company` (`company_name`);--> statement-breakpoint
CREATE TABLE `summary` (
	`summary_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`name_mask` text NOT NULL,
	`vote_id_count` integer DEFAULT 0 NOT NULL,
	`shits_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vote` (
	`vote_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_mask` text NOT NULL,
	`company_id` integer NOT NULL,
	`vote_details` text NOT NULL,
	`shits` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
