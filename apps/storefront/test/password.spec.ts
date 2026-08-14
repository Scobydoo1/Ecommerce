import { hashPassword, verifyPassword } from '@/lib/password';

describe('hashPassword', () => {
  it('khong bao gio tra ve chinh mat khau', async () => {
    const hash = await hashPassword('bimat123');
    expect(hash).not.toBe('bimat123');
    expect(hash).not.toContain('bimat123');
  });

  it('hai lan bam cung mot mat khau cho hai chuoi khac nhau', async () => {
    // Moi hash mang salt rieng, nen hash trung nhau la dau hieu salt bi thieu.
    const [a, b] = await Promise.all([hashPassword('bimat123'), hashPassword('bimat123')]);
    expect(a).not.toBe(b);
  });
});

describe('verifyPassword', () => {
  it('chap nhan dung mat khau', async () => {
    const hash = await hashPassword('bimat123');
    await expect(verifyPassword('bimat123', hash)).resolves.toBe(true);
  });

  it('tu choi sai mat khau', async () => {
    const hash = await hashPassword('bimat123');
    await expect(verifyPassword('bimat124', hash)).resolves.toBe(false);
  });

  it('tu choi khi hash rong thay vi nem loi', async () => {
    // Tai khoan chua dat mat khau khong duoc phep lam vo luong dang nhap.
    await expect(verifyPassword('bimat123', '')).resolves.toBe(false);
  });
});
