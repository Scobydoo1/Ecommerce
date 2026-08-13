import { PrismaClient, ProductStatus } from '@prisma/client';
import { slugify } from '../src/products/slugify';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Thời trang nam' },
  { name: 'Đồ điện tử' },
  { name: 'Giày dép' },
];

interface SeedProduct {
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  imageUrl: string;
}

const PRODUCTS: SeedProduct[] = [
  {
    sku: 'AO-THUN-001',
    name: 'Áo thun nam cotton',
    description: 'Áo thun nam chất liệu cotton 100%, thoáng mát, form regular fit.',
    priceCents: 199_000,
    stock: 40,
    category: 'Thời trang nam',
    imageUrl: 'https://picsum.photos/seed/aothun/600/600',
  },
  {
    sku: 'AO-SOMI-002',
    name: 'Áo sơ mi trắng dài tay',
    description: 'Áo sơ mi công sở vải lụa mềm, ít nhăn, dễ là ủi.',
    priceCents: 349_000,
    stock: 25,
    category: 'Thời trang nam',
    imageUrl: 'https://picsum.photos/seed/somi/600/600',
  },
  {
    sku: 'QUAN-JEAN-003',
    name: 'Quần jean nam ống đứng',
    description: 'Quần jean denim co giãn nhẹ, màu xanh đậm, dáng ống đứng.',
    priceCents: 459_000,
    stock: 18,
    category: 'Thời trang nam',
    imageUrl: 'https://picsum.photos/seed/jean/600/600',
  },
  {
    sku: 'DH-CO-004',
    name: 'Đồng hồ cơ dây da',
    description: 'Đồng hồ cơ automatic, dây da bò thật, chống nước 5ATM.',
    priceCents: 2_490_000,
    stock: 7,
    category: 'Đồ điện tử',
    imageUrl: 'https://picsum.photos/seed/dongho/600/600',
  },
  {
    sku: 'TN-BT-005',
    name: 'Tai nghe Bluetooth chống ồn',
    description: 'Tai nghe không dây chống ồn chủ động, pin 30 giờ, sạc nhanh USB-C.',
    priceCents: 1_290_000,
    stock: 32,
    category: 'Đồ điện tử',
    imageUrl: 'https://picsum.photos/seed/tainghe/600/600',
  },
  {
    sku: 'BP-SD-006',
    name: 'Bàn phím cơ không dây',
    description: 'Bàn phím cơ switch nâu, kết nối Bluetooth và USB-C, đèn nền RGB.',
    priceCents: 1_690_000,
    stock: 12,
    category: 'Đồ điện tử',
    imageUrl: 'https://picsum.photos/seed/banphim/600/600',
  },
  {
    sku: 'GIAY-SNK-007',
    name: 'Giày sneaker trắng',
    description: 'Giày sneaker da tổng hợp, đế cao su chống trượt, phù hợp đi hằng ngày.',
    priceCents: 890_000,
    stock: 22,
    category: 'Giày dép',
    imageUrl: 'https://picsum.photos/seed/sneaker/600/600',
  },
  {
    sku: 'GIAY-CT-008',
    name: 'Giày chạy bộ nhẹ',
    description: 'Giày chạy bộ đế êm, trọng lượng 220g, lưới thoáng khí.',
    priceCents: 1_150_000,
    stock: 15,
    category: 'Giày dép',
    imageUrl: 'https://picsum.photos/seed/chaybo/600/600',
  },
  {
    sku: 'DEP-QU-009',
    name: 'Dép quai ngang nam',
    description: 'Dép quai ngang chống trượt, đế EVA siêu nhẹ.',
    priceCents: 259_000,
    stock: 50,
    category: 'Giày dép',
    imageUrl: 'https://picsum.photos/seed/dep/600/600',
  },
];

async function main(): Promise<void> {
  const categoryIdByName = new Map<string, string>();

  for (const category of CATEGORIES) {
    const slug = slugify(category.name);
    const saved = await prisma.category.upsert({
      where: { slug },
      update: { name: category.name },
      create: { name: category.name, slug },
    });
    categoryIdByName.set(category.name, saved.id);
  }

  for (const product of PRODUCTS) {
    const slug = slugify(product.name);
    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug,
        description: product.description,
        priceCents: product.priceCents,
        stock: product.stock,
        status: ProductStatus.ACTIVE,
        categoryId: categoryIdByName.get(product.category) ?? null,
      },
      create: {
        sku: product.sku,
        name: product.name,
        slug,
        description: product.description,
        priceCents: product.priceCents,
        currency: 'VND',
        stock: product.stock,
        status: ProductStatus.ACTIVE,
        categoryId: categoryIdByName.get(product.category) ?? null,
      },
    });

    const imageCount = await prisma.productImage.count({ where: { productId: saved.id } });
    if (imageCount === 0) {
      await prisma.productImage.create({
        data: { productId: saved.id, url: product.imageUrl, alt: product.name, position: 0 },
      });
    }
  }

  console.warn(`Seed xong: ${CATEGORIES.length} danh muc, ${PRODUCTS.length} san pham.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
