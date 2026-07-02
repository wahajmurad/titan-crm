import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const PUBLIC_PATHS = ['/api/auth', '/api/setup', '/_next', '/favicon.ico']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // ── Security Headers ──
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  }

  // ── Block common attack paths ──
  if (pathname.includes('/.') && !pathname.startsWith('/_next')) {
    return new NextResponse(null, { status: 404 })
  }

  const blockedPatterns = ['../', '..\\', '%2e%2e', '%252e', '<script', 'javascript:']
  const urlLower = pathname.toLowerCase()
  for (const pattern of blockedPatterns) {
    if (urlLower.includes(pattern.toLowerCase())) {
      return new NextResponse(null, { status: 400 })
    }
  }

  // ── API Route Protection ──
  if (pathname.startsWith('/api/') && !PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const method = request.method.toUpperCase()
    const allowedMethods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
    if (!allowedMethods.includes(method)) {
      return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
    }

    if (['POST', 'PATCH', 'PUT'].includes(method)) {
      const contentType = request.headers.get('content-type') || ''
      if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415 })
      }
    }

    response.headers.set('Content-Type', 'application/json')
  }

  // ── Rate Limit Indicator Headers ──
  response.headers.set('X-RateLimit-Policy', 'auth:5/15m, general:100/1m')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|fonts|images|icons).*)',
  ],
}