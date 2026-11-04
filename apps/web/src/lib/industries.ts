export const INDUSTRIES = [
  "Aerospace & Defense",
  "Agriculture",
  "Construction",
  "Consulting",
  "Consumer Goods",
  "Education",
  "Energy",
  "Finance",
  "Government",
  "Healthcare",
  "Hospitality",
  "Insurance",
  "Legal",
  "Life Sciences",
  "Logistics",
  "Manufacturing & Distribution",
  "Media",
  "Nonprofit",
  "Professional Services",
  "Public Sector",
  "Real Estate",
  "Retail",
  "Technology",
  "Telecommunications",
  "Transportation",
  "Utilities",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export function industryChoices(extra: Array<string | undefined | null> = []) {
  const names = new Set<string>(INDUSTRIES);
  extra.forEach((item) => {
    if (item?.trim()) names.add(item.trim());
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}
