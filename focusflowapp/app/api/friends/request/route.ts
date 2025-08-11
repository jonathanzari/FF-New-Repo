import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId, targetUserId, targetUsername } = await request.json();
  
  if (!currentUserId || !targetUserId) {
    return NextResponse.json({ success: false, message: 'User IDs are required.' }, { status: 400 });
  }

  const session = driver.session();
  try {
    // First, ensure both users exist in Neo4j with usernames
    const createUsersQuery = `
      MERGE (u1:User {userId: $currentUserId})
      MERGE (u2:User {userId: $targetUserId})
      SET u2.username = $targetUsername
      RETURN u1, u2
    `;
    await session.run(createUsersQuery, { currentUserId, targetUserId, targetUsername });

    // Create the friend request relationship
    const query = `
      MATCH (u1:User {userId: $currentUserId})
      MATCH (u2:User {userId: $targetUserId})
      MERGE (u1)-[:SENT_REQUEST_TO]->(u2)
    `;
    await session.run(query, { currentUserId, targetUserId });
    return NextResponse.json({ success: true, message: 'Friend request sent.' });
  } catch (error) {
    console.error('Neo4j friend request error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send friend request.' }, { status: 500 });
  } finally {
    await session.close();
  }
}