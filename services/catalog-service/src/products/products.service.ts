import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Paginated, ProductDetail, ProductSummary } from '@ecommerce/types';
import { PrismaService } from '../common/prisma.service';
import { slugify, uniqueSlug } from './slugify';
import { PRODUCT_INCLUDE, toProductDetail, toProductSummary } from './product.mapper';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';

@Injectable()
export class ProductsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<ProductDetail> {
    const slug = await this.deriveSlug(dto.name);

    try {
      const created = await this.prisma.product.create({
        data: {
          sku: dto.sku,
          name: dto.name,
          slug,
          description: dto.description ?? null,
          priceCents: dto.priceCents,
          currency: dto.currency ?? 'VND',
          stock: dto.stock,
          status: dto.status ?? 'DRAFT',
          categoryId: dto.categoryId ?? null,
        },
        include: PRODUCT_INCLUDE,
      });

      return toProductDetail(created);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async findAll(query: ListProductsDto): Promise<Paginated<ProductSummary>> {
    const take = Math.min(query.limit ?? ProductsService.DEFAULT_PAGE_SIZE, ProductsService.MAX_PAGE_SIZE);
    const skip = query.offset ?? 0;

    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { total, limit: take, offset: skip, items: rows.map(toProductSummary) };
  }

  async findBySlug(slug: string): Promise<ProductDetail> {
    const found = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });

    if (!found) {
      throw new NotFoundException(`Khong tim thay san pham voi slug "${slug}"`);
    }

    return toProductDetail(found);
  }

  async findOne(id: string): Promise<ProductDetail> {
    const found = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!found) {
      throw new NotFoundException(`Khong tim thay san pham ${id}`);
    }

    return toProductDetail(found);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDetail> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Khong tim thay san pham ${id}`);
    }

    const data: Prisma.ProductUncheckedUpdateInput = { ...dto };

    // Chi sinh slug moi khi ten that su doi, de URL cu khong gay vo co.
    if (dto.name !== undefined && dto.name !== existing.name) {
      data.slug = await this.deriveSlug(dto.name);
    }

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data,
        include: PRODUCT_INCLUDE,
      });

      return toProductDetail(updated);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Khong tim thay san pham ${id}`);
    }

    await this.prisma.product.delete({ where: { id } });
  }

  /** Slug duy nhat toan bang: lay cac slug cung tien to roi chon hau to trong. */
  private async deriveSlug(name: string): Promise<string> {
    const base = slugify(name);
    const siblings = await this.prisma.product.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });

    return uniqueSlug(base, new Set(siblings.map((row) => row.slug)));
  }

  private translateWriteError(error: unknown): unknown {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? String(target[0]) : 'gia tri';
      return new ConflictException(`Da ton tai san pham voi ${field} nay`);
    }

    return error;
  }
}
