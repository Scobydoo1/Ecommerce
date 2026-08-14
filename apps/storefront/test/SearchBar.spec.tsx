import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/search-bar/SearchBar';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

const suggestions = { items: [{ name: 'Áo thun nam cotton', slug: 'ao-thun-nam-cotton' }] };

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => suggestions,
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('SearchBar', () => {
  it('khong bung goi y khi o nhap duoc dien san tu URL', async () => {
    render(<SearchBar initialQuery="ao thunn" />);

    // Doi qua het thoi gian debounce va vong fetch.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    // Nguoi dung chua go gi, danh sach goi y khong duoc che noi dung trang.
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('bung goi y khi nguoi dung go', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(screen.getByRole('combobox'), 'ao thun');

    await waitFor(
      () => expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true'),
      { timeout: 2000 },
    );
    expect(screen.getByRole('option', { name: 'Áo thun nam cotton' })).toBeInTheDocument();
  });
});
