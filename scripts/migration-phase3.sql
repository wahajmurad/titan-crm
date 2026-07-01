-- ============================================================
-- TITAN CRM Phase 3 — Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Add new 10-category audit columns to WebsiteAudit
-- (if old columns exist, rename/drop them; if not, just add new ones)

-- First, try to drop old columns if they exist (safe with IF EXISTS)
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "designScore";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "technicalScore";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "businessScore";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "automationScore";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "designDetails";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "technicalDetails";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "businessDetails";
ALTER TABLE "WebsiteAudit" DROP COLUMN IF EXISTS "automationDetails";

-- Add 10 new score columns (IF NOT EXISTS pattern via DO blocks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'uiScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "uiScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'uxScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "uxScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'seoScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "seoScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'performanceScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "performanceScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'accessibilityScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "accessibilityScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'mobileScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "mobileScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'securityScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "securityScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'aiReadinessScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "aiReadinessScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'automationScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "automationScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'conversionScore') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "conversionScore" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add 10 detail columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'uiDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "uiDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'uxDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "uxDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'seoDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "seoDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'performanceDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "performanceDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'accessibilityDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "accessibilityDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'mobileDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "mobileDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'securityDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "securityDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'aiReadinessDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "aiReadinessDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'automationDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "automationDetails" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'conversionDetails') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "conversionDetails" TEXT;
  END IF;
END $$;

-- Add missing business intel columns (if not exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'pitchStrategy') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "pitchStrategy" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WebsiteAudit' AND column_name = 'talkingPoints') THEN
    ALTER TABLE "WebsiteAudit" ADD COLUMN "talkingPoints" TEXT;
  END IF;
END $$;

-- ============================================================
-- STEP 2: Create LeadProvider table (Phase 3 new feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS "LeadProvider" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'custom',
  "apiUrl" TEXT,
  "apiKey" TEXT,
  "authType" TEXT NOT NULL DEFAULT 'none',
  "authHeader" TEXT,
  "authValue" TEXT,
  "headers" TEXT,
  "params" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3),
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "failCount" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeadProvider_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadProvider_type_idx" ON "LeadProvider"("type");
CREATE INDEX IF NOT EXISTS "LeadProvider_isActive_idx" ON "LeadProvider"("isActive");

-- ============================================================
-- DONE! All Phase 3 columns and tables are now ready.
-- ============================================================
