import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { SearchResponse, SuggestResponse } from '@ecommerce/types';
import { SearchService } from './search.service';
import { SearchQueryDto, SuggestQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  // Rate limit chat hon muc toan cuc theo muc 8 CLAUDE.md: search la endpoint
  // de bi lam dung nhat vi moi lan go phim deu co the goi.
  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  searchProducts(@Query() query: SearchQueryDto): Promise<SearchResponse> {
    return this.search.search(query.q ?? '', {
      limit: query.limit,
      offset: query.offset,
      categoryId: query.categoryId,
    });
  }

  @Get('suggest')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  suggest(@Query() query: SuggestQueryDto): Promise<SuggestResponse> {
    return this.search.suggest(query.q ?? '');
  }
}
