import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import AdminSessionClient from "./AdminSessionClient";

export default async function AdminSessionPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      flavor: true,
      variants: true,
      questions: true,
      profiles: {
        include: {
          responses: true
        }
      },
      responses: true
    }
  });

  if (!session) {
    notFound();
  }

  return <AdminSessionClient session={session} />;
}