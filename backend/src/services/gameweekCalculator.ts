import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Gameweek {
  number: number
  startDate: Date
  endDate: Date
}

function gameweekChangeTime(date: Date): void {
  date.setUTCHours(15, 0, 0, 0)
}

function generateGameweeks(): Gameweek[] {
  const gameweeks: Gameweek[] = []

  const weekStartDate = new Date('2024-08-16T15:00:00.000Z')
  const endDate = new Date('2027-12-31T15:00:00.000Z')

  const specialCases: Record<number, { start: string; end: string }> = {
    46: { start: '2025-01-21T15:00:00.000Z', end: '2025-01-24T15:00:00.000Z' },
    47: { start: '2025-01-24T15:00:00.000Z', end: '2025-01-29T15:00:00.000Z' },
    48: { start: '2025-01-29T15:00:00.000Z', end: '2025-01-30T15:00:00.000Z' },
    49: { start: '2025-01-30T15:00:00.000Z', end: '2025-01-31T15:00:00.000Z' },
    50: { start: '2025-01-31T15:00:00.000Z', end: '2025-02-04T15:00:00.000Z' },
  }

  while (weekStartDate < endDate) {
    const currentGameweek = gameweeks.length + 1

    if (specialCases[currentGameweek]) {
      weekStartDate.setTime(
        new Date(specialCases[currentGameweek].start).getTime(),
      )
      const weekEndDate = new Date(specialCases[currentGameweek].end)
      gameweeks.push({
        number: currentGameweek,
        startDate: new Date(weekStartDate),
        endDate: new Date(weekEndDate),
      })
      weekStartDate.setTime(weekEndDate.getTime())
    } else {
      const daysToAdd =
        currentGameweek >= 51
          ? currentGameweek % 2 === 1
            ? 3
            : 4
          : currentGameweek % 2 === 1
            ? 4
            : 3

      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + daysToAdd)
      gameweekChangeTime(weekEndDate)

      gameweeks.push({
        number: currentGameweek,
        startDate: new Date(weekStartDate),
        endDate: new Date(weekEndDate),
      })
      weekStartDate.setTime(weekEndDate.getTime())
    }
  }

  console.log(`Generated ${gameweeks.length} gameweeks`)

  return gameweeks
}

async function storeGameweeksInDatabase() {
  const gameweeks = generateGameweeks()

  for (const gameweek of gameweeks) {
    await prisma.gameweek.upsert({
      where: { number: gameweek.number },
      update: {
        startDate: gameweek.startDate,
        endDate: gameweek.endDate,
      },
      create: {
        number: gameweek.number,
        startDate: gameweek.startDate,
        endDate: gameweek.endDate,
      },
    })
  }
}

export { generateGameweeks, storeGameweeksInDatabase }
