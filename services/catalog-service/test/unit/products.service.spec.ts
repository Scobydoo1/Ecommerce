import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from '../../src/products/products.service';
import type { PrismaService } from '../../src/common/prisma.service';

type ProductDelegateMock = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
};

const productRecord = {
  id: 'p1',
  sku: 'AO-001',
  name: 'Áo thun nam',
  slug: 'ao-thun-nam',
  description: 'Cotton 100%',
  priceCents: 199_000,
  currency: 'VND',
  stock: 12,
  status: 'ACTIVE' as const,
  categoryId: 'c1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  images: [{ url: 'https://cdn/a.jpg', alt: null, position: 0 }],
  category: { id: 'c1', name: 'Áo', slug: 'ao' },
};

function makeService(): { service: ProductsService; product: ProductDelegateMock } {
  const product: ProductDelegateMock = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  const prisma = { product } as unknown as PrismaService;
  return { service: new ProductsService(prisma), product };
}

function uniqueViolation(field: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.0.0',
    meta: { target: [field] },
  });
}

describe('ProductsService.create', () => {
  it('derives the slug from the product name', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([]);
    product.create.mockResolvedValue(productRecord);

    await service.create({ sku: 'AO-001', name: 'Áo thun nam', priceCents: 199_000, stock: 12 });

    expect(product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'ao-thun-nam' }) }),
    );
  });

  it('appends a suffix when the derived slug is already taken', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([{ slug: 'ao-thun-nam' }]);
    product.create.mockResolvedValue(productRecord);

    await service.create({ sku: 'AO-002', name: 'Áo thun nam', priceCents: 199_000, stock: 1 });

    expect(product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'ao-thun-nam-2' }) }),
    );
  });

  it('translates a duplicate SKU into ConflictException', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([]);
    product.create.mockRejectedValue(uniqueViolation('sku'));

    await expect(
      service.create({ sku: 'AO-001', name: 'Khac', priceCents: 1000, stock: 0 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns money as integer cents with the product currency', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([]);
    product.create.mockResolvedValue(productRecord);

    const created = await service.create({
      sku: 'AO-001',
      name: 'Áo thun nam',
      priceCents: 199_000,
      stock: 12,
    });

    expect(created.price).toEqual({ amountCents: 199_000, currency: 'VND' });
  });
});

describe('ProductsService.findAll', () => {
  it('defaults to a page size of 20', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([productRecord]);
    product.count.mockResolvedValue(1);

    await service.findAll({});

    expect(product.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20, skip: 0 }));
  });

  it('clamps an oversized limit to 100', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([]);
    product.count.mockResolvedValue(0);

    await service.findAll({ limit: 5000 });

    expect(product.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it('reports the unpaginated total alongside the page', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([productRecord]);
    product.count.mockResolvedValue(57);

    const page = await service.findAll({ limit: 1 });

    expect(page.total).toBe(57);
    expect(page.items).toHaveLength(1);
  });
});

describe('ProductsService.findBySlug', () => {
  it('throws NotFoundException for an unknown slug', async () => {
    const { service, product } = makeService();
    product.findUnique.mockResolvedValue(null);

    await expect(service.findBySlug('khong-ton-tai')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns images ordered by position', async () => {
    const { service, product } = makeService();
    product.findUnique.mockResolvedValue({
      ...productRecord,
      images: [
        { url: 'b.jpg', alt: null, position: 1 },
        { url: 'a.jpg', alt: null, position: 0 },
      ],
    });

    const detail = await service.findBySlug('ao-thun-nam');

    expect(detail.images.map((i) => i.url)).toEqual(['a.jpg', 'b.jpg']);
  });
});

describe('ProductsService.update', () => {
  it('throws NotFoundException when the product does not exist', async () => {
    const { service, product } = makeService();
    product.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { stock: 3 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not regenerate the slug when the name is unchanged', async () => {
    const { service, product } = makeService();
    product.findUnique.mockResolvedValue(productRecord);
    product.update.mockResolvedValue({ ...productRecord, stock: 3 });

    await service.update('p1', { stock: 3 });

    const call = product.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(call.data).not.toHaveProperty('slug');
  });
});
