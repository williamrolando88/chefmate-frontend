#!/usr/bin/env node
/**
 * Enforces the theming rules from .claude/skills/ui-styling/SKILL.md:
 * templates and component code may only use semantic token utilities —
 * raw palette colors, color literals, and `dark:` variants are banned
 * outside src/styles.css (the single theming file).
 *
 * Modes:
 *   node scripts/check-styling.mjs            # scan all of src/, exit 1 on violations (CI)
 *   node scripts/check-styling.mjs <files...> # scan specific files
 *   node scripts/check-styling.mjs --hook     # Claude Code PostToolUse hook: reads the tool
 *                                             # payload from stdin, exits 2 with feedback
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SRC = join(ROOT, 'src');
const CHECKED_EXTENSIONS = new Set(['.html', '.ts', '.css']);
/** The only file allowed to contain raw color values: the theme itself. */
const EXEMPT = new Set([join('src', 'styles.css')]);

const UTILITY_PREFIXES =
  '(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|inset-ring)';
const PALETTES =
  '(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';

const RULES = [
  {
    name: 'raw Tailwind palette color',
    regex: new RegExp(`(?<![\\w/-])${UTILITY_PREFIXES}-${PALETTES}-\\d{2,3}\\b`, 'g'),
    extensions: ['.html', '.ts'],
    fix: 'use a semantic token utility (bg-primary, text-muted-foreground, border-input, …); if no token fits, add one in src/styles.css',
  },
  {
    name: 'raw white/black color',
    regex: new RegExp(`(?<![\\w/-])${UTILITY_PREFIXES}-(?:white|black)\\b`, 'g'),
    extensions: ['.html', '.ts'],
    fix: 'use a semantic token utility (bg-background, bg-card, text-foreground, …)',
  },
  {
    name: 'arbitrary color literal in utility',
    regex: new RegExp(
      `(?<![\\w/-])${UTILITY_PREFIXES}-\\[(?:#|rgba?|hsla?|oklch|oklab|color:)`,
      'g',
    ),
    extensions: ['.html', '.ts'],
    fix: 'color values belong in src/styles.css as tokens, never inline in templates',
  },
  {
    name: 'dark: variant',
    // (?=\S) skips TS object keys like `dark: '...'` — class variants abut the next utility
    regex: /(?<![\w-])dark:(?=\S)/g,
    extensions: ['.html', '.ts'],
    fix: 'dark mode is a theme: flip the token values under `.dark` in src/styles.css; components must be theme-agnostic',
  },
  {
    name: 'color literal in component CSS',
    regex: /(?<=[:\s(,])(?:#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|oklch|oklab)\()/g,
    extensions: ['.css'],
    fix: 'component CSS must reference tokens: var(--color-primary), var(--color-border), …',
  },
  {
    name: 'non-tier breakpoint variant',
    // (?=\S) skips TS object keys like `sm: '...'` — class variants abut the next utility
    regex: /(?<![\w@-])(?:sm|xl|2xl):(?=\S)/g,
    extensions: ['.html', '.ts'],
    fix: 'three device tiers only (mobile-first): unprefixed = phones, md: = tablets/iPads, lg: = desktop',
  },
  {
    name: 'max-width breakpoint variant',
    regex: /(?<![\w@-])max-(?:sm|md|lg|xl|2xl):(?=\S)/g,
    extensions: ['.html', '.ts'],
    fix: 'mobile-first: style the base for phones and enhance upward with md:/lg:, never downward with max-*:',
  },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (CHECKED_EXTENSIONS.has(extname(path))) out.push(path);
  }
  return out;
}

function checkFile(path) {
  const rel = relative(ROOT, path);
  if (EXEMPT.has(rel) || !rel.startsWith(`src${sep}`)) return [];
  const ext = extname(path);
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return []; // deleted or unreadable — nothing to check
  }
  const violations = [];
  const lines = content.split('\n');
  for (const rule of RULES) {
    if (!rule.extensions.includes(ext)) continue;
    lines.forEach((line, i) => {
      const matches = line.match(rule.regex);
      if (matches) {
        violations.push({ rel, line: i + 1, rule, matches: [...new Set(matches)] });
      }
    });
  }
  return violations;
}

function report(violations, stream) {
  for (const v of violations) {
    stream.write(`${v.rel}:${v.line} — ${v.rule.name}: ${v.matches.join(', ')}\n`);
    stream.write(`  fix: ${v.rule.fix}\n`);
  }
}

const args = process.argv.slice(2);

if (args[0] === '--hook') {
  // Claude Code PostToolUse hook: {"tool_input": {"file_path": "..."}} on stdin.
  const input = readFileSync(0, 'utf8');
  let filePath;
  try {
    filePath = JSON.parse(input)?.tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!filePath || !CHECKED_EXTENSIONS.has(extname(filePath))) process.exit(0);
  const violations = checkFile(resolve(filePath));
  if (violations.length > 0) {
    process.stderr.write('Styling rule violations (see .claude/skills/ui-styling/SKILL.md):\n');
    report(violations, process.stderr);
    process.exit(2); // exit 2 feeds stderr back to Claude as blocking feedback
  }
  process.exit(0);
}

const files = args.length > 0 ? args.map((f) => resolve(f)) : walk(SRC);
const violations = files.flatMap(checkFile);
if (violations.length > 0) {
  report(violations, process.stderr);
  process.stderr.write(`\n${violations.length} styling violation(s). Theme file: src/styles.css\n`);
  process.exit(1);
}
console.log(`lint:styles — ${files.length} file(s) clean`);
