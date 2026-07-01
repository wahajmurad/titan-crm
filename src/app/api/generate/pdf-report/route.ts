import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, leadId } = await req.json()
    if (!businessId && !leadId) {
      return NextResponse.json({ error: 'businessId or leadId required' }, { status: 400 })
    }

    // Get business + audit
    let businessIdToUse = businessId
    if (leadId && !businessId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { business: true } })
      if (lead) businessIdToUse = lead.businessId
    }

    const [business, audit, intel] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessIdToUse } }),
      prisma.websiteAudit.findUnique({ where: { businessId: businessIdToUse! } }),
      prisma.companyIntel.findUnique({ where: { businessId: businessIdToUse! } }).catch(() => null),
    ])

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Generate HTML report
    const html = generateReportHTML({ business, audit, intel })

    // Save as GeneratedAsset
    const asset = await prisma.generatedAsset.create({
      data: {
        businessId: businessIdToUse,
        leadId: leadId || null,
        type: 'pdf_audit_report',
        title: `Audit Report - ${business.name}`,
        content: html,
      },
    })

    return NextResponse.json({
      html,
      assetId: asset.id,
      fileName: `titan-audit-${business.name.replace(/\s+/g, '-').toLowerCase()}.html`
    })
  } catch (err) {
    console.error('[PDF Report]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate report' }, { status: 500 })
  }
}

function generateReportHTML(data: { business: any; audit: any; intel: any }): string {
  const { business, audit, intel } = data
  const score = audit?.overallScore || 0
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'

  const categories = audit ? [
    { name: 'UI Design', score: audit.uiScore },
    { name: 'UX Experience', score: audit.uxScore },
    { name: 'SEO', score: audit.seoScore },
    { name: 'Performance', score: audit.performanceScore },
    { name: 'Accessibility', score: audit.accessibilityScore },
    { name: 'Mobile', score: audit.mobileScore },
    { name: 'Security', score: audit.securityScore },
    { name: 'AI Readiness', score: audit.aiReadinessScore },
    { name: 'Automation', score: audit.automationScore },
    { name: 'Conversion', score: audit.conversionScore },
  ] : []

  const strengths = intel?.strengths ? JSON.parse(intel.strengths) : []
  const weaknesses = intel?.weaknesses ? JSON.parse(intel.weaknesses) : []
  const painPoints = intel?.painPoints ? JSON.parse(intel.painPoints) : []
  const opportunities = intel?.aiOpportunities ? JSON.parse(intel.aiOpportunities) : []
  const problems = audit?.problemsFound ? JSON.parse(audit.problemsFound) : []
  const recommendations = audit?.recommendations ? JSON.parse(audit.recommendations) : []

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Website Audit Report - ${business.name}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; }
.header { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 48px; }
.header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.header p { opacity: 0.85; font-size: 14px; }
.score-ring { width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${scoreColor}; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; color: ${scoreColor}; background: white; position: absolute; right: 48px; top: 36px; }
.container { max-width: 800px; margin: 0 auto; padding: 32px; }
.section { margin-bottom: 32px; }
.section-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #E5E7EB; }
.score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.score-card { background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
.score-card .label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
.score-card .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
.score-bar { height: 4px; background: #E5E7EB; border-radius: 4px; margin-top: 8px; overflow: hidden; }
.score-bar-fill { height: 100%; border-radius: 4px; }
.finding { padding: 12px 16px; background: #F8FAFC; border-left: 3px solid #2563EB; margin-bottom: 8px; border-radius: 0 8px 8px 0; }
.finding.problem { border-left-color: #EF4444; }
.finding.opportunity { border-left-color: #10B981; }
.finding h4 { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.finding p { font-size: 12px; color: #6B7280; }
.tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; }
.tag.blue { background: #EFF6FF; color: #2563EB; }
.tag.red { background: #FEF2F2; color: #EF4444; }
.tag.green { background: #F0FDF4; color: #16A34A; }
.tag.amber { background: #FFFBEB; color: #D97706; }
.footer { text-align: center; padding: 32px; color: #94A3B8; font-size: 12px; border-top: 1px solid #E5E7EB; margin-top: 32px; }
@media print { .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header" style="position: relative; overflow: hidden;">
  <div style="position: relative; z-index: 1;">
    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.7; margin-bottom: 4px;">TITAN AI Growth OS</p>
    <h1>Website Audit Report</h1>
    <p>${business.name}${business.industry ? ` · ${business.industry}` : ''}${business.city ? ` · ${business.city}` : ''}</p>
    <p style="margin-top: 4px;">${business.website || ''}</p>
  </div>
  <div class="score-ring">${score}/100</div>
</div>
<div class="container">
  ${audit?.executiveSummary ? `<div class="section"><div class="section-title">Executive Summary</div><p style="color: #4B5563; font-size: 14px;">${audit.executiveSummary}</p></div>` : ''}

  <div class="section">
    <div class="section-title">Category Scores</div>
    <div class="score-grid">
      ${categories.map(c => {
        const color = c.score >= 70 ? '#10B981' : c.score >= 40 ? '#F59E0B' : '#EF4444'
        return `<div class="score-card">
          <div class="label">${c.name}</div>
          <div class="value" style="color: ${color}">${c.score}</div>
          <div class="score-bar"><div class="score-bar-fill" style="width: ${c.score}%; background: ${color}"></div></div>
        </div>`
      }).join('')}
    </div>
  </div>

  ${problems.length > 0 ? `<div class="section"><div class="section-title">Problems Found</div>${problems.map((p: string) => `<div class="finding problem"><h4>Issue</h4><p>${p}</p></div>`).join('')}</div>` : ''}

  ${opportunities.length > 0 ? `<div class="section"><div class="section-title">AI Opportunities</div>${opportunities.map((o: string) => `<div class="finding opportunity"><h4>Opportunity</h4><p>${o}</p></div>`).join('')}</div>` : ''}

  ${recommendations.length > 0 ? `<div class="section"><div class="section-title">Recommendations</div>${recommendations.map((r: string) => `<div class="finding"><h4>Recommendation</h4><p>${r}</p></div>`).join('')}</div>` : ''}

  ${strengths.length > 0 ? `<div class="section"><div class="section-title">Business Strengths</div><div>${strengths.map((s: string) => `<span class="tag green">${s}</span>`).join('')}</div></div>` : ''}
  ${weaknesses.length > 0 ? `<div class="section"><div class="section-title">Weaknesses</div><div>${weaknesses.map((w: string) => `<span class="tag red">${w}</span>`).join('')}</div></div>` : ''}
  ${painPoints.length > 0 ? `<div class="section"><div class="section-title">Pain Points</div><div>${painPoints.map((p: string) => `<span class="tag amber">${p}</span>`).join('')}</div></div>` : ''}

  <div class="footer">Generated by TITAN AI Growth Operating System · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>
</body>
</html>`
}