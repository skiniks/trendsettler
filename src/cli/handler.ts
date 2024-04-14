import type readline from 'node:readline/promises'
import chalk from 'chalk'
import { analyzeSentiment } from '../services/sentiment'
import { fetchHistoricalData, fetchXMLData } from '../utils/api'
import { calculateEMA, decideAction } from '../core/analysis'
import { BENZINGA_API_KEY } from '../config'

export async function handleCli(rl: readline.Interface) {
  try {
    const symbol = await rl.question(chalk.green('Enter the stock symbol: '))
    const purchasePriceInput = await rl.question(chalk.green(`Enter purchase price for ${symbol}: `))
    const purchasePrice = Number.parseFloat(purchasePriceInput)
    if (Number.isNaN(purchasePrice))
      throw new Error('Invalid input for purchase price')

    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    const startDateFormatted = startDate.toISOString().slice(0, 10)
    const endDate = new Date().toISOString().slice(0, 10)

    const historicalPricesData = await fetchHistoricalData(symbol, startDateFormatted, endDate)
    const historicalPrices = historicalPricesData.map(day => day.close)
    const currentPrice = historicalPrices[historicalPrices.length - 1]

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
    const ratings = await Promise.all(jsonData.result.item.map(article => analyzeSentiment(article.title)))
    ratings.forEach((rating, index) => {
      const title = jsonData.result.item[index].title
      if (rating > 6)
        console.log(`- ${chalk.green(title)} [Rating: ${rating}]`)

      else if (rating < 4)
        console.log(`- ${chalk.red(title)} [Rating: ${rating}]`)

      else
        console.log(`- ${chalk.yellow(title)} [Rating: ${rating}]`)
    })

    const averageRating = ratings.reduce((acc, val) => acc + val, 0) / ratings.length
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

function determineTrend(shortTermEMA: number[], longTermEMA: number[]): string {
  const lastShortTermEMA = shortTermEMA[shortTermEMA.length - 1]
  const lastLongTermEMA = longTermEMA[longTermEMA.length - 1]
  const isSignificantlyUptrending = lastShortTermEMA > lastLongTermEMA * 1.05
  const isSignificantlyDowntrending = lastShortTermEMA < lastLongTermEMA * 0.95

  if (isSignificantlyUptrending)
    return 'Significantly Uptrend'
  if (isSignificantlyDowntrending)
    return 'Significantly Downtrend'
  return lastShortTermEMA > lastLongTermEMA ? 'Uptrend' : 'Downtrend'
}
