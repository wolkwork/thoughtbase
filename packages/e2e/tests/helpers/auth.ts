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
 * Create a user account programmatically using the better-auth API
 * This is faster than going through the UI and useful for test setup
 * @param options Optional user details. If not provided, random values will be generated
 * @param baseURL Base URL for the API (defaults to http://thoughtbase.localhost:3000)
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
    console.error("error kek", error);
    throw error;
  }
}

/**
 * Create an organization programmatically using the Better Auth API
 * @param cookies Authentication cookies from a logged-in user
 * @param name Optional organization name. If not provided, a random name will be generated
 * @returns The created organization with slug
 */
export async function createTestOrganization(
  cookies: string,
  name?: string,
): Promise<{ id: string; name: string; slug: string }> {
  const orgName = name || `Test Org ${Date.now()}`;
  // Generate a slug from the name
  const baseSlug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Create the organization
  const createResponse = await fetch(
    `http://localhost:3000/api/auth/organization/create`,
    {
      method: "POST",
      headers: {
        Cookie: cookies,
        "Content-Type": "application/json",
        Origin: "http://thoughtbase.localhost:3000",
      },
      body: JSON.stringify({
        name: orgName,
        slug,
      }),
    },
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    let errorMessage = `Failed to create test organization: ${createResponse.status} ${createResponse.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const result = await createResponse.json();
  // Better Auth returns { data: {...} } or just the object
  const org = result?.data || result;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug || slug,
  };
}

/**
 * Login a user using the REST API and set cookies on the page
 * @param page Playwright page object
 * @param email User email
 * @param password User password
 * @returns Object with organization slug and cookies string
 */
export async function loginUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  email: string,
  password: string,
): Promise<{ orgSlug: string; cookies: string }> {
  // Login via API
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
  // Parse cookies from Set-Cookie headers
  const cookiesArray = setCookieHeaders.map((cookieHeader) => {
    const parts = cookieHeader.split(";").map((p) => p.trim());
    const [nameValue] = parts;
    const [name, ...valueParts] = nameValue.split("=");
    const value = valueParts.join("=");

    // Extract attributes from cookie header
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
      cookie.domain = domainMatch[1].trim().replace(/^\./, ""); // Remove leading dot for Playwright
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

  // Get organizations to find the org slug
  // Better Auth organization list endpoint
  const orgsResponse = await fetch(`http://localhost:3000/api/auth/organization/list`, {
    method: "GET",
    headers: {
      Cookie: cookies,
      "Content-Type": "application/json",
    },
  });

  if (!orgsResponse.ok) {
    const errorText = await orgsResponse.text();
    throw new Error(`Failed to get organizations: ${orgsResponse.status} ${errorText}`);
  }

  const orgsData = await orgsResponse.json();
  // Better Auth returns { data: [...] } or just the array
  const orgs = orgsData?.data || orgsData || [];

  let orgSlug: string;
  if (!orgs || orgs.length === 0) {
    // Create an organization if the user doesn't have one
    const org = await createTestOrganization(cookies);
    orgSlug = org.slug;
  } else {
    orgSlug = orgs[0].slug;
  }

  // Navigate to dashboard to ensure cookies are set
  await page.goto(`/dashboard/${orgSlug}/ideas`);

  return { orgSlug, cookies };
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
