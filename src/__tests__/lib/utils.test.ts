import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
  });

  it('handles undefined values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
});