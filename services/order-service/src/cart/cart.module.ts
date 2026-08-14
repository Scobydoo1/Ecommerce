import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CatalogClient } from '../common/catalog.client';

@Module({
  controllers: [CartController],
  providers: [CartService, CatalogClient],
  exports: [CartService],
})
export class CartModule {}
