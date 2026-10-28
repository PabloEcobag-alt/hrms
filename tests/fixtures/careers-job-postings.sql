CREATE TABLE "job_postings" (

	"id" text PRIMARY KEY NOT NULL,
 "announced_at" timestamptz,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text NOT NULL,
 "responsibilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
 "benefits" jsonb NOT NULL DEFAULT '[]'::jsonb,
	"employment_type" text NOT NULL,
	"location" text NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"required_documents" jsonb NOT NULL,
	"screening_criteria" jsonb NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
