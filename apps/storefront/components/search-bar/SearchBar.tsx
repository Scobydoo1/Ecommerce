'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SuggestItem } from '@ecommerce/types';
import { useDebouncedValue } from './useDebouncedValue';
import { moveHighlight, NO_HIGHLIGHT } from './moveHighlight';

const DEBOUNCE_MS = 250;

type Props = {
  variant?: 'header' | 'hero';
  initialQuery?: string;
};

export function SearchBar({ variant = 'header', initialQuery = '' }: Props) {
  const router = useRouter();
  const listId = useId();

  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(NO_HIGHLIGHT);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const boxRef = useRef<HTMLDivElement>(null);

  // Tren trang ket qua, o nhap duoc dien san tu URL. Neu chi dua vao "co chu
  // trong o" thi danh sach goi y tu bung ra ngay khi tai trang va che mat tieu
  // de. Chi mo khi nguoi dung that su go.
  const hasTyped = useRef(false);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term === '') {
      setItems([]);
      return;
    }

    // Huy request cu khi nguoi dung go tiep, de ket qua ve muon khong ghi de
    // ket qua moi.
    const controller = new AbortController();

    fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: SuggestItem[] }) => {
        setItems(data.items ?? []);
        setHighlight(NO_HIGHLIGHT);
        if (hasTyped.current) setOpen(true);
      })
      .catch(() => {
        /* request bi huy hoac mang loi: giu nguyen goi y dang hien. */
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function submitQuery(term: string) {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open && items.length > 0) setOpen(true);
      setHighlight((current) => moveHighlight(current, event.key === 'ArrowDown' ? 1 : -1, items.length));
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setHighlight(NO_HIGHLIGHT);
      return;
    }

    if (event.key === 'Enter') {
      const chosen = items[highlight];
      event.preventDefault();
      if (chosen) {
        setOpen(false);
        router.push(`/products/${chosen.slug}`);
      } else if (query.trim() !== '') {
        submitQuery(query.trim());
      }
    }
  }

  const showList = open && items.length > 0;
  const isHero = variant === 'hero';

  return (
    <div ref={boxRef} className={`relative ${isHero ? 'w-full max-w-2xl' : 'ml-auto w-full max-w-xs'}`}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim() !== '') submitQuery(query.trim());
        }}
        className="flex items-center"
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Tìm sản phẩm
        </label>
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && highlight !== NO_HIGHLIGHT ? `${listId}-option-${highlight}` : undefined
          }
          autoComplete="off"
          value={query}
          placeholder={isHero ? 'áo thun, đồng hồ, tai nghe…' : 'Tìm sản phẩm…'}
          onChange={(event) => {
            hasTyped.current = true;
            setQuery(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => hasTyped.current && items.length > 0 && setOpen(true)}
          className={
            isHero
              ? 'h-14 flex-1 rounded-l-md border border-jade/30 bg-white px-4 text-lg placeholder:text-muted focus:border-jade'
              : 'h-10 w-full rounded-l-md border border-line bg-mist px-3 text-sm placeholder:text-muted focus:border-jade'
          }
        />
        <button
          type="submit"
          className={
            isHero
              ? 'h-14 shrink-0 rounded-r-md bg-jade px-8 font-medium text-white transition-colors hover:bg-jade-deep'
              : 'h-10 shrink-0 rounded-r-md bg-jade px-4 text-sm font-medium text-white hover:bg-jade-deep'
          }
        >
          Tìm
        </button>
      </form>

      <ul
        id={listId}
        role="listbox"
        aria-label="Gợi ý sản phẩm"
        hidden={!showList}
        className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-line bg-white shadow-lg"
      >
        {items.map((item, index) => (
          <li
            key={item.slug}
            id={`${listId}-option-${index}`}
            role="option"
            aria-selected={index === highlight}
            // `onMouseDown` chu khong phai `onClick`: click lam input mat focus
            // truoc khi kip dieu huong.
            onMouseDown={(event) => {
              event.preventDefault();
              setOpen(false);
              router.push(`/products/${item.slug}`);
            }}
            onMouseEnter={() => setHighlight(index)}
            className={`cursor-pointer px-4 py-2.5 text-sm ${
              index === highlight ? 'bg-jade-wash text-jade-deep' : 'text-ink'
            }`}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
