CREATE TABLE `admin_action_plans` (
	`id` text PRIMARY KEY,
	`actor_user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`operations` text NOT NULL,
	`snapshot` text NOT NULL,
	`snapshot_hash` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text,
	`expires_at` integer NOT NULL,
	`retry_expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`applied_at` integer,
	CONSTRAINT `admin_action_plans_actorUserId_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `admin_audit_events` (
	`id` text PRIMARY KEY,
	`plan_id` text,
	`actor_user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`source` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`before` text,
	`after` text,
	`outcome` text NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `admin_audit_events_planId_fkey` FOREIGN KEY (`plan_id`) REFERENCES `admin_action_plans`(`id`) ON DELETE SET NULL,
	CONSTRAINT `admin_audit_events_actorUserId_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `jwks` (
	`id` text PRIMARY KEY,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	`alg` text,
	`crv` text
);
--> statement-breakpoint
CREATE TABLE `oauth_access_tokens` (
	`id` text PRIMARY KEY,
	`token` text NOT NULL UNIQUE,
	`client_id` text NOT NULL,
	`session_id` text,
	`user_id` text,
	`reference_id` text,
	`authorization_code_id` text,
	`resources` text,
	`requested_user_info_claims` text,
	`refresh_id` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`revoked` integer,
	`confirmation` text,
	`scopes` text NOT NULL,
	CONSTRAINT `oauth_access_tokens_clientId_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_access_tokens_sessionId_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL,
	CONSTRAINT `oauth_access_tokens_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_access_tokens_refreshId_fkey` FOREIGN KEY (`refresh_id`) REFERENCES `oauth_refresh_tokens`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_client_assertions` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_client_resources` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`metadata` text,
	`created_at` integer,
	CONSTRAINT `oauth_client_resources_clientId_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_client_resources_resourceId_fkey` FOREIGN KEY (`resource_id`) REFERENCES `oauth_resources`(`identifier`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_clients` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL UNIQUE,
	`client_secret` text,
	`disabled` integer DEFAULT false,
	`skip_consent` integer,
	`enable_end_session` integer,
	`subject_type` text,
	`scopes` text,
	`user_id` text,
	`created_at` integer,
	`updated_at` integer,
	`name` text,
	`uri` text,
	`icon` text,
	`contacts` text,
	`tos` text,
	`policy` text,
	`software_id` text,
	`software_version` text,
	`software_statement` text,
	`redirect_uris` text NOT NULL,
	`post_logout_redirect_uris` text,
	`backchannel_logout_uri` text,
	`backchannel_logout_session_required` integer,
	`token_endpoint_auth_method` text,
	`jwks` text,
	`jwks_uri` text,
	`grant_types` text,
	`response_types` text,
	`public` integer,
	`type` text,
	`require_pkce` integer,
	`dpop_bound_access_tokens` integer DEFAULT false,
	`reference_id` text,
	`metadata` text,
	CONSTRAINT `oauth_clients_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_consents` (
	`id` text PRIMARY KEY,
	`client_id` text NOT NULL,
	`user_id` text,
	`reference_id` text,
	`resources` text,
	`requested_user_info_claims` text,
	`scopes` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `oauth_consents_clientId_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_consents_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_refresh_tokens` (
	`id` text PRIMARY KEY,
	`token` text NOT NULL UNIQUE,
	`client_id` text NOT NULL,
	`session_id` text,
	`user_id` text NOT NULL,
	`reference_id` text,
	`authorization_code_id` text,
	`resources` text,
	`requested_user_info_claims` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`revoked` integer,
	`rotated_at` integer,
	`rotation_replay_response` text,
	`rotation_replay_expires_at` integer,
	`auth_time` integer,
	`confirmation` text,
	`scopes` text NOT NULL,
	CONSTRAINT `oauth_refresh_tokens_clientId_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`client_id`) ON DELETE CASCADE,
	CONSTRAINT `oauth_refresh_tokens_sessionId_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL,
	CONSTRAINT `oauth_refresh_tokens_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `oauth_resources` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`access_token_ttl` integer,
	`refresh_token_ttl` integer,
	`signing_algorithm` text,
	`signing_key_id` text,
	`allowed_scopes` text,
	`custom_claims` text,
	`dpop_bound_access_tokens_required` integer DEFAULT false,
	`disabled` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	`policy_version` integer DEFAULT 1,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `post_review_jobs` (
	`id` text PRIMARY KEY,
	`post_slug` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` integer NOT NULL,
	`locked_at` integer,
	`last_error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `post_review_jobs_postSlug_fkey` FOREIGN KEY (`post_slug`) REFERENCES `posts`(`slug`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `post_reviews` (
	`id` text PRIMARY KEY,
	`post_slug` text NOT NULL,
	`model` text NOT NULL,
	`status` text NOT NULL,
	`issues` text NOT NULL,
	`suggested_content` text,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `post_reviews_postSlug_fkey` FOREIGN KEY (`post_slug`) REFERENCES `posts`(`slug`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `excerpt` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `scheduled_at` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `author_user_id` text CONSTRAINT `posts_authorUserId_fkey` REFERENCES users(id) ON DELETE SET NULL;--> statement-breakpoint
UPDATE `posts` SET `published_at` = `created_at` WHERE `published_at` IS NULL;--> statement-breakpoint
CREATE INDEX `admin_action_plans_actorUserId_createdAt_idx` ON `admin_action_plans` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `admin_action_plans_status_expiresAt_idx` ON `admin_action_plans` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `admin_audit_events_planId_idx` ON `admin_audit_events` (`plan_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_events_actorUserId_createdAt_idx` ON `admin_audit_events` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `oauth_access_tokens_clientId_idx` ON `oauth_access_tokens` (`client_id`);--> statement-breakpoint
CREATE INDEX `oauth_access_tokens_sessionId_idx` ON `oauth_access_tokens` (`session_id`);--> statement-breakpoint
CREATE INDEX `oauth_access_tokens_userId_idx` ON `oauth_access_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_access_tokens_authorizationCodeId_idx` ON `oauth_access_tokens` (`authorization_code_id`);--> statement-breakpoint
CREATE INDEX `oauth_access_tokens_refreshId_idx` ON `oauth_access_tokens` (`refresh_id`);--> statement-breakpoint
CREATE INDEX `oauth_client_resources_clientId_idx` ON `oauth_client_resources` (`client_id`);--> statement-breakpoint
CREATE INDEX `oauth_client_resources_resourceId_idx` ON `oauth_client_resources` (`resource_id`);--> statement-breakpoint
CREATE INDEX `oauth_clients_userId_idx` ON `oauth_clients` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_consents_clientId_idx` ON `oauth_consents` (`client_id`);--> statement-breakpoint
CREATE INDEX `oauth_consents_userId_idx` ON `oauth_consents` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_refresh_tokens_clientId_idx` ON `oauth_refresh_tokens` (`client_id`);--> statement-breakpoint
CREATE INDEX `oauth_refresh_tokens_sessionId_idx` ON `oauth_refresh_tokens` (`session_id`);--> statement-breakpoint
CREATE INDEX `oauth_refresh_tokens_userId_idx` ON `oauth_refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `oauth_refresh_tokens_authorizationCodeId_idx` ON `oauth_refresh_tokens` (`authorization_code_id`);--> statement-breakpoint
CREATE INDEX `post_review_jobs_status_availableAt_idx` ON `post_review_jobs` (`status`,`available_at`);--> statement-breakpoint
CREATE INDEX `post_review_jobs_postSlug_createdAt_idx` ON `post_review_jobs` (`post_slug`,`created_at`);--> statement-breakpoint
CREATE INDEX `post_reviews_postSlug_createdAt_idx` ON `post_reviews` (`post_slug`,`created_at`);--> statement-breakpoint
CREATE INDEX `posts_status_publishedAt_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_status_scheduledAt_idx` ON `posts` (`status`,`scheduled_at`);
