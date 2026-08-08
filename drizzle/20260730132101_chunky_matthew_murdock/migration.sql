CREATE TABLE `accounts` (
	`id` text PRIMARY KEY,
	`issuer` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `art_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`art_slug` text NOT NULL,
	`src` text NOT NULL,
	`alt` text,
	CONSTRAINT `art_images_artSlug_fkey` FOREIGN KEY (`art_slug`) REFERENCES `arts`(`slug`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `arts` (
	`slug` text PRIMARY KEY,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`href` text,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `careers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`period` text NOT NULL,
	`position` text NOT NULL,
	`company` text NOT NULL,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `passkeys` (
	`id` text PRIMARY KEY,
	`created_at` integer,
	`name` text,
	`public_key` text NOT NULL,
	`user_id` text NOT NULL,
	`credential_id` text NOT NULL,
	`counter` integer NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer NOT NULL,
	`transports` text,
	`aaguid` text,
	CONSTRAINT `passkeys_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_slug` text NOT NULL,
	`tag` text NOT NULL,
	CONSTRAINT `post_tags_postSlug_fkey` FOREIGN KEY (`post_slug`) REFERENCES `posts`(`slug`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`slug` text PRIMARY KEY,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ranks` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`game` text NOT NULL,
	`season` text,
	`rank` text NOT NULL,
	`image_url` text NOT NULL,
	`href` text,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY,
	`key` text NOT NULL UNIQUE,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`category` text,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `socials` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`href` text NOT NULL,
	`alias` text,
	`icon` text NOT NULL,
	`label` text NOT NULL,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `works` (
	`slug` text PRIMARY KEY,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text,
	`image` text,
	`icon` text,
	`href` text,
	`sort_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_issuer_providerAccountId_uidx` ON `accounts` (`issuer`,`provider_account_id`);--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `art_images_artSlug_idx` ON `art_images` (`art_slug`);--> statement-breakpoint
CREATE INDEX `arts_sortIndex_createdAt_idx` ON `arts` (`sort_index`,`created_at`);--> statement-breakpoint
CREATE INDEX `careers_sortIndex_idx` ON `careers` (`sort_index`);--> statement-breakpoint
CREATE INDEX `passkeys_userId_idx` ON `passkeys` (`user_id`);--> statement-breakpoint
CREATE INDEX `passkeys_credentialID_idx` ON `passkeys` (`credential_id`);--> statement-breakpoint
CREATE INDEX `post_tags_postSlug_idx` ON `post_tags` (`post_slug`);--> statement-breakpoint
CREATE INDEX `posts_createdAt_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `ranks_sortIndex_idx` ON `ranks` (`sort_index`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `skills_sortIndex_idx` ON `skills` (`sort_index`);--> statement-breakpoint
CREATE INDEX `socials_alias_idx` ON `socials` (`alias`);--> statement-breakpoint
CREATE INDEX `socials_sortIndex_idx` ON `socials` (`sort_index`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `works_sortIndex_createdAt_idx` ON `works` (`sort_index`,`created_at`);