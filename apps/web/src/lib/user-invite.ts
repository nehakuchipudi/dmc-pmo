import { roleLabel } from "./help-labels";
import { workspaceOrigin } from "./project-notify";
import type { Role } from "./types";

export function userInviteSubject() {
  return "You are invited to DMC PMO";
}

export function inviteSignupHref(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  origin?: string;
}) {
  const origin = input.origin ?? workspaceOrigin();
  const params = new URLSearchParams({
    email: input.email,
    invite: "1",
  });
  if (input.firstName) params.set("first", input.firstName);
  if (input.lastName) params.set("last", input.lastName);
  return `${origin}/signup/?${params.toString()}`;
}

export function inviteLoginHref(email: string, origin = workspaceOrigin()) {
  const params = new URLSearchParams({ email });
  return `${origin}/login/?${params.toString()}`;
}

export function inviteLandingHref(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  origin?: string;
}) {
  const origin = input.origin ?? workspaceOrigin();
  const params = new URLSearchParams({
    email: input.email,
  });
  if (input.firstName) params.set("first", input.firstName);
  if (input.lastName) params.set("last", input.lastName);
  if (input.role) params.set("role", input.role);
  return `${origin}/invite/?${params.toString()}`;
}

export function userInviteBody(input: {
  name: string;
  email: string;
  role: Role;
  inviterName: string;
  inviteHref: string;
  signupHref: string;
  loginHref: string;
  toolHref: string;
}) {
  const first = input.name.split(" ")[0] || "there";
  return [
    `Hi ${first},`,
    "",
    `${input.inviterName} invited you to DMC PMO as ${roleLabel(input.role)}. Use this email to join: ${input.email}.`,
    "",
    `Accept the invite and create your account: ${input.inviteHref}`,
    `Sign up directly: ${input.signupHref}`,
    `Already have an account? Sign in: ${input.loginHref}`,
    "",
    "Create the account with this same work email, then sign in with Microsoft Entra ID. That address is how you return to the workspace.",
    "",
    `Open DMC PMO: ${input.toolHref}`,
    "",
  ].join("\n");
}
