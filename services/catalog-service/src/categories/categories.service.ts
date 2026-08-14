import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { CategorySummary } from '@ecommerce/types';
import { PrismaService } from '../common/prisma.service';
import { slugify, uniqueSlug } from '../products/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<CategorySummary> {
    const base = slugify(dto.name);
    const siblings = await this.prisma.category.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });

    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: uniqueSlug(base, new Set(siblings.map((row) => row.slug))),
        parentId: dto.parentId ?? null,
      },
    });

    return { id: created.id, name: created.name, slug: created.slug };
  }

  async findAll(query: ListCategoriesDto): Promise<CategorySummary[]> {
    const where: Prisma.CategoryWhereInput = query.rootOnly ? { parentId: null } : {};

    const rows = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug }));
  }

  async findBySlug(slug: string): Promise<CategorySummary> {
    const found = await this.prisma.category.findUnique({ where: { slug } });

    if (!found) {
      throw new NotFoundException(`Khong tim thay danh muc "${slug}"`);
    }

    return { id: found.id, name: found.name, slug: found.slug };
  }
}
