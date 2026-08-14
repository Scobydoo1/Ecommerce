import { PrismaClient, ProductStatus } from '@prisma/client';
import { slugify } from '../src/products/slugify';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Thời trang nam' },
  { name: 'Thời trang nữ' },
  { name: 'Đồ điện tử' },
  { name: 'Giày dép' },
  { name: 'Nhà cửa & Đời sống' },
  { name: 'Sách & Văn phòng phẩm' },
];

interface SeedProduct {
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  category: string;
  /** Khoa anh tren picsum.photos. Nhieu khoa = san pham co bo suu tap anh. */
  imageSeeds: string[];
  status?: ProductStatus;
}

/**
 * Du lieu mau co chu dich:
 * - Ten tieng Viet co dau, de thu tim kiem mo khi go thieu dau hoac sai chinh ta.
 * - Vai mon `stock: 0` de thay trang thai "Het hang".
 * - Vai mon DRAFT/ARCHIVED de chung minh bo loc `status` that su hoat dong -
 *   chung KHONG duoc xuat hien o trang chu hay ket qua tim kiem.
 * - Vai mon co nhieu anh de thay dai anh o trang chi tiet.
 */
const PRODUCTS: SeedProduct[] = [
  // ── Thời trang nam ────────────────────────────────────────────────
  {
    sku: 'AO-THUN-001',
    name: 'Áo thun nam cotton',
    description:
      'Áo thun nam chất liệu cotton 100%, thoáng mát, form regular fit. Cổ tròn dệt rib giữ phom sau nhiều lần giặt.',
    priceCents: 199_000,
    stock: 40,
    category: 'Thời trang nam',
    imageSeeds: ['aothun', 'aothun-2', 'aothun-3'],
  },
  {
    sku: 'AO-SOMI-002',
    name: 'Áo sơ mi trắng dài tay',
    description: 'Áo sơ mi công sở vải lụa mềm, ít nhăn, dễ là ủi. Có sẵn size S đến XXL.',
    priceCents: 349_000,
    stock: 25,
    category: 'Thời trang nam',
    imageSeeds: ['somi', 'somi-2'],
  },
  {
    sku: 'QUAN-JEAN-003',
    name: 'Quần jean nam ống đứng',
    description: 'Quần jean denim co giãn nhẹ, màu xanh đậm, dáng ống đứng. Cạp vừa, không bó gối.',
    priceCents: 459_000,
    stock: 18,
    category: 'Thời trang nam',
    imageSeeds: ['jean', 'jean-2'],
  },
  {
    sku: 'AO-KHOAC-010',
    name: 'Áo khoác gió chống nước',
    description: 'Áo khoác gió hai lớp, chống nước nhẹ, có mũ tháo rời. Gấp gọn bỏ vừa balo.',
    priceCents: 629_000,
    stock: 14,
    category: 'Thời trang nam',
    imageSeeds: ['khoacgio'],
  },
  {
    sku: 'QUAN-SHORT-011',
    name: 'Quần short kaki nam',
    description: 'Quần short kaki co giãn, dài trên gối, hai túi hông và một túi sau có khuy.',
    priceCents: 279_000,
    stock: 30,
    category: 'Thời trang nam',
    imageSeeds: ['short'],
  },
  {
    sku: 'AO-POLO-012',
    name: 'Áo polo nam bo kẻ',
    description: 'Áo polo vải cá sấu cotton pha, cổ và tay bo kẻ tương phản.',
    priceCents: 329_000,
    stock: 0,
    category: 'Thời trang nam',
    imageSeeds: ['polo'],
  },
  {
    sku: 'THAT-LUNG-013',
    name: 'Thắt lưng da bò khoá kim',
    description: 'Thắt lưng da bò thật, khoá kim thép không gỉ, bản 3,5cm. Cắt ngắn được tại nhà.',
    priceCents: 389_000,
    stock: 21,
    category: 'Thời trang nam',
    imageSeeds: ['thatlung'],
  },

  // ── Thời trang nữ ─────────────────────────────────────────────────
  {
    sku: 'VAY-HOA-020',
    name: 'Váy hoa nhí dáng suông',
    description: 'Váy hoa nhí vải voan hai lớp, dáng suông, dài qua gối. Có lớp lót bên trong.',
    priceCents: 549_000,
    stock: 16,
    category: 'Thời trang nữ',
    imageSeeds: ['vayhoa', 'vayhoa-2', 'vayhoa-3'],
  },
  {
    sku: 'AO-LEN-021',
    name: 'Áo len nữ cổ lọ',
    description: 'Áo len sợi mảnh, cổ lọ gập, co giãn tốt. Mặc trong hoặc phối cùng áo khoác.',
    priceCents: 429_000,
    stock: 23,
    category: 'Thời trang nữ',
    imageSeeds: ['aolen'],
  },
  {
    sku: 'CHAN-VAY-022',
    name: 'Chân váy xếp ly midi',
    description: 'Chân váy xếp ly dáng midi, cạp chun sau, vải giữ nếp ly sau khi giặt.',
    priceCents: 389_000,
    stock: 19,
    category: 'Thời trang nữ',
    imageSeeds: ['chanvay', 'chanvay-2'],
  },
  {
    sku: 'AO-BLAZER-023',
    name: 'Áo blazer nữ dáng lửng',
    description: 'Blazer dáng lửng một khuy, vai nhẹ không độn, lót lụa mát.',
    priceCents: 899_000,
    stock: 8,
    category: 'Thời trang nữ',
    imageSeeds: ['blazer'],
  },
  {
    sku: 'TUI-TOTE-024',
    name: 'Túi tote vải canvas',
    description: 'Túi tote canvas dày 12oz, quai dài đeo vai, một ngăn khoá kéo bên trong.',
    priceCents: 259_000,
    stock: 35,
    category: 'Thời trang nữ',
    imageSeeds: ['tote', 'tote-2'],
  },
  {
    sku: 'KHAN-LUA-025',
    name: 'Khăn lụa vuông hoạ tiết',
    description: 'Khăn lụa vuông 90x90cm, viền cuốn tay, hoạ tiết in kỹ thuật số.',
    priceCents: 319_000,
    stock: 0,
    category: 'Thời trang nữ',
    imageSeeds: ['khanlua'],
  },

  // ── Đồ điện tử ────────────────────────────────────────────────────
  {
    sku: 'DH-CO-004',
    name: 'Đồng hồ cơ dây da',
    description:
      'Đồng hồ cơ automatic, dây da bò thật, chống nước 5ATM. Mặt sau kính khoáng nhìn thấy bộ máy.',
    priceCents: 2_490_000,
    stock: 7,
    category: 'Đồ điện tử',
    imageSeeds: ['dongho', 'dongho-2', 'dongho-3'],
  },
  {
    sku: 'TN-BT-005',
    name: 'Tai nghe Bluetooth chống ồn',
    description:
      'Tai nghe không dây chống ồn chủ động, pin 30 giờ, sạc nhanh USB-C. Có chế độ xuyên âm.',
    priceCents: 1_290_000,
    stock: 32,
    category: 'Đồ điện tử',
    imageSeeds: ['tainghe', 'tainghe-2'],
  },
  {
    sku: 'BP-SD-006',
    name: 'Bàn phím cơ không dây',
    description: 'Bàn phím cơ switch nâu, kết nối Bluetooth và USB-C, đèn nền RGB. Layout 75%.',
    priceCents: 1_690_000,
    stock: 12,
    category: 'Đồ điện tử',
    imageSeeds: ['banphim', 'banphim-2'],
  },
  {
    sku: 'CHUOT-KD-030',
    name: 'Chuột không dây im lặng',
    description: 'Chuột quang không dây 2.4GHz, click giảm ồn, cảm biến 1600 DPI, pin AA dùng 12 tháng.',
    priceCents: 259_000,
    stock: 44,
    category: 'Đồ điện tử',
    imageSeeds: ['chuot'],
  },
  {
    sku: 'LOA-BT-031',
    name: 'Loa Bluetooth chống nước',
    description: 'Loa di động chuẩn IPX7, pin 12 giờ, ghép đôi hai loa thành âm thanh nổi.',
    priceCents: 890_000,
    stock: 17,
    category: 'Đồ điện tử',
    imageSeeds: ['loa', 'loa-2'],
  },
  {
    sku: 'SAC-DP-032',
    name: 'Sạc dự phòng 20000mAh',
    description: 'Sạc dự phòng 20000mAh, hai cổng USB-C PD 30W, hiển thị phần trăm pin bằng số.',
    priceCents: 649_000,
    stock: 28,
    category: 'Đồ điện tử',
    imageSeeds: ['sacduphong'],
  },
  {
    sku: 'CAM-WC-033',
    name: 'Webcam 1080p có màn chắn',
    description: 'Webcam 1080p 30fps, micro kép khử ồn, màn chắn ống kính trượt cơ học.',
    priceCents: 749_000,
    stock: 11,
    category: 'Đồ điện tử',
    imageSeeds: ['webcam'],
  },
  {
    sku: 'DEN-BAN-034',
    name: 'Đèn bàn LED chống loá',
    description: 'Đèn bàn LED ba mức nhiệt màu, cần gập hai khớp, cổng USB sạc điện thoại.',
    priceCents: 459_000,
    stock: 26,
    category: 'Đồ điện tử',
    imageSeeds: ['denban'],
  },
  {
    sku: 'ODIA-SSD-035',
    name: 'Ổ cứng di động SSD 1TB',
    description: 'SSD ngoài 1TB, USB 3.2 Gen2, tốc độ đọc tới 1050MB/s, vỏ nhôm tản nhiệt.',
    priceCents: 2_190_000,
    stock: 0,
    category: 'Đồ điện tử',
    imageSeeds: ['ssd'],
  },

  // ── Giày dép ──────────────────────────────────────────────────────
  {
    sku: 'GIAY-SNK-007',
    name: 'Giày sneaker trắng',
    description:
      'Giày sneaker da tổng hợp, đế cao su chống trượt, phù hợp đi hằng ngày. Dễ lau vết bẩn.',
    priceCents: 890_000,
    stock: 22,
    category: 'Giày dép',
    imageSeeds: ['sneaker', 'sneaker-2', 'sneaker-3'],
  },
  {
    sku: 'GIAY-CT-008',
    name: 'Giày chạy bộ nhẹ',
    description: 'Giày chạy bộ đế êm, trọng lượng 220g, lưới thoáng khí. Hỗ trợ chạy đường bằng.',
    priceCents: 1_150_000,
    stock: 15,
    category: 'Giày dép',
    imageSeeds: ['chaybo', 'chaybo-2'],
  },
  {
    sku: 'DEP-QU-009',
    name: 'Dép quai ngang nam',
    description: 'Dép quai ngang chống trượt, đế EVA siêu nhẹ. Đi trong nhà hoặc ra phố đều được.',
    priceCents: 259_000,
    stock: 50,
    category: 'Giày dép',
    imageSeeds: ['dep'],
  },
  {
    sku: 'GIAY-LUOI-040',
    name: 'Giày lười da nam',
    description: 'Giày lười da bò, lót da mềm, đế khâu chỉ. Phù hợp đi làm và dự tiệc nhẹ.',
    priceCents: 1_290_000,
    stock: 9,
    category: 'Giày dép',
    imageSeeds: ['giayluoi', 'giayluoi-2'],
  },
  {
    sku: 'GIAY-CAOGOT-041',
    name: 'Giày cao gót mũi nhọn 5cm',
    description: 'Giày cao gót 5cm, mũi nhọn, lót đệm êm gan bàn chân, gót bọc da.',
    priceCents: 759_000,
    stock: 13,
    category: 'Giày dép',
    imageSeeds: ['caogot'],
  },
  {
    sku: 'DEP-SANDAL-042',
    name: 'Sandal quai chéo nữ',
    description: 'Sandal quai chéo đế bệt, quai điều chỉnh, đế cao su bám tốt khi trời mưa.',
    priceCents: 349_000,
    stock: 24,
    category: 'Giày dép',
    imageSeeds: ['sandal'],
  },

  // ── Nhà cửa & Đời sống ────────────────────────────────────────────
  {
    sku: 'NOI-CHIEN-050',
    name: 'Nồi chiên không dầu 5 lít',
    description: 'Nồi chiên không dầu 5L, 8 chế độ nấu sẵn, lòng nồi chống dính tháo rời rửa được.',
    priceCents: 1_890_000,
    stock: 10,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['noichien', 'noichien-2'],
  },
  {
    sku: 'BINH-GIU-051',
    name: 'Bình giữ nhiệt 500ml',
    description: 'Bình giữ nhiệt thép không gỉ 316, giữ nóng 12 giờ, nắp chống rò rỉ.',
    priceCents: 329_000,
    stock: 41,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['binhgiunhiet'],
  },
  {
    sku: 'CHAN-GA-052',
    name: 'Bộ chăn ga cotton 1m6',
    description: 'Bộ chăn ga gối cotton 100%, khổ 1m6x2m, gồm ga chun, hai vỏ gối và vỏ chăn.',
    priceCents: 1_190_000,
    stock: 12,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['changa', 'changa-2'],
  },
  {
    sku: 'KE-SACH-053',
    name: 'Kệ sách gỗ 4 tầng',
    description: 'Kệ sách gỗ công nghiệp phủ melamine, 4 tầng, có ke chống lật gắn tường.',
    priceCents: 1_490_000,
    stock: 6,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['kesach'],
  },
  {
    sku: 'THAM-TRAI-054',
    name: 'Thảm trải sàn lông ngắn',
    description: 'Thảm 1m6x2m lông ngắn, đế chống trượt, hút bụi được bằng máy hút thường.',
    priceCents: 869_000,
    stock: 15,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['tham'],
  },
  {
    sku: 'NEN-THOM-055',
    name: 'Nến thơm sáp đậu nành',
    description: 'Nến thơm sáp đậu nành 200g, bấc gỗ, cháy khoảng 40 giờ. Hương gỗ tuyết tùng.',
    priceCents: 289_000,
    stock: 33,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['nenthom'],
  },
  {
    sku: 'MAY-LOC-056',
    name: 'Máy lọc không khí phòng ngủ',
    description: 'Máy lọc không khí màng HEPA H13, phù hợp phòng 25m², chế độ đêm 24dB.',
    priceCents: 3_290_000,
    stock: 4,
    category: 'Nhà cửa & Đời sống',
    imageSeeds: ['mayloc'],
  },

  // ── Sách & Văn phòng phẩm ─────────────────────────────────────────
  {
    sku: 'SACH-VN-060',
    name: 'Sách Nhà giả kim bản tiếng Việt',
    description: 'Tiểu thuyết Nhà giả kim, bìa mềm, 228 trang, bản dịch tiếng Việt.',
    priceCents: 89_000,
    stock: 60,
    category: 'Sách & Văn phòng phẩm',
    imageSeeds: ['sach1'],
  },
  {
    sku: 'SACH-KN-061',
    name: 'Sổ tay bìa da gáy khâu',
    description: 'Sổ tay A5 bìa da PU, gáy khâu chỉ mở phẳng 180 độ, giấy 100gsm không lem mực.',
    priceCents: 189_000,
    stock: 38,
    category: 'Sách & Văn phòng phẩm',
    imageSeeds: ['sotay', 'sotay-2'],
  },
  {
    sku: 'BUT-BI-062',
    name: 'Bút bi mực gel 0.5mm (hộp 12)',
    description: 'Hộp 12 bút bi gel 0.5mm mực đen, khô nhanh, không lem khi viết tay trái.',
    priceCents: 96_000,
    stock: 75,
    category: 'Sách & Văn phòng phẩm',
    imageSeeds: ['butbi'],
  },
  {
    sku: 'BALO-LT-063',
    name: 'Balo laptop chống sốc 15 inch',
    description: 'Balo vừa laptop 15 inch, ngăn chống sốc riêng, vải chống nước nhẹ, cổng sạc USB.',
    priceCents: 629_000,
    stock: 20,
    category: 'Sách & Văn phòng phẩm',
    imageSeeds: ['balo', 'balo-2'],
  },
  {
    sku: 'DEN-BAN-064',
    name: 'Bảng ghim nút bần 60x45cm',
    description: 'Bảng ghim nút bần khung gỗ 60x45cm, kèm 20 đinh ghim màu và bộ treo tường.',
    priceCents: 349_000,
    stock: 0,
    category: 'Sách & Văn phòng phẩm',
    imageSeeds: ['bangghim'],
  },

  // ── Không hiển thị: chứng minh bộ lọc status ──────────────────────
  {
    sku: 'NHAP-DRAFT-090',
    name: 'Áo khoác bomber (đang soạn)',
    description: 'Bản nháp chưa lên kệ. Không được xuất hiện ở trang chủ hay kết quả tìm kiếm.',
    priceCents: 799_000,
    stock: 10,
    category: 'Thời trang nam',
    imageSeeds: ['bomber'],
    status: ProductStatus.DRAFT,
  },
  {
    sku: 'LUUKHO-ARCH-091',
    name: 'Tai nghe có dây đời cũ',
    description: 'Đã ngừng kinh doanh. Không được xuất hiện ở trang chủ hay kết quả tìm kiếm.',
    priceCents: 149_000,
    stock: 0,
    category: 'Đồ điện tử',
    imageSeeds: ['taingheduday'],
    status: ProductStatus.ARCHIVED,
  },
];

function imageUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/800/1000`;
}

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
    const status = product.status ?? ProductStatus.ACTIVE;
    const categoryId = categoryIdByName.get(product.category) ?? null;

    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug,
        description: product.description,
        priceCents: product.priceCents,
        stock: product.stock,
        status,
        categoryId,
      },
      create: {
        sku: product.sku,
        name: product.name,
        slug,
        description: product.description,
        priceCents: product.priceCents,
        currency: 'VND',
        stock: product.stock,
        status,
        categoryId,
      },
    });

    // Dung lai bo anh moi lan seed de chay lai khong sinh anh trung.
    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.createMany({
      data: product.imageSeeds.map((seed, position) => ({
        productId: saved.id,
        url: imageUrl(seed),
        alt: product.name,
        position,
      })),
    });
  }

  const active = PRODUCTS.filter((p) => (p.status ?? ProductStatus.ACTIVE) === ProductStatus.ACTIVE);
  const soldOut = active.filter((p) => p.stock === 0);

  console.warn(
    `Seed xong: ${CATEGORIES.length} danh muc, ${PRODUCTS.length} san pham ` +
      `(${active.length} dang ban, trong do ${soldOut.length} het hang, ` +
      `${PRODUCTS.length - active.length} khong hien thi).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
