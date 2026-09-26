export interface WebhookPayload {
  full_name: string
  email: string
  amount: number
  paymentkey: string
  status: "COMPLETED" | "CANCELLED"
}

export interface WebhookResult {
  paykey: string
  status: "COMPLETED" | "CANCELLED"
}
