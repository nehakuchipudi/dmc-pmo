import type { Role } from "./types";

export function roleLabel(role: Role) {
  switch (role) {
    case "admin":
      return "Admin";
    case "pm":
      return "Project Manager";
    case "staff":
      return "Staff";
    case "finance":
      return "Finance";
    case "leadership":
      return "Leadership";
    case "client":
      return "Client Contact";
  }
}
