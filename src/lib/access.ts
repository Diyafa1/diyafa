import type { Role } from "@prisma/client";

/** Which role may open which part of the site. Used by the middleware and re-checked on the server. */
export type Rule = { prefix: string; roles: Role[] | "any-user" };

export const ACCESS_RULES: Rule[] = [
  { prefix: "/admin", roles: ["ADMIN", "STAFF"] },
  { prefix: "/host/onboarding", roles: "any-user" },
  { prefix: "/host", roles: ["HOST"] },
  { prefix: "/account", roles: "any-user" },
  { prefix: "/trips", roles: "any-user" },
  { prefix: "/messages", roles: "any-user" },
  { prefix: "/favorites", roles: "any-user" },
  { prefix: "/pay", roles: "any-user" },
  { prefix: "/api/files", roles: "any-user" },
];

export type AccessDecision = "allow" | "login" | "forbidden";

export function checkAccess(pathname: string, role: Role | null): AccessDecision {
  const rule = ACCESS_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return "allow";
  if (!role) return "login";
  if (rule.roles === "any-user") return "allow";
  return rule.roles.includes(role) ? "allow" : "forbidden";
}
