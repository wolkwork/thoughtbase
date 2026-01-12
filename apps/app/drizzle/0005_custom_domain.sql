ALTER TABLE "organization" ADD COLUMN "custom_domain" text;
ALTER TABLE "organization" ADD COLUMN "domain_verification_token" text;
ALTER TABLE "organization" ADD COLUMN "domain_verified_at" timestamp;
ALTER TABLE "organization" ADD COLUMN "domain_verification_status" text;

