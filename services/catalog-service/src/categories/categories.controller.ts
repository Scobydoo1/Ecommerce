import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { CategorySummary } from '@ecommerce/types';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll(@Query() query: ListCategoriesDto): Promise<CategorySummary[]> {
    return this.categories.findAll(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string): Promise<CategorySummary> {
    return this.categories.findBySlug(slug);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCategoryDto): Promise<CategorySummary> {
    return this.categories.create(dto);
  }
}
