import type { PaymentInfo, PaymentStatus } from "@type/payment"

interface QueryOrExecute {
  paykey: string
  status: PaymentStatus
  name: string
  email: string
  amount: number
  convertedAmount: number | null
  totalAmount: number | null
  createdAt: Date
  paidAt: Date | null
  receipt: string | null
  metadata: Record<string, unknown> | null
  paymentInfo: PaymentInfo
}

export interface CreateResponse {
  paykey: string
  paymentUrl: string
}

export interface ExecuteResponse extends QueryOrExecute {}

export interface QueryResponse extends QueryOrExecute {}
