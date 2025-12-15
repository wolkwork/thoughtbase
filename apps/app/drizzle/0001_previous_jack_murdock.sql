CREATE TABLE "changelog" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"published_at" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changelog_idea" (
	"changelog_id" text NOT NULL,
	"idea_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "changelog_idea_changelog_id_idea_id_pk" PRIMARY KEY("changelog_id","idea_id")
);
--> statement-breakpoint
ALTER TABLE "external_user" ADD COLUMN "revenue" integer;--> statement-breakpoint
ALTER TABLE "external_user" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "idea" ADD COLUMN "eta" timestamp;--> statement-breakpoint
ALTER TABLE "changelog" ADD CONSTRAINT "changelog_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_idea" ADD CONSTRAINT "changelog_idea_changelog_id_changelog_id_fk" FOREIGN KEY ("changelog_id") REFERENCES "public"."changelog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_idea" ADD CONSTRAINT "changelog_idea_idea_id_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changelog_organizationId_idx" ON "changelog" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "changelog_status_idx" ON "changelog" USING btree ("status");--> statement-breakpoint
CREATE INDEX "changelog_publishedAt_idx" ON "changelog" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "changelogIdea_changelogId_idx" ON "changelog_idea" USING btree ("changelog_id");--> statement-breakpoint
CREATE INDEX "changelogIdea_ideaId_idx" ON "changelog_idea" USING btree ("idea_id");