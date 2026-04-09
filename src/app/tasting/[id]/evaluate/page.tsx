import { redirect } from 'next/navigation'

export default async function EvaluatePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ taster?: string }> }) {
  const { id } = await params
  redirect(`/tasting/${id}`)
}