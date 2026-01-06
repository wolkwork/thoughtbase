CREATE TABLE "webhook_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event" text NOT NULL,
	"webhook_url" text NOT NULL,
	"api_key_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_api_key_id_apikey_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."apikey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_subscription_org_event_idx" ON "webhook_subscription" USING btree ("organization_id","event");--> statement-breakpoint
CREATE INDEX "webhook_subscription_api_key_idx" ON "webhook_subscription" USING btree ("api_key_id");