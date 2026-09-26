import { describe, it, expect, afterEach, vi } from "vitest"
import { Request } from "@bohudur/http"

function mockFetchOnce(partial: { ok?: boolean; status?: number; json?: () => Promise<unknown> }) {
  const response = {
    ok: partial.ok ?? true,
    status: partial.status ?? 200,
    json: partial.json ?? (async () => ({}))
  }
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response) as unknown as typeof fetch)
}

describe("Request", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns parsed JSON on success", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ hello: "world" }) })
    const result = await Request<{ hello: string }>("key", {}, "/path", {})
    expect(result).toEqual({ hello: "world" })
  })

  it("throws a 'server' BohudurError on a non-2xx HTTP status", async () => {
    mockFetchOnce({ ok: false, status: 500 })
    await expect(Request("key", {}, "/path", {})).rejects.toMatchObject({
      code: 500,
      type: "server"
    })
  })

  it("throws a 'server' BohudurError when the body isn't valid JSON", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("bad json")
      }
    })
    await expect(Request("key", {}, "/path", {})).rejects.toMatchObject({
      code: 0,
      type: "server"
    })
  })

  it("throws an 'api' BohudurError using the ErrorCodes lookup when status is 'failed'", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "failed", responseCode: 3013, message: "raw message, should be overridden" })
    })
    await expect(Request("key", {}, "/path", {})).rejects.toMatchObject({
      code: 3013,
      type: "api",
      message: "Invalid API key. The provided key is incorrect or inactive."
    })
  })

  it("falls back to the server's own message when responseCode isn't in ErrorCodes", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "failed", responseCode: 9999, message: "some unrecognized error" })
    })
    await expect(Request("key", {}, "/path", {})).rejects.toMatchObject({
      code: 9999,
      type: "api",
      message: "some unrecognized error"
    })
  })

  it("throws a 'network' BohudurError when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("DNS failure")) as unknown as typeof fetch)
    await expect(Request("key", {}, "/path", {})).rejects.toMatchObject({
      code: 0,
      type: "network",
      message: "DNS failure"
    })
  })

  it("throws a timeout-specific 'network' BohudurError on AbortError", async () => {
    const abortError = new Error("aborted")
    abortError.name = "AbortError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch)
    await expect(Request("key", { timeout: 5000 }, "/path", {})).rejects.toMatchObject({
      code: 0,
      type: "network",
      message: "Request timed out after 5000ms"
    })
  })
})
