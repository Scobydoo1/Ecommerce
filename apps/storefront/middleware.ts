import { NextResponse, type NextRequest } from 'next/server';

export const CART_SESSION_COOKIE = 'cart_session';

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

/**
 * Bao dam moi khach co mot ma phien gio hang truoc khi trang duoc render.
 *
 * Phai lam o middleware chu khong o server component: server component doc
 * duoc cookie nhung khong dat duoc cookie. Ma phien duoc gan vao CA request
 * (de trang render trong cung luot da thay) lan response (de trinh duyet giu).
 */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(CART_SESSION_COOKIE)?.value;
  if (existing) return NextResponse.next();

  const sessionId = crypto.randomUUID();
  request.cookies.set(CART_SESSION_COOKIE, sessionId);

  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS_SECONDS,
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
