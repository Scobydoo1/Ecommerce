import { Inject, Injectable } from '@nestjs/common';
import type { SearchResponse, SuggestResponse } from '@ecommerce/types';
import { PrismaService } from '../common/prisma.service';
import { PRODUCT_INCLUDE, toProductSummary } from '../products/product.mapper';
import { normalizeQuery } from './normalizeQuery';
import { fuseResults } from './fuseResults';
import type { RankedList, SearchStrategy } from './types';

export const SEARCH_STRATEGIES = Symbol('SEARCH_STRATEGIES');

interface SearchPageOptions {
  limit?: number;
  offset?: number;
  categoryId?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SUGGEST_LIMIT = 8;

/**
 * Moi strategy phai lay rong hon trang dang xem thi RRF moi co du nguyen lieu
 * de xep lai thu hang truoc khi cat trang.
 */
const CANDIDATE_MULTIPLIER = 4;

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_STRATEGIES) private readonly strategies: SearchStrategy[],
    private readonly prisma: PrismaService,
  ) {}

  async search(raw: string, options: SearchPageOptions): Promise<SearchResponse> {
    const normalizedQuery = normalizeQuery(raw ?? '');
    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const offset = options.offset ?? 0;

    if (normalizedQuery === '') {
      return { query: raw, normalizedQuery, total: 0, limit, offset, items: [] };
    }

    const candidateWindow = {
      limit: (offset + limit) * CANDIDATE_MULTIPLIER,
      offset: 0,
      categoryId: options.categoryId,
    };

    const lists: RankedList[] = await Promise.all(
      this.strategies.map(async (strategy) => ({
        strategy: strategy.name,
        hits: await strategy.search(normalizedQuery, candidateWindow),
      })),
    );

    const fused = fuseResults(lists);
    const pageHits = fused.slice(offset, offset + limit);

    if (pageHits.length === 0) {
      return { query: raw, normalizedQuery, total: fused.length, limit, offset, items: [] };
    }

    const rows = await this.prisma.product.findMany({
      where: { id: { in: pageHits.map((hit) => hit.productId) } },
      include: PRODUCT_INCLUDE,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    // Giu dung thu tu do RRF quyet dinh, khong theo thu tu Prisma tra ve.
    // San pham bi xoa giua chung se bien mat khoi trang thay vi lam vo response.
    const items = pageHits
      .map((hit) => byId.get(hit.productId))
      .filter((row) => row !== undefined)
      .map(toProductSummary);

    return { query: raw, normalizedQuery, total: fused.length, limit, offset, items };
  }

  async suggest(raw: string): Promise<SuggestResponse> {
    const { items } = await this.search(raw, { limit: SUGGEST_LIMIT, offset: 0 });

    return {
      query: raw,
      items: items.map((item) => ({ name: item.name, slug: item.slug })),
    };
  }
}
