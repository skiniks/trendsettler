export interface StockData {
  date: number
  open: number
  high: number
  low: number
  close: number
  adjClose: number
  volume: number
}

export interface BenzingaResponse {
  result: {
    item: {
      title: string
    }[]
  }
}
