import { describe, it, expect } from "vitest";
import { urlMatchesDomain, urlMatchesPattern, matchCategories, matchCustomSites } from "./rule-engine";

describe("urlMatchesDomain", () => {
  it("matches the exact domain", () => {
    expect(urlMatchesDomain("https://reddit.com/r/funny", "reddit.com")).toBe(true);
  });
  it("matches subdomains", () => {
    expect(urlMatchesDomain("https://old.reddit.com/r/funny", "reddit.com")).toBe(true);
    expect(urlMatchesDomain("https://www.facebook.com/feed", "facebook.com")).toBe(true);
  });
  it("does not match unrelated domains", () => {
    expect(urlMatchesDomain("https://notreddit.com/r/funny", "reddit.com")).toBe(false);
  });
  it("ignores www when comparing the stored domain too", () => {
    expect(urlMatchesDomain("https://reddit.com/x", "www.reddit.com")).toBe(true);
  });
});

describe("urlMatchesPattern", () => {
  it("matches a bare domain pattern to any path", () => {
    expect(urlMatchesPattern("https://reddit.com/r/funny", "reddit.com")).toBe(true);
  });
  it("matches domain/* the same as a bare domain", () => {
    expect(urlMatchesPattern("https://reddit.com/r/funny", "reddit.com/*")).toBe(true);
  });
  it("matches a specific path with a wildcard", () => {
    expect(urlMatchesPattern("https://youtube.com/shorts/abc123", "youtube.com/shorts/*")).toBe(true);
    expect(urlMatchesPattern("https://youtube.com/watch?v=abc123", "youtube.com/shorts/*")).toBe(false);
  });
  it("rejects an empty pattern", () => {
    expect(urlMatchesPattern("https://reddit.com", "")).toBe(false);
  });
});

describe("matchCategories", () => {
  const categories = [
    { id: "social", label: "Social Media", domains: ["facebook.com"], enabled: true },
    { id: "shopping", label: "Shopping", domains: ["amazon.com"], enabled: false },
  ];
  it("blocks a domain in an enabled category", () => {
    expect(matchCategories("https://facebook.com/feed", categories).matched).toBe(true);
  });
  it("does not block a domain in a disabled category", () => {
    expect(matchCategories("https://amazon.com/cart", categories).matched).toBe(false);
  });
  it("does not block an unrelated domain", () => {
    expect(matchCategories("https://example.com", categories).matched).toBe(false);
  });
});

describe("matchCustomSites", () => {
  const sites = [{ id: "1", label: "Reddit", pattern: "reddit.com/*", enabled: true }];
  it("blocks an enabled custom site", () => {
    expect(matchCustomSites("https://reddit.com/r/funny", sites).matched).toBe(true);
  });
  it("does not block a disabled custom site", () => {
    const disabled = [{ ...sites[0], enabled: false }];
    expect(matchCustomSites("https://reddit.com/r/funny", disabled).matched).toBe(false);
  });
});
