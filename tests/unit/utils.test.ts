import { cn } from '@/lib/utils';

describe('Utils - cn (className utility)', () => {
    it('should merge class names', () => {
        const result = cn('class1', 'class2');
        expect(result).toContain('class1');
        expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
        const isActive = true;
        const result = cn('base', isActive && 'active');
        expect(result).toContain('base');
        expect(result).toContain('active');
    });

    it('should ignore falsy values', () => {
        const result = cn('class1', false, null, undefined, 'class2');
        expect(result).toContain('class1');
        expect(result).toContain('class2');
        expect(result).not.toContain('false');
        expect(result).not.toContain('null');
        expect(result).not.toContain('undefined');
    });

    it('should handle empty input', () => {
        const result = cn();
        expect(result).toBe('');
    });

    it('should handle Tailwind class conflicts', () => {
        // cn should use tailwind-merge to resolve conflicts
        const result = cn('px-2', 'px-4');
        // Should keep only px-4 (last one wins)
        expect(result).toContain('px-4');
        expect(result).not.toContain('px-2');
    });

    it('should handle array of classes', () => {
        const result = cn(['class1', 'class2']);
        expect(result).toContain('class1');
        expect(result).toContain('class2');
    });

    it('should handle object with boolean values', () => {
        const result = cn({
            'class1': true,
            'class2': false,
            'class3': true,
        });
        expect(result).toContain('class1');
        expect(result).not.toContain('class2');
        expect(result).toContain('class3');
    });
});
