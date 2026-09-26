interface ExecuteOrQuery {
  name: string
  email: string
  amount: number
  convertedAmount: number
  totalAmount: number
  transactionFee: number
  defaultCurrency: string
  paymentCurrency: string
  currencyValue: number
  metadata: Record<string, unknown> | null
  createdAt: Date
  paidAt: Date | null
  paykey: string
  receipt: string | null
  webhook: Record<string, unknown>
  paymentInfo: Record<string, unknown> | null
  status: "PENDING" | "COMPLETED" | "EXECUTED" | "CANCELLED"
}

export interface CreateResponse {
  paykey: string
  paymentURL: string
}

export interface ExecuteResponse extends ExecuteOrQuery {}

export interface QueryResponse extends ExecuteOrQuery {}
