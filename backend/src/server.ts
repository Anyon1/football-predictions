import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { storeGameweeksInDatabase } from './services/gameweekCalculator'
import { scrapeAllLeagues } from './services/scraper'

dotenv.config()

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/generateGameweeks', (req, res) => {
  res.json(storeGameweeksInDatabase())
})

app.get('/scrape', (req, res) => {
  res.json(scrapeAllLeagues())
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
