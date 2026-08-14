import { NextResponse } from 'next/server';
import { catalogApi } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

/**
 * Proxy goi y cho trinh duyet.
 *
 * Trinh duyet goi cung goc (`/api/suggest`) thay vi goi thang catalog-service:
 * khong dinh CORS, va dia chi noi bo cua service khong lo ra client.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';

  if (q.trim() === '') {
    return NextResponse.json({ query: q, items: [] });
  }

  try {
    return NextResponse.json(await catalogApi.suggest(q));
  } catch {
    // Goi y hong khong duoc lam vo o tim kiem - tra danh sach rong la du.
    return NextResponse.json({ query: q, items: [] }, { status: 200 });
  }
}
