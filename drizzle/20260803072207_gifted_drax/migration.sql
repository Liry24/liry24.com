CREATE TABLE `person_links` (
	`id` text PRIMARY KEY,
	`person_id` text NOT NULL,
	`href` text NOT NULL,
	`label` text NOT NULL,
	CONSTRAINT `person_links_personId_fkey` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`image` text
);
--> statement-breakpoint
CREATE TABLE `work_persons` (
	`id` text PRIMARY KEY,
	`work_slug` text NOT NULL,
	`person_id` text NOT NULL,
	CONSTRAINT `work_persons_workSlug_fkey` FOREIGN KEY (`work_slug`) REFERENCES `works`(`slug`) ON DELETE CASCADE,
	CONSTRAINT `work_persons_personId_fkey` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `works` ADD `price` text;--> statement-breakpoint
ALTER TABLE `works` ADD `style` text DEFAULT 'small' NOT NULL;--> statement-breakpoint
CREATE INDEX `person_links_personId_idx` ON `person_links` (`person_id`);--> statement-breakpoint
CREATE INDEX `work_persons_workSlug_idx` ON `work_persons` (`work_slug`);