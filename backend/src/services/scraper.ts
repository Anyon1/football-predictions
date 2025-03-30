import axios from 'axios'
import * as cheerio from 'cheerio'
import { Prisma, PrismaClient, Match } from '@prisma/client'

const prisma = new PrismaClient()

const URL =
  'https://fbref.com/en/comps/9/schedule/Premier-League-Scores-and-Fixtures'
