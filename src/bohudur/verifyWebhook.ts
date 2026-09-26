import type { BohudurOptions, WebhookPayload, WebhookResult } from "@type/index"
import { BohudurError } from "@error/index"
import query from "@bohudur/query"

export default async function verifyWebhook(key: string, options: BohudurOptions, payload: WebhookPayload): Promise<WebhookResult> {
  const queryResult = await query(key, options, {
    paykey: payload.paymentkey
  })

  const status = queryResult.status
  if (status === "EXECUTED" || status === "PENDING") throw new BohudurError(`Webhook cannot process status: ${status}`, 0, "validation")

  return {
    paykey: queryResult.paykey,
    status: status
  }
}
