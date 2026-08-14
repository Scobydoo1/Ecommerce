import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { CartView } from '@ecommerce/types';
import { CartService } from './cart.service';
import { AddCartItemDto, SetQuantityDto } from './dto/cart.dto';

/**
 * Phien gio hang di qua header `x-cart-session`. Storefront sinh va giu no
 * trong cookie HttpOnly, nen order-service khong can biet gi ve auth.
 */
function requireSession(sessionId: string | undefined): string {
  if (!sessionId || sessionId.trim() === '') {
    throw new BadRequestException('Thieu header x-cart-session');
  }
  return sessionId;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@Headers('x-cart-session') sessionId?: string): Promise<CartView> {
    return this.cart.getCart(requireSession(sessionId));
  }

  @Post('items')
  @HttpCode(200)
  addItem(
    @Body() dto: AddCartItemDto,
    @Headers('x-cart-session') sessionId?: string,
  ): Promise<CartView> {
    return this.cart.addItem(requireSession(sessionId), dto.productId, dto.quantity);
  }

  @Put('items/:productId')
  setQuantity(
    @Param('productId') productId: string,
    @Body() dto: SetQuantityDto,
    @Headers('x-cart-session') sessionId?: string,
  ): Promise<CartView> {
    return this.cart.setQuantity(requireSession(sessionId), productId, dto.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @Param('productId') productId: string,
    @Headers('x-cart-session') sessionId?: string,
  ): Promise<CartView> {
    return this.cart.setQuantity(requireSession(sessionId), productId, 0);
  }

  @Delete()
  @HttpCode(204)
  clear(@Headers('x-cart-session') sessionId?: string): Promise<void> {
    return this.cart.clear(requireSession(sessionId));
  }
}
