-- Maximum allocation per individual investor, per programme.
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "maxAmount" INTEGER;
