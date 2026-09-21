CREATE TABLE "enrich_dismissals" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"note_id" uuid NOT NULL,
	"kind" text NOT NULL,
	CONSTRAINT "enrich_dismissals_user_id_note_id_kind_pk" PRIMARY KEY("user_id","note_id","kind")
);
