import { parseString } from 'xml2js'
import { POLYGON_API_KEY } from '../config'
import type { BenzingaResponse, DayData } from '../types'

export async function fetchXMLData(url: string): Promise<BenzingaResponse> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error('Failed to fetch XML data')
  const xmlData = await response.text()
  return new Promise((resolve, reject) => {
    parseString(xmlData, (err, result) => {
      if (err)
        reject(err)
      resolve(result as BenzingaResponse)
    })
  })
}

export async function fetchHistoricalData(symbol: string, startDate: string, endDate: string, frequency: string = 'day') {
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/${frequency}/${startDate}/${endDate}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`
  const response = await fetch(url)
  if (!response.ok)
    throw new Error('Failed to fetch historical data')
  const data = await response.json()
  return data.results.map((day: DayData) => ({
    date: day.t,
    open: day.o,
    high: day.h,
    low: day.l,
    close: day.c,
    volume: day.v,
  }))
}

export async function fetchRealTimeData(symbol: string) {
  const url = `https://api.polygon.io/v1/last/stocks/${symbol}?apiKey=${POLYGON_API_KEY}`
  const response = await fetch(url)
  if (!response.ok)
    throw new Error('Failed to fetch real time data')
  const data = await response.json()
  return {
    price: data.last.price,
  }
}
