import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartModule } from '../cart/cart.module';
import { CatalogClient } from '../common/catalog.client';
import { StripeService } from '../payments/stripe/stripe.service';
import { StripeController } from '../payments/stripe/stripe.controller';

@Module({
  imports: [CartModule],
  controllers: [OrdersController, StripeController],
  providers: [OrdersService, CatalogClient, StripeService],
})
export class OrdersModule {}
