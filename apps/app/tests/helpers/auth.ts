import type { Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { member, organization, user } from "~/lib/db/schema";
import { db } from "./db";
/**
 * Helper utilities for authentication tests
 */

export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

export function generateTestPassword(): string {
  return `TestPassword${Math.random().toString(36).substring(7)}!`;
}

export function generateTestName(): string {
  return `Test User ${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a user account programmatically using the HTTP API
 * This handles password hashing and all user creation logic via Better Auth
 * @param options Optional user details. If not provided, random values will be generated
 * @returns User credentials (email, password, name)
 */
export async function createTestUser(options?: {
  email?: string;
  password?: string;
  name?: string;
}): Promise<{ email: string; password: string; name: string }> {
  const email = options?.email || generateTestEmail();
  const password = options?.password || generateTestPassword();
  const name = options?.name || generateTestName();

  try {
    const response = await fetch(`http://localhost:3000/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to create test user: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    return { email, password, name };
  } catch (error) {
    console.error("Error creating test user:", error);
    throw error;
  }
}

/**
 * Create an organization programmatically using the database directly
 * @param userId The user ID who will own the organization
 * @param options Optional organization details
 * @returns The created organization with slug
 */
export async function createTestOrganization(options?: { name?: string; slug?: string }) {
  const orgName = options?.name || `Test Org ${Date.now()}`;

  let slug: string;
  if (options?.slug) {
    slug = options.slug;
  } else {
    // Generate a slug from the name
    const baseSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  // Create the organization
  const orgId = crypto.randomUUID();
  const [newOrg] = await db
    .insert(organization)
    .values({
      id: orgId,
      name: orgName,
      slug,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [organization.slug],
      set: {
        name: orgName,
        createdAt: new Date(),
      },
    })
    .returning();

  return {
    id: newOrg.id,
    name: newOrg.name,
    slug: newOrg.slug,
  };
}

/**
 * Login a user using the REST API and set cookies on the page
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 * @returns Object with cookies string
 */
export async function loginUser(page: Page, email: string, password: string) {
  // Login via API to get cookies
  const loginResponse = await fetch(`http://localhost:3000/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Failed to login: ${loginResponse.status} ${errorText}`);
  }

  // Extract cookies from response
  const setCookieHeaders = loginResponse.headers.getSetCookie();
  const cookies = setCookieHeaders.map((cookie) => cookie.split(";")[0]).join("; ");

  // Set cookies on the page context
  const cookiesArray = setCookieHeaders.map((cookieHeader) => {
    const parts = cookieHeader.split(";").map((p) => p.trim());
    const [nameValue] = parts;
    const [name, ...valueParts] = nameValue.split("=");
    const value = valueParts.join("=");

    const domainMatch = cookieHeader.match(/Domain=([^;]+)/i);
    const pathMatch = cookieHeader.match(/Path=([^;]+)/i);
    const secureMatch = cookieHeader.match(/Secure/i);
    const httpOnlyMatch = cookieHeader.match(/HttpOnly/i);
    const sameSiteMatch = cookieHeader.match(/SameSite=([^;]+)/i);

    const cookie: {
      name: string;
      value: string;
      domain?: string;
      path: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "Strict" | "Lax" | "None";
    } = {
      name: name.trim(),
      value: decodeURIComponent(value),
      path: pathMatch ? pathMatch[1].trim() : "/",
    };

    if (domainMatch) {
      cookie.domain = domainMatch[1].trim().replace(/^\./, "");
    }
    if (secureMatch) {
      cookie.secure = true;
    }
    if (httpOnlyMatch) {
      cookie.httpOnly = true;
    }
    if (sameSiteMatch) {
      const sameSiteValue = sameSiteMatch[1].trim();
      if (["Strict", "Lax", "None"].includes(sameSiteValue)) {
        cookie.sameSite = sameSiteValue as "Strict" | "Lax" | "None";
      }
    }

    return cookie;
  });

  await page.context().addCookies(cookiesArray);

  // Get user ID from database to check/create organizations
  const dbUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!dbUser) {
    throw new Error("User not found after login");
  }

  return { cookies, user: dbUser };
}

/**
 * Add a user to an organization programmatically
 * @param userId The user ID to add to the organization
 * @param organizationId The organization ID (or slug) to add the user to
 * @param options Optional member details (role)
 * @returns The created member record
 */
export async function addUserToOrganization(
  userId: string,
  organizationIdOrSlug: string,
  options?: { role?: string },
) {
  // Check if organizationIdOrSlug is a slug or ID
  let orgId: string;
  const existingOrg = await db.query.organization.findFirst({
    where: eq(organization.slug, organizationIdOrSlug),
  });

  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    // Assume it's an ID if not found by slug
    orgId = organizationIdOrSlug;
  }

  // Check if member already exists
  const existingMember = await db.query.member.findFirst({
    where: (members, { and }) =>
      and(eq(members.organizationId, orgId), eq(members.userId, userId)),
  });

  if (existingMember) {
    return existingMember;
  }

  // Create the member record
  const memberId = crypto.randomUUID();
  const [newMember] = await db
    .insert(member)
    .values({
      id: memberId,
      organizationId: orgId,
      userId,
      role: options?.role || "member",
      createdAt: new Date(),
    })
    .returning();

  return newMember;
}

/**
 * Wait for a toast message to appear
 * Sonner toasts are rendered in a portal, so we need to wait for them
 */
export async function waitForToast(
  page: {
    getByText: (text: string | RegExp) => {
      waitFor: (options: { state: string; timeout: number }) => Promise<unknown>;
    };
  },
  text: string | RegExp,
  timeout = 5000,
) {
  if (typeof text === "string") {
    return await page.getByText(text).waitFor({ state: "visible", timeout });
  } else {
    return await page.getByText(text).waitFor({ state: "visible", timeout });
  }
}
