import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SEARCH_STRATEGIES, SearchService } from './search.service';
import { TrigramStrategy } from './strategies/trigram.strategy';

@Module({
  controllers: [SearchController],
  providers: [
    TrigramStrategy,
    {
      // Phase 1 chi co mot strategy. Phase 2 them VectorStrategy vao mang nay
      // la xong, SearchService khong phai sua gi (AD-1).
      provide: SEARCH_STRATEGIES,
      useFactory: (trigram: TrigramStrategy) => [trigram],
      inject: [TrigramStrategy],
    },
    SearchService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
