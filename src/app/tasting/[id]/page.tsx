import { prisma } from "../../../lib/prisma";
import { notFound } from "next/navigation";
import TastingClient from "./TastingClient";

export default async function TastingPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { 
      // Allow searching by customCode OR ID
      id: id,
    },
    include: {
      flavor: true,
      variants: true,
      questions: true,
    }
  }) || await prisma.session.findUnique({
    where: { customCode: id },
    include: {
      flavor: true,
      variants: true,
      questions: true,
    }
  });

  if (!session || session.status === "TERMINATED") {
    notFound();
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", minHeight: "100vh", background: "var(--cream)" }}>
      <TastingClient session={session} profile={null} />
    </div>
  );
}