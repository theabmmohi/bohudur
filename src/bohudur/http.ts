import { BohudurError, ErrorCodes } from "@error/index"
import type { BohudurOptions } from "@type/index"

const DEFAULT_BASEURL = "https://request.bohudur.one"
const DEFAULT_TIMEOUT = 10000

export async function request<T>(key: string, options: BohudurOptions, path: string, body: unknown): Promise<T> {
  const baseURL = options.baseURL ?? DEFAULT_BASEURL
  const timeout = options.timeout ?? DEFAULT_TIMEOUT

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${baseURL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AH-BOHUDUR-API-KEY": key,
        ...options.headers
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    if (!response.ok) throw new BohudurError(`Bohudur: Server error (HTTP ${response.status}).`, response.status, "server")

    let data: any
    try {
      data = await response.json()
    } catch {
      throw new BohudurError("Bohudur: Failed to parse server response as JSON.", response.status, "server")
    }

    if (data.status === "failed") throw new BohudurError(ErrorCodes[data.responseCode] ?? data.message ?? "Bohudur: Server responsed with failed status.", data.responseCode, "api")
    return data as T
  } catch (error) {
    throw error
  } finally {
    clearTimeout(timer)
  }
}
