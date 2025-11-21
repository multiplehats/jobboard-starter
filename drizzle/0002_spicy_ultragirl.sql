CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD');--> statement-breakpoint
CREATE TYPE "public"."salary_period" AS ENUM('year', 'month', 'hour');--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "salary_currency" SET DEFAULT 'USD'::"public"."currency";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "salary_currency" SET DATA TYPE "public"."currency" USING "salary_currency"::"public"."currency";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "salary_currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "salary_period" SET DEFAULT 'year'::"public"."salary_period";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "salary_period" SET DATA TYPE "public"."salary_period" USING "salary_period"::"public"."salary_period";--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "salary_period" SET NOT NULL;