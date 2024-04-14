import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import chalk from 'chalk'
import { handleCli } from './cli/handler'

async function main() {
  const rl = createInterface({ input, output })
  console.log(chalk.yellow.bold('trendsettler Stock Analysis Tool'))
  await handleCli(rl)
  rl.close()
}

main()
