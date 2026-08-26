import { describe, expect, it } from 'vitest';
import { isValidGaId } from './analytics';

describe('isValidGaId', () => {
  it('accepts standard GA4 measurement ids', () => {
    expect(isValidGaId('G-ABCDEF')).toBe(true);
    expect(isValidGaId('G-ABCDEF123456')).toBe(true);
    expect(isValidGaId('g-abcdef')).toBe(true);
  });

  it('rejects invalid or missing ids', () => {
    expect(isValidGaId('')).toBe(false);
    expect(isValidGaId('UA-123456-1')).toBe(false);
    expect(isValidGaId('G-')).toBe(false);
    expect(isValidGaId('ABCDEF')).toBe(false);
    expect(isValidGaId('G-ABC')).toBe(false);
  });
});
