import { execSync } from 'node:child_process';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient, ProductStatus } from '@prisma/client';
import { SearchService } from '../../src/search/search.service';
import { TrigramStrategy } from '../../src/search/strategies/trigram.strategy';
import type { PrismaService } from '../../src/common/prisma.service';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let search: SearchService;

jest.setTimeout(180_000);

beforeAll(async () => {
  container = await new PostgreSqlContainer('pgvector/pgvector:pg16')
    .withDatabase('ecommerce')
    .withUsername('ecommerce')
    .withPassword('ecommerce')
    .start();

  // Migration cua Prisma khong tao schema, chi tao bang ben trong no.
  await container.exec([
    'psql',
    '-U',
    'ecommerce',
    '-d',
    'ecommerce',
    '-c',
    'CREATE SCHEMA IF NOT EXISTS catalog',
  ]);

  const databaseUrl = `${container.getConnectionUri()}?schema=catalog`;

  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env, CATALOG_DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  await prisma.product.createMany({
    data: [
      {
        sku: 'AO-001',
        name: 'Áo thun nam cotton',
        slug: 'ao-thun-nam-cotton',
        description: 'Áo thun chất liệu cotton thoáng mát',
        priceCents: 199_000,
        stock: 10,
        status: ProductStatus.ACTIVE,
      },
      {
        sku: 'DH-002',
        name: 'Đồng hồ cơ dây da',
        slug: 'dong-ho-co-day-da',
        description: 'Đồng hồ automatic dây da bò',
        priceCents: 2_490_000,
        stock: 3,
        status: ProductStatus.ACTIVE,
      },
      {
        sku: 'TN-003',
        name: 'Tai nghe Bluetooth chống ồn',
        slug: 'tai-nghe-bluetooth-chong-on',
        // "chống ồn chủ động" chua "dong", du de mo ta nay khop nham voi
        // truy van "dong ho" neu bo loc mo ta khong duoc danh trong so.
        description: 'Tai nghe không dây chống ồn chủ động, pin 30 giờ, sạc nhanh USB-C',
        priceCents: 1_290_000,
        stock: 8,
        status: ProductStatus.ACTIVE,
      },
      {
        sku: 'GIAY-005',
        name: 'Giày sneaker trắng',
        slug: 'giay-sneaker-trang',
        description: 'Giày sneaker da tổng hợp, đế cao su chống trượt, đi hằng ngày',
        priceCents: 890_000,
        stock: 20,
        status: ProductStatus.ACTIVE,
      },
      {
        sku: 'AO-004',
        name: 'Áo khoác gió chưa phát hành',
        slug: 'ao-khoac-gio-chua-phat-hanh',
        description: 'Bản nháp chưa mở bán',
        priceCents: 500_000,
        stock: 5,
        status: ProductStatus.DRAFT,
      },
    ],
  });

  const prismaAsService = prisma as unknown as PrismaService;
  search = new SearchService([new TrigramStrategy(prismaAsService)], prismaAsService);
});

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

async function names(query: string): Promise<string[]> {
  const response = await search.search(query, {});
  return response.items.map((item) => item.name);
}

describe('fuzzy search against a real Postgres', () => {
  it('finds the product when the query is typed exactly', async () => {
    expect(await names('áo thun')).toContain('Áo thun nam cotton');
  });

  it('finds the product when diacritics are omitted', async () => {
    expect(await names('ao thun')).toContain('Áo thun nam cotton');
  });

  it('finds the product despite a misspelling', async () => {
    expect(await names('ao thunn')).toContain('Áo thun nam cotton');
  });

  it('finds the product when the case is wrong and spacing is sloppy', async () => {
    expect(await names('  AO   THUN ')).toContain('Áo thun nam cotton');
  });

  it('handles đ correctly when the user types d', async () => {
    expect(await names('dong ho')).toContain('Đồng hồ cơ dây da');
  });

  it('matches on description text as well as name', async () => {
    expect(await names('pin 30 gio')).toContain('Tai nghe Bluetooth chống ồn');
  });

  it('does not let a weak description match drag in unrelated products', async () => {
    // "chong on chu dong" va "chong truot" deu khop yeu voi "dong ho".
    // Chi dong ho that su moi duoc tra ve.
    expect(await names('dong ho')).toEqual(['Đồng hồ cơ dây da']);
  });

  it('never returns a DRAFT product', async () => {
    const response = await search.search('ao', {});
    expect(response.items.map((item) => item.name)).not.toContain(
      'Áo khoác gió chưa phát hành',
    );
  });

  it('returns nothing for a query unrelated to the catalogue', async () => {
    expect(await names('máy xúc công nghiệp')).toEqual([]);
  });

  it('returns nothing for another unrelated query', async () => {
    expect(await names('phần mềm kế toán')).toEqual([]);
  });

  it('still matches a query far shorter than the product name', async () => {
    // Guard: `similarity()` phat nang truy van ngan tren chuoi dai, nen truoc
    // day case nay chi song nho nhanh LIKE. Voi word_similarity no phai tu khop.
    expect(await names('ao')).toContain('Áo thun nam cotton');
  });

  it('suggests at most eight lightweight entries for autocomplete', async () => {
    const response = await search.suggest('ao');

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items.length).toBeLessThanOrEqual(8);
    expect(Object.keys(response.items[0])).toEqual(['name', 'slug']);
  });
});
