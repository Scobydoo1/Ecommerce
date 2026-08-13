export interface SearchHit {
  productId: string;
  score: number;
}

/** Ket qua cua mot strategy, da duoc xep hang: phan tu dau tien la rank 1. */
export interface RankedList {
  strategy: string;
  hits: SearchHit[];
}

export interface SearchOptions {
  limit: number;
  offset: number;
  categoryId?: string;
}

/**
 * Hop dong ma moi chien luoc tim kiem phai tuan theo.
 *
 * Phase 1 chi co TrigramStrategy. Phase 2 them VectorStrategy vao danh sach
 * ma khong phai sua SearchService (AD-1).
 */
export interface SearchStrategy {
  readonly name: string;
  search(normalizedQuery: string, options: SearchOptions): Promise<SearchHit[]>;
}
