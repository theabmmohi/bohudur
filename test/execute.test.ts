import { describe, it, expect, vi } from "vitest"

vi.mock("@bohudur/http", () => ({
  Request: vi.fn()
}))

import { Request } from "@bohudur/http"
import execute from "@bohudur/execute"

const executedWire = {
  full_name: "Gabriel Adams",
  email: "gabriel@gmail.com",
  amount: 40,
  converted_amount: 4878,
  total_amount: 40,
  transaction_fee: 0,
  default_currency: "USD",
  payment_currency: "BDT",
  currency_value: 121.951,
  metadata: [] as unknown[],
  created_time: "2026-01-04 16:04:35",
  payment_time: "2026-01-04 16:12:37",
  paymentkey: "fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn",
  receipt: "https://pay.bohudur.one/receipt/download/102f89389f9e",
  webhook: [] as unknown[],
  payment_info: { m0: "Stripe", status: "succeeded", tran_id: "pi_demo_payment_intent" },
  status: "EXECUTED" as const
}

describe("execute", () => {
  it("sends { paymentkey } built from paykey and hits /execute/v2/", async () => {
    vi.mocked(Request).mockResolvedValue(executedWire)

    await execute("test-key", {}, { paykey: "fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn" })

    expect(Request).toHaveBeenCalledWith("test-key", {}, "/execute/v2/", {
      paymentkey: "fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn"
    })
  })

  it("maps an EXECUTED response, including a populated payment_info", async () => {
    vi.mocked(Request).mockResolvedValue(executedWire)

    const result = await execute("test-key", {}, { paykey: "irrelevant" })

    expect(result.status).toBe("EXECUTED")
    expect(result.paykey).toBe("fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn")
    expect(result.receipt).toBe("https://pay.bohudur.one/receipt/download/102f89389f9e")
    expect(result.webhook).toEqual({})
    expect(result.metadata).toBeNull()
    expect(result.paymentInfo).toEqual({ m0: "Stripe", status: "succeeded", tran_id: "pi_demo_payment_intent" })
    expect(result.createdAt.toISOString()).toBe("2026-01-04T10:04:35.000Z")
    expect(result.paidAt?.toISOString()).toBe("2026-01-04T10:12:37.000Z")
  })
})
