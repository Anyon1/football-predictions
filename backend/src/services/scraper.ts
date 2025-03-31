import axios from 'axios'
import * as cheerio from 'cheerio'
// @ts-ignore
import { PrismaClient, League, Match } from '@prisma/client'

const prisma = new PrismaClient()

interface LeagueData {
  url: string
  name: League
  id: number
}

const leagues: LeagueData[] = [
  {
    url: 'https://fbref.com/en/comps/9/schedule/Premier-League-Scores-and-Fixtures',
    name: League.PREMIER_LEAGUE, // The name of the league is a string
    id: 9,
  },
  {
    url: 'https://fbref.com/en/comps/20/schedule/Premier-League-Scores-and-Fixtures',
    name: League.BUNDESLIGA, // The name of the league is a string
    id: 20,
  },
]

async function scrapeAndStore(league: LeagueData) {
  try {
    const response = await axios.get(league.url)
    const html = response.data
    const $ = cheerio.load(html)
    const matches: Match[] = []
    const rows = $('tr').toArray()

    for (const row of rows) {
      const $row = $(row)

      const dateLink = $row.find('td:nth-child(3) a').text().trim()
      if (!dateLink) {
        console.log('Invalid date', dateLink)
        continue
      }

      const timeElement = $row.find('td[data-stat="start_time"] span.venuetime')
      const time = timeElement.attr('data-venue-time')

      const data = {
        homeTeam: $row.find('td[data-stat="home_team"] a').text().trim(),
        homeXG: $row.find('td[data-stat="home_xg"]').text().trim(),
        score: $row.find('td[data-stat="score"]').text().trim(),
        awayXG: $row.find('td[data-stat="away_xg"]').text().trim(),
        awayTeam: $row.find('td[data-stat="away_team"] a').text().trim(),
      }

      if (!data.homeTeam || !data.awayTeam) {
        continue
      }

      const dateParts = dateLink.split('-').map(Number)
      if (dateParts.length !== 3) continue
      const [year, month, day] = dateParts

      const timeParts = (time || '00:00').split(':').map(Number)
      if (timeParts.length !== 2) continue
      const [hours, minutes] = timeParts

      const matchDate = new Date(Date.UTC(year, month - 1, day, hours, minutes))

      const gameweek = await prisma.gameweek.findFirst({
        where: {
          startDate: { lte: matchDate },
          endDate: { gte: matchDate },
        },
      })

      if (!gameweek) {
        console.log(`No gameweek found for match on ${matchDate}`)
        continue
      }

      const existingMatch = await prisma.match.findFirst({
        where: {
          date: matchDate,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          gameweekId: gameweek.id,
        },
      })

      if (existingMatch) {
        const updatedMatch = await prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            score: data.score || null,
            homeXG: data.homeXG || null,
            awayXG: data.awayXG || null,
            league: league.name, // Using league name directly here as string
          },
        })
        matches.push(updatedMatch)
      } else {
        const createdMatch = await prisma.match.create({
          data: {
            date: matchDate,
            homeTeam: data.homeTeam,
            awayTeam: data.awayTeam,
            score: data.score || null,
            homeXG: data.homeXG || null,
            awayXG: data.awayXG || null,
            gameweekId: gameweek.id,
            status: data.score ? 'COMPLETED' : 'UPCOMING',
            league: league.name, // Using league name directly here as string
          },
        })
        matches.push(createdMatch)
      }
    }

    return matches
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        headers: error.response?.headers,
      })
      throw new Error(`Failed to fetch URL: ${error.message}`)
    }
    console.error('Scraping error:', error)
    throw error
  }
}

async function scrapeAllLeagues() {
  for (const league of leagues) {
    await scrapeAndStore(league)
  }
}

export { scrapeAndStore, scrapeAllLeagues, LeagueData }
