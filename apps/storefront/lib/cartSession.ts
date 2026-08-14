import { cookies } from 'next/headers';
import { CART_SESSION_COOKIE } from '@/middleware';

/**
 * Doc ma phien gio hang do middleware dat. Tra ve chuoi rong neu chua co -
 * khi do gio hang duong nhien rong, khong can goi order-service.
 */
export function getCartSession(): string {
  return cookies().get(CART_SESSION_COOKIE)?.value ?? '';
}
