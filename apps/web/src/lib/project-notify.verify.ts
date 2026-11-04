import assert from "node:assert/strict";
import {
  OWNER_ROLE,
  memberAssignmentSubject,
  projectAssignmentBody,
  projectAssignmentSubject,
  projectHref,
  resolveNotifyEmail,
  wantsOwnerRole,
} from "./project-notify";
import { seedTeam, users } from "./seed";

assert.equal(OWNER_ROLE, "Owner");
assert.equal(projectAssignmentSubject("Downtown Sidewalk Connector"), "You are the Owner of Downtown Sidewalk Connector");
assert.match(
  projectAssignmentBody({
    ownerName: "Aishwarya Phalak",
    projectName: "Downtown Sidewalk Connector",
    companyName: "City of Rowlett Public Works",
    requestId: "RQ-2025-0127",
    href: "https://dmc-pmo.vercel.app/app/projects/view/?id=p-sidewalk",
    created: true,
  }),
  /aishwarya|Owner|RQ-2025-0127|dmc-pmo.vercel.app/i,
);

const hit = resolveNotifyEmail({
  name: "Aishwarya Phalak",
  people: [{ name: "Aishwarya Phalak", email: "aishwarya.phalak@dillonmorgan.com", notifyEmail: true }],
});
assert.equal(hit?.email, "aishwarya.phalak@dillonmorgan.com");

const skipped = resolveNotifyEmail({
  email: "quiet@dillonmorgan.com",
  people: [{ name: "Quiet", email: "quiet@dillonmorgan.com", notifyEmail: false }],
});
assert.equal(skipped, undefined);

assert.equal(wantsOwnerRole("assign Aishwarya as Owner"), true);
assert.equal(memberAssignmentSubject("Downtown Sidewalk Connector", "Owner").includes("Owner"), true);
assert.equal(projectHref("p-sidewalk", "https://dmc-pmo.vercel.app"), "https://dmc-pmo.vercel.app/app/projects/view/?id=p-sidewalk");

assert.ok(users.some((user) => user.email === "aishwarya.phalak@dillonmorgan.com" && user.notifyEmail));
assert.ok(seedTeam.some((member) => member.email === "aishwarya.phalak@dillonmorgan.com" && member.notifyEmail));

console.log("project-notify.verify ok");
