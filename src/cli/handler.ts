import type { Interface as ReadLineInterface } from 'node:readline/promises'
import chalk from 'chalk'
import { analyzeSentiment } from '../services/sentiment'
import { fetchHistoricalData, fetchRealTimeData, fetchXMLData } from '../utils/api'
import { calculateEMA, decideAction, determineTrend } from '../core/analysis'
import { BENZINGA_API_KEY } from '../config'

export async function handleCli(rl: ReadLineInterface) {
  try {
    const symbol = await rl.question(chalk.green('Enter the stock symbol: '))
    const purchasePriceInput = await rl.question(chalk.green(`Enter purchase price for ${symbol}: `))
    const purchasePrice = Number.parseFloat(purchasePriceInput)
    if (Number.isNaN(purchasePrice))
      throw new Error('Invalid input for purchase price')

    const realTimePriceData = await fetchRealTimeData(symbol)
    const currentPrice = realTimePriceData.price

    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    const startDateFormatted = startDate.toISOString().slice(0, 10)
    const endDate = new Date().toISOString().slice(0, 10)

    const historicalPricesData = await fetchHistoricalData(symbol, startDateFormatted, endDate)
    const historicalPrices = historicalPricesData.map((day: { close: number }) => day.close)

    const shortTermEMA = calculateEMA(historicalPrices, 50)
    const longTermEMA = calculateEMA(historicalPrices, 200)
    const trend = determineTrend(shortTermEMA, longTermEMA)

    console.log(chalk.magenta(`Current ${symbol} Price: $${currentPrice.toFixed(2)}`))
    console.log(chalk.blue(`Short-term EMA (50-day): ${shortTermEMA[shortTermEMA.length - 1].toFixed(2)}`))
    console.log(chalk.blue(`Long-term EMA (200-day): ${longTermEMA[longTermEMA.length - 1].toFixed(2)}`))
    console.log(chalk.blue(`Market Trend: ${trend}`))

    const url = `https://api.benzinga.com/api/v2/news?tickers=${symbol}&pageSize=20&token=${BENZINGA_API_KEY}`
    const jsonData = await fetchXMLData(url)
    console.log(chalk.blue('='.repeat(50)))
    console.log('News Headlines and Ratings:')
    const ratings = await Promise.all(jsonData.result.item.map((article: { title: string }) => analyzeSentiment(article.title)))
    ratings.forEach((rating: number, index: number) => {
      const title = jsonData.result.item[index].title
      if (rating > 6)
        console.log(`- ${chalk.green(title)} [Rating: ${rating}]`)
      else if (rating < 4)
        console.log(`- ${chalk.red(title)} [Rating: ${rating}]`)
      else
        console.log(`- ${chalk.yellow(title)} [Rating: ${rating}]`)
    })

    const averageRating = ratings.reduce((acc: number, val: number) => acc + val, 0) / ratings.length
    const overallSentiment = averageRating >= 6 ? 'Positive' : averageRating <= 4 ? 'Negative' : 'Neutral'
    console.log(chalk.blue('='.repeat(50)))
    console.log(`Overall News Sentiment: ${overallSentiment} (Average Rating: ${averageRating.toFixed(2)})`)

    const decision = decideAction(purchasePrice, currentPrice, averageRating, trend)
    console.log(chalk.blue('='.repeat(50)))
    console.log(chalk.green(decision))
  }
  catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`))
  }
}
