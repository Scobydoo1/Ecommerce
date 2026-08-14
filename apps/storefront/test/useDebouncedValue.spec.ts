import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '../components/search-bar/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('ao', 250));
    expect(result.current).toBe('ao');
  });

  it('withholds the new value until the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'ao' },
    });

    rerender({ value: 'ao thun' });
    expect(result.current).toBe('ao');

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('ao thun');
  });

  it('emits only the last value when typing quickly', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: 'a' },
    });

    for (const value of ['ao', 'ao ', 'ao t', 'ao th', 'ao thun']) {
      rerender({ value });
      act(() => {
        jest.advanceTimersByTime(100);
      });
    }

    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current).toBe('ao thun');
  });
});
