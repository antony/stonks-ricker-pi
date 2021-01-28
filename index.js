'use strict'

require('dotenv')
const fetch = require('node-fetch')
const { transform } = require('reorient')
const Max7219 = require('max7219-display')

const controllerCount = 4
const display = new Max7219({ device: '/dev/spidev0.0', controllerCount })

const list = [
  { symbol: 'GME' },
  { symbol: 'PLTR' },
  { symbol: 'BB' }
]

const globalPath = 'Global Quote'
const transformer = {
  symbol: j => j[globalPath]['01. symbol'],
  price: j => j[globalPath]['05. price'],
  change: j => j[globalPath]['09. change'],
  percent: j => j[globalPath]['10. change percent'],
  growth: j => j[globalPath]['09. change'] >= 0
}

async function fetchStonk (symbol) {
  const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.API_KEY}`)
  const json = await res.json()
  console.log(json)
  return transform(json, transformer)
}

async function getStonks (list) {
  return Promise.all(list.map(({ symbol }) => fetchStonk(symbol)))
}

async function parseStonks (stonks) {
  return stonks.map(({ symbol, price, change, percent }) => `${symbol} $${price} ${change} (${percent})`).join(' ')
}

async function showStonks (line) {
  for (let i = 0; i < controllerCount; i++) {
    await display.reset(i)
  }
  await display.scroll(line, { scrollIn: true, loop: true, speed: 100 })
  await display.resetAll()
}

async function tick () {
  const stonks = await getStonks(list)
  const line = await parseStonks(stonks)
  await showStonks(line)
}

tick()
setInterval(tick, 60 * 1000)