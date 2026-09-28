import assert from "node:assert/strict";
import { PRODUCT_TOPICS, answerProductKnowledge, askAiCapabilityText, fallbackProductAnswer } from "./product-knowledge";

assert.ok(PRODUCT_TOPICS.length >= 18);
assert.ok(PRODUCT_TOPICS.every((topic) => topic.summary && topic.howTo.length && topic.canDo.length));
assert.doesNotMatch(PRODUCT_TOPICS.map((topic) => `${topic.summary} ${topic.howTo.join(" ")}`).join("\n"), /[\u2013\u2014]/);

const chain = answerProductKnowledge("How do Strategy, Ideas, Portfolios, and Projects connect?", { role: "admin" });
assert.equal(chain?.topicId, "ppm-chain");
assert.match(chain?.text ?? "", /Strategy sets the objective/);
assert.match(chain?.text ?? "", /convert/);

const canDo = answerProductKnowledge("What can you do?", { role: "pm" });
assert.equal(canDo?.topicId, "ask-ai");

const staffStrategy = answerProductKnowledge("Explain Strategy", { role: "staff" });
assert.match(staffStrategy?.text ?? "", /cannot open this module/i);

const fallback = fallbackProductAnswer("admin");
assert.match(fallback.text, /DMC PMO/);
assert.doesNotMatch(fallback.text, /[\u2013\u2014]/);
assert.match(askAiCapabilityText("admin"), /Admin/);

console.log("product-knowledge.verify ok", PRODUCT_TOPICS.length, "topics");
