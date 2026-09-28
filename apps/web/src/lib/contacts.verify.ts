import assert from "node:assert/strict";
import { formatPhoneDisplay } from "./contacts";

assert.equal(formatPhoneDisplay("+1 972 412 6101"), "+1\u00a0972\u00a0412\u00a06101");
assert.equal(formatPhoneDisplay(""), "");
assert.doesNotMatch(formatPhoneDisplay("+1 972 412 6101"), /[\u2013\u2014]/);

console.log("contacts.verify ok");
