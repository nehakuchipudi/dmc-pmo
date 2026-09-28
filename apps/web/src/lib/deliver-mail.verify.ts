import assert from "node:assert/strict";
import { mailHtml, noSenderMessage } from "./deliver-mail";

const html = mailHtml("Hi Jordan,\nOpen https://dmc-pmo.vercel.app/invite/?email=a@b.com\n");
assert.match(html, /<br\/>/);
assert.match(html, /href="https:\/\/dmc-pmo\.vercel\.app\/invite\/\?email=a@b.com"/);
assert.doesNotMatch(html, /[\u2013\u2014]/);
assert.match(noSenderMessage(), /Sign in with Microsoft/);
assert.match(noSenderMessage(), /RESEND_API_KEY/);

console.log("deliver-mail.verify ok");
