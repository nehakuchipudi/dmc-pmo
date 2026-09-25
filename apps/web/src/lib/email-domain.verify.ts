import assert from "node:assert/strict";
import {
  buildDnsRecords,
  domainStatus,
  localPart,
  normalizeDomain,
  recordMatches,
} from "./email-domain";

assert.equal(normalizeDomain("https://www.DillonMorgan.com/app"), "dillonmorgan.com");
assert.equal(normalizeDomain("not a domain"), undefined);
assert.equal(normalizeDomain("a.b"), undefined);
assert.equal(localPart("Notifications+Ops"), "notifications+ops");

const records = buildDnsRecords("acme.com");
assert.equal(records.length, 3);
assert.equal(records[0].kind, "spf");
assert.match(records[0].value, /v=spf1/);
assert.equal(records[1].name, "dmc._domainkey.acme.com");
assert.equal(records[2].name, "_dmarc.acme.com");
assert.match(records[2].value, /v=DMARC1/);

assert.equal(domainStatus(records), "Not checked");
assert.equal(domainStatus(records.map((row) => ({ ...row, found: true }))), "Verified");
assert.equal(
  domainStatus(records.map((row, index) => ({ ...row, found: index === 0 }))),
  "Partial",
);
assert.equal(domainStatus(records.map((row) => ({ ...row, found: false }))), "Missing");

assert.equal(recordMatches(records[0], ["v=spf1 include:_spf.google.com ~all"]), true);
assert.equal(recordMatches(records[2], ["v=DMARC1; p=none"]), true);
assert.equal(recordMatches(records[1], ["dmc._domainkey.dmc-pmo.app"]), true);
assert.equal(recordMatches(records[0], []), false);

console.log("email-domain.verify ok");
