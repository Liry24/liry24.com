-- SQLite cannot add a NOT NULL column without a default to an existing table.
-- Backfill legacy Cron jobs from the post they were created for instead.
ALTER TABLE `post_review_jobs` ADD `input` text;--> statement-breakpoint
UPDATE `post_review_jobs`
SET `input` = COALESCE(
    (SELECT json_object('title', `title`, 'excerpt', `excerpt`, 'content', `content`)
     FROM `posts` WHERE `posts`.`slug` = `post_review_jobs`.`post_slug`),
    json_object('title', '', 'excerpt', '', 'content', '')
)
WHERE `input` IS NULL;--> statement-breakpoint
ALTER TABLE `post_reviews` ADD `job_id` text;--> statement-breakpoint
ALTER TABLE `post_reviews` ADD `source_content` text;--> statement-breakpoint
ALTER TABLE `post_reviews` ADD `summary` text;--> statement-breakpoint
ALTER TABLE `post_reviews` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `schedule_revision` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `publish_workflow_instance_id` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `publish_workflow_engine` text;--> statement-breakpoint
CREATE INDEX `post_reviews_jobId_idx` ON `post_reviews` (`job_id`);
