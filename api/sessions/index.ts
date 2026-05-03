import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { method, plannedDuration, actualDuration } = req.body

    if (!method || typeof actualDuration !== 'number') {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    const session = await prisma.session.create({
      data: {
        method,
        plannedDuration: plannedDuration ?? 0,
        actualDuration,
        completedAt: new Date(),
      },
    })

    return res.status(201).json(session)
  } catch (error) {
    console.error('Failed to save session:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
