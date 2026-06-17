import { Injectable } from '@nestjs/common';

/**
 * Parser AST minimalista para formulas de custom rates.
 *
 * Gramatica soportada (recursive descent):
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/') factor)*
 *   factor  := NUMBER | IDENT | '(' expr ')' | '-' factor
 *
 * Tokens validos:
 *   - Numeros decimales (1.5, 42, 0.003)
 *   - Identificadores: letra/underscore + alfanumericos (ej. USD_BCV)
 *   - Operadores: + - * /
 *   - Parentesis: ( )
 *   - Espacios en blanco (ignorados)
 *
 * Seguridad: NO usa eval / Function. Cualquier token fuera de los permitidos
 * produce error. Los identificadores se resuelven contra un Map<string, number>
 * provisto por el caller — si un identificador no existe en el Map, falla.
 */

type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'IDENT'; value: string }
  | { type: 'OP'; value: '+' | '-' | '*' | '/' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' };

type AstNode =
  | { type: 'num'; value: number }
  | { type: 'ref'; name: string }
  | { type: 'neg'; expr: AstNode }
  | { type: 'bin'; op: '+' | '-' | '*' | '/'; left: AstNode; right: AstNode };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      let hasDot = false;
      while (j < input.length) {
        const c = input[j];
        if (c >= '0' && c <= '9') { j++; continue; }
        if (c === '.' && !hasDot) { hasDot = true; j++; continue; }
        break;
      }
      const raw = input.slice(i, j);
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new Error(`Formula invalida: numero malformado "${raw}"`);
      }
      tokens.push({ type: 'NUMBER', value });
      i = j;
      continue;
    }
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let j = i;
      while (j < input.length) {
        const c = input[j];
        const alnum =
          (c >= 'a' && c <= 'z') ||
          (c >= 'A' && c <= 'Z') ||
          (c >= '0' && c <= '9') ||
          c === '_';
        if (!alnum) break;
        j++;
      }
      tokens.push({ type: 'IDENT', value: input.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`Formula invalida: caracter inesperado "${ch}" en posicion ${i}`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): AstNode {
    const node = this.parseExpr();
    if (this.pos < this.tokens.length) {
      throw new Error('Formula invalida: tokens sobrantes al final');
    }
    return node;
  }

  private peek(): Token | null {
    return this.tokens[this.pos] ?? null;
  }

  private consume(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error('Formula invalida: fin inesperado');
    this.pos++;
    return t;
  }

  private parseExpr(): AstNode {
    let left = this.parseTerm();
    while (true) {
      const t = this.peek();
      if (t?.type === 'OP' && (t.value === '+' || t.value === '-')) {
        this.consume();
        const right = this.parseTerm();
        left = { type: 'bin', op: t.value, left, right };
      } else break;
    }
    return left;
  }

  private parseTerm(): AstNode {
    let left = this.parseFactor();
    while (true) {
      const t = this.peek();
      if (t?.type === 'OP' && (t.value === '*' || t.value === '/')) {
        this.consume();
        const right = this.parseFactor();
        left = { type: 'bin', op: t.value, left, right };
      } else break;
    }
    return left;
  }

  private parseFactor(): AstNode {
    const t = this.peek();
    if (!t) throw new Error('Formula invalida: se esperaba numero, identificador o parentesis');
    if (t.type === 'OP' && t.value === '-') {
      this.consume();
      return { type: 'neg', expr: this.parseFactor() };
    }
    if (t.type === 'OP' && t.value === '+') {
      this.consume();
      return this.parseFactor();
    }
    if (t.type === 'NUMBER') {
      this.consume();
      return { type: 'num', value: t.value };
    }
    if (t.type === 'IDENT') {
      this.consume();
      return { type: 'ref', name: t.value };
    }
    if (t.type === 'LPAREN') {
      this.consume();
      const node = this.parseExpr();
      const close = this.consume();
      if (close.type !== 'RPAREN') {
        throw new Error('Formula invalida: parentesis sin cerrar');
      }
      return node;
    }
    throw new Error(`Formula invalida: token inesperado ${JSON.stringify(t)}`);
  }
}

function evalNode(node: AstNode, vars: Map<string, number>): number {
  if (node.type === 'num') return node.value;
  if (node.type === 'ref') {
    const v = vars.get(node.name);
    if (v == null) {
      throw new Error(`Formula invalida: variable desconocida "${node.name}"`);
    }
    return v;
  }
  if (node.type === 'neg') return -evalNode(node.expr, vars);
  const l = evalNode(node.left, vars);
  const r = evalNode(node.right, vars);
  let result: number;
  switch (node.op) {
    case '+': result = l + r; break;
    case '-': result = l - r; break;
    case '*': result = l * r; break;
    case '/':
      if (r === 0) throw new Error('Formula invalida: division por cero');
      result = l / r;
      break;
  }
  if (!Number.isFinite(result)) {
    throw new Error('Formula invalida: resultado no finito (overflow/NaN)');
  }
  return result;
}

function collectRefs(node: AstNode, acc: Set<string>): void {
  if (node.type === 'ref') acc.add(node.name);
  else if (node.type === 'neg') collectRefs(node.expr, acc);
  else if (node.type === 'bin') {
    collectRefs(node.left, acc);
    collectRefs(node.right, acc);
  }
}

@Injectable()
export class FormulaParserService {
  /** Parsea una formula y retorna su AST. Lanza Error si es invalida. */
  parse(formula: string): AstNode {
    if (!formula || formula.length > 500) {
      throw new Error('Formula invalida: vacia o excede 500 caracteres');
    }
    const tokens = tokenize(formula);
    return new Parser(tokens).parse();
  }

  /** Retorna los identificadores referenciados (rate codes que deben existir). */
  refs(formula: string): string[] {
    const ast = this.parse(formula);
    const s = new Set<string>();
    collectRefs(ast, s);
    return [...s];
  }

  /** Evalua la formula dados los valores de sus variables. */
  evaluate(formula: string, vars: Map<string, number>): number {
    const ast = this.parse(formula);
    return evalNode(ast, vars);
  }

  /** Valida sintaxis sin ejecutar. */
  validate(formula: string): void {
    this.parse(formula);
  }
}
