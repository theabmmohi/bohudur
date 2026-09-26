import type { BohudurOptions } from "@type/index"

export default class Bohudur {
  constructor(
    private readonly key: string,
    private readonly options: BohudurOptions = {}
  ) {}
}
