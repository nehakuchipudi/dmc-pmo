import assert from "node:assert/strict";
import {
  inviteLandingHref,
  inviteLoginHref,
  inviteSignupHref,
  userInviteBody,
  userInviteSubject,
} from "./user-invite";

assert.equal(userInviteSubject(), "You are invited to DMC PMO");

const signup = inviteSignupHref({
  email: "jordan.lee@dillonmorgan.com",
  firstName: "Jordan",
  lastName: "Lee",
  origin: "https://dmc-pmo.vercel.app",
});
assert.ok(signup.includes("/signup/?"));
assert.ok(signup.includes("email=jordan.lee%40dillonmorgan.com"));
assert.ok(signup.includes("invite=1"));
assert.ok(signup.includes("first=Jordan"));

const login = inviteLoginHref("jordan.lee@dillonmorgan.com", "https://dmc-pmo.vercel.app");
assert.equal(login, "https://dmc-pmo.vercel.app/login/?email=jordan.lee%40dillonmorgan.com");

const landing = inviteLandingHref({
  email: "jordan.lee@dillonmorgan.com",
  firstName: "Jordan",
  lastName: "Lee",
  role: "staff",
  origin: "https://dmc-pmo.vercel.app",
});
assert.ok(landing.includes("/invite/?"));
assert.ok(landing.includes("email=jordan.lee%40dillonmorgan.com"));

const body = userInviteBody({
  name: "Jordan Lee",
  email: "jordan.lee@dillonmorgan.com",
  role: "staff",
  inviterName: "A. Chen",
  inviteHref: landing,
  signupHref: signup,
  loginHref: login,
  toolHref: "https://dmc-pmo.vercel.app/",
});
assert.match(body, /A\. Chen invited you to DMC PMO as Staff/);
assert.match(body, /Accept the invite and create your account/);
assert.match(body, /Sign in: https:\/\/dmc-pmo\.vercel\.app\/login\//);
assert.match(body, /Open DMC PMO: https:\/\/dmc-pmo\.vercel\.app\//);
assert.doesNotMatch(body, /[\u2013\u2014]/);

console.log("user-invite.verify ok");
