import assert from "node:assert/strict";
import { answerHelpQuestion, helpStarters } from "./help-assistant";
import { HELP_ARTICLES, articlesForAudience } from "./help-guide";

assert.ok(HELP_ARTICLES.length >= 28, "guide should cover every module");
assert.ok(articlesForAudience("internal").some((article) => article.id === "billing"));
assert.ok(articlesForAudience("portal").some((article) => article.id === "portal-tickets"));
assert.equal(
  articlesForAudience("internal").some((article) => article.id === "portal-tickets"),
  false,
);

const invoice = answerHelpQuestion("How do I create an invoice?", [], { role: "admin" });
assert.equal(invoice.articleId, "billing");
assert.match(invoice.text, /New Invoice/);
assert.ok(invoice.hrefs.some((link) => link.href === "/app/billing"));

const staffBilling = answerHelpQuestion("How do I create an invoice?", [], { role: "staff" });
assert.match(staffBilling.text, /cannot open this module/i);

const role = answerHelpQuestion("What can Staff do?", [], { role: "admin" });
assert.match(role.text, /Staff works assigned tasks/);

const time = answerHelpQuestion("How do I log time?", [], { role: "staff" });
assert.equal(time.articleId, "timesheets");

const portal = answerHelpQuestion("How do I raise a ticket?", [], { role: "client", audience: "portal" });
assert.equal(portal.articleId, "portal-tickets");

const miss = answerHelpQuestion("what is the weather in paris", [], { role: "pm" });
assert.match(miss.text, /did not find/i);

assert.ok(helpStarters("finance").some((item) => /invoice/i.test(item)));
assert.ok(helpStarters("client").some((item) => /ticket/i.test(item)));

console.log("help-assistant.verify ok", HELP_ARTICLES.length, "articles");
