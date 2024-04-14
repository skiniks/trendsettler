import { OpenAI } from 'openai'
import { OPENAI_API_KEY } from '../config'

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

export async function analyzeSentiment(title: string): Promise<number> {
  const prompt = `Given the news headline "${title}", rate the sentiment from 1 (very negative) to 10 (very positive). Provide your answer in the format: "Rating: X."`
  try {
    const sentimentAnalysis = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a highly intelligent question answering bot.' },
        { role: 'user', content: prompt },
      ],
    })

    if (sentimentAnalysis.choices?.[0]?.message?.content) {
      const sentimentText = sentimentAnalysis.choices[0].message.content.trim()
      const ratingMatch = sentimentText.match(/Rating:\s*(\d+)/)
      return ratingMatch ? Number.parseInt(ratingMatch[1], 10) : 5
    }
  }
  catch (error) {
    console.error('Error analyzing sentiment:', error)
  }
  return 5
}
