-- TITAN AI Growth OS — Complete Database Setup for Supabase
-- Run this in Supabase SQL Editor (replaces all previous tables)

-- Drop all existing tables
DROP TABLE IF EXISTS "Activity" CASCADE;
DROP TABLE IF EXISTS "Outreach" CASCADE;
DROP TABLE IF EXISTS "Meeting" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
DROP TABLE IF EXISTS "Lead" CASCADE;
DROP TABLE IF EXISTS "Business" CASCADE;
DROP TABLE IF EXISTS "WebsiteAudit" CASCADE;
DROP TABLE IF EXISTS "Campaign" CASCADE;
DROP TABLE IF EXISTS "PromptTemplate" CASCADE;
DROP TABLE IF EXISTS "AppSetting" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- User
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT DEFAULT 'TEAM',
  "avatar" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

-- Permission
CREATE TABLE "Permission" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "module" TEXT NOT NULL,
  "canView" BOOLEAN DEFAULT false,
  "canCreate" BOOLEAN DEFAULT false,
  "canEdit" BOOLEAN DEFAULT false,
  "canDelete" BOOLEAN DEFAULT false,
  CONSTRAINT "Permission_userId_module_key" UNIQUE ("userId", "module")
);
CREATE INDEX "Permission_userId_idx" ON "Permission"("userId");

-- Business
CREATE TABLE "Business" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "website" TEXT,
  "industry" TEXT,
  "city" TEXT,
  "country" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "socialProfiles" TEXT,
  "companySize" TEXT,
  "businessCategory" TEXT,
  "source" TEXT,
  "discoveredAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "Business_industry_idx" ON "Business"("industry");
CREATE INDEX "Business_country_idx" ON "Business"("country");

-- Lead
CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId" TEXT UNIQUE NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "stage" TEXT DEFAULT 'DISCOVERED',
  "score" INTEGER DEFAULT 0,
  "qualificationScore" INTEGER DEFAULT 0,
  "temperature" TEXT DEFAULT 'COLD',
  "aiAnalysis" TEXT,
  "problems" TEXT,
  "recommendedSolution" TEXT,
  "decisionMaker" TEXT,
  "decisionMakerRole" TEXT,
  "decisionMakerEmail" TEXT,
  "notes" TEXT,
  "assignedToId" TEXT REFERENCES "User"("id"),
  "campaignId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");
CREATE INDEX "Lead_businessId_idx" ON "Lead"("businessId");
CREATE INDEX "Lead_campaignId_idx" ON "Lead"("campaignId");
CREATE INDEX "Lead_temperature_idx" ON "Lead"("temperature");

-- Outreach
CREATE TABLE "Outreach" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "campaignId" TEXT,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT DEFAULT 'DRAFT',
  "type" TEXT DEFAULT 'INITIAL',
  "followUpNumber" INTEGER DEFAULT 0,
  "sentAt" TIMESTAMP,
  "openedAt" TIMESTAMP,
  "repliedAt" TIMESTAMP,
  "scheduledFor" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "Outreach_leadId_idx" ON "Outreach"("leadId");
CREATE INDEX "Outreach_status_idx" ON "Outreach"("status");
CREATE INDEX "Outreach_campaignId_idx" ON "Outreach"("campaignId");

-- Meeting
CREATE TABLE "Meeting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP NOT NULL,
  "duration" INTEGER DEFAULT 30,
  "status" TEXT DEFAULT 'SCHEDULED',
  "location" TEXT,
  "meetingLink" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "Meeting_leadId_idx" ON "Meeting"("leadId");
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- Activity
CREATE TABLE "Activity" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "leadId" TEXT REFERENCES "Lead"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- AppSetting
CREATE TABLE "AppSetting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Campaign
CREATE TABLE "Campaign" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "industry" TEXT,
  "targetLocation" TEXT,
  "targetCity" TEXT,
  "targetSize" TEXT,
  "serviceOffering" TEXT,
  "dailyLimit" INTEGER DEFAULT 20,
  "aiModel" TEXT DEFAULT 'default',
  "notes" TEXT,
  "status" TEXT DEFAULT 'ACTIVE',
  "leadCount" INTEGER DEFAULT 0,
  "sentCount" INTEGER DEFAULT 0,
  "replyCount" INTEGER DEFAULT 0,
  "meetingCount" INTEGER DEFAULT 0,
  "wonCount" INTEGER DEFAULT 0,
  "ownerId" TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "Campaign_ownerId_idx" ON "Campaign"("ownerId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_industry_idx" ON "Campaign"("industry");

-- WebsiteAudit
CREATE TABLE "WebsiteAudit" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId" TEXT UNIQUE REFERENCES "Business"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "designScore" INTEGER DEFAULT 0,
  "technicalScore" INTEGER DEFAULT 0,
  "businessScore" INTEGER DEFAULT 0,
  "automationScore" INTEGER DEFAULT 0,
  "overallScore" INTEGER DEFAULT 0,
  "designDetails" TEXT,
  "technicalDetails" TEXT,
  "businessDetails" TEXT,
  "automationDetails" TEXT,
  "opportunities" TEXT,
  "recommendations" TEXT,
  "talkingPoints" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "WebsiteAudit_businessId_idx" ON "WebsiteAudit"("businessId");
CREATE INDEX "WebsiteAudit_overallScore_idx" ON "WebsiteAudit"("overallScore");

-- PromptTemplate
CREATE TABLE "PromptTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX "PromptTemplate_category_idx" ON "PromptTemplate"("category");

-- Add campaign FK to Lead (PostgreSQL doesn't support FK to non-existent table during creation)
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL;
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL;