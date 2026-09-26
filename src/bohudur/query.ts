import type { BohudurOptions, QueryRequest, QueryResponse } from "@type/index"
import { Request } from "@bohudur/http"
import { toDate } from "@bohudur/helpers"

const path: string = "/query/v2/"

interface QueryResponseWire {
  full_name: string
  email: string
  amount: number
  converted_amount: number
  total_amount: number
  transaction_fee: number
  default_currency: string
  payment_currency: string
  currency_value: number
  metadata: Record<string, unknown> | unknown[]
  created_time: string
  payment_time: string
  paymentkey: string
  receipt: string
  webhook: Record<string, unknown> | unknown[]
  payment_info: Record<string, unknown> | unknown[]
  status: "PENDING" | "COMPLETED" | "EXECUTED" | "CANCELLED"
}

export default async function query(key: string, options: BohudurOptions, request: QueryRequest): Promise<QueryResponse> {
  const data = await Request<QueryResponseWire>(key, options, path, {
    paymentkey: request.paykey
  })
  return {
    name: data.full_name,
    email: data.email,
    amount: data.amount,
    convertedAmount: data.converted_amount,
    totalAmount: data.total_amount,
    transactionFee: data.transaction_fee,
    defaultCurrency: data.default_currency,
    paymentCurrency: data.payment_currency,
    currencyValue: data.currency_value,
    metadata: Array.isArray(data.metadata) ? null : data.metadata,
    createdAt: toDate(data.created_time) as Date,
    paidAt: toDate(data.payment_time),
    paykey: data.paymentkey,
    receipt: data.receipt === "NONE" ? null : data.receipt,
    webhook: Array.isArray(data.webhook) ? {} : data.webhook,
    paymentInfo: Array.isArray(data.payment_info) ? null : data.payment_info,
    status: data.status
  }
}
