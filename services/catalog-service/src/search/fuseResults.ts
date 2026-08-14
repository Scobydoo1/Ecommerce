import type { RankedList, SearchHit } from './types';

export const DEFAULT_RRF_K = 60;

/**
 * Reciprocal Rank Fusion.
 *
 *   score(doc) = tong tren cac strategy cua 1 / (k + rank)
 *
 * RRF chi dung THU HANG, khong dung diem tho, nen hop nhat duoc cac strategy
 * co thang diem hoan toan khac nhau (similarity 0..1 cua pg_trgm va cosine
 * distance cua pgvector) ma khong phai chuan hoa diem.
 *
 * `k` lon lam phang chenh lech giua cac hang: tai lieu duoc nhieu strategy
 * cung dong y se noi len tren tai lieu chi dung dau o mot strategy.
 *
 * Khi diem bang nhau, sap theo `productId` tang dan de ket qua tat dinh.
 */
export function fuseResults(lists: RankedList[], k: number = DEFAULT_RRF_K): SearchHit[] {
  const scores = new Map<string, number>();

  for (const list of lists) {
    list.hits.forEach((hit, index) => {
      const rank = index + 1;
      scores.set(hit.productId, (scores.get(hit.productId) ?? 0) + 1 / (k + rank));
    });
  }

  return [...scores.entries()]
    .map(([productId, score]) => ({ productId, score }))
    .sort((a, b) => (b.score === a.score ? a.productId.localeCompare(b.productId) : b.score - a.score));
}
