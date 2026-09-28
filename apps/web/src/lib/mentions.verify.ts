import assert from "node:assert/strict";
import {
  clampSplitPct,
  insertMention,
  matchMentionPeople,
  mentionHandle,
  mentionQueryAt,
  mentionedPeople,
  splitMentions,
} from "./mentions";

const people = [
  { id: "tm-ac", name: "A. Chen" },
  { id: "tm-pr", name: "P. Rivera" },
  { id: "tm-ap", name: "Aishwarya Phalak" },
];

assert.equal(mentionHandle("A. Chen"), "A.Chen");
assert.deepEqual(mentionQueryAt("Please review @A.C", 18), { start: 14, query: "A.C" });
assert.equal(matchMentionPeople("A.C", people)[0]?.name, "A. Chen");
assert.equal(mentionedPeople("Can you look at this @A.Chen ?", people)[0]?.name, "A. Chen");
assert.equal(splitMentions("Hi @A.Chen please review.", people).some((part) => part.mention && part.text === "@A.Chen"), true);
assert.equal(insertMention("Hi @A", 5, "A. Chen").text, "Hi @A.Chen ");
assert.equal(clampSplitPct(10), 28);
assert.equal(clampSplitPct(90), 72);

console.log("mentions.verify ok");
