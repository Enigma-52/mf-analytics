CREATE TABLE "funds" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amc" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
