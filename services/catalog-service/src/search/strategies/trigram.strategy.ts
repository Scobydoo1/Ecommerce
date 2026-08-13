import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import type { SearchHit, SearchOptions, SearchStrategy } from '../types';

/**
 * Nguong cua `word_similarity`. Chon 0.45 vi do thuc te tren du lieu tieng Viet
 * cho thay hai lop tach han nhau:
 *
 *   khop dung  : 0.750 - 1.000  ("ao thunn" sai chinh ta -> 0.778, "ao" -> 1.000)
 *   khop nham  : 0.130 - 0.185  ("may xuc cong nghiep" vs "dong ho co day da")
 *
 * 0.45 nam giua khoang trong do, du bien an toan hon 0.25 ve ca hai phia.
 */
const WORD_SIMILARITY_THRESHOLD = 0.45;

/**
 * Mo ta khop kem tin cay hon ten, nen chi tinh 60% trong so.
 *
 * Trong so nay duoc ap CA khi tinh diem LAN khi loc. Neu chi ap khi tinh diem,
 * mot mo ta khop yeu van lot qua bo loc: truy van "dong ho" tung keo ve ca
 * "Tai nghe ... chong on chu DONG" (mo ta 0.625) va "Giay sneaker ... chong
 * truot" (mo ta 0.500). Sau khi nhan 0.6 chung con 0.375 va 0.300, nam duoi
 * nguong, trong khi dong ho that su van dat 1.000 * 0.6 = 0.600.
 */
const DESCRIPTION_WEIGHT = 0.6;

interface TrigramRow {
  id: string;
  score: number;
}

/**
 * Fuzzy search dua tren `pg_trgm`.
 *
 * So sanh tren `lower(unaccent(...))` de go thieu dau hoac sai hoa thuong van
 * khop.
 *
 * Dung `word_similarity` chu KHONG dung `similarity`. `similarity` chuan hoa
 * theo hop trigram cua ca hai chuoi, nen mot truy van ngan tren mot ten dai bi
 * phat nang y het mot truy van khong lien quan - do duoc: "ao" vs
 * "ao thun nam cotton" chi dat 0.158, trong khi "may xuc cong nghiep" vs
 * "dong ho co day da" dat 0.167. Hai lop chong lan nhau nen KHONG co nguong nao
 * tach duoc chung.
 *
 * `word_similarity` chuan hoa theo doan khop tot nhat BEN TRONG chuoi dich,
 * dung ngu nghia "truy van co xuat hien trong ten san pham khong", va tach hai
 * lop nay rat sach (xem so lieu o WORD_SIMILARITY_THRESHOLD).
 *
 * Luu y hieu nang: dang goi ham nen Postgres khong dung duoc index GIN trigram
 * (chi toan tu `%>` moi dung duoc index). O quy mo MVP dieu nay khong dang ke;
 * CLAUDE.md muc 3 da dat san moc de xu ly khi can - do p95 roi cannh nhac
 * Meilisearch. Index GIN van duoc giu lai vi chinh no phuc vu duong `%>` khi toi uu.
 */
@Injectable()
export class TrigramStrategy implements SearchStrategy {
  readonly name = 'trigram';

  constructor(private readonly prisma: PrismaService) {}

  buildQuery(normalizedQuery: string, options: SearchOptions): Prisma.Sql {
    const categoryFilter = options.categoryId
      ? Prisma.sql`AND p."categoryId" = ${options.categoryId}`
      : Prisma.empty;

    return Prisma.sql`
      SELECT p."id",
             GREATEST(
               word_similarity(${normalizedQuery}, lower(unaccent(p."name"))),
               word_similarity(${normalizedQuery}, lower(unaccent(coalesce(p."description", ''))))
                 * ${DESCRIPTION_WEIGHT}
             ) AS score
      FROM "Product" p
      WHERE p."status" = 'ACTIVE'
      ${categoryFilter}
      AND (
        word_similarity(${normalizedQuery}, lower(unaccent(p."name")))
          > ${WORD_SIMILARITY_THRESHOLD}
        OR word_similarity(${normalizedQuery}, lower(unaccent(coalesce(p."description", ''))))
             * ${DESCRIPTION_WEIGHT} > ${WORD_SIMILARITY_THRESHOLD}
      )
      ORDER BY score DESC, p."name" ASC
      LIMIT ${options.limit} OFFSET ${options.offset}
    `;
  }

  async search(normalizedQuery: string, options: SearchOptions): Promise<SearchHit[]> {
    const rows = await this.prisma.$queryRaw<TrigramRow[]>(
      this.buildQuery(normalizedQuery, options),
    );

    return rows.map((row) => ({ productId: row.id, score: Number(row.score) }));
  }
}
