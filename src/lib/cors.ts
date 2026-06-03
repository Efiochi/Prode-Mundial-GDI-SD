import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://prode-mundial-pied.vercel.app',
  // add more origins here if needed
]

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000')
}

export function corsHeaders(origin?: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleOptions(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    })
  }
  return null
}

export function withCors(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}
