import { FormulaParserService } from './formula-parser.service';

describe('FormulaParserService', () => {
  const parser = new FormulaParserService();

  describe('evaluate — arithmetic', () => {
    it.each([
      ['1 + 2', 3],
      ['10 - 4', 6],
      ['6 * 7', 42],
      ['20 / 5', 4],
      ['1.5 + 2.25', 3.75],
      ['0.1 + 0.2', expect.closeTo(0.3, 10) as unknown as number],
    ])('%s = %s', (formula, expected) => {
      expect(parser.evaluate(formula, new Map())).toEqual(expected);
    });

    it('honours operator precedence (*/ before +-)', () => {
      expect(parser.evaluate('2 + 3 * 4', new Map())).toBe(14);
      expect(parser.evaluate('10 - 6 / 2', new Map())).toBe(7);
    });

    it('honours parentheses', () => {
      expect(parser.evaluate('(2 + 3) * 4', new Map())).toBe(20);
      expect(parser.evaluate('((1 + 2) * (3 + 4))', new Map())).toBe(21);
    });

    it('handles unary minus and double-unary', () => {
      expect(parser.evaluate('-5 + 10', new Map())).toBe(5);
      expect(parser.evaluate('--5', new Map())).toBe(5);
      expect(parser.evaluate('-(2 + 3)', new Map())).toBe(-5);
    });

    it('handles leading unary plus', () => {
      expect(parser.evaluate('+5 + 1', new Map())).toBe(6);
    });
  });

  describe('evaluate — identifiers (rate codes)', () => {
    it('substitutes known identifiers from the vars map', () => {
      const vars = new Map([['USD_BCV', 596.78]]);
      expect(parser.evaluate('USD_BCV', vars)).toBe(596.78);
      expect(parser.evaluate('USD_BCV * 1.05', vars)).toBeCloseTo(626.619, 3);
    });

    it('supports multiple identifiers in the same formula', () => {
      const vars = new Map([
        ['USD_BCV', 600],
        ['EUR_BCV', 650],
      ]);
      expect(parser.evaluate('(USD_BCV + EUR_BCV) / 2', vars)).toBe(625);
    });

    it('throws when referencing an identifier not provided in vars', () => {
      expect(() => parser.evaluate('UNKNOWN + 1', new Map())).toThrow(/variable desconocida/i);
    });
  });

  describe('safety — anti-eval', () => {
    it('rejects JavaScript expressions disguised as formulas', () => {
      // Operators not in the grammar (^, %, &, |, ~) must error
      expect(() => parser.parse('2 ^ 3')).toThrow();
      expect(() => parser.parse('10 % 3')).toThrow();
      expect(() => parser.parse('1 && 2')).toThrow();
    });

    it('rejects function-call syntax (parser sees IDENT then LPAREN as fresh expr)', () => {
      // `Math.pow(2, 3)` includes `.` and `,` which are not legal tokens
      expect(() => parser.parse('Math.pow(2, 3)')).toThrow();
      expect(() => parser.parse('alert(1)')).toThrow();
    });

    it('rejects assignment / dangerous JS punctuation', () => {
      expect(() => parser.parse('x = 1')).toThrow();
      expect(() => parser.parse('1; 2')).toThrow();
      expect(() => parser.parse('a[0]')).toThrow();
    });

    it('rejects formulas longer than 500 chars (DoS guard)', () => {
      const long = '1+'.repeat(300) + '1';
      expect(() => parser.parse(long)).toThrow(/excede 500/);
    });

    it('rejects empty formulas', () => {
      expect(() => parser.parse('')).toThrow(/vacia/);
    });
  });

  describe('safety — math errors', () => {
    it('rejects division by zero', () => {
      expect(() => parser.evaluate('10 / 0', new Map())).toThrow(/division por cero/i);
      expect(() => parser.evaluate('10 / (2 - 2)', new Map())).toThrow(/division por cero/i);
    });

    it('rejects overflow / NaN results', () => {
      // Number.MAX_VALUE * 10 overflows to Infinity
      const vars = new Map([['BIG', Number.MAX_VALUE]]);
      expect(() => parser.evaluate('BIG * 10', vars)).toThrow(/no finito/i);
    });
  });

  describe('syntax errors', () => {
    it('rejects unclosed parens', () => {
      expect(() => parser.parse('(1 + 2')).toThrow();
    });

    it('rejects double-dotted numbers', () => {
      expect(() => parser.parse('1.2.3')).toThrow();
    });

    it('rejects trailing operators', () => {
      expect(() => parser.parse('1 +')).toThrow();
    });
  });

  describe('refs', () => {
    it('returns the unique set of identifiers used', () => {
      const refs = parser.refs('USD_BCV * 1.05 + EUR_BCV / 2 + USD_BCV');
      expect(new Set(refs)).toEqual(new Set(['USD_BCV', 'EUR_BCV']));
    });

    it('returns an empty array when no identifiers are referenced', () => {
      expect(parser.refs('2 + 3 * 4')).toEqual([]);
    });
  });

  describe('validate', () => {
    it('does not throw for valid formulas', () => {
      expect(() => parser.validate('USD_BCV * 1.05 + 0.5')).not.toThrow();
    });

    it('throws for invalid syntax (caller catches and surfaces to UI)', () => {
      expect(() => parser.validate('1 ** 2')).toThrow();
    });
  });
});
