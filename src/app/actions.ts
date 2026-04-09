'use server'

import { prisma } from '../lib/prisma'
import { redirect } from 'next/navigation'

export async function createSession(formData: FormData) {
  const flavor = formData.get('flavor') as string
  const benchCodes = formData.get('benchCodes') as string
  
  if (!flavor || !benchCodes) throw new Error("Missing fields")
  
  const formattedBenchCodes = benchCodes.split(',').map((s: string) => s.trim()).filter(Boolean).join(',')
  
  const session = await prisma.session.create({
    data: {
      flavor,
      benchCodes: formattedBenchCodes,
    }
  })
  
  redirect(`/session/${session.id}/share`)
}

export async function joinSession(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  if (!sessionId) throw new Error("Session missing")
  redirect(`/tasting/${sessionId}`)
}

export async function createProfileAndStartTasting(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const name = formData.get('name') as string
  const drinksBeer = formData.get('drinksBeer') === 'on'
  const drinksIpa = formData.get('drinksIpa') === 'on'

  if (!name || !sessionId) throw new Error("Name is required")

  await prisma.profile.upsert({
    where: {
      sessionId_name: {
        sessionId,
        name
      }
    },
    update: {
      drinksBeer,
      drinksIpa
    },
    create: {
      sessionId,
      name,
      drinksBeer,
      drinksIpa
    }
  })

  redirect(`/tasting/${sessionId}/evaluate?taster=${encodeURIComponent(name)}&step=0`)
}

export async function saveEvaluation(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const tasterName = formData.get('tasterName') as string
  const benchCode = formData.get('benchCode') as string
  const aroma = parseInt(formData.get('aroma') as string)
  const flavor = parseInt(formData.get('flavor') as string)
  const bitterness = formData.get('bitterness') as string
  const linger = formData.get('linger') === 'true' || formData.get('linger') === 'on'
  const overall = parseInt(formData.get('overall') as string)
  const wouldBuy = formData.get('wouldBuy') as string
  const drinkAgain = formData.get('drinkAgain') as string
  const oneWord = formData.get('oneWord') as string

  await prisma.evaluation.upsert({
    where: {
      sessionId_tasterName_benchCode: {
        sessionId,
        tasterName,
        benchCode
      }
    },
    update: {
      aroma, flavor, bitterness, linger, overall, wouldBuy, drinkAgain, oneWord
    },
    create: {
      sessionId, tasterName, benchCode, aroma, flavor, bitterness, linger, overall, wouldBuy, drinkAgain, oneWord
    }
  })

  return { success: true }
}

export async function savePreference(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const tasterName = formData.get('tasterName') as string
  const preferredBench = formData.get('preferredBench') as string
  const reason = formData.get('reason') as string

  await prisma.preference.upsert({
    where: {
      sessionId_tasterName: {
        sessionId,
        tasterName
      }
    },
    update: {
      preferredBench, reason
    },
    create: {
      sessionId, tasterName, preferredBench, reason
    }
  })

  redirect(`/tasting/${sessionId}/finish?success=1`)
}


