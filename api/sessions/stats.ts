import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const todaySessions = await prisma.session.findMany({
      where: { completedAt: { gte: todayStart } },
    })

    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.actualDuration, 0)

    const weekSessions = await prisma.session.findMany({
      where: { completedAt: { gte: sevenDaysAgo } },
      orderBy: { completedAt: 'asc' },
    })

    const chartMap = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      chartMap.set(d.toISOString().split('T')[0], 0)
    }
    for (const s of weekSessions) {
      const key = s.completedAt.toISOString().split('T')[0]
      if (chartMap.has(key)) {
        chartMap.set(key, (chartMap.get(key) || 0) + s.actualDuration)
      }
    }
    const sevenDayChart = Array.from(chartMap.entries()).map(([date, minutes]) => ({
      date,
      minutes,
    }))

    const allDays = await prisma.session.findMany({
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    })

    let streak = 0
    const seen = new Set<string>()
    for (const s of allDays) {
      seen.add(s.completedAt.toISOString().split('T')[0])
    }

    const checkDate = new Date(todayStart)
    while (true) {
      const key = checkDate.toISOString().split('T')[0]
      if (seen.has(key)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return res.status(200).json({
      todaySessions: todaySessions.length,
      todayMinutes,
      sevenDayChart,
      streak,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
