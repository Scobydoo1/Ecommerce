import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../../src/categories/categories.service';
import type { PrismaService } from '../../src/common/prisma.service';

function makeService() {
  const category = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };
  const prisma = { category } as unknown as PrismaService;
  return { service: new CategoriesService(prisma), category };
}

describe('CategoriesService', () => {
  it('derives the slug from the category name on create', async () => {
    const { service, category } = makeService();
    category.findMany.mockResolvedValue([]);
    category.create.mockResolvedValue({ id: 'c1', name: 'Đồ điện tử', slug: 'do-dien-tu' });

    await service.create({ name: 'Đồ điện tử' });

    expect(category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'do-dien-tu' }) }),
    );
  });

  it('throws NotFoundException for an unknown slug', async () => {
    const { service, category } = makeService();
    category.findUnique.mockResolvedValue(null);

    await expect(service.findBySlug('khong-co')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns only top level categories when asked for roots', async () => {
    const { service, category } = makeService();
    category.findMany.mockResolvedValue([]);

    await service.findAll({ rootOnly: true });

    expect(category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { parentId: null } }),
    );
  });
});
