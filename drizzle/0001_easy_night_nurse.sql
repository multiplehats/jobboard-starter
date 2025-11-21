CREATE TYPE "public"."hiring_location_type" AS ENUM('worldwide', 'timezone');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'awaiting_payment', 'awaiting_approval', 'published', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('full_time', 'part_time', 'contract', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TYPE "public"."seniority_level" AS ENUM('entry-level', 'mid-level', 'senior', 'manager', 'director', 'executive');--> statement-breakpoint
CREATE TYPE "public"."working_permits_type" AS ENUM('no-specific', 'required');--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "location_type" SET DATA TYPE "public"."location_type" USING "location_type"::"public"."location_type";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "job_type" SET DATA TYPE "public"."job_type" USING "job_type"::"public"."job_type";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."job_status";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "status" SET DATA TYPE "public"."job_status" USING "status"::"public"."job_status";