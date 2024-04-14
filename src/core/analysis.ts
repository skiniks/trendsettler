export function calculateEMA(data: number[], windowSize: number): number[] {
  const ema: number[] = Array.from<number>({ length: data.length }).fill(0)
  const k = 2 / (windowSize + 1)

  if (data.length > 0) {
    ema[0] = data[0]

    for (let i = 1; i < data.length; i++) ema[i] = data[i] * k + ema[i - 1] * (1 - k)
  }

  return ema
}

export function decideAction(purchasePrice: number, currentPrice: number, sentiment: number, trend: string): string {
  const profitOrLoss = ((currentPrice - purchasePrice) / purchasePrice) * 100
  let decision = `Hold. Your profit/loss would be ${profitOrLoss.toFixed(2)}%.`

  const isSignificantUptrend = trend === 'Significantly Uptrend'
  const isSignificantDowntrend = trend === 'Significantly Downtrend'

  if (sentiment >= 6 && profitOrLoss > 20 && !isSignificantUptrend) {
    decision = `Consider selling to take profit. Sentiment is positive, and your profit is substantial at ${profitOrLoss.toFixed(
      2,
    )}%. The market might correct itself after such a rally unless it's a significant uptrend.`
  }
  else if (sentiment < 4 && profitOrLoss > 0) {
    decision = `Consider selling to secure profits. Sentiment is negative, and you currently have a profit of ${profitOrLoss.toFixed(2)}%. This might be prudent if not in a significant downtrend.`
  }

  if (sentiment >= 7 && (trend === 'Uptrend' || isSignificantUptrend) && profitOrLoss < 10)
    decision = `Strong Buy. Market sentiment is very positive, and the (significant) uptrend suggests a good entry point for growth. Your current profit/loss is at ${profitOrLoss.toFixed(2)}%.`
  else if (sentiment >= 5 && (trend === 'Uptrend' || isSignificantUptrend))
    decision = `Consider buying more. Positive sentiment and an (significant) uptrend suggest potential for growth. Your current profit/loss is at ${profitOrLoss.toFixed(2)}%.`
  else if (sentiment >= 6 && profitOrLoss <= 20)
    decision = `Hold or consider buying more. Sentiment is positive, and there might be more room for growth, especially in an uptrend. Your current profit/loss is at ${profitOrLoss.toFixed(2)}%.`
  else if (sentiment < 4 && profitOrLoss <= 0)
    decision = `Hold. Sentiment is negative, and selling now would realize a loss. Your current profit/loss is at ${profitOrLoss.toFixed(2)}%.`

  if (isSignificantUptrend)
    decision += ` The market indicates a significant uptrend, suggesting a strong potential for further gains. A long position is highly recommended if sentiment aligns.`
  else if (isSignificantDowntrend)
    decision += ` The market indicates a significant downtrend, suggesting a strong potential for further losses. A short position might be considered if sentiment aligns.`
  else if (trend === 'Uptrend')
    decision += ` Market trend indicates an uptrend, suggesting potential for further gains. Consider maintaining a long position if sentiment aligns.`
  else if (trend === 'Downtrend')
    decision += ` Market trend indicates a downtrend, suggesting potential for further losses. Consider a short position if sentiment aligns.`

  return decision
}
