import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Paginated, ProductDetail, ProductSummary } from '@ecommerce/types';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query() query: ListProductsDto): Promise<Paginated<ProductSummary>> {
    return this.products.findAll(query);
  }

  // Khai bao truoc `:id` de slug khong bi route param uuid nuot mat.
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string): Promise<ProductDetail> {
    return this.products.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDetail> {
    return this.products.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateProductDto): Promise<ProductDetail> {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDetail> {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.products.remove(id);
  }
}
