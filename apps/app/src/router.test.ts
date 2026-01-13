import { describe, expect, test } from "bun:test";
import { rewriteInput, rewriteOutput } from "./router";

describe("rewriteInput", () => {
  test("should rewrite input for local subdomain", () => {
    const url = new URL("http://acme.thoughtbase.localhost:3000/");

    expect(rewriteInput({ url }).pathname).toBe("/subdomain/acme/");
  });

  test("should rewrite input for local subdomain", () => {
    const url = new URL("http://acme.thoughtbase.localhost:3000/roadmap");

    expect(rewriteInput({ url }).pathname).toBe("/subdomain/acme/roadmap");
  });

  test("should rewrite input for local without subdomain", () => {
    const url = new URL("http://thoughtbase.localhost:3000/");

    expect(rewriteInput({ url }).pathname).toBe("/");
  });

  test("should rewrite input for Vercel preview deployment", () => {
    const url = new URL("http://tenant---branch-name.vercel.app/");

    expect(rewriteInput({ url }).pathname).toBe("/");
  });

  test("should not rewrite input for production base domain", () => {
    const url = new URL("http://app.thoughtbase.app/");

    expect(rewriteInput({ url }).pathname).toBe("/");
  });

  test("should rewrite input for production subdomain", () => {
    const url = new URL("http://acme.thoughtbase.app/");

    expect(rewriteInput({ url }).pathname).toBe("/subdomain/acme/");
  });

  test("should rewrite input for production subdomain", () => {
    const url = new URL("http://acme.thoughtbase.app/roadmap");

    expect(rewriteInput({ url }).pathname).toBe("/subdomain/acme/roadmap");
  });

  test("should rewrite input for custom domain", () => {
    const url = new URL("http://acme.com/");

    expect(rewriteInput({ url }).pathname).toBe("/_custom/acme.com/");
  });

  test("should rewrite input for custom domain", () => {
    const url = new URL("http://acme.com/roadmap");

    expect(rewriteInput({ url }).pathname).toBe("/_custom/acme.com/roadmap");
  });
});

describe("rewriteOutput", () => {
  test("should rewrite output for local subdomain", () => {
    const url = new URL("http://acme.thoughtbase.localhost:3000/");

    expect(rewriteOutput({ url }).pathname).toBe("/");
  });

  test("should rewrite output for local subdomain", () => {
    const url = new URL("http://acme.thoughtbase.localhost:3000/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/roadmap");
  });

  test("should rewrite output for local subdomain", () => {
    const url = new URL("http://acme.thoughtbase.localhost:3000/subdomain/acme/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/roadmap");
  });

  test("should rewrite output for local subdomain", () => {
    const url = new URL("http://thoughtbase.localhost:3000/subdomain/acme/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/subdomain/acme/roadmap");
  });

  test("should rewrite output for local subdomain", () => {
    const url = new URL("http://thoughtbase.localhost:3000/dashboard");

    expect(rewriteOutput({ url }).pathname).toBe("/dashboard");
  });

  test("should rewrite output for Vercel preview deployment", () => {
    const url = new URL("http://tenant---branch-name.vercel.app/subdomain/acme/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/subdomain/acme/roadmap");
  });

  test("should rewrite output for Vercel preview deployment", () => {
    const url = new URL("http://tenant---branch-name.vercel.app/dashboard");

    expect(rewriteOutput({ url }).pathname).toBe("/dashboard");
  });

  test("should rewrite output for production base domain", () => {
    const url = new URL("http://app.thoughtbase.app/dashboard");

    expect(rewriteOutput({ url }).pathname).toBe("/dashboard");
  });

  test("should rewrite output for production base domain", () => {
    const url = new URL("http://app.thoughtbase.app/subdomain/acme/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/subdomain/acme/roadmap");
  });

  test("should rewrite output for production base domain", () => {
    const url = new URL("http://acme.thoughtbase.app/subdomain/acme/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/roadmap");
  });

  test("should rewrite output for production base domain", () => {
    const url = new URL("http://acme.com/_custom/acme.com/");

    expect(rewriteOutput({ url }).pathname).toBe("/");
  });

  test("should rewrite output for production base domain", () => {
    const url = new URL("http://acme.com/_custom/acme.com/roadmap");

    expect(rewriteOutput({ url }).pathname).toBe("/roadmap");
  });
});
