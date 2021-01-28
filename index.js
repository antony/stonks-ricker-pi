'use strict'

require('dotenv').config()
const fetch = require('node-fetch')
const { transform } = require('reorient')
const Max7219 = require('max7219-display')

const local = process.env.LOCAL_DEV
const controllerCount = 4
const display = !local &&new Max7219({ device: '/dev/spidev0.0', controllerCount })

const list = [
  { symbol: 'GME' },
  { symbol: 'PLTR' },
  { symbol: 'BB' }
]

const globalPath = 'Global Quote'
const transformer = {
  symbol: j => j[globalPath]['01. symbol'],
  price: j => round(j[globalPath]['05. price']),
  change: j => round(j[globalPath]['09. change']),
  percent: j => round(j[globalPath]['10. change percent'].slice(0, -1)) + '%',
  growth: j => j[globalPath]['09. change'] >= 0
}

function round (num) {
  return Math.round(parseFloat(num) * 100) / 100
}

async function fetchStonk (symbol) {
  const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.API_KEY}`)
  const json = await res.json()
  return transform(json, transformer)
}

async function getStonks (list) {
  return Promise.all(list.map(({ symbol }) => fetchStonk(symbol)))
}

async function parseStonks (stonks) {
  return stonks.map(({ symbol, price, change, percent, growth }) => {
    const direction = growth ? '+' : ''
    return `${symbol} $${price} ${direction}${change} (${direction}${percent})`
  }).join(' ')
}

async function showStonks (line) {
  for (let i = 0; i < controllerCount; i++) {
    await display.reset(i)
  }
  await display.scroll(line, { scrollIn: true, loop: true, speed: 200 })
  await display.resetAll()
}

async function tick () {
  const stonks = await getStonks(list)
  const line = await parseStonks(stonks)
  local && console.log(line)
  !local && await showStonks(line)
}

tick()
setInterval(tick, 60 * 1000)