import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId, targetUserId } = await request.json();
  const session = driver.session();
  try {
    const query = `
      MATCH (u1:User {userId: $currentUserId})
      MATCH (u2:User {userId: $targetUserId})
      MERGE (u1)-[:SENT_REQUEST_TO]->(u2)
    `;
    await session.run(query, { currentUserId, targetUserId });
    return NextResponse.json({ success: true, message: 'Friend request sent.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'An error occurred.' }, { status: 500 });
  } finally {
    await session.close();
  }
}