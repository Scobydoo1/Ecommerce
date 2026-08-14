import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export interface PaymentIntentResult {
  paymentIntentId: string | null;
  clientSecret: string | null;
}

/**
 * Boc Stripe test mode.
 *
 * Khi chua cau hinh STRIPE_SECRET_KEY, service chay o che do tat: don hang van
 * tao duoc va dung o trang thai PENDING. Nho vay dung duoc toan bo luong mua
 * hang tren may dev chua co khoa Stripe, thay vi vo ngay o buoc thanh toan.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      this.logger.warn('Chua co STRIPE_SECRET_KEY - thanh toan dang tat');
      this.stripe = null;
      return;
    }

    this.stripe = new Stripe(secretKey);
  }

  get enabled(): boolean {
    return this.stripe !== null;
  }

  async createPaymentIntent(
    amountCents: number,
    currency: string,
    orderNumber: string,
  ): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      return { paymentIntentId: null, clientSecret: null };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      // Chi luu ma don trong metadata - khong bao gio la thong tin ca nhan.
      metadata: { orderNumber },
      automatic_payment_methods: { enabled: true },
    });

    return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
  }

  /**
   * Kiem chu ky webhook. Bat buoc dung body THO - JSON da parse roi serialize
   * lai se cho ra chuoi khac va chu ky khong con khop.
   */
  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!this.stripe || !webhookSecret) {
      throw new Error('Webhook Stripe chua duoc cau hinh');
    }

    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
