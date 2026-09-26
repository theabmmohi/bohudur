import { describe, it, expect, vi } from "vitest"

vi.mock("@bohudur/http", () => ({
  Request: vi.fn()
}))

import { Request } from "@bohudur/http"
import create from "@bohudur/create"

const validRequest = {
  name: "Jane Doe",
  email: "jane@example.com",
  amount: 10,
  returnType: "GET" as const,
  redirectURL: "default",
  cancelURL: "default"
}

describe("create", () => {
  it("maps CreateRequest fields to the wire's snake_case body and hits /create/v2/", async () => {
    vi.mocked(Request).mockResolvedValue({
      paymentkey: "abc123",
      payment_url: "https://checkout.bohudur.one/payment/abc123"
    })

    await create("test-key", {}, validRequest)

    expect(Request).toHaveBeenCalledWith("test-key", {}, "/create/v2/", {
      full_name: "Jane Doe",
      email: "jane@example.com",
      amount: 10,
      return_type: "GET",
      redirect_url: "default",
      cancel_url: "default",
      metadata: undefined,
      webhook: undefined
    })
  })

  it("passes metadata and webhook through untouched when provided", async () => {
    vi.mocked(Request).mockResolvedValue({
      paymentkey: "abc123",
      payment_url: "https://checkout.bohudur.one/payment/abc123"
    })

    await create("test-key", {}, {
      ...validRequest,
      metadata: { order_id: "ORD-1001" },
      webhook: { success: "https://example.com/success" }
    })

    expect(Request).toHaveBeenCalledWith("test-key", {}, "/create/v2/", expect.objectContaining({
      metadata: { order_id: "ORD-1001" },
      webhook: { success: "https://example.com/success" }
    }))
  })

  it("maps the wire response back to CreateResponse", async () => {
    vi.mocked(Request).mockResolvedValue({
      paymentkey: "abc123",
      payment_url: "https://checkout.bohudur.one/payment/abc123"
    })

    const result = await create("test-key", {}, validRequest)

    expect(result).toEqual({
      paykey: "abc123",
      paymentURL: "https://checkout.bohudur.one/payment/abc123"
    })
  })
})
