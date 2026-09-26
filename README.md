The first unofficial Node.js SDK (before official 🙂) for the [Bohudur Payment API](https://bohudur.one) — a free payment automation platform supporting bKash, Nagad, Rocket, Upay, mCash, SSLCommerz, Stripe, Binance and more.

Wraps the official [Bohudur REST API](https://docs.bohudur.one/curl/) with a small class-based interface.

## Installation

```bash
npm install bohudur
```

Works with both ESM and CJS:

```ts
// ESM
import Bohudur from "bohudur"
```

```ts
// CJS
const Bohudur = require("bohudur")
```

## Getting an API key

Sign in at [console.bohudur.one](https://console.bohudur.one) with Google and copy your API key from there.

> **Keep your key secret.** Never expose it in frontend JavaScript, mobile app code, or public repos — always call this SDK from your server.

## Quick start

```ts
import Bohudur from "bohudur"

const bohudur = new Bohudur(process.env.BOHUDUR_API_KEY!)
```

Optional second argument for advanced configuration:

```ts
const bohudur = new Bohudur(process.env.BOHUDUR_API_KEY!, {
  baseURL: "https://request.bohudur.one", // override if Bohudur gives you a different endpoint
  timeout: 10000,                          // ms before a request is aborted (default: 10000)
  headers: { "X-Custom-Header": "value" }  // merged into every request
})
```

## API Flow

```
1. bohudur.create()          → get paymentURL + paykey
        ↓
2. Redirect user to paymentURL
        ↓
3. User pays or cancels on the hosted checkout page
        ↓
4. Webhook sent to your server (if configured)
        ↓
5. bohudur.verifyWebhook()   → confirm the real status, don't trust the webhook body
        ↓
6. bohudur.execute()         → finalize, only once verifyWebhook() confirms COMPLETED
        ↓
7. bohudur.query()           → check status anytime
```

## `create(request)`

Creates a new payment session and returns a hosted checkout URL.

```ts
const result = await bohudur.create({
  name: "Jane Doe",
  email: "jane@example.com",
  amount: 10,
  returnType: "GET",
  redirectURL: "https://example.com/redirect/",
  cancelURL: "https://example.com/cancel/",
  metadata: {
    order_id: "ORD-1001",
    user_id: 55
  },
  webhook: {
    success: "https://example.com/webhook/success",
    cancel: "https://example.com/webhook/cancel"
  }
})
```

### Request

| Parameter          | Type   | Required | Maps to (Bohudur API) | Description                                                              |
| ------------------ | ------ | -------- | ----------------------- | -------------------------------------------------------------------------- |
| `name`              | string | YES      | `full_name`               | Customer full name                                                        |
| `email`             | string | YES      | `email`                   | Customer email address                                                    |
| `amount`            | number | YES      | `amount`                  | Payment amount in your account's default currency                        |
| `returnType`        | string | YES      | `return_type`             | How params are returned after payment: `"GET"` or `"POST"`               |
| `redirectURL`       | string | YES      | `redirect_url`            | Redirect URL after successful payment. Use `"default"` for Bohudur's page |
| `cancelURL`         | string | YES      | `cancel_url`              | Redirect URL after cancellation. Use `"default"` for Bohudur's page       |
| `metadata`          | object | NO       | `metadata`                 | Any custom key-value data to attach to this payment                      |
| `webhook.success`   | string | NO       | `webhook.success`          | Your server URL to receive a POST when payment succeeds                  |
| `webhook.cancel`    | string | NO       | `webhook.cancel`           | Your server URL to receive a POST when payment is cancelled              |

### Response

```ts
{
  paykey: "5RWS4w2w1R5nFAvoP5U0JS4O74UrMXGt",
  paymentURL: "https://checkout.bohudur.one/payment/5RWS4w2w1R5nFAvoP5U0JS4O74UrMXGt"
}
```

Redirect your customer to `paymentURL` and store `paykey`.

## `execute(request)`

Finalizes a completed payment. Call this from your server after `query()` (or `verifyWebhook()`) confirms the status is `COMPLETED`.

> A payment can be executed **exactly once**. A second attempt fails with code `3108` — this prevents duplicate charges. Store the execute response immediately after a successful call.

```ts
const result = await bohudur.execute({ paykey: "fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn" })
```

### Response

```ts
{
  name: "Gabriel Adams",
  email: "gabriel@example.com",
  paykey: "fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn",
  amount: 40,
  convertedAmount: 4878,
  totalAmount: 40,
  transactionFee: 0,
  defaultCurrency: "USD",
  paymentCurrency: "BDT",
  currencyValue: 121.951,
  createdAt: Date,       // parsed from created_time
  paidAt: Date | null,   // parsed from payment_time
  receipt: "https://pay.bohudur.one/receipt/download/102f89389f9e",
  metadata: {},
  webhook: {},
  paymentInfo: { m0: "Stripe" }, // gateway used, plus gateway-specific fields
  status: "EXECUTED"
}
```

`createdAt` and `paidAt` are native `Date` objects, not raw strings.

## `query(request)`

Retrieves the full details and current status of any payment. Safe to call at any time, as many times as you like.

```ts
const result = await bohudur.query({ paykey: "fnPwIkdIsMjN4FJxYxw6DF75GuW9qStn" })
```

### Response

Same shape as `execute()` above.

| `status`    | Meaning                                                          |
| ----------- | ----------------------------------------------------------------- |
| `PENDING`   | Session created, customer hasn't paid yet                        |
| `COMPLETED` | Customer has paid — call `execute()` next to finalize             |
| `EXECUTED`  | Payment finalized by your server via `execute()`                  |
| `CANCELLED` | Cancelled by the user or system — cannot be executed              |

## Webhooks

If you configure `webhook.success` / `webhook.cancel` on `create()`, Bohudur `POST`s a small payload to that URL when a payment succeeds or is cancelled:

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "amount": 1,
  "paymentkey": "CrD85r3ibMK6ip38reUcuECvVhaF0xOT",
  "status": "COMPLETED"
}
```

**Webhooks are not final truth.** Bohudur can retry a webhook delivery, and the payload's own `status` field is just what Bohudur is *claiming* — not a guarantee. `verifyWebhook()` re-checks the real status with `query()` before you act on it:

```ts
const result = await bohudur.verifyWebhook(req.body) // req.body typed as WebhookPayload
// result: { paykey: string, status: "COMPLETED" | "CANCELLED" }
```

If the real, freshly-confirmed status is `PENDING` or `EXECUTED` (e.g. a retried webhook arriving after your server already executed the payment), `verifyWebhook()` throws a `BohudurError` with `type: "validation"` instead of returning — a webhook handler only has two outcomes to act on, so those two cases are surfaced as errors rather than squeezed into the return type.

### Express example

```ts
import express from "express"
import Bohudur from "bohudur"
import { BohudurError } from "bohudur/errors"
import type { WebhookPayload } from "bohudur/types"

const app = express()
app.use(express.json())

const bohudur = new Bohudur(process.env.BOHUDUR_API_KEY!)

app.post("/webhook/bohudur", async (req, res) => {
  res.sendStatus(200) // acknowledge immediately — Bohudur retries on anything else

  const payload = req.body as WebhookPayload

  try {
    const result = await bohudur.verifyWebhook(payload)

    if (result.status === "COMPLETED") {
      // trusted — this came from verifyWebhook()'s own query(), not payload.status
      // execute to mark as EXECUTED
      await bohudur.execute({ paykey: result.paykey })
      // deliver the product/service here
    } else {
      // result.status === "CANCELLED"
      // release any reserved stock, mark the order cancelled, etc.
    }
  } catch (error) {
    if (error instanceof BohudurError) {
      console.error(`Webhook verification failed: [${error.code}] ${error.message}`)
    }
  }
})
```

> Always return HTTP 200 from your webhook route immediately, and do any order-fulfillment logic asynchronously afterward — a slow or failing response causes Bohudur to retry.

## Error handling

Every method — `create()`, `execute()`, `query()`, `verifyWebhook()` — throws a `BohudurError` on failure rather than returning a wrapped result:

```ts
import Bohudur from "bohudur"
import { BohudurError } from "bohudur/errors"

try {
  const result = await bohudur.query({ paykey: "..." })
} catch (error) {
  if (error instanceof BohudurError) {
    console.error(error.code)    // e.g. 3052
    console.error(error.type)    // "api" | "network" | "server" | "validation"
    console.error(error.message) // human-readable description
  }
}
```

`error.type` tells you what kind of failure it was:

| `type`         | Meaning                                                                       |
| -------------- | -------------------------------------------------------------------------------- |
| `"api"`        | Bohudur received the request and rejected it — `code` is one of Bohudur's own error codes |
| `"server"`     | Bohudur responded with a non-2xx HTTP status, or an unparseable body            |
| `"network"`    | The request never reached Bohudur — timeout, DNS failure, connection error      |
| `"validation"` | The SDK rejected the request or response locally (e.g. a malformed URL, or `verifyWebhook()` seeing a `PENDING`/`EXECUTED` status) |

## Error codes

For `type: "api"` errors, `code` comes directly from Bohudur's API. Common ones:

| Code   | Meaning                                    |
| ------ | ------------------------------------------- |
| `3000`/`3100`/`3050` | API key missing from the request       |
| `3013`/`3101`/`3103`/`3051`/`3053` | API key invalid or inactive |
| `3102`/`3052` | `paykey` malformed or doesn't exist       |
| `3105`/`3055` | No payment found for that `paykey`        |
| `3106` | Payment still pending — customer hasn't paid  |
| `3107` | Payment was cancelled — cannot be executed   |
| `3108` | Payment already executed                      |
| `3016`/`3104`/`3054` | Request blocked — IP not authorized |

Full list: [Bohudur cURL / REST API reference](https://docs.bohudur.one/curl/).

## Supported gateways

bKash, Nagad, Rocket, Upay, mCash, Bkash Merchant, SSLCommerz, Stripe, Binance.

## Links

- [Bohudur Docs](https://docs.bohudur.one/)
- [Console (get your API key)](https://console.bohudur.one/)
- [Telegram support (Bohudur)](https://t.me/bohudur)
- [Telegram support (Me)](https://t.me/theabmmohi)
