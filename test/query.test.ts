import { describe, it, expect, vi } from "vitest"

vi.mock("@bohudur/http", () => ({
  Request: vi.fn()
}))

import { Request } from "@bohudur/http"
import query from "@bohudur/query"

const pendingWire = {
  full_name: "Chloe Morales",
  email: "chloe@gmail.com",
  amount: 1,
  converted_amount: 1,
  total_amount: 1,
  transaction_fee: 0,
  default_currency: "USD",
  payment_currency: "USD",
  currency_value: 1,
  metadata: [] as unknown[],
  created_time: "2026-01-07 10:02:20",
  payment_time: "NONE",
  paymentkey: "7QWQsOhg9X7dgQlfRO4EPxWKK9qaCWka",
  receipt: "NONE",
  webhook: [] as unknown[],
  payment_info: [] as unknown[],
  status: "PENDING" as const
}

describe("query", () => {
  it("sends { paymentkey } built from paykey and hits /query/v2/", async () => {
    vi.mocked(Request).mockResolvedValue(pendingWire)

    await query("test-key", {}, { paykey: "7QWQsOhg9X7dgQlfRO4EPxWKK9qaCWka" })

    expect(Request).toHaveBeenCalledWith("test-key", {}, "/query/v2/", {
      paymentkey: "7QWQsOhg9X7dgQlfRO4EPxWKK9qaCWka"
    })
  })

  it("maps a PENDING response, collapsing NONE and [] correctly", async () => {
    vi.mocked(Request).mockResolvedValue(pendingWire)

    const result = await query("test-key", {}, { paykey: "irrelevant" })

    expect(result.paidAt).toBeNull()
    expect(result.receipt).toBeNull()
    expect(result.metadata).toBeNull()
    expect(result.paymentInfo).toBeNull()
    expect(result.webhook).toEqual({})
    expect(result.status).toBe("PENDING")
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.createdAt.toISOString()).toBe("2026-01-07T04:02:20.000Z")
  })

  it("passes populated object fields (metadata/webhook/payment_info) through unchanged", async () => {
    vi.mocked(Request).mockResolvedValue({
      ...pendingWire,
      payment_time: "2026-01-07 12:00:00",
      receipt: "https://pay.bohudur.one/receipt/download/abc",
      metadata: { order_id: "ORD-1" },
      webhook: { success: "https://example.com/s" },
      payment_info: { m0: "Stripe" },
      status: "COMPLETED"
    })

    const result = await query("test-key", {}, { paykey: "irrelevant" })

    expect(result.paidAt).toBeInstanceOf(Date)
    expect(result.receipt).toBe("https://pay.bohudur.one/receipt/download/abc")
    expect(result.metadata).toEqual({ order_id: "ORD-1" })
    expect(result.webhook).toEqual({ success: "https://example.com/s" })
    expect(result.paymentInfo).toEqual({ m0: "Stripe" })
    expect(result.status).toBe("COMPLETED")
  })
})
