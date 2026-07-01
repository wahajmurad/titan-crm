import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, leadId, solutions } = await req.json()
    if (!businessId && !leadId) {
      return NextResponse.json({ error: 'businessId or leadId required' }, { status: 400 })
    }

    let bizId = businessId
    if (leadId && !businessId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { business: true } })
      if (lead) bizId = lead.businessId
    }

    const [business, audit] = await Promise.all([
      prisma.business.findUnique({ where: { id: bizId } }),
      prisma.websiteAudit.findUnique({ where: { businessId: bizId! } }),
    ])

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const problems = audit?.problemsFound ? (typeof audit.problemsFound === 'string' ? (() => { try { return JSON.parse(audit.problemsFound) } catch { return [] } })() : audit.problemsFound) : []
    const solutionsData = solutions || []

    const html = generateDemoHTML({ business, problems, solutions: solutionsData, companyColor: '#2563EB' })

    const asset = await prisma.generatedAsset.create({
      data: {
        businessId: bizId,
        leadId: leadId || null,
        type: 'html_demo',
        title: `AI Demo - ${business.name}`,
        content: html,
      },
    })

    return NextResponse.json({ html, assetId: asset.id, fileName: `titan-demo-${business.name.replace(/\s+/g, '-').toLowerCase()}.html` })
  } catch (err) {
    console.error('[HTML Demo]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate demo' }, { status: 500 })
  }
}

function generateDemoHTML(data: { business: any; problems: string[]; solutions: any[]; companyColor: string }): string {
  const { business, problems, solutions, companyColor } = data
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Solution Demo — ${business.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;background:#fff}
.hero{background:linear-gradient(135deg,${companyColor},#1D4ED8);color:white;padding:64px 48px;text-align:center}
.hero h1{font-size:32px;font-weight:700;margin-bottom:8px}
.hero p{font-size:16px;opacity:.85;max-width:600px;margin:0 auto}
.badge{display:inline-block;padding:4px 12px;background:rgba(255,255,255,.2);border-radius:20px;font-size:12px;margin-bottom:16px}
.container{max-width:900px;margin:0 auto;padding:40px 24px}
.section{margin-bottom:48px}
.section-title{font-size:20px;font-weight:700;margin-bottom:16px;color:#1a1a2e;display:flex;align-items:center;gap:8px}
.section-title .dot{width:8px;height:8px;border-radius:50%;background:${companyColor}}
.problem-card{background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px 20px;margin-bottom:12px}
.problem-card h4{font-size:14px;font-weight:600;color:#991B1B;margin-bottom:4px}
.problem-card p{font-size:13px;color:#B91C1C}
.solution-card{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin-bottom:12px}
.solution-card h4{font-size:14px;font-weight:600;color:#166534;margin-bottom:4px}
.solution-card p{font-size:13px;color:#15803D}
.solution-card .roi{margin-top:8px;padding-top:8px;border-top:1px solid #BBF7D0;font-size:12px;font-weight:600;color:#166534}
.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
.metric{text-align:center;padding:24px 16px;background:#F8FAFC;border-radius:12px;border:1px solid #E5E7EB}
.metric .number{font-size:28px;font-weight:800;color:${companyColor}}
.metric .label{font-size:12px;color:#6B7280;margin-top:4px}
.cta-section{text-align:center;padding:48px;background:#F8FAFC;border-radius:16px;border:1px solid #E5E7EB}
.cta-button{display:inline-block;padding:14px 32px;background:${companyColor};color:white;border-radius:12px;font-size:16px;font-weight:600;text-decoration:none;margin-top:12px}
.footer{text-align:center;padding:32px;color:#94A3B8;font-size:12px;border-top:1px solid #E5E7EB}
</style>
</head>
<body>
<div class="hero">
  <div class="badge">Personalized AI Solution</div>
  <h1>${business.name}</h1>
  <p>AI-powered solutions tailored specifically for your business needs${business.industry ? ` in the ${business.industry} industry` : ''}</p>
</div>
<div class="container">
  <div class="section">
    <div class="section-title"><span class="dot"></span>Current Challenges</div>
    ${problems.length > 0 ? problems.map((p: string) => `<div class="problem-card"><h4>Challenge Identified</h4><p>${p}</p></div>`).join('') : '<p style="color:#6B7280">Based on our analysis, here are the key areas where AI can transform your operations.</p>'}
  </div>
  <div class="section">
    <div class="section-title"><span class="dot"></span>Recommended AI Solutions</div>
    ${solutions.length > 0 ? solutions.map((s: any) => `<div class="solution-card"><h4>${s.solution || s.name || 'AI Solution'}</h4><p>${s.implementation || s.description || 'Custom AI implementation for your business'}</p>${s.estimatedROI ? `<div class="roi">Estimated ROI: ${s.estimatedROI}</div>` : ''}</div>`).join('') : `<div class="solution-card"><h4>AI-Powered Customer Engagement</h4><p>Automate customer interactions with intelligent chatbots that understand context, provide instant responses, and qualify leads 24/7.</p><div class="roi">Estimated ROI: 300-500% in year one</div></div><div class="solution-card"><h4>Intelligent Process Automation</h4><p>Eliminate manual workflows with AI that learns your business processes and automates repetitive tasks.</p><div class="roi">Estimated time savings: 20+ hours per week</div></div><div class="solution-card"><h4>Smart Analytics &amp; Insights</h4><p>Transform your data into actionable insights with AI-powered analytics that predict trends and identify opportunities.</p><div class="roi">Revenue impact: 15-25% increase</div></div>`}
  </div>
  <div class="section">
    <div class="section-title"><span class="dot"></span>Expected Impact</div>
    <div class="metric-grid">
      <div class="metric"><div class="number">60%</div><div class="label">Reduction in Response Time</div></div>
      <div class="metric"><div class="number">3x</div><div class="label">Lead Conversion Increase</div></div>
      <div class="metric"><div class="number">20h</div><div class="label">Weekly Time Savings</div></div>
    </div>
  </div>
  <div class="section">
    <div class="cta-section">
      <h3 style="font-size:20px;font-weight:700;margin-bottom:8px">Ready to Transform Your Business?</h3>
      <p style="color:#6B7280;font-size:14px">Let's discuss how these AI solutions can be customized for ${business.name}</p>
      <a href="#" class="cta-button">Schedule a Free Consultation</a>
    </div>
  </div>
</div>
<div class="footer">Generated by TITAN AI Growth Operating System &middot; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</body>
</html>`
}