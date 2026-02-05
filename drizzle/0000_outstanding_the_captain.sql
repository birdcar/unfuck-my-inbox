CREATE TABLE "user_preferences" (
	"workos_user_id" text PRIMARY KEY NOT NULL,
	"aggressiveness" text DEFAULT 'aggressive' NOT NULL,
	"protected_senders" jsonb DEFAULT '[]'::jsonb,
	"notify_on_complete" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
