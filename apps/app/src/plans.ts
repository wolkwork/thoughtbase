export enum Permission {
  READ = "read",
  WRITE = "write",

  // Paid
  CUSTOM_DOMAIN = "custom-domain",
  WHITE_LABEL = "white-label",
  SSO = "sso",
  PRIVATE_BOARDS = "private-boards",
  INTEGRATIONS = "integrations",
}

export const free = {
  slug: "free",
  name: "Free",
  hidden: true,
  price: {
    month: 0,
    year: 0,
  },
  permissions: [Permission.READ] as Permission[],
} as const;

export const start = {
  slug: "start",
  name: "Start",
  price: {
    month: 25,
    year: 250,
  },
  permissions: [...free.permissions, Permission.WRITE] as Permission[],
} as const;

export const pro = {
  slug: "pro",
  name: "Pro",
  price: {
    month: 49,
    year: 490,
  },
  permissions: [
    ...start.permissions,
    Permission.CUSTOM_DOMAIN,
    Permission.WHITE_LABEL,
    Permission.PRIVATE_BOARDS,
  ] as Permission[],
} as const;

export const business = {
  slug: "business",
  name: "Business",
  price: {
    month: 99,
    year: 990,
  },
  permissions: [
    ...pro.permissions,
    Permission.SSO,
    Permission.INTEGRATIONS,
  ] as Permission[],
} as const;

export const plans = {
  free,
  start,
  pro,
  business,
} as const;
