import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { CheckoutResult, OrderView } from '@ecommerce/types';
import { PrismaService } from '../common/prisma.service';
import { CatalogClient } from '../common/catalog.client';
import { CartService } from '../cart/cart.service';
import { CartRuleError } from '../cart/cartRules';
import { StripeService } from '../payments/stripe/stripe.service';
import { buildOrderSnapshot, generateOrderNumber, randomSuffix } from './orderRules';

type OrderWithItems = {
  id: string;
  orderNumber: string;
  status: string;
  email: string | null;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  createdAt: Date;
  items: {
    productId: string;
    nameSnapshot: string;
    skuSnapshot: string;
    unitPriceCents: number;
    quantity: number;
  }[];
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly catalog: CatalogClient,
    private readonly stripe: StripeService,
  ) {}

  async checkout(sessionId: string, email: string, userId?: string): Promise<CheckoutResult> {
    const cart = await this.cart.getCart(sessionId);

    // SKU khong nam trong CartView nen phai hoi lai catalog de chup vao don.
    const products = await this.catalog.getProducts(cart.items.map((item) => item.productId));
    const skuByProductId: Record<string, string> = {};
    for (const [id, product] of products) {
      skuByProductId[id] = product.sku;
    }

    let snapshot;
    try {
      snapshot = buildOrderSnapshot(cart.items, skuByProductId);
    } catch (error) {
      if (error instanceof CartRuleError) throw new BadRequestException(error.message);
      throw error;
    }

    const currency = cart.subtotal.currency;
    const orderNumber = generateOrderNumber(new Date(), randomSuffix());

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: userId ?? null,
        email,
        subtotalCents: snapshot.subtotalCents,
        // Phase 1 chua co phi van chuyen hay khuyen mai nen tong = tam tinh.
        totalCents: snapshot.subtotalCents,
        currency,
        items: { create: snapshot.items },
      },
      include: { items: true },
    });

    const payment = await this.stripe.createPaymentIntent(
      order.totalCents,
      currency,
      orderNumber,
    );

    if (payment.paymentIntentId) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: payment.paymentIntentId },
      });
    }

    await this.cart.clear(sessionId);
    this.logger.log(`Da tao don ${orderNumber}`);

    return {
      order: this.toView(order as OrderWithItems),
      clientSecret: payment.clientSecret,
    };
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderView> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) throw new NotFoundException(`Khong tim thay don ${orderNumber}`);
    return this.toView(order as OrderWithItems);
  }

  async markPaymentResult(paymentIntentId: string, paid: boolean): Promise<void> {
    const order = await this.prisma.order.findFirst({ where: { stripePaymentIntentId: paymentIntentId } });

    if (!order) {
      this.logger.warn(`Webhook tro toi PaymentIntent khong khop don nao`);
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: paid ? 'PAID' : 'FAILED' },
    });

    this.logger.log(`Don ${order.orderNumber} chuyen sang ${paid ? 'PAID' : 'FAILED'}`);
  }

  private toView(order: OrderWithItems): OrderView {
    const currency = order.currency;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderView['status'],
      email: order.email,
      subtotal: { amountCents: order.subtotalCents, currency },
      total: { amountCents: order.totalCents, currency },
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.nameSnapshot,
        sku: item.skuSnapshot,
        unitPrice: { amountCents: item.unitPriceCents, currency },
        quantity: item.quantity,
        lineTotal: { amountCents: item.unitPriceCents * item.quantity, currency },
      })),
    };
  }
}
