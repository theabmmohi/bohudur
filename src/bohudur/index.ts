import type { BohudurOptions } from "@type/index"

export class Bohudur {
  constructor(
    private readonly key: string,
    private readonly options: BohudurOptions = {}
  ) {}
}
