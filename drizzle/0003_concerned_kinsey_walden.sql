CREATE TYPE "public"."desired_salary_currency" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('modal_shown', 'cta_clicked', 'external_opened');--> statement-breakpoint
CREATE TYPE "public"."payment_currency" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
ALTER TABLE "talent_profiles" ALTER COLUMN "desired_salary_currency" SET DEFAULT 'USD'::"public"."desired_salary_currency";--> statement-breakpoint
ALTER TABLE "talent_profiles" ALTER COLUMN "desired_salary_currency" SET DATA TYPE "public"."desired_salary_currency" USING "desired_salary_currency"::"public"."desired_salary_currency";--> statement-breakpoint
ALTER TABLE "talent_profiles" ALTER COLUMN "profile_visibility" SET DEFAULT 'public'::"public"."profile_visibility";--> statement-breakpoint
ALTER TABLE "talent_profiles" ALTER COLUMN "profile_visibility" SET DATA TYPE "public"."profile_visibility" USING "profile_visibility"::"public"."profile_visibility";--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "job_payments" ALTER COLUMN "currency" SET DEFAULT 'EUR'::"public"."payment_currency";--> statement-breakpoint
ALTER TABLE "job_payments" ALTER COLUMN "currency" SET DATA TYPE "public"."payment_currency" USING "currency"::"public"."payment_currency";--> statement-breakpoint
ALTER TABLE "job_payments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "job_payments" ALTER COLUMN "status" SET DATA TYPE "public"."payment_status" USING "status"::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "selected_upsells" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "has_newsletter_feature";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "has_extended_duration";