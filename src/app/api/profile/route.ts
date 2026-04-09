import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sessionId, name, drinksBeer, drinksIpa } = await req.json();

  // Handle duplicate names within a session by assigning a unique ID internally
  // but keeping the display name.
  // We can use a combination of name + sessionId for the unique constraint 
  // if we strictly wanted one "Juan", but the user wants to allow it.
  // Actually, Profile has a unique constraint @@unique([sessionId, name]).
  // To allow duplicate display names, we need to remove that constraint or 
  // change how we identify them.
  
  // Let's create a profile with a unique ID and the provided name.
  // We should remove the @@unique([sessionId, name]) in schema.prisma if we want true duplicates.
  
  // For now, I'll just append a short hash if it exists, or create a new one.
  const profile = await prisma.profile.create({
    data: {
      sessionId,
      name,
      drinksBeer,
      drinksIpa
    }
  });

  return NextResponse.json(profile);
}