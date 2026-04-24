/**
 * Unicode category taxonomy used for filtering.
 */

export const CATEGORY_GROUPS: Record<string, string> = {
  L: "Letter",
  M: "Mark",
  N: "Number",
  P: "Punctuation",
  S: "Symbol",
  Z: "Separator",
  C: "Other",
};

export const CATEGORY_NAMES: Record<string, string> = {
  Lu: "Letter, Uppercase",
  Ll: "Letter, Lowercase",
  Lt: "Letter, Titlecase",
  Lm: "Letter, Modifier",
  Lo: "Letter, Other",
  Mn: "Mark, Non-Spacing",
  Mc: "Mark, Spacing Combining",
  Me: "Mark, Enclosing",
  Nd: "Number, Decimal Digit",
  Nl: "Number, Letter",
  No: "Number, Other",
  Pc: "Punctuation, Connector",
  Pd: "Punctuation, Dash",
  Ps: "Punctuation, Open",
  Pe: "Punctuation, Close",
  Pi: "Punctuation, Initial quote",
  Pf: "Punctuation, Final quote",
  Po: "Punctuation, Other",
  Sm: "Symbol, Math",
  Sc: "Symbol, Currency",
  Sk: "Symbol, Modifier",
  So: "Symbol, Other",
  Zs: "Separator, Space",
  Zl: "Separator, Line",
  Zp: "Separator, Paragraph",
  Cc: "Other, Control",
  Cf: "Other, Format",
  Cs: "Other, Surrogate",
  Co: "Other, Private Use",
  Cn: "Other, Not Assigned",
};

/** Grouped hierarchy for rendering <optgroup> selects. */
export const CATEGORIES_HIERARCHY: Record<
  string,
  { name: string; subgroups: { code: string; name: string }[] }
> = Object.entries(CATEGORY_NAMES).reduce(
  (acc, [code, name]) => {
    const mainCode = code.charAt(0);
    if (!acc[mainCode]) {
      acc[mainCode] = { name: CATEGORY_GROUPS[mainCode], subgroups: [] };
    }
    acc[mainCode].subgroups.push({ code, name });
    return acc;
  },
  {} as Record<string, { name: string; subgroups: { code: string; name: string }[] }>
);

export function getCategoryName(code: string): string {
  return CATEGORY_NAMES[code] ?? code;
}
