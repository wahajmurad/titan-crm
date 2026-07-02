import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { aiChat } from '@/lib/ai'

// ═══════════════════════════════════════════════════════════════════
// PERSONALIZATION ENGINE — The Core USP of TITAN
// Full pipeline: Research → Analyze → Audit → Intel → Solutions →
//   Outreach → Quality Score (auto-revise if < 90%)
// ═══════════════════════════════════════════════════════════════════

interface PipelineStepResult {
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  duration?: number
  output?: Record<string, unknown>
  error?: string
}

const PIPELINE_STEPS = [
  'research_company',
  'analyze_website',
  'analyze_industry',
  'analyze_competitors',
  'identify_problems',
  'identify_opportunities',
  'recommend_ai_solutions',
  'generate_assets',
  'generate_outreach',
  'quality_check',
] as const

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leadId, companyName, website, industry, location, companySize, generateAssets = true } = body

    // Resolve lead data if leadId provided
    let resolvedCompany = companyName
    let resolvedWebsite = website
    let resolvedIndustry = industry
    let resolvedLocation = location
    let resolvedCompanySize = companySize
    let businessId: string | null = null

    if (leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: { business: true },
      })
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      businessId = lead.businessId
      resolvedCompany = resolvedCompany || lead.business.name
      resolvedWebsite = resolvedWebsite || lead.business.website || undefined
      resolvedIndustry = resolvedIndustry || lead.business.industry || undefined
      resolvedLocation = resolvedLocation || lead.business.city || undefined
      resolvedCompanySize = resolvedCompanySize || lead.business.companySize || undefined
    }

    if (!resolvedCompany?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Run the full personalization pipeline
    const results: Record<string, PipelineStepResult> = {}
    const context: Record<string, unknown> = {}

    // ═══ STEP 1: RESEARCH COMPANY ═══
    results.research_company = { step: 'Research Company', status: 'running' }
    const t1 = Date.now()
    try {
      const researchPrompt = buildResearchPrompt(resolvedCompany, resolvedWebsite, resolvedIndustry, resolvedLocation, resolvedCompanySize)
      const researchRaw = await aiChat(researchPrompt, 0.4, 4000)
      const researchParsed = extractJSON(researchRaw)
      context.research = researchParsed
      results.research_company = { step: 'Research Company', status: 'completed', duration: Date.now() - t1, output: researchParsed }
    } catch (e) {
      results.research_company = { step: 'Research Company', status: 'failed', duration: Date.now() - t1, error: String(e) }
    }

    // ═══ STEP 2: ANALYZE WEBSITE ═══
    if (resolvedWebsite) {
      results.analyze_website = { step: 'Analyze Website', status: 'running' }
      const t2 = Date.now()
      try {
        // Fetch existing audit or generate quick analysis
        const hostname = resolvedWebsite.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        const existingAudit = await db.websiteAudit.findFirst({
          where: { url: { contains: hostname } },
        })
        if (existingAudit) {
          context.audit = {
            overallScore: existingAudit.overallScore,
            uiScore: existingAudit.uiScore,
            uxScore: existingAudit.uxScore,
            seoScore: existingAudit.seoScore,
            performanceScore: existingAudit.performanceScore,
            accessibilityScore: existingAudit.accessibilityScore,
            mobileScore: existingAudit.mobileScore,
            securityScore: existingAudit.securityScore,
            aiReadinessScore: existingAudit.aiReadinessScore,
            automationScore: existingAudit.automationScore,
            conversionScore: existingAudit.conversionScore,
            problemsFound: existingAudit.problemsFound,
            opportunities: existingAudit.opportunities,
            recommendations: existingAudit.recommendations,
            executiveSummary: existingAudit.executiveSummary,
          }
        } else {
          const websitePrompt = buildWebsiteAnalysisPrompt(resolvedWebsite, resolvedCompany)
          const websiteRaw = await aiChat(websitePrompt, 0.3, 3000)
          context.audit = extractJSON(websiteRaw)
        }
        results.analyze_website = { step: 'Analyze Website', status: 'completed', duration: Date.now() - t2, output: context.audit as Record<string, unknown> }
      } catch (e) {
        results.analyze_website = { step: 'Analyze Website', status: 'failed', duration: Date.now() - t2, error: String(e) }
      }
    } else {
      results.analyze_website = { step: 'Analyze Website', status: 'skipped', error: 'No website provided' }
    }

    // ═══ STEP 3: ANALYZE INDUSTRY ═══
    results.analyze_industry = { step: 'Analyze Industry', status: 'running' }
    const t3 = Date.now()
    try {
      const industryPrompt = buildIndustryPrompt(resolvedCompany, resolvedIndustry, context.research)
      const industryRaw = await aiChat(industryPrompt, 0.5, 3000)
      context.industry = extractJSON(industryRaw)
      results.analyze_industry = { step: 'Analyze Industry', status: 'completed', duration: Date.now() - t3, output: context.industry as Record<string, unknown> }
    } catch (e) {
      results.analyze_industry = { step: 'Analyze Industry', status: 'failed', duration: Date.now() - t3, error: String(e) }
    }

    // ═══ STEP 4: ANALYZE COMPETITORS ═══
    results.analyze_competitors = { step: 'Analyze Competitors', status: 'running' }
    const t4 = Date.now()
    try {
      const competitorPrompt = buildCompetitorPrompt(resolvedCompany, resolvedIndustry, context.research)
      const competitorRaw = await aiChat(competitorPrompt, 0.5, 3000)
      context.competitors = extractJSON(competitorRaw)
      results.analyze_competitors = { step: 'Analyze Competitors', status: 'completed', duration: Date.now() - t4, output: context.competitors as Record<string, unknown> }
    } catch (e) {
      results.analyze_competitors = { step: 'Analyze Competitors', status: 'failed', duration: Date.now() - t4, error: String(e) }
    }

    // ═══ STEP 5: IDENTIFY PROBLEMS ═══
    results.identify_problems = { step: 'Identify Problems', status: 'running' }
    const t5 = Date.now()
    try {
      const problemsPrompt = buildProblemsPrompt(resolvedCompany, context)
      const problemsRaw = await aiChat(problemsPrompt, 0.4, 3000)
      context.problems = extractJSON(problemsRaw)
      results.identify_problems = { step: 'Identify Problems', status: 'completed', duration: Date.now() - t5, output: context.problems as Record<string, unknown> }
    } catch (e) {
      results.identify_problems = { step: 'Identify Problems', status: 'failed', duration: Date.now() - t5, error: String(e) }
    }

    // ═══ STEP 6: IDENTIFY OPPORTUNITIES ═══
    results.identify_opportunities = { step: 'Identify Opportunities', status: 'running' }
    const t6 = Date.now()
    try {
      const oppPrompt = buildOpportunitiesPrompt(resolvedCompany, context)
      const oppRaw = await aiChat(oppPrompt, 0.5, 3000)
      context.opportunities = extractJSON(oppRaw)
      results.identify_opportunities = { step: 'Identify Opportunities', status: 'completed', duration: Date.now() - t6, output: context.opportunities as Record<string, unknown> }
    } catch (e) {
      results.identify_opportunities = { step: 'Identify Opportunities', status: 'failed', duration: Date.now() - t6, error: String(e) }
    }

    // ═══ STEP 7: RECOMMEND AI SOLUTIONS ═══
    results.recommend_ai_solutions = { step: 'Recommend AI Solutions', status: 'running' }
    const t7 = Date.now()
    try {
      const solutionsPrompt = buildSolutionsPrompt(resolvedCompany, resolvedIndustry, context)
      const solutionsRaw = await aiChat(solutionsPrompt, 0.4, 4000)
      context.solutions = extractJSON(solutionsRaw)
      results.recommend_ai_solutions = { step: 'Recommend AI Solutions', status: 'completed', duration: Date.now() - t7, output: context.solutions as Record<string, unknown> }
    } catch (e) {
      results.recommend_ai_solutions = { step: 'Recommend AI Solutions', status: 'failed', duration: Date.now() - t7, error: String(e) }
    }

    // ═══ STEP 8: GENERATE SALES ANGLES ═══
    results.generate_assets = { step: 'Generate Personalized Assets', status: 'running' }
    const t8 = Date.now()
    try {
      // Generate ranked sales angles as part of asset pipeline
      const anglesPrompt = buildSalesAnglesPrompt(resolvedCompany, resolvedIndustry, context)
      const anglesRaw = await aiChat(anglesPrompt, 0.5, 3000)
      const anglesParsed = extractArray(anglesRaw)
      context.salesAngles = anglesParsed.map((a: Record<string, unknown>, i: number) => ({
        angleName: String(a.angleName || a.name || `Angle ${i + 1}`),
        hook: String(a.hook || ''),
        subjectLine: String(a.subjectLine || ''),
        openingLine: String(a.openingLine || ''),
        valueProposition: String(a.valueProposition || ''),
        emotionalTrigger: String(a.emotionalTrigger || ''),
        bestFor: a.bestFor || 'cold',
        estimatedEffectiveness: a.estimatedEffectiveness || 'Medium',
        effectivenessScore: Number(a.effectivenessScore) || (a.estimatedEffectiveness === 'High' ? 85 : a.estimatedEffectiveness === 'Medium' ? 60 : 35),
      }))
      // Sort by effectiveness score descending
      ;(context.salesAngles as any[]).sort((a: any, b: any) => (b.effectivenessScore || 0) - (a.effectivenessScore || 0))

      context.assets = {
        email: null,
        linkedin: null,
        salesAngles: (context.salesAngles as unknown[]).length,
        auditReport: generateAssets ? 'ready' : 'skipped',
        htmlDemo: generateAssets ? 'ready' : 'skipped',
        growthBlueprint: generateAssets ? 'ready' : 'skipped',
        roiReport: generateAssets ? 'ready' : 'skipped',
      }
      results.generate_assets = { step: 'Generate Personalized Assets', status: 'completed', duration: Date.now() - t8, output: context.assets as Record<string, unknown> }
    } catch (e) {
      context.assets = { salesAngles: 0, auditReport: 'skipped', htmlDemo: 'skipped', growthBlueprint: 'skipped', roiReport: 'skipped' }
      results.generate_assets = { step: 'Generate Personalized Assets', status: 'failed', duration: Date.now() - t8, error: String(e) }
    }

    // ═══ STEP 9: GENERATE OUTREACH ═══
    results.generate_outreach = { step: 'Generate Outreach', status: 'running' }
    const t9 = Date.now()
    try {
      const outreachPrompt = buildOutreachPrompt(resolvedCompany, context)
      const outreachRaw = await aiChat(outreachPrompt, 0.6, 3000)
      context.outreach = extractJSON(outreachRaw)
      results.generate_outreach = { step: 'Generate Outreach', status: 'completed', duration: Date.now() - t9, output: context.outreach as Record<string, unknown> }
    } catch (e) {
      results.generate_outreach = { step: 'Generate Outreach', status: 'failed', duration: Date.now() - t9, error: String(e) }
    }

    // ═══ STEP 10: QUALITY CHECK — Auto-revise if below 90% ═══
    results.quality_check = { step: 'Quality Check', status: 'running' }
    const t10 = Date.now()
    try {
      const qualityPrompt = buildQualityPrompt(resolvedCompany, context)
      const qualityRaw = await aiChat(qualityPrompt, 0.3, 2000)
      const qualityScores = extractJSON(qualityRaw) as Record<string, number>

      let finalOutreach = context.outreach
      let revisionCount = 0

      // Auto-revise loop — max 3 attempts
      while ((qualityScores.overall || 0) < 90 && revisionCount < 3) {
        revisionCount++
        const revisePrompt = buildRevisePrompt(resolvedCompany, context, qualityScores)
        const revisedRaw = await aiChat(revisePrompt, 0.6, 3000)
        const revisedOutreach = extractJSON(revisedRaw)

        // Re-score
        const reScorePrompt = buildQualityPrompt(resolvedCompany, { ...context, outreach: revisedOutreach })
        const reScoreRaw = await aiChat(reScorePrompt, 0.3, 2000)
        const reScore = extractJSON(reScoreRaw) as Record<string, number>

        if ((reScore.overall || 0) > (qualityScores.overall || 0)) {
          Object.assign(qualityScores, reScore)
          finalOutreach = revisedOutreach
        } else {
          break
        }
      }

      context.qualityScores = qualityScores
      context.finalOutreach = finalOutreach
      context.revisionCount = revisionCount
      context.qualityPassed = (qualityScores.overall || 0) >= 90

      results.quality_check = {
        step: 'Quality Check',
        status: 'completed',
        duration: Date.now() - t10,
        output: {
          scores: qualityScores,
          passed: (qualityScores.overall || 0) >= 90,
          revisions: revisionCount,
        },
      }
    } catch (e) {
      results.quality_check = { step: 'Quality Check', status: 'failed', duration: Date.now() - t10, error: String(e) }
    }

    // Save CompanyIntel if we have a businessId
    if (businessId && context.research) {
      const r = context.research as Record<string, unknown>
      try {
        await db.companyIntel.upsert({
          where: { businessId },
          update: {
            businessOverview: String(r.businessSummary || r.businessOverview || ''),
            coreServices: String(r.coreServices || ''),
            idealCustomers: String(r.idealCustomers || ''),
            uniqueSellingProp: String(r.uniqueSellingProposition || r.uniqueSellingProp || ''),
            strengths: JSON.stringify(r.businessStrengths || r.strengths || []),
            weaknesses: JSON.stringify(r.businessWeaknesses || r.weaknesses || []),
            painPoints: JSON.stringify(r.painPoints || []),
            growthOpportunities: JSON.stringify(r.growthOpportunities || []),
            automationOpportunities: JSON.stringify(r.automationOpportunities || []),
            aiOpportunities: JSON.stringify(r.aiOpportunities || []),
            trustSignals: JSON.stringify(r.trustSignals || []),
            websiteQuality: String(r.websiteQuality || ''),
            estimatedRevenue: String(r.estimatedRevenue || ''),
            recommendedOutreachStyle: String(r.recommendedOutreachStyle || ''),
            personalizationNotes: String(r.personalizationNotes || ''),
            competitors: JSON.stringify((context.competitors as Record<string, unknown>)?.list || (context.competitors as Record<string, unknown>)?.competitors || []),
            techStack: JSON.stringify((context.research as Record<string, unknown>)?.techStack || []),
          },
          create: {
            businessId,
            businessOverview: String(r.businessSummary || ''),
            coreServices: String(r.coreServices || ''),
            idealCustomers: String(r.idealCustomers || ''),
            uniqueSellingProp: String(r.uniqueSellingProposition || ''),
            strengths: JSON.stringify(r.businessStrengths || []),
            weaknesses: JSON.stringify(r.businessWeaknesses || []),
            painPoints: JSON.stringify(r.painPoints || []),
            growthOpportunities: JSON.stringify(r.growthOpportunities || []),
            automationOpportunities: JSON.stringify(r.automationOpportunities || []),
            aiOpportunities: JSON.stringify(r.aiOpportunities || []),
            trustSignals: JSON.stringify(r.trustSignals || []),
            websiteQuality: String(r.websiteQuality || ''),
            estimatedRevenue: String(r.estimatedRevenue || ''),
            recommendedOutreachStyle: String(r.recommendedOutreachStyle || ''),
            personalizationNotes: String(r.personalizationNotes || ''),
          },
        })
      } catch (e) {
        console.error('[Personalization] Failed to save CompanyIntel:', e)
      }
    }

    // Save PersonalizationScore
    if (businessId && context.qualityScores) {
      const qs = context.qualityScores as Record<string, number>
      try {
        await db.personalizationScore.create({
          data: {
            businessId,
            overallScore: qs.overall || 0,
            specificityScore: qs.specificity || 0,
            relevanceScore: qs.relevance || 0,
            valueScore: qs.value || 0,
            toneScore: qs.tone || 0,
            ctaScore: qs.cta || 0,
            notes: `Pipeline completed. Revisions: ${context.revisionCount || 0}. Passed: ${context.qualityPassed ? 'Yes' : 'No'}`,
          },
        })
      } catch (e) {
        console.error('[Personalization] Failed to save PersonalizationScore:', e)
      }
    }

    return NextResponse.json({
      success: true,
      companyName: resolvedCompany,
      pipelineSteps: PIPELINE_STEPS.map(s => results[s]),
      context: {
        research: context.research,
        audit: context.audit,
        industry: context.industry,
        competitors: context.competitors,
        problems: context.problems,
        opportunities: context.opportunities,
        solutions: context.solutions,
        salesAngles: context.salesAngles,
        outreach: context.finalOutreach || context.outreach,
        qualityScores: context.qualityScores,
        qualityPassed: context.qualityPassed,
        revisionCount: context.revisionCount || 0,
      },
    })
  } catch (err) {
    console.error('[Personalization Engine]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Pipeline failed' }, { status: 500 })
  }
}

// ─── Prompt Builders ────────────────────────────────────────────

function buildResearchPrompt(company: string, website?: string, industry?: string, location?: string, size?: string): string {
  return `You are a senior business intelligence analyst. Deeply analyze "${company}" and generate a comprehensive Company Intelligence Report as JSON:
{
  "businessSummary": "2-3 sentence deep understanding of what this company does and who they serve",
  "coreServices": "detailed description of main services/products",
  "idealCustomers": "who they serve, buyer personas",
  "uniqueSellingProposition": "their actual USP — not generic",
  "businessStrengths": ["specific strength 1", "strength 2", "strength 3", "strength 4"],
  "businessWeaknesses": ["specific weakness 1", "weakness 2", "weakness 3"],
  "painPoints": ["pain point 1 with specific evidence", "pain point 2", "pain point 3", "pain point 4"],
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "automationOpportunities": ["specific process that could be automated 1", "process 2"],
  "aiOpportunities": ["specific AI use case 1 with expected impact", "use case 2", "use case 3"],
  "trustSignals": ["trust signal 1", "signal 2", "signal 3"],
  "websiteQuality": "detailed assessment of website as a business tool",
  "estimatedRevenue": "estimated annual revenue range with reasoning",
  "recommendedOutreachStyle": "how to approach this company (formal/casual/direct/consultative)",
  "personalizationNotes": "GOLD observations to use in outreach — make these hyper-specific",
  "decisionMakerInsights": "who likely makes decisions, what they care about",
  "techStack": ["technology 1", "technology 2", "technology 3"]
}
Website: ${website || 'N/A'} | Industry: ${industry || 'Unknown'} | Location: ${location || 'Unknown'} | Size: ${size || 'Unknown'}
CRITICAL: Be SPECIFIC. Every field should contain insights that could ONLY come from analyzing THIS company. Return valid JSON only.`
}

function buildWebsiteAnalysisPrompt(website: string, company: string): string {
  return `Analyze the website "${website}" for "${company}". Return JSON:
{
  "overallScore": <0-100>,
  "uiScore": <0-100>, "uxScore": <0-100>, "seoScore": <0-100>,
  "performanceScore": <0-100>, "mobileScore": <0-100>,
  "aiReadinessScore": <0-100>, "automationScore": <0-100>, "conversionScore": <0-100>,
  "keyProblems": [
    {"issue": "description", "impact": "business impact", "severity": "High|Medium|Low", "screenshot": "which page"}
  ],
  "keyOpportunities": [
    {"opportunity": "description", "potentialImpact": "estimated impact", "aiSolution": "recommended AI solution"}
  ],
  "annotatedPages": [
    {"page": "Homepage", "findings": "UX audit observations", "score": <0-100>},
    {"page": "Services", "findings": "observations", "score": <0-100>},
    {"page": "Contact", "findings": "observations", "score": <0-100>}
  ],
  "missingElements": ["No AI Chatbot", "Weak CTA", "No Booking Automation"],
  "executiveSummary": "2-3 sentence summary"
}
Return valid JSON only.`
}

function buildIndustryPrompt(company: string, industry: string, research: unknown): string {
  return `Analyze the ${industry || 'business'} industry for "${company}". Consider this research context: ${JSON.stringify(research || {})}
Return JSON:
{
  "industryOverview": "current state of the industry",
  "keyTrends": ["trend 1", "trend 2", "trend 3"],
  "commonChallenges": ["challenge 1", "challenge 2", "challenge 3"],
  "aiAdoptionRate": "Low|Medium|High",
  "competitorLandscape": "brief overview of the competitive landscape",
  "growthPotential": "High|Medium|Low",
  "recommendedAngle": "best outreach angle for companies in this industry"
}
Return valid JSON only.`
}

function buildCompetitorPrompt(company: string, industry: string, research: unknown): string {
  return `Identify 3-5 competitors of "${company}" in the ${industry || 'business'} industry. Context: ${JSON.stringify(research || {})}
Return JSON:
{
  "competitors": [
    {"name": "competitor name", "website": "url", "strengths": ["strength 1"], "weaknesses": ["weakness 1"], "marketPosition": "description"}
  ],
  "competitiveAdvantages": ["what makes this company unique vs competitors"],
  "marketGaps": ["gaps competitors are missing that this company could exploit"]
}
Return valid JSON only.`
}

function buildProblemsPrompt(company: string, context: Record<string, unknown>): string {
  return `Based on the analysis of "${company}", identify their specific business problems. Research: ${JSON.stringify(context.research || {})}
Audit: ${JSON.stringify(context.audit || {})}
Industry: ${JSON.stringify(context.industry || {})}
Return JSON:
{
  "problems": [
    {
      "problem": "specific problem description",
      "currentSituation": "what they're doing now",
      "businessImpact": "how this hurts their business — be specific with numbers",
      "opportunity": "what solving this would unlock",
      "recommendedAISolution": "specific AI solution",
      "expectedROI": "estimated ROI range",
      "priority": "Critical|High|Medium|Low",
      "evidence": "what evidence supports this"
    }
  ],
  "totalEstimatedLoss": "estimated annual loss from all problems combined"
}
Return valid JSON only.`
}

function buildOpportunitiesPrompt(company: string, context: Record<string, unknown>): string {
  return `Based on the analysis of "${company}", identify growth opportunities. Research: ${JSON.stringify(context.research || {})}
Solutions: ${JSON.stringify(context.solutions || {})}
Competitors: ${JSON.stringify(context.competitors || {})}
Return JSON:
{
  "opportunities": [
    {
      "opportunity": "description",
      "type": "Revenue|Efficiency|Customer|Innovation",
      "potentialImpact": "specific impact estimate",
      "implementationDifficulty": "Easy|Medium|Hard",
      "timeToValue": "estimated time to see results",
      "aiSolution": "recommended AI approach",
      "estimatedROI": "ROI range"
    }
  ]
}
Return valid JSON only.`
}

function buildSolutionsPrompt(company: string, industry: string, context: Record<string, unknown>): string {
  return `Design specific AI solutions for "${company}" (${industry}). Problems: ${JSON.stringify(context.problems || {})}
Opportunities: ${JSON.stringify(context.opportunities || {})}
Return JSON:
{
  "solutions": [
    {
      "name": "solution name",
      "description": "what this AI solution does specifically for this company",
      "category": "Customer Service|Automation|Analytics|Marketing|Operations|Sales",
      "implementationSteps": ["step 1", "step 2", "step 3"],
      "expectedROI": "ROI range",
      "timeToImplement": "estimated timeline",
      "confidence": "High|Medium|Low",
      "priority": 1
    }
  ],
  "totalPotentialROI": "combined estimated ROI",
  "quickWins": ["solutions that can be implemented fastest"]
}
Return valid JSON only.`
}

function buildOutreachPrompt(company: string, context: Record<string, unknown>): string {
  return `Generate hyper-personalized outreach for "${company}". This must feel like an experienced consultant spent 30 minutes researching their business.
Research: ${JSON.stringify(context.research || {})}
Problems: ${JSON.stringify(context.problems || {})}
Solutions: ${JSON.stringify(context.solutions || {})}
Industry: ${JSON.stringify(context.industry || {})}
CRITICAL RULES:
- NEVER use merge tags or templates
- Reference specific details about THIS company
- Focus on HELPING, not selling
- Be professional, respectful, helpful
- Never desperate, never spammy, never exaggerated
- Every sentence must add value
Return JSON:
{
  "emailSubject": "compelling subject line that references something specific about them",
  "emailBody": "the complete email — 150-250 words, value-first, references their specific business",
  "linkedinStrategy": {
    "action": "connect_first|engage_post|view_profile|wait",
    "reasoning": "why this approach for THIS company",
    "connectionNote": "if connecting, what to say in the connection request (max 300 chars)",
    "followUpMessage": "first message after connecting — relationship-focused, not pitch"
  },
  "keyPersonalizationPoints": ["specific point 1 used in outreach", "point 2", "point 3"],
  "tone": "professional|consultative|casual|direct",
  "valueProvided": "what value the prospect gets BEFORE any ask"
}
Return valid JSON only.`
}

function buildQualityPrompt(company: string, context: Record<string, unknown>): string {
  return `Score this outreach for "${company}" on personalization quality. Be strict and honest.
Outreach: ${JSON.stringify(context.outreach || {})}
Research: ${JSON.stringify(context.research || {})}
Return JSON:
{
  "researchQuality": <0-100>,
  "businessUnderstanding": <0-100>,
  "personalizationDepth": <0-100>,
  "offerRelevance": <0-100>,
  "emailQuality": <0-100>,
  "professionalism": <0-100>,
  "confidence": <0-100>,
  "overall": <0-100>,
  "issues": ["specific issue 1 that hurts personalization", "issue 2"],
  "improvements": ["specific improvement 1", "improvement 2"]
}
Return valid JSON only.`
}

function buildRevisePrompt(company: string, context: Record<string, unknown>, scores: Record<string, number>): string {
  return `The following outreach for "${company}" scored ${(scores.overall || 0)}/100 on personalization quality — it MUST score 90+.
Issues: ${JSON.stringify(scores.issues || [])}
Improvements: ${JSON.stringify(scores.improvements || [])}
Current outreach: ${JSON.stringify(context.outreach || {})}
Research: ${JSON.stringify(context.research || {})}
REWRITE the outreach to address every issue. Make it more specific, more valuable, more personalized.
Return the same JSON structure as before:
{
  "emailSubject": "...",
  "emailBody": "...",
  "linkedinStrategy": {...},
  "keyPersonalizationPoints": [...],
  "tone": "...",
  "valueProvided": "..."
}
Return valid JSON only.`
}

function extractJSON(raw: string): Record<string, unknown> {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return { raw }
  } catch {
    return { raw }
  }
}

function extractArray(raw: string): Record<string, unknown>[] {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    return []
  } catch {
    return []
  }
}

function buildSalesAnglesPrompt(company: string, industry: string | undefined, context: Record<string, unknown>): string {
  return `Generate 6 unique, highly specific sales angles for reaching out to "${company}" in ${industry || 'their industry'}.
Use this research: ${JSON.stringify(context.research || {})}
Problems identified: ${JSON.stringify(context.problems || {})}
Solutions: ${JSON.stringify(context.solutions || {})}

CRITICAL: Every angle must be UNIQUE to this company. Reference their specific situation.
Each angle sells OUTCOMES not technology.

Return JSON array:
[
  {
    "angleName": "Short descriptive name",
    "hook": "One powerful sentence that stops them reading",
    "subjectLine": "Email subject line — references something specific about THEM",
    "openingLine": "First sentence of the email",
    "valueProposition": "What value they get — specific to their situation",
    "emotionalTrigger": "What emotion this angle taps into",
    "bestFor": "cold|warm|follow_up",
    "estimatedEffectiveness": "High|Medium|Low",
    "effectivenessScore": <0-100 score based on fit for THIS company>
  }
]
Return valid JSON array only. No markdown.`
}