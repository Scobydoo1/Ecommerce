'use client';

import { useEffect, useState } from 'react';

/**
 * Giu lai gia tri moi cho den khi nguoi dung ngung go `delayMs`.
 * Tranh ban mot request goi y cho moi phim.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
