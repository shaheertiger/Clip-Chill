import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Shared by the live blog page and the build-time prerenderer so both emit
 *  identical article HTML (GFM tables, stable heading ids for the TOC). */
export const remarkPlugins = [remarkGfm];

export function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function textOf(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return textOf((children as { props: { children?: unknown } }).props.children);
  }
  return '';
}

export const markdownComponents: Components = {
  h1: () => null,
  h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
};

/** Splits "---\nfrontmatter\n---\nbody" and returns the body only. */
export function stripFrontmatter(text: string): string {
  return text.replace(/^---[\s\S]*?---/, '').trim();
}

/** Pulls Q&A pairs out of a post's "## Frequently Asked Questions" section,
 *  written as a bold question line followed by its answer paragraph. */
export function extractFaqs(markdown: string): { q: string; a: string }[] {
  const section = markdown.match(/^##\s+(?:Frequently Asked Questions|FAQs?)\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im);
  if (!section) return [];
  const faqs: { q: string; a: string }[] = [];
  const re = /^\*\*(.+?\?)\*\*\s*\n([\s\S]+?)(?=\n\s*\n|$)/gm;
  for (const m of section[1].matchAll(re)) {
    const a = m[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    if (a) faqs.push({ q: m[1].trim(), a });
  }
  return faqs;
}
