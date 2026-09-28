export type MentionPerson = {
  id?: string;
  name: string;
  email?: string;
};

export function mentionHandle(name: string) {
  return name.replace(/\s+/g, "");
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mentionQueryAt(text: string, cursor: number) {
  const upto = text.slice(0, cursor);
  const hit = upto.match(/(^|[\s(])@([^\s@]*)$/);
  if (!hit) return undefined;
  return {
    start: upto.length - hit[2].length - 1,
    query: hit[2],
  };
}

export function matchMentionPeople(query: string, people: MentionPerson[]) {
  const needle = query.replace(/\s+/g, "").toLowerCase();
  return people.filter((person) => {
    const handle = mentionHandle(person.name).toLowerCase();
    const name = person.name.toLowerCase();
    return !needle || handle.includes(needle) || name.includes(query.toLowerCase());
  });
}

export function mentionedPeople(text: string, people: MentionPerson[]) {
  return people.filter((person) => {
    const handle = mentionHandle(person.name);
    const pattern = new RegExp(`@(?:${escapeRegExp(handle)}|${escapeRegExp(person.name)})\\b`, "i");
    return pattern.test(text);
  });
}

export function splitMentions(text: string, people: MentionPerson[]) {
  if (!text || !people.length) return [{ text, mention: false }];
  const tokens = [...new Set(people.flatMap((person) => [mentionHandle(person.name), person.name]))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (!tokens.length) return [{ text, mention: false }];
  const pattern = new RegExp(`@(${tokens.join("|")})\\b`, "gi");
  const parts: { text: string; mention: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index), mention: false });
    parts.push({ text: match[0], mention: true });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mention: false });
  return parts.length ? parts : [{ text, mention: false }];
}

export function insertMention(text: string, cursor: number, name: string) {
  const at = mentionQueryAt(text, cursor);
  const handle = `@${mentionHandle(name)} `;
  if (!at) {
    const next = `${text}${text && !text.endsWith(" ") ? " " : ""}${handle}`;
    return { text: next, cursor: next.length };
  }
  const next = `${text.slice(0, at.start)}${handle}${text.slice(cursor)}`;
  return { text: next, cursor: at.start + handle.length };
}

export function clampSplitPct(value: number) {
  return Math.min(72, Math.max(28, value));
}
