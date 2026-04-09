'use server'

import { prisma } from '../lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// --- ADMIN AUTH ---
export async function loginAdmin(formData: FormData) {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD || 'catalupulus'
  
  if (password === adminPassword) {
    const cs = await cookies()
    cs.set('admin_auth', 'true', { 
      httpOnly: true, 
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    redirect('/admin')
  }
  redirect('/admin?error=1')
}

export async function logoutAdmin() {
  const cs = await cookies()
  cs.delete('admin_auth')
  redirect('/')
}

// --- FLAVOR & SESSION MANAGEMENT ---
export async function createSession(formData: FormData) {
  const flavorName = formData.get('flavorName') as string
  const customCode = (formData.get('customCode') as string) || null
  const variantsInput = formData.get('variants') as string

  if (!flavorName || !variantsInput) throw new Error('Faltan campos obligatorios')

  let flavor = await prisma.flavor.findUnique({ where: { name: flavorName } })
  if (!flavor) {
    flavor = await prisma.flavor.create({ data: { name: flavorName } })
  }

  const variantCodes = variantsInput.split(',').map((v: string) => v.trim()).filter(Boolean)

  const session = await prisma.session.create({
    data: {
      flavorId: flavor.id,
      customCode: customCode || null,
      status: 'ACTIVE',
      variants: {
        create: variantCodes.map((code: string) => ({ code }))
      }
    }
  })

  // Create Standard Questions
  const standardQuestions = [
    { text: 'Aroma', type: 'STAR', scope: 'VARIANT', order: 1 },
    { text: 'Sabor', type: 'STAR', scope: 'VARIANT', order: 2 },
    { text: 'Amargor - es agradable o te molesta?', type: 'OPTION', options: 'Agradable,Me molesta,No lo siento', scope: 'VARIANT', order: 3 },
    { text: 'Sientes que algo queda en boca despues de tomar?', type: 'OPTION', options: 'Si,No', scope: 'VARIANT', order: 4 },
    { text: 'Puntaje General', type: 'STAR', scope: 'VARIANT', order: 5 },
    { text: 'Lo comprarias?', type: 'OPTION', options: 'Si,No,Tal vez', scope: 'VARIANT', order: 6 },
    { text: 'Lo volverias a tomar?', type: 'OPTION', options: 'Si,No,Tal vez', scope: 'VARIANT', order: 7 },
    { text: 'Una palabra o frase - a que te recuerda?', type: 'TEXT', scope: 'VARIANT', order: 8 },
    { text: 'Cual variante preferiste?', type: 'OPTION', options: variantCodes.join(','), scope: 'GLOBAL', order: 9 },
    { text: 'Por que?', type: 'TEXT', scope: 'GLOBAL', order: 10 }
  ]

  for (const q of standardQuestions) {
    await prisma.question.create({
      data: {
        sessionId: session.id,
        text: q.text,
        type: q.type as any,
        scope: q.scope as any,
        options: q.options || null,
        order: q.order
      }
    })
  }

  redirect(`/admin/session/${session.id}`)
}

export async function updateSessionStatus(sessionId: string, status: 'ACTIVE' | 'PAUSED' | 'TERMINATED') {
  await prisma.session.update({
    where: { id: sessionId },
    data: { status }
  })
}

// --- TASTER ACTIONS ---
export async function createProfile(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const name = formData.get('name') as string
  const drinksBeer = formData.get('drinksBeer') === 'on' || formData.get('drinksBeer') === 'true'
  const drinksIpa = formData.get('drinksIpa') === 'on' || formData.get('drinksIpa') === 'true'

  const profile = await prisma.profile.create({
    data: { sessionId, name, drinksBeer, drinksIpa }
  })

  redirect(`/tasting/${sessionId}/evaluate?profileId=${profile.id}`)
}

// Bulk submit all responses at end of session
export async function submitAllResponses(payload: {
  sessionId: string
  profileId: string
  responses: { questionId: string; variantId: string | null; value: string }[]
}) {
  const { sessionId, profileId, responses } = payload

  for (const resp of responses) {
    const { questionId, variantId, value } = resp

    const existing = await prisma.response.findFirst({
      where: { profileId, questionId, variantId }
    })

    if (existing) {
      await prisma.response.update({
        where: { id: existing.id },
        data: { value: String(value) }
      })
    } else {
      await prisma.response.create({
        data: { sessionId, profileId, questionId, variantId, value: String(value) }
      })
    }
  }

  return { success: true }
}