import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import type { CheckoutResult, OrderView } from '@ecommerce/types';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  @HttpCode(201)
  checkout(
    @Body() dto: CheckoutDto,
    @Headers('x-cart-session') sessionId?: string,
  ): Promise<CheckoutResult> {
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('Thieu header x-cart-session');
    }

    return this.orders.checkout(sessionId, dto.email, dto.userId);
  }

  @Get(':orderNumber')
  findOne(@Param('orderNumber') orderNumber: string): Promise<OrderView> {
    return this.orders.findByOrderNumber(orderNumber);
  }
}
