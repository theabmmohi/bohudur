import { describe, it, expect } from "vitest"
import { toDate } from "@bohudur/helpers"

describe("toDate", () => {
  it("returns null for \"NONE\"", () => {
    expect(toDate("NONE")).toBeNull()
  })

  it("returns null for an empty string", () => {
    expect(toDate("")).toBeNull()
  })

  it("parses a Bohudur timestamp as +06:00 and converts to the correct UTC instant", () => {
    const result = toDate("2026-01-04 16:04:35")
    expect(result).toBeInstanceOf(Date)
    expect(result?.toISOString()).toBe("2026-01-04T10:04:35.000Z")
  })
})
