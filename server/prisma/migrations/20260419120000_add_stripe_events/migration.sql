-- Stripe webhook idempotency table.
-- Inserting the event ID before processing guarantees each webhook mutates
-- state exactly once, even under Stripe's at-least-once retry semantics.

CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StripeEvent_processedAt_idx" ON "StripeEvent"("processedAt");
