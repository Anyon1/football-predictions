import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Home' })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
