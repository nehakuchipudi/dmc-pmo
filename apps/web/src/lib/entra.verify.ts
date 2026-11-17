import assert from "node:assert/strict";
import { ENTRA_SCOPES, MAIL_SCOPES, SIGNIN_SCOPES, takeAfterAuthPath } from "./entra";

assert.ok(ENTRA_SCOPES.includes("User.Read"));
assert.ok(MAIL_SCOPES.includes("Mail.Send"));
assert.ok(SIGNIN_SCOPES.includes("Mail.Send"));
assert.ok(SIGNIN_SCOPES.includes("openid"));
assert.equal(takeAfterAuthPath(), "");

console.log("entra.verify ok");
