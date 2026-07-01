import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════
// PREMIUM PERSONALIZED AUDIT PDF
// Consulting-quality report — 17 sections, feels like a $5K audit
// ═══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, leadId } = await req.json()
    if (!businessId && !leadId) {
      return NextResponse.json({ error: 'businessId or leadId required' }, { status: 400 })
    }

    let bizId = businessId
    if (leadId && !businessId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { business: true } })
      if (lead) bizId = lead.businessId
    }

    const [business, audit, intel] = await Promise.all([
      prisma.business.findUnique({ where: { id: bizId } }),
      prisma.websiteAudit.findUnique({ where: { businessId: bizId! } }),
      prisma.companyIntel.findUnique({ where: { businessId: bizId! } }).catch(() => null),
    ])

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Fetch generated assets (blueprint, ROI)
    const assets = await prisma.generatedAsset.findMany({
      where: { businessId: bizId },
      orderBy: { createdAt: 'desc' },
    })

    const blueprint = assets.find(a => a.type === 'growth_blueprint')
    const roiAsset = assets.find(a => a.type === 'roi_calculation')
    let blueprintData: Record<string, unknown> | null = null
    let roiData: Record<string, unknown> | null = null
    try { blueprintData = blueprint ? JSON.parse(blueprint.content) : null } catch { /* skip */ }
    try { roiData = roiAsset ? JSON.parse(roiAsset.content) : null } catch { /* skip */ }

    const html = generatePremiumReportHTML({ business, audit, intel, blueprintData, roiData })

    const asset = await prisma.generatedAsset.upsert({
      where: { id: assets.find(a => a.type === 'pdf_audit_report')?.id || '' },
      update: { content: html, title: `Premium Audit — ${business.name}` },
      create: {
        businessId: bizId,
        leadId: leadId || null,
        type: 'pdf_audit_report',
        title: `Premium Audit — ${business.name}`,
        content: html,
      },
    })

    return NextResponse.json({
      html,
      assetId: asset.id,
      fileName: `titan-audit-${business.name.replace(/\s+/g, '-').toLowerCase()}.html`,
    })
  } catch (err) {
    console.error('[PDF Report]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate report' }, { status: 500 })
  }
}

// ── Safe JSON parse helpers ──
function tryParse(val: string | null | undefined): unknown[] {
  if (!val) return []
  try { return JSON.parse(val) } catch {
    return val.split('\n').filter(Boolean).map(s => s.replace(/^\d+[\.\)\-]\s*/, '').trim()).filter(s => s.length > 0)
  }
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generatePremiumReportHTML(data: {
  business: any; audit: any; intel: any
  blueprintData: Record<string, unknown> | null
  roiData: Record<string, unknown> | null
}): string {
  const { business, audit, intel, blueprintData, roiData } = data
  const score = audit?.overallScore || 0
  const scoreColor = score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'
  const scoreLabel = score >= 70 ? 'Good' : score >= 40 ? 'Needs Improvement' : 'Critical'
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const categories = audit ? [
    { name: 'UI Design', score: audit.uiScore, detail: audit.uiDetails },
    { name: 'UX Experience', score: audit.uxScore, detail: audit.uxDetails },
    { name: 'SEO', score: audit.seoScore, detail: audit.seoDetails },
    { name: 'Performance', score: audit.performanceScore, detail: audit.performanceDetails },
    { name: 'Accessibility', score: audit.accessibilityScore, detail: audit.accessibilityDetails },
    { name: 'Mobile Experience', score: audit.mobileScore, detail: audit.mobileDetails },
    { name: 'Security', score: audit.securityScore, detail: audit.securityDetails },
    { name: 'AI Readiness', score: audit.aiReadinessScore, detail: audit.aiReadinessDetails },
    { name: 'Automation', score: audit.automationScore, detail: audit.automationDetails },
    { name: 'Conversion', score: audit.conversionScore, detail: audit.conversionDetails },
  ] : []

  const strengths = tryParse(intel?.strengths)
  const weaknesses = tryParse(intel?.weaknesses)
  const painPoints = tryParse(intel?.painPoints)
  const aiOpps = tryParse(intel?.aiOpportunities)
  const autoOpps = tryParse(intel?.automationOpportunities)
  const trustSignals = tryParse(intel?.trustSignals)
  const problems = tryParse(audit?.problemsFound)
  const recommendations = tryParse(audit?.recommendations)
  const opportunities = tryParse(audit?.opportunities)
  const competitors = tryParse(intel?.competitors)

  function scoreBar(s: number) {
    const c = s >= 70 ? '#059669' : s >= 40 ? '#D97706' : '#DC2626'
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:600;color:#1E293B">${s}</span>
        </div>
        <div style="height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden">
          <div style="width:${s}%;height:100%;background:${c};border-radius:3px"></div>
        </div>
      </div>
    </div>`
  }

  function findingCard(title: string, body: string, type: 'problem' | 'opportunity' | 'info' | 'recommendation' | 'risk' | 'growth') {
    const colors: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
      problem: { bg: '#FEF2F2', border: '#DC2626', icon: 'X', titleColor: '#991B1B' },
      opportunity: { bg: '#F0FDF4', border: '#059669', icon: '+', titleColor: '#065F46' },
      info: { bg: '#EFF6FF', border: '#2563EB', icon: 'i', titleColor: '#1E40AF' },
      recommendation: { bg: '#FAF5FF', border: '#7C3AED', icon: '>', titleColor: '#5B21B6' },
      risk: { bg: '#FFFBEB', border: '#D97706', icon: '!', titleColor: '#92400E' },
      growth: { bg: '#ECFDF5', border: '#10B981', icon: '^', titleColor: '#047857' },
    }
    const c = colors[type] || colors.info
    return `<div style="background:${c.bg};border-left:4px solid ${c.border};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;color:${c.titleColor};margin-bottom:4px">${esc(title)}</div>
      <div style="font-size:12px;color:#475569;line-height:1.6">${esc(body)}</div>
    </div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Growth Audit — ${esc(business.name)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1E293B;background:#fff;line-height:1.65}
.page{max-width:860px;margin:0 auto;padding:0 40px}
.page-break{page-break-before:always}
h2{font-size:20px;font-weight:800;color:#0F172A;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #E2E8F0;letter-spacing:-0.02em}
h3{font-size:15px;font-weight:700;color:#1E293B;margin-bottom:8px}
p{font-size:13px;color:#475569;margin-bottom:8px}
.tag{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;margin:2px}
.tag-green{background:#F0FDF4;color:#059669}
.tag-red{background:#FEF2F2;color:#DC2626}
.tag-amber{background:#FFFBEB;color:#D97706}
.tag-blue{background:#EFF6FF;color:#2563EB}
.tag-purple{background:#FAF5FF;color:#7C3AED}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:10px}
.card-label{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#94A3B8;font-weight:700;margin-bottom:4px}
.card-value{font-size:20px;font-weight:800;color:#0F172A}
.metric{text-align:center;padding:20px 12px;background:#F8FAFC;border-radius:10px;border:1px solid #E2E8F0}
.metric .num{font-size:28px;font-weight:800}
.metric .lbl{font-size:11px;color:#64748B;margin-top:4px}
.timeline-item{display:flex;gap:16px;margin-bottom:16px}
.timeline-dot{width:10px;height:10px;border-radius:50%;background:#2563EB;margin-top:5px;flex-shrink:0}
.timeline-content h4{font-size:13px;font-weight:700;color:#1E293B}
.timeline-content p{font-size:12px;color:#64748B}
.cta-box{text-align:center;padding:40px 24px;background:linear-gradient(135deg,#EFF6FF,#F8FAFC);border-radius:16px;border:1px solid #BFDBFE;margin-top:32px}
.cta-box h3{font-size:20px;font-weight:800;color:#1E40AF;margin-bottom:8px}
.cta-box p{color:#3B82F6;font-size:14px}
@media print{
  .no-print{display:none!important}
  .page{padding:0 32px}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>

<!-- ═══ COVER PAGE ═══ -->
<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(160deg,#0F172A 0%,#1E293B 50%,#0F172A 100%);color:white;text-align:center;padding:60px 40px;position:relative;overflow:hidden">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 30% 40%,rgba(37,99,235,0.15),transparent 60%),radial-gradient(circle at 70% 60%,rgba(59,130,246,0.1),transparent 50%)"></div>
  <div style="position:relative;z-index:1">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:32px;backdrop-filter:blur(10px)">
      TITAN AI Growth Operating System
    </div>
    <h1 style="font-size:42px;font-weight:900;letter-spacing:-0.03em;line-height:1.1;margin-bottom:16px">AI Growth Audit</h1>
    <h2 style="font-size:24px;font-weight:600;opacity:0.9;margin-bottom:24px">${esc(business.name)}</h2>
    <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:40px">
      ${business.industry ? `<span style="font-size:13px;opacity:0.7">${esc(business.industry)}</span>` : ''}
      ${business.city ? `<span style="font-size:13px;opacity:0.7">${esc(business.city)}</span>` : ''}
      ${business.website ? `<span style="font-size:13px;opacity:0.7">${esc(business.website)}</span>` : ''}
    </div>
    <div style="display:inline-flex;align-items:center;gap:16px;padding:20px 32px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;backdrop-filter:blur(10px)">
      <div style="width:64px;height:64px;border-radius:50%;border:4px solid ${scoreColor};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${scoreColor}">${score}</div>
      <div style="text-align:left">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:0.6">Overall Score</div>
        <div style="font-size:18px;font-weight:700">${scoreLabel}</div>
        <div style="font-size:11px;opacity:0.5">out of 100</div>
      </div>
    </div>
    <div style="margin-top:48px;font-size:12px;opacity:0.4">Prepared ${date} · Confidential</div>
  </div>
</div>

<div class="page">

<!-- ═══ 1. EXECUTIVE SUMMARY ═══ -->
<div class="page-break"></div>
<h2>1. Executive Summary</h2>
${audit?.executiveSummary ? `<p style="font-size:14px;color:#334155;line-height:1.8">${esc(audit.executiveSummary)}</p>` : ''}
${intel?.businessOverview ? `<p style="font-size:14px;color:#334155;line-height:1.8;margin-top:12px">${esc(intel.businessOverview)}</p>` : ''}

<!-- ═══ 2. WEBSITE OVERVIEW ═══ -->
<h2>2. Website Overview</h2>
<div class="grid-2">
  <div class="card">
    <div class="card-label">Website</div>
    <div class="card-value" style="font-size:14px;word-break:break-all">${esc(business.website) || 'N/A'}</div>
  </div>
  <div class="card">
    <div class="card-label">Industry</div>
    <div class="card-value" style="font-size:14px">${esc(business.industry) || 'Unknown'}</div>
  </div>
  <div class="card">
    <div class="card-label">Location</div>
    <div class="card-value" style="font-size:14px">${esc(business.city || business.country) || 'Unknown'}</div>
  </div>
  <div class="card">
    <div class="card-label">Company Size</div>
    <div class="card-value" style="font-size:14px">${esc(business.companySize) || 'Unknown'}</div>
  </div>
</div>
${intel?.coreServices ? `<h3>Core Services</h3><p>${esc(intel.coreServices)}</p>` : ''}
${intel?.idealCustomers ? `<h3>Ideal Customers</h3><p>${esc(intel.idealCustomers)}</p>` : ''}

<!-- ═══ 3. WEBSITE SCORES ═══ -->
<div class="page-break"></div>
<h2>3. Website Scores</h2>
<div class="grid-2">
  ${categories.map(c => {
    const color = c.score >= 70 ? '#059669' : c.score >= 40 ? '#D97706' : '#DC2626'
    return `<div class="card">
      <div class="card-label">${c.name}</div>
      <div class="card-value" style="color:${color}">${c.score}<span style="font-size:12px;color:#94A3B8;font-weight:400">/100</span></div>
      ${scoreBar(c.score)}
    </div>`
  }).join('')}
</div>

<!-- ═══ 4. UI ANALYSIS ═══ -->
<h2>4. UI Analysis</h2>
${findingCard('Visual Design Assessment', audit?.uiDetails || 'No detailed UI analysis available.', 'info')}

<!-- ═══ 5. UX ANALYSIS ═══ -->
<h2>5. UX Analysis</h2>
${findingCard('User Experience Assessment', audit?.uxDetails || 'No detailed UX analysis available.', 'info')}

<!-- ═══ 6. SEO ANALYSIS ═══ -->
<h2>6. SEO Analysis</h2>
${findingCard('Search Engine Optimization', audit?.seoDetails || 'No detailed SEO analysis available.', 'info')}

<!-- ═══ 7. ACCESSIBILITY ═══ -->
<h2>7. Accessibility</h2>
${findingCard('Web Accessibility', audit?.accessibilityDetails || 'No detailed accessibility analysis available.', 'info')}

<!-- ═══ 8. PERFORMANCE ═══ -->
<h2>8. Performance</h2>
${findingCard('Website Performance', audit?.performanceDetails || 'No detailed performance analysis available.', 'info')}

<!-- ═══ 9. AI READINESS ═══ -->
<div class="page-break"></div>
<h2>9. AI Readiness</h2>
${findingCard('AI Readiness Assessment', audit?.aiReadinessDetails || 'No detailed AI readiness analysis available.', 'opportunity')}

<!-- ═══ 10. AUTOMATION OPPORTUNITIES ═══ -->
<h2>10. Automation Opportunities</h2>
${findingCard('Automation Assessment', audit?.automationDetails || 'No detailed automation analysis available.', 'opportunity')}
${autoOpps.length > 0 ? autoOpps.map((o: any) => findingCard(
  typeof o === 'string' ? o : (o.name || o.opportunity || 'Automation Opportunity'),
  typeof o === 'string' ? '' : (o.impact || o.description || ''),
  'opportunity'
)).join('') : ''}

<!-- ═══ 11. BUSINESS RISKS ═══ -->
<h2>11. Business Risks</h2>
${problems.length > 0 ? problems.map((p: any) => findingCard(
  typeof p === 'string' ? 'Risk Identified' : (p.issue || p.problem || 'Risk'),
  typeof p === 'string' ? p : ((p.impact || p.businessImpact || p.description || '') + (p.severity ? ` [Severity: ${p.severity}]` : '')),
  'risk'
)).join('') : '<p>No specific business risks identified.</p>'}

<!-- ═══ 12. GROWTH OPPORTUNITIES ═══ -->
<div class="page-break"></div>
<h2>12. Growth Opportunities</h2>
${aiOpps.length > 0 ? aiOpps.map((o: any) => findingCard(
  typeof o === 'string' ? 'AI Opportunity' : (o.opportunity || o.name || 'Opportunity'),
  typeof o === 'string' ? o : (o.impact || o.description || o.expectedImpact || ''),
  'growth'
)).join('') : opportunities.length > 0 ? opportunities.map((o: any) => findingCard(
  typeof o === 'string' ? 'Growth Opportunity' : (o.opportunity || o.name || 'Opportunity'),
  typeof o === 'string' ? o : (o.potentialImpact || o.description || ''),
  'growth'
)).join('') : '<p>No specific growth opportunities identified.</p>'}

<!-- ═══ 13. COMPETITOR COMPARISON ═══ -->
<h2>13. Competitor Comparison</h2>
${competitors.length > 0 ? competitors.map((c: any) => `<div class="card">
  <div style="font-weight:700;font-size:14px;color:#1E293B">${esc(typeof c === 'string' ? c : (c.name || 'Competitor'))}</div>
  ${typeof c !== 'string' ? `<p style="font-size:12px;color:#64748B">${esc(c.strengths ? (Array.isArray(c.strengths) ? c.strengths.join(', ') : String(c.strengths)) : '')}</p>` : ''}
</div>`).join('') : '<p>Competitor analysis not yet completed.</p>'}

<!-- ═══ 14. AI RECOMMENDATIONS ═══ -->
<h2>14. AI Recommendations</h2>
${recommendations.length > 0 ? recommendations.map((r: any) => findingCard(
  typeof r === 'string' ? 'Recommendation' : (r.recommendation || r.name || 'Recommendation'),
  typeof r === 'string' ? r : (r.impact || r.description || ''),
  'recommendation'
)).join('') : '<p>No specific recommendations available.</p>'}

<!-- ═══ 15. ESTIMATED ROI ═══ -->
<div class="page-break"></div>
<h2>15. Estimated ROI</h2>
${roiData ? `<div class="grid-3">
  ${roiData.potentialRevenueIncrease ? `<div class="metric"><div class="num" style="color:#059669">${esc(String(roiData.potentialRevenueIncrease))}</div><div class="lbl">Revenue Increase</div></div>` : ''}
  ${roiData.potentialTimeSavings ? `<div class="metric"><div class="num" style="color:#2563EB">${esc(String(roiData.potentialTimeSavings))}</div><div class="lbl">Time Savings</div></div>` : ''}
  ${roiData.potentialCostReduction ? `<div class="metric"><div class="num" style="color:#7C3AED">${esc(String(roiData.potentialCostReduction))}</div><div class="lbl">Cost Reduction</div></div>` : ''}
  ${roiData.potentialStaffHoursSaved ? `<div class="metric"><div class="num" style="color:#D97706">${esc(String(roiData.potentialStaffHoursSaved))}</div><div class="lbl">Staff Hours Saved</div></div>` : ''}
  ${roiData.potentialConversionImprovement ? `<div class="metric"><div class="num" style="color:#059669">${esc(String(roiData.potentialConversionImprovement))}</div><div class="lbl">Conversion Improvement</div></div>` : ''}
</div>
${roiData.disclaimer ? `<p style="margin-top:16px;font-size:11px;color:#94A3B8;font-style:italic">${esc(String(roiData.disclaimer))}</p>` : ''}` : `<div class="grid-3">
  <div class="metric"><div class="num" style="color:#059669">15-25%</div><div class="lbl">Revenue Increase</div></div>
  <div class="metric"><div class="num" style="color:#2563EB">20h/week</div><div class="lbl">Time Savings</div></div>
  <div class="metric"><div class="num" style="color:#7C3AED">300-500%</div><div class="lbl">Expected ROI</div></div>
</div>
<p style="margin-top:16px;font-size:11px;color:#94A3B8;font-style:italic">All estimates are conservative projections based on industry benchmarks and should be validated during consultation.</p>`}

<!-- ═══ 16. 30/60/90 DAY GROWTH BLUEPRINT ═══ -->
<h2>16. 30 / 60 / 90 Day Growth Blueprint</h2>
${blueprintData ? `
<div class="grid-3" style="margin-bottom:20px">
  <div class="card" style="border-left:4px solid #2563EB">
    <div class="card-label" style="color:#2563EB">Days 1-30</div>
    <div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:6px">${esc(String(blueprintData.thirtyDayPlan?.focus || 'Foundation'))}</div>
    <p style="font-size:11px;color:#64748B">${esc(String(blueprintData.thirtyDayPlan?.expectedResults || ''))}</p>
  </div>
  <div class="card" style="border-left:4px solid #7C3AED">
    <div class="card-label" style="color:#7C3AED">Days 31-60</div>
    <div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:6px">${esc(String(blueprintData.sixtyDayPlan?.focus || 'Growth'))}</div>
    <p style="font-size:11px;color:#64748B">${esc(String(blueprintData.sixtyDayPlan?.expectedResults || ''))}</p>
  </div>
  <div class="card" style="border-left:4px solid #059669">
    <div class="card-label" style="color:#059669">Days 61-90</div>
    <div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:6px">${esc(String(blueprintData.ninetyDayPlan?.focus || 'Scale'))}</div>
    <p style="font-size:11px;color:#64748B">${esc(String(blueprintData.ninetyDayPlan?.expectedResults || ''))}</p>
  </div>
</div>
` : '<p>Run the AI Growth Blueprint generator for a detailed 30/60/90 day plan.</p>'}

<!-- ═══ 17. MEETING INVITATION ═══ -->
<div class="cta-box">
  <h3>Ready to Transform Your Business?</h3>
  <p>Let's discuss how these AI solutions can be customized for ${esc(business.name)}</p>
  <div style="margin-top:16px;display:inline-block;padding:12px 28px;background:#2563EB;color:white;border-radius:10px;font-weight:700;font-size:14px">Schedule a Free Consultation</div>
</div>

</div>

<div style="text-align:center;padding:32px;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;margin-top:40px">
  This report was generated by TITAN AI Growth Operating System · ${date}<br>
  All recommendations are based on automated analysis and should be validated by experts.
</div>
</body>
</html>`
}