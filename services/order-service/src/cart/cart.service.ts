import { BadRequestException, Injectable } from '@nestjs/common';
import type { CartLine, CartView } from '@ecommerce/types';
import { RedisService } from '../common/redis.service';
import { CatalogClient } from '../common/catalog.client';
import { addItem, calcSubtotalCents, CartItem, CartRuleError } from './cartRules';

/** Gio hang song 30 ngay ke tu lan cham cuoi. */
const CART_TTL_SECONDS = 60 * 60 * 24 * 30;

@Injectable()
export class CartService {
  constructor(
    private readonly redis: RedisService,
    private readonly catalog: CatalogClient,
  ) {}

  private key(sessionId: string): string {
    return `cart:${sessionId}`;
  }

  async readItems(sessionId: string): Promise<CartItem[]> {
    const raw = await this.redis.client.get(this.key(sessionId));
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Du lieu hong thi coi nhu gio rong, khong lam vo ca phien mua hang.
      return [];
    }
  }

  private async writeItems(sessionId: string, items: CartItem[]): Promise<void> {
    if (items.length === 0) {
      await this.redis.client.del(this.key(sessionId));
      return;
    }

    await this.redis.client.set(
      this.key(sessionId),
      JSON.stringify(items),
      'EX',
      CART_TTL_SECONDS,
    );
  }

  async getCart(sessionId: string): Promise<CartView> {
    return this.hydrate(await this.readItems(sessionId));
  }

  async addItem(sessionId: string, productId: string, quantity: number): Promise<CartView> {
    const product = await this.catalog.getProduct(productId);
    const items = await this.readItems(sessionId);

    let next: CartItem[];
    try {
      next = addItem(items, productId, quantity, product.stock);
    } catch (error) {
      if (error instanceof CartRuleError) throw new BadRequestException(error.message);
      throw error;
    }

    await this.writeItems(sessionId, next);
    return this.hydrate(next);
  }

  /** Dat so luong tuyet doi; `0` la xoa dong khoi gio. */
  async setQuantity(sessionId: string, productId: string, quantity: number): Promise<CartView> {
    const items = await this.readItems(sessionId);

    if (quantity <= 0) {
      const next = items.filter((item) => item.productId !== productId);
      await this.writeItems(sessionId, next);
      return this.hydrate(next);
    }

    const product = await this.catalog.getProduct(productId);
    if (quantity > product.stock) {
      throw new BadRequestException(`Chi con ${product.stock} san pham trong ton kho`);
    }

    const withoutLine = items.filter((item) => item.productId !== productId);
    const next = [...withoutLine, { productId, quantity }];

    await this.writeItems(sessionId, next);
    return this.hydrate(next);
  }

  async clear(sessionId: string): Promise<void> {
    await this.redis.client.del(this.key(sessionId));
  }

  /** Ghep so luong trong Redis voi ten/gia/ton kho hien tai ben catalog. */
  private async hydrate(items: CartItem[]): Promise<CartView> {
    if (items.length === 0) {
      return { items: [], subtotal: { amountCents: 0, currency: 'VND' }, itemCount: 0 };
    }

    const products = await this.catalog.getProducts(items.map((item) => item.productId));

    const priceByProductId: Record<string, number> = {};
    for (const [id, product] of products) {
      priceByProductId[id] = product.price.amountCents;
    }

    const lines: CartLine[] = items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new BadRequestException(`Thieu du lieu san pham ${item.productId}`);

      return {
        productId: item.productId,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: {
          amountCents: product.price.amountCents * item.quantity,
          currency: product.price.currency,
        },
        stock: product.stock,
      };
    });

    const currency = lines[0]?.unitPrice.currency ?? 'VND';

    return {
      items: lines,
      subtotal: { amountCents: calcSubtotalCents(items, priceByProductId), currency },
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  }
}
