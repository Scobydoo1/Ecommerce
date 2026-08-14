import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { ProductDetail } from '@ecommerce/types';

/**
 * order-service khong doc thang bang cua catalog: moi service so huu schema
 * cua rieng no. Gia va ton kho luon hoi qua HTTP de chi co mot nguon su that.
 */
@Injectable()
export class CatalogClient {
  private readonly logger = new Logger(CatalogClient.name);
  private readonly baseUrl = process.env.CATALOG_API_URL ?? 'http://localhost:3001';

  async getProduct(productId: string): Promise<ProductDetail> {
    const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: { accept: 'application/json' } });
    } catch {
      this.logger.error(`Khong goi duoc catalog-service tai ${this.baseUrl}`);
      throw new ServiceUnavailableException('Khong tra cuu duoc san pham luc nay');
    }

    if (response.status === 404) {
      throw new NotFoundException(`Khong tim thay san pham ${productId}`);
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Khong tra cuu duoc san pham luc nay');
    }

    return (await response.json()) as ProductDetail;
  }

  /** Lay nhieu san pham song song; dung cho viec dung lai gio hang. */
  async getProducts(productIds: string[]): Promise<Map<string, ProductDetail>> {
    const products = await Promise.all(productIds.map((id) => this.getProduct(id)));
    return new Map(products.map((product) => [product.id, product]));
  }
}
