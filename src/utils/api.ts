import { parseString } from 'xml2js'
import { load as loadCheerio } from 'cheerio'
import type { BenzingaResponse, StockData } from '../types'

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

export async function fetchHistoricalData(symbol: string, startDate: string, endDate: string, frequency: string = '1d'): Promise<StockData[]> {
  const startUnix = Math.floor(new Date(startDate).getTime() / 1000)
  const endUnix = Math.floor(new Date(endDate).getTime() / 1000)

  const url = `https://finance.yahoo.com/quote/${symbol}/history?period1=${startUnix}&period2=${endUnix}&interval=${frequency}&filter=history&frequency=${frequency}`

  const response = await fetch(url)
  if (!response.ok)
    throw new Error('Network response was not ok')

  const html = await response.text()
  const $ = loadCheerio(html)

  if ($('title').text().includes('Symbol Not Found'))
    throw new Error('Requested symbol wasn\'t found')

  const data: StockData[] = []
  $('table > tbody > tr').each((_, elem) => {
    const $elem = $(elem)
    const cols = $elem.find('td')
    if (cols.length > 6) {
      const date = new Date($(cols[0]).text()).getTime() / 1000
      const open = Number.parseFloat($(cols[1]).text().replace(',', ''))
      const high = Number.parseFloat($(cols[2]).text().replace(',', ''))
      const low = Number.parseFloat($(cols[3]).text().replace(',', ''))
      const close = Number.parseFloat($(cols[4]).text().replace(',', ''))
      const adjClose = Number.parseFloat($(cols[5]).text().replace(',', ''))
      const volume = Number.parseInt($(cols[6]).text().replace(',', ''), 10)
      data.push({ date, open, high, low, close, adjClose, volume })
    }
  })

  return data
}
