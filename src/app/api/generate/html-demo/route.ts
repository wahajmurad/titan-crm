import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════
// PERSONALIZED HTML DEMO PAGE
// Every company gets a dedicated landing page that feels like
// a consulting presentation made exclusively for them.
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

    const [business, audit, intel, lead] = await Promise.all([
      prisma.business.findUnique({ where: { id: bizId } }),
      prisma.websiteAudit.findUnique({ where: { businessId: bizId! } }),
      prisma.companyIntel.findUnique({ where: { businessId: bizId! } }).catch(() => null),
      prisma.lead.findFirst({ where: { businessId: bizId } }).catch(() => null),
    ])

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Fetch additional assets
    const assets = await prisma.generatedAsset.findMany({
      where: { businessId: bizId },
      orderBy: { createdAt: 'desc' },
    })
    const blueprint = assets.find(a => a.type === 'growth_blueprint')

    let blueprintData: Record<string, unknown> | null = null
    try { blueprintData = blueprint ? JSON.parse(blueprint.content) : null } catch { /* skip */ }

    const html = generatePersonalizedDemoHTML({ business, audit, intel, lead, blueprintData })

    const asset = await prisma.generatedAsset.upsert({
      where: { id: assets.find(a => a.type === 'html_demo')?.id || '' },
      update: { content: html, title: `AI Demo — ${business.name}` },
      create: {
        businessId: bizId,
        leadId: leadId || null,
        type: 'html_demo',
        title: `AI Demo — ${business.name}`,
        content: html,
      },
    })

    return NextResponse.json({
      html,
      assetId: asset.id,
      slug: business.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, ''),
      fileName: `titan-demo-${business.name.replace(/\s+/g, '-').toLowerCase()}.html`,
    })
  } catch (err) {
    console.error('[HTML Demo]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate demo' }, { status: 500 })
  }
}

function tryParse(val: string | null | undefined): string[] {
  if (!val) return []
  try { return JSON.parse(val) } catch {
    return val.split('\n').filter(Boolean).map(s => s.replace(/^\d+[\.\)\-]\s*/, '').trim()).filter(s => s.length > 0)
  }
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generatePersonalizedDemoHTML(data: {
  business: any; audit: any; intel: any; lead: any; blueprintData: Record<string, unknown> | null
}): string {
  const { business, audit, intel, lead, blueprintData } = data
  const score = audit?.overallScore || 0
  const scoreColor = score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'
  const scoreLabel = score >= 70 ? 'Good' : score >= 40 ? 'Needs Work' : 'Critical'
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const primary = '#1E293B'
  const accent = '#2563EB'
  const light = '#F8FAFC'

  const problems = tryParse(audit?.problemsFound)
  const aiOpps = tryParse(intel?.aiOpportunities)
  const painPoints = tryParse(intel?.painPoints)
  const dmName = lead?.decisionMaker || 'Team'

  // Determine industry-specific demo type
  const industry = (business.industry || '').toLowerCase()
  const demoType = industry.includes('law') || industry.includes('legal') ? 'law' :
    industry.includes('dent') || industry.includes('dental') || industry.includes('health') || industry.includes('medical') || industry.includes('clinic') ? 'healthcare' :
    industry.includes('real estate') || industry.includes('property') ? 'realestate' :
    industry.includes('restaurant') || industry.includes('food') || industry.includes('cafe') || industry.includes('catering') ? 'restaurant' :
    industry.includes('ecommerce') || industry.includes('e-commerce') || industry.includes('shop') || industry.includes('retail') || industry.includes('store') ? 'ecommerce' :
    industry.includes('finance') || industry.includes('account') || industry.includes('tax') || industry.includes('insurance') ? 'finance' :
    industry.includes('educat') || industry.includes('school') || industry.includes('training') || industry.includes('tutor') || industry.includes('university') ? 'education' :
    industry.includes('marketing') || industry.includes('agency') || industry.includes('advertis') ? 'agency' :
    'general'

  const demoFeatures: Record<string, Array<{ title: string; desc: string; chatPreview: string[] }>> = {
    law: [
      { title: 'AI Receptionist', desc: 'Handle client calls 24/7, schedule consultations, and qualify leads automatically — never miss a potential client again.', chatPreview: ["Hi, you've reached Smith & Associates. I'm our AI assistant. How can I help you today?", "I need to schedule a consultation for a personal injury case.", "Of course! I have availability this Thursday at 2 PM or Friday at 10 AM. Which works better for you? I'll also collect some preliminary details to make your consultation more productive."] },
      { title: 'Client Intake Automation', desc: 'AI-powered intake forms that collect case details, pre-qualify leads, and route to the right attorney.', chatPreview: ["Welcome to our intake process. I'll ask a few questions to understand your situation.", "When did the incident occur?", "Based on what you've shared, your case falls under personal injury. Attorney Sarah Johnson specializes in this area. Let me schedule your consultation."] },
      { title: 'Smart Scheduling', desc: 'AI scheduling that considers attorney availability, case type, and urgency. Reduces no-shows by 40%.', chatPreview: ["Your consultation is confirmed for Thursday at 2 PM with Attorney Johnson.", "We'll send a reminder 24 hours before and 1 hour before.", "Need to reschedule? Just let me know and I'll find the next available slot."] },
      { title: 'Document Assistant', desc: 'AI drafts common legal documents, summarizes case files, and accelerates research.', chatPreview: ["I've analyzed the case file and prepared a summary of key facts.", "Here are 3 similar precedents from the past 5 years that may be relevant.", "I've drafted initial motions based on the case strategy. Ready for your review."] },
    ],
    healthcare: [
      { title: 'AI Appointment Assistant', desc: 'Patients book, reschedule, and get reminders automatically. Reduces front desk calls by 60%.', chatPreview: ["Hello! This is Dr. Miller's office AI assistant. How can I help you?", "I'd like to book a check-up appointment.", "Dr. Miller has openings on Monday at 9 AM, Wednesday at 2 PM, or Friday at 11 AM. Do any of these work for you?"] },
      { title: 'Smart Reminder System', desc: 'Multi-channel reminders via SMS, email, and voice. Reduces no-shows by up to 50%.', chatPreview: ["Reminder: You have an appointment with Dr. Miller tomorrow at 2 PM.", "Reply YES to confirm, RESCHEDULE to change, or CANCEL.", "Thank you for confirming! See you tomorrow."] },
      { title: 'Voice Receptionist', desc: 'AI answers calls, provides office hours, directs emergencies, and books appointments.', chatPreview: ["Thank you for calling. Our AI assistant is here to help.", "For appointments, press 1. For prescriptions, press 2. For emergencies, stay on the line.", "Connecting you to the next available staff member..."] },
      { title: 'Patient Follow-Up', desc: 'Automated post-visit follow-ups, satisfaction surveys, and treatment plan reminders.', chatPreview: ["Hi, this is a follow-up from your visit on Monday. How are you feeling?", "Your treatment plan includes: 1) Take prescribed medication daily 2) Rest for 48 hours 3) Follow-up in 2 weeks.", "Any concerns? Reply here and we'll get back to you within 2 hours."] },
    ],
    realestate: [
      { title: 'Property Recommendation AI', desc: 'Match buyers with properties using natural language preferences, budget, and lifestyle.', chatPreview: ["What are you looking for in your next home?", "I'd like a 3-bedroom house near good schools, budget around $500K.", "I found 7 properties that match! Top pick: 3-bed, 2-bath near Lincoln Elementary, listed at $485K. Want details?"] },
      { title: 'Lead Qualification AI', desc: 'Qualify buyers and sellers automatically with smart questionnaires that feel natural.', chatPreview: ["Welcome! Let me help you find the right property.", "Are you looking to buy, sell, or both?", "Great! A few quick questions: What's your timeline? Have you been pre-approved? What areas interest you?"] },
      { title: 'Viewing Booking System', desc: 'Schedule, confirm, and follow up on property viewings. Syncs with your calendar.', chatPreview: ["I've scheduled your viewing of 123 Oak Street for Saturday at 2 PM.", "The property has 4 bedrooms, 2.5 bathrooms, and a renovated kitchen.", "I'll send you the address and directions 1 hour before."] },
      { title: 'Market Analysis', desc: 'AI-powered CMA reports and neighborhood insights for every listing.', chatPreview: ["Here's the Comparative Market Analysis for your property.", "Similar homes in your area sold for $485K-$520K in the last 90 days.", "Based on your home's features, I recommend listing at $509,000."] },
    ],
    restaurant: [
      { title: 'AI Reservation System', desc: 'Handle reservations, waitlists, and table management automatically.', chatPreview: ["Welcome! How many guests will be dining tonight?", "Party of 4, around 7 PM please.", "Perfect! I have a table for 4 at 7 PM. Any dietary restrictions I should notify the kitchen about?"] },
      { title: 'Menu Chatbot', desc: 'Answer menu questions, dietary restrictions, and allergen info 24/7.', chatPreview: ["I can help with our menu! What would you like to know?", "Do you have gluten-free options?", "Yes! We have 8 gluten-free dishes including our popular GF pasta, grilled salmon, and cauliflower steak. Would you like details on any?"] },
      { title: 'Review Management', desc: 'Auto-respond to reviews, track sentiment, and identify service issues.', chatPreview: ["New 5-star review: 'Amazing food and service!'", "Response drafted: Thank you so much! We're thrilled you enjoyed your experience. We hope to see you again soon!", "Sent automatically. Review trending positively this week."] },
      { title: 'Loyalty Program AI', desc: 'Personalized offers based on dining history, preferences, and special occasions.', chatPreview: ["Happy Birthday month! Here's a special offer just for you.", "Enjoy a complimentary dessert with your next meal this month.", "You've dined with us 12 times this year — you're now a Gold Member!"] },
    ],
    ecommerce: [
      { title: 'AI Shopping Assistant', desc: 'Help customers find products, compare options, and make purchase decisions.', chatPreview: ["Hi! I'm your personal shopping assistant. What are you looking for?", "I need a laptop for video editing, under $2000.", "I recommend the Dell XPS 15 or MacBook Pro 14. Based on your video editing needs, the MacBook Pro with M3 Pro chip would be ideal. Want to compare specs?"] },
      { title: 'Smart Product Recommendations', desc: 'AI-powered recommendations based on browsing history, purchase patterns, and preferences.', chatPreview: ["Based on your recent purchases, you might like these items.", "Customers who bought the running shoes also purchased our performance socks and hydration pack.", "These items are currently 15% off — want me to add them to your cart?"] },
      { title: 'Returns & Support Bot', desc: 'Handle returns, exchanges, and customer support questions automatically.', chatPreview: ["I see you'd like to return your recent order.", "Your order #12345 is eligible for return within 30 days. I've initiated the process — you'll receive a prepaid shipping label by email.", "Once we receive the item, your refund will be processed within 3-5 business days."] },
      { title: 'Abandoned Cart Recovery', desc: 'AI-powered follow-ups for abandoned carts with personalized incentives.', chatPreview: ["You left items in your cart! Here's a reminder.", "Still thinking about it? Here's 10% off your entire cart — valid for 24 hours.", "Use code COMEBACK10 at checkout. Your cart is waiting!"] },
    ],
    finance: [
      { title: 'Client Onboarding AI', desc: 'Automated KYC, document collection, and account setup for new clients.', chatPreview: ["Welcome to our firm! Let's get your account set up.", "I'll need a few documents: government ID, proof of address, and your SSN for tax reporting.", "All documents received and verified! Your account is now active. Your advisor will reach out within 24 hours."] },
      { title: 'Financial Q&A Bot', desc: 'Answer common financial questions, explain products, and provide preliminary guidance.', chatPreview: ["I can help with questions about our services and financial planning.", "What's the difference between a traditional and Roth IRA?", "Great question! With a traditional IRA, you contribute pre-tax money and pay taxes in retirement. With a Roth IRA, you contribute after-tax money but withdrawals are tax-free. Want me to explain which might be better for you?"] },
      { title: 'Appointment Scheduling', desc: 'Schedule consultations with advisors, send reminders, and prepare meeting briefs.', chatPreview: ["Your consultation with Advisor Thompson is scheduled for Tuesday at 10 AM.", "To prepare, please have your recent tax returns and investment statements ready.", "I've sent a pre-meeting questionnaire to help your advisor prepare personalized recommendations."] },
      { title: 'Document Analysis', desc: 'AI that processes financial documents, extracts key data, and flags action items.', chatPreview: ["I've analyzed your financial statements for Q1 2024.", "Key findings: Revenue up 12%, expenses up 8%, net profit margin improved to 18%.", "Action items: Review the 3 flagged transactions and consider the tax optimization opportunity I identified."] },
    ],
    education: [
      { title: 'Student Enrollment AI', desc: 'Guide prospective students through the enrollment process, answer questions, and collect applications.', chatPreview: ["Welcome! I'm here to help you explore our programs.", "I'm interested in the Computer Science program.", "Great choice! Our CS program is ranked top 20 nationally. I'll walk you through prerequisites, tuition options, and the application process. Ready to start?"] },
      { title: 'Course Recommendation', desc: 'AI that suggests courses based on student goals, prerequisites, and career aspirations.', chatPreview: ["Based on your goal of becoming a data scientist, I recommend:", "1) Statistics 201 (prerequisite), 2) Machine Learning 301, 3) Data Visualization 250.", "These courses can be completed in 2 semesters. Want me to check availability?"] },
      { title: 'Assignment Help Bot', desc: "24/7 AI assistant that helps students with questions, resources, and study planning.", chatPreview: ["I'm stuck on the calculus problem set. Can you help?", "Of course! Let me walk you through Problem 3 step by step.", "The key is to use the chain rule. Here's how: first identify the inner function, then differentiate it, then multiply by the derivative of the outer function..."] },
      { title: 'Parent Communication', desc: 'Automated updates to parents about attendance, grades, and upcoming events.', chatPreview: ["Hi! Here's your weekly update for Alex:", "Attendance: 100% this week. Grade in Math: B+ (improved from B).", "Upcoming: Science fair on Friday. Alex's project on renewable energy has been selected as a finalist!"] },
    ],
    agency: [
      { title: 'Client Onboarding AI', desc: 'Streamlined onboarding with brand brief collection, project scoping, and timeline setup.', chatPreview: ["Welcome aboard! Let's get your project started.", "I'll need your brand guidelines, target audience details, and campaign goals.", "Based on your brief, I recommend a 3-month strategy focused on social media and content marketing. Estimated reach: 500K impressions."] },
      { title: 'Campaign Performance Bot', desc: 'Real-time campaign insights, anomaly detection, and optimization suggestions.', chatPreview: ["Your LinkedIn campaign is performing 40% above benchmark today!", "The top-performing ad is the 'Problem-Solution' variant with a 6.2% CTR.", "Suggestion: Increase budget allocation to this ad by 30% for maximum ROI."] },
      { title: 'Content Calendar AI', desc: 'AI generates content calendars based on industry trends, audience behavior, and campaign goals.', chatPreview: ["Here's your proposed content calendar for next month:", "Week 1: Industry trend report (blog), 3 social posts, 1 email newsletter.", "Week 2: Customer success story (video), 4 social posts, 1 webinar.", "All content is optimized for your peak engagement times: 9-11 AM and 2-4 PM."] },
      { title: 'Reporting Automation', desc: 'Automated weekly/monthly reports with key metrics, insights, and recommendations.', chatPreview: ["Your June Performance Report is ready.", "Key metrics: Website traffic +23%, Leads generated: 47, Cost per lead: $12.40.", "Top recommendation: Your blog content is driving 60% of organic traffic. Doubling your content output could yield 35% more leads."] },
    ],
    general: [
      { title: 'AI Customer Engagement', desc: 'Intelligent chatbot that understands context, provides instant responses, and qualifies leads 24/7.', chatPreview: ["Hello! How can I help you today?", "I'm interested in learning more about your services.", "Great! I'd love to help. What specific challenge are you looking to solve? Our team specializes in automation, analytics, and customer engagement solutions."] },
      { title: 'Process Automation', desc: 'Eliminate manual workflows with AI that learns your business processes and automates repetitive tasks.', chatPreview: ["I've identified 5 processes that can be automated:", "1) Invoice processing (saves 8h/week), 2) Customer onboarding (saves 5h/week)", "Total estimated time savings: 20+ hours per week."] },
      { title: 'Smart Analytics', desc: 'Transform your data into actionable insights with AI-powered analytics and predictive modeling.', chatPreview: ["Your monthly analytics report is ready.", "Revenue trend: Up 15% MoM. Churn risk: 3 customers flagged.", "Predictive model suggests Q3 revenue could reach $250K with the current growth trajectory."] },
      { title: 'Lead Nurturing', desc: 'Automated follow-up sequences that feel personal, not mass-produced.', chatPreview: ["New lead: John from Acme Corp visited your pricing page 3 times this week.", "Suggested follow-up: Share a relevant case study about a similar company.", "I've drafted a personalized email referencing their specific industry challenge. Ready to review?"] },
    ],
  }

  const features = demoFeatures[demoType] || demoFeatures.general
  const demoLabel = demoType === 'law' ? 'Law Firm' : demoType === 'healthcare' ? 'Healthcare' : demoType === 'realestate' ? 'Real Estate' : demoType === 'restaurant' ? 'Restaurant' : demoType === 'ecommerce' ? 'E-Commerce' : demoType === 'finance' ? 'Financial Services' : demoType === 'education' ? 'Education' : demoType === 'agency' ? 'Marketing Agency' : 'Business'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Solutions for ${esc(business.name)} — Personalized Demo</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${primary};background:#fff;line-height:1.6}
.hero{background:linear-gradient(160deg,${primary} 0%,#334155 100%);color:white;padding:80px 40px 60px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 30% 50%,rgba(37,99,235,0.2),transparent 60%)}
.hero>*{position:relative;z-index:1}
.hero h1{font-size:36px;font-weight:900;letter-spacing:-0.03em;margin-bottom:8px}
.hero p{font-size:16px;opacity:0.8;max-width:600px;margin:0 auto 24px}
.badge{display:inline-block;padding:5px 14px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.15);border-radius:20px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:20px;backdrop-filter:blur(8px)}
.container{max-width:920px;margin:0 auto;padding:48px 24px}
.section{margin-bottom:56px}
.section-title{font-size:24px;font-weight:800;color:${primary};margin-bottom:24px;display:flex;align-items:center;gap:10px}
.section-title .dot{width:8px;height:8px;border-radius:50%;background:${accent}}
.section-subtitle{font-size:14px;color:#64748B;margin-top:-16px;margin-bottom:24px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.problem-card{background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px}
.problem-card h4{font-size:14px;font-weight:700;color:#991B1B;margin-bottom:6px}
.problem-card p{font-size:13px;color:#B91C1C;line-height:1.6}
.solution-card{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:20px;transition:transform 0.2s,box-shadow 0.2s}
.solution-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(5,150,105,0.12)}
.solution-card h4{font-size:14px;font-weight:700;color:#065F46;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.solution-card h4 .icon{width:28px;height:28px;background:#059669;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:white;flex-shrink:0}
.solution-card p{font-size:13px;color:#15803D;line-height:1.6}
.score-display{display:flex;align-items:center;gap:20px;padding:24px;background:${light};border-radius:16px;border:1px solid #E2E8F0;margin-bottom:32px}
.score-circle{width:80px;height:80px;border-radius:50%;border:5px solid ${scoreColor};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:${scoreColor};flex-shrink:0}
.metric{text-align:center;padding:24px 16px;background:${light};border-radius:12px;border:1px solid #E2E8F0}
.metric .number{font-size:32px;font-weight:900;color:${accent}}
.metric .label{font-size:12px;color:#64748B;margin-top:4px}
.timeline{position:relative;padding-left:28px}
.timeline::before{content:'';position:absolute;left:8px;top:0;bottom:0;width:2px;background:#E2E8F0}
.timeline-item{position:relative;margin-bottom:24px}
.timeline-item::before{content:'';position:absolute;left:-24px;top:6px;width:12px;height:12px;border-radius:50%;background:${accent};border:3px solid #fff;box-shadow:0 0 0 2px ${accent}}
.timeline-item h4{font-size:14px;font-weight:700;color:${primary}}
.timeline-item p{font-size:13px;color:#64748B;margin-top:2px}
.cta-section{text-align:center;padding:56px 32px;background:linear-gradient(135deg,#EFF6FF,#F8FAFC);border-radius:20px;border:1px solid #BFDBFE}
.cta-section h3{font-size:24px;font-weight:900;color:#1E40AF;margin-bottom:8px}
.cta-section p{color:#3B82F6;font-size:15px;margin-bottom:20px}
.cta-button{display:inline-block;padding:14px 36px;background:${accent};color:white;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(37,99,235,0.3)}
.interactive-demo{border:2px dashed #CBD5E1;border-radius:16px;padding:40px;text-align:center;background:#FAFBFC}
.interactive-demo h4{font-size:16px;font-weight:700;color:${primary};margin-bottom:8px}
.interactive-demo p{font-size:13px;color:#64748B}
.demo-feature{padding:16px;background:${light};border-radius:10px;border:1px solid #E2E8F0;text-align:center;cursor:pointer;transition:all 0.2s}
.demo-feature:hover{background:#EFF6FF;border-color:${accent}}
.demo-feature .icon{font-size:24px;margin-bottom:8px}
.demo-feature h5{font-size:13px;font-weight:700;color:${primary}}
.demo-feature p{font-size:11px;color:#64748B;margin-top:4px}
.footer{text-align:center;padding:32px;color:#94A3B8;font-size:12px;border-top:1px solid #E2E8F0;margin-top:0}
@media(max-width:640px){
  .grid-2,.grid-3{grid-template-columns:1fr}
  .hero{padding:48px 20px 40px}
  .hero h1{font-size:28px}
}
</style>
</head>
<body>

<!-- ═══ PERSONALIZED HERO ═══ -->
<div class="hero">
  <div class="badge">Personalized AI Solution</div>
  <h1>${esc(business.name)}</h1>
  <p>AI-powered solutions tailored specifically for your business${business.industry ? ` in the ${esc(business.industry)} industry` : ''}</p>
  <div style="display:inline-flex;gap:8px;flex-wrap:wrap;justify-content:center">
    ${business.industry ? `<span style="padding:4px 12px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:12px">${esc(business.industry)}</span>` : ''}
    ${business.city ? `<span style="padding:4px 12px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:12px">${esc(business.city)}</span>` : ''}
    <span style="padding:4px 12px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:12px">${demoLabel} Demo</span>
  </div>
</div>

<div class="container">

<!-- ═══ AUDIT SUMMARY ═══ -->
<div class="section">
  <div class="section-title"><span class="dot"></span>Website Audit Summary</div>
  <div class="score-display">
    <div class="score-circle">${score}</div>
    <div>
      <div style="font-size:13px;color:#64748B">Overall Website Score</div>
      <div style="font-size:20px;font-weight:800;color:${scoreColor}">${scoreLabel}</div>
      <div style="font-size:12px;color:#94A3B8;margin-top:4px">${audit?.executiveSummary ? esc(audit.executiveSummary.substring(0, 200)) + '...' : 'Comprehensive audit completed'}</div>
    </div>
  </div>

  ${audit ? `<div class="grid-3" style="margin-bottom:24px">
    <div style="text-align:center;padding:12px;background:${light};border-radius:10px;border:1px solid #E2E8F0">
      <div style="font-size:22px;font-weight:800;color:${audit.uiScore >= 70 ? '#059669' : audit.uiScore >= 40 ? '#D97706' : '#DC2626'}">${audit.uiScore}</div>
      <div style="font-size:11px;color:#64748B">UI Design</div>
    </div>
    <div style="text-align:center;padding:12px;background:${light};border-radius:10px;border:1px solid #E2E8F0">
      <div style="font-size:22px;font-weight:800;color:${audit.uxScore >= 70 ? '#059669' : audit.uxScore >= 40 ? '#D97706' : '#DC2626'}">${audit.uxScore}</div>
      <div style="font-size:11px;color:#64748B">UX</div>
    </div>
    <div style="text-align:center;padding:12px;background:${light};border-radius:10px;border:1px solid #E2E8F0">
      <div style="font-size:22px;font-weight:800;color:${audit.conversionScore >= 70 ? '#059669' : audit.conversionScore >= 40 ? '#D97706' : '#DC2626'}">${audit.conversionScore}</div>
      <div style="font-size:11px;color:#64748B">Conversion</div>
    </div>
  </div>` : ''}
</div>

<!-- ═══ CURRENT CHALLENGES ═══ -->
${problems.length > 0 ? `<div class="section">
  <div class="section-title"><span class="dot" style="background:#DC2626"></span>Current Challenges</div>
  <div class="section-subtitle">Issues identified during our analysis of ${esc(business.name)}</div>
  <div class="grid-2">
    ${problems.slice(0, 4).map((p: any) => {
      const text = typeof p === 'string' ? p : (p.issue || p.problem || p.description || '')
      const impact = typeof p === 'string' ? '' : (p.impact || p.businessImpact || '')
      return `<div class="problem-card">
        <h4>${esc(text.substring(0, 80))}</h4>
        <p>${esc(impact || text)}</p>
      </div>`
    }).join('')}
  </div>
</div>` : ''}

<!-- ═══ RECOMMENDED AI SOLUTIONS ═══ -->
<div class="section">
  <div class="section-title"><span class="dot" style="background:#059669"></span>Recommended AI Solutions</div>
  <div class="section-subtitle">Tailored for ${esc(business.name)} in the ${esc(business.industry || demoLabel)} space</div>
  <div class="grid-2">
    ${features.map(f => `<div class="solution-card">
      <h4><span class="icon">AI</span>${esc(f.title)}</h4>
      <p>${esc(f.desc)}</p>
    </div>`).join('')}
  </div>
  ${aiOpps.length > 0 ? `<div style="margin-top:20px">
    <h4 style="font-size:14px;font-weight:700;color:${primary};margin-bottom:8px">Additional AI Opportunities</h4>
    ${aiOpps.slice(0, 3).map((o: any) => `<div style="padding:10px 14px;background:#F0FDF4;border-radius:8px;margin-bottom:6px;font-size:13px;color:#065F46">
      ${esc(typeof o === 'string' ? o : (o.opportunity || o.name || String(o)))}
    </div>`).join('')}
  </div>` : ''}
</div>

<!-- ═══ INTERACTIVE DEMO ═══ -->
<div class="section">
  <div class="section-title"><span class="dot" style="background:#7C3AED"></span>Interactive Demo</div>
  <div class="section-subtitle">Click any feature below to see how AI would work for ${esc(business.name)}</div>
  <div class="grid-2" id="demo-grid">
    ${features.map((f, i) => `<div class="demo-feature" onclick="showDemo(${i})">
      <div class="icon">${['01', '02', '03', '04'][i]}</div>
      <h5>${esc(f.title)}</h5>
      <p>Click to preview</p>
    </div>`).join('')}
  </div>
  <div id="demo-preview" class="interactive-demo" style="margin-top:20px;display:none">
    <h4 id="demo-title">Demo Preview</h4>
    <p id="demo-desc">Select a feature above to see the interactive demonstration</p>
  </div>
</div>

<!-- ═══ EXPECTED IMPACT ═══ -->
<div class="section">
  <div class="section-title"><span class="dot" style="background:${accent}"></span>Expected Impact</div>
  <div class="grid-3">
    <div class="metric"><div class="number">60%</div><div class="label">Faster Response Time</div></div>
    <div class="metric"><div class="number">3x</div><div class="label">Lead Conversion</div></div>
    <div class="metric"><div class="number">20h</div><div class="label">Weekly Time Saved</div></div>
  </div>
</div>

<!-- ═══ 30/60/90 BLUEPRINT PREVIEW ═══ -->
${blueprintData ? `<div class="section">
  <div class="section-title"><span class="dot" style="background:#D97706"></span>AI Growth Blueprint</div>
  <div class="timeline">
    <div class="timeline-item">
      <h4>Days 1-30: ${esc(String(blueprintData.thirtyDayPlan?.focus || 'Foundation & Quick Wins'))}</h4>
      <p>${esc(String(blueprintData.thirtyDayPlan?.expectedResults || ''))}</p>
    </div>
    <div class="timeline-item">
      <h4>Days 31-60: ${esc(String(blueprintData.sixtyDayPlan?.focus || 'Growth & Optimization'))}</h4>
      <p>${esc(String(blueprintData.sixtyDayPlan?.expectedResults || ''))}</p>
    </div>
    <div class="timeline-item">
      <h4>Days 61-90: ${esc(String(blueprintData.ninetyDayPlan?.focus || 'Scale & Expand'))}</h4>
      <p>${esc(String(blueprintData.ninetyDayPlan?.expectedResults || ''))}</p>
    </div>
  </div>
</div>` : ''}

<!-- ═══ CTA ═══ -->
<div class="cta-section">
  <h3>Ready to Transform ${esc(business.name)}?</h3>
  <p>Let's discuss how these AI solutions can be customized for your specific needs</p>
  <a href="#" class="cta-button">Schedule a Free Consultation</a>
  <p style="margin-top:12px;font-size:12px;color:#94A3B8">No commitment required · 30-minute consultation</p>
</div>

</div>

<div class="footer">
  Generated by TITAN AI Growth Operating System · ${date}<br>
  Prepared exclusively for ${esc(business.name)}
</div>

<script>
const features = ${JSON.stringify(features)};
function showDemo(idx){
  const f=features[idx];
  document.getElementById('demo-preview').style.display='block';
  document.getElementById('demo-title').textContent=f.title+' — Demo';
  document.getElementById('demo-desc').textContent=f.desc;
  document.getElementById('demo-preview').scrollIntoView({behavior:'smooth',block:'center'});
}
</script>
</body>
</html>`
}