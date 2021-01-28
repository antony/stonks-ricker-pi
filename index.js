'use strict'

require('dotenv')
const fetch = require('node-fetch')
const { transform } = require('reorient')

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
    await m.reset(i)
  }
  await m.scroll(line, { scrollIn: true, loop: true, speed: 100 })
  await m.resetAll()
}

async function tick () {
  const stonks = await getStonks(list)
  const line = await parseStonks(stonks)
  await showStonks(line)
}

tick()
setInterval(tick, 60 * 1000)