import { BadRequestException, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { OrdersService } from '../../orders/orders.service';

@Controller('payments/stripe')
export class StripeController {
  constructor(
    private readonly stripe: StripeService,
    private readonly orders: OrdersService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: true }> {
    if (!signature || !request.rawBody) {
      throw new BadRequestException('Thieu chu ky hoac body tho');
    }

    let event;
    try {
      event = this.stripe.verifyWebhook(request.rawBody, signature);
    } catch {
      // Khong log noi dung su kien: no chua du lieu thanh toan.
      throw new BadRequestException('Chu ky webhook khong hop le');
    }

    if (event.type === 'payment_intent.succeeded') {
      await this.orders.markPaymentResult((event.data.object as { id: string }).id, true);
    } else if (event.type === 'payment_intent.payment_failed') {
      await this.orders.markPaymentResult((event.data.object as { id: string }).id, false);
    }

    return { received: true };
  }
}
