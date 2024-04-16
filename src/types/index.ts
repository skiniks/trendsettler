export interface DayData {
  t: number // timestamp
  o: number // open price
  h: number // high price
  l: number // low price
  c: number // close price
  v: number // volume
}

export interface BenzingaResponse {
  result: {
    item: {
      title: string
    }[]
  }
}
