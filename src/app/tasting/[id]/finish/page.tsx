import { redirect } from 'next/navigation'

export default async function FinishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/tasting/${id}`)
}