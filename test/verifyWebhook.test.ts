import { describe, it, expect, vi } from "vitest"

vi.mock("@bohudur/query", () => ({
  default: vi.fn()
}))

import query from "@bohudur/query"
import verifyWebhook from "@bohudur/verifyWebhook"
import { BohudurError } from "@error/index"

const baseQueryResult = {
  name: "Jane Doe",
  email: "jane@example.com",
  amount: 1,
  convertedAmount: 1,
  totalAmount: 1,
  transactionFee: 0,
  defaultCurrency: "USD",
  paymentCurrency: "USD",
  currencyValue: 1,
  metadata: null,
  createdAt: new Date("2026-01-07T04:02:20.000Z"),
  paidAt: null,
  paykey: "CrD85r3ibMK6ip38reUcuECvVhaF0xOT",
  receipt: null,
  webhook: {},
  paymentInfo: null,
  status: "PENDING" as const
}

const webhookPayload = {
  full_name: "Jane Doe",
  email: "jane@example.com",
  amount: 1,
  paymentkey: "CrD85r3ibMK6ip38reUcuECvVhaF0xOT",
  status: "COMPLETED" as const
}

describe("verifyWebhook", () => {
  it("calls query() with { paykey } built from payload.paymentkey", async () => {
    vi.mocked(query).mockResolvedValue({ ...baseQueryResult, status: "COMPLETED" })

    await verifyWebhook("test-key", {}, webhookPayload)

    expect(query).toHaveBeenCalledWith("test-key", {}, { paykey: "CrD85r3ibMK6ip38reUcuECvVhaF0xOT" })
  })

  it("returns { paykey, status } when the real status is COMPLETED", async () => {
    vi.mocked(query).mockResolvedValue({ ...baseQueryResult, status: "COMPLETED" })

    const result = await verifyWebhook("test-key", {}, webhookPayload)

    expect(result).toEqual({
      paykey: "CrD85r3ibMK6ip38reUcuECvVhaF0xOT",
      status: "COMPLETED"
    })
  })

  it("returns { paykey, status } when the real status is CANCELLED", async () => {
    vi.mocked(query).mockResolvedValue({ ...baseQueryResult, status: "CANCELLED" })

    const result = await verifyWebhook("test-key", {}, { ...webhookPayload, status: "CANCELLED" })

    expect(result).toEqual({
      paykey: "CrD85r3ibMK6ip38reUcuECvVhaF0xOT",
      status: "CANCELLED"
    })
  })

  it("trusts query()'s real status, not the webhook payload's claimed status", async () => {
    // payload claims COMPLETED, but the freshly-queried status says otherwise
    vi.mocked(query).mockResolvedValue({ ...baseQueryResult, status: "CANCELLED" })

    const result = await verifyWebhook("test-key", {}, { ...webhookPayload, status: "COMPLETED" })

    expect(result.status).toBe("CANCELLED")
  })

  it("throws a 'validation' BohudurError when the real status is PENDING", async () => {
    vi.mocked(query).mockResolvedValue({ ...baseQueryResult, status: "PENDING" })

    await expect(verifyWebhook("test-key", {}, webhookPayload)).rejects.toBeInstanceOf(BohudurError)
    await expect(verifyWebhook("test-key", {}, webhookPayload)).rejects.toMatchObject({
      type: "validation"
    })
  })

  it("throws a 'validation' BohudurError when the real status is EXECUTED", async () => {
    vi.mocked(query).mockResolvedValue({ ...baseQueryResult, status: "EXECUTED" })

    await expect(verifyWebhook("test-key", {}, webhookPayload)).rejects.toMatchObject({
      type: "validation"
    })
  })

  it("propagates a BohudurError thrown by query() itself (e.g. invalid paymentkey)", async () => {
    vi.mocked(query).mockRejectedValue(new BohudurError("Invalid Payment Key", 3052, "api"))

    await expect(verifyWebhook("test-key", {}, webhookPayload)).rejects.toMatchObject({
      code: 3052,
      type: "api"
    })
  })
})
