export function slugify(text: string): string;
export function rowLabel(text: string): string;
export function createSlugger(): (text: string) => string;
export function anchorIds(body: string): Set<string>;
