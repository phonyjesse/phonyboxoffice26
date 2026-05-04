import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  const auth = request.headers.get('authorization')

  if (auth?.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6))
    const [, password] = decoded.split(':')
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Box Office Admin"' },
  })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
