import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId, currentUsername, requestUserId } = await request.json();
  
  if (!currentUserId || !requestUserId) {
    return NextResponse.json({ success: false, message: 'User IDs are required.' }, { status: 400 });
  }

  const session = driver.session();
  
  try {
    // First, ensure both users exist in Neo4j with usernames
    const createUsersQuery = `
      MERGE (u1:User {userId: $currentUserId})
      MERGE (u2:User {userId: $requestUserId})
      SET u1.username = $currentUsername
      RETURN u1, u2
    `;
    await session.run(createUsersQuery, { currentUserId, currentUsername, requestUserId });

    // Accept the friend request and create friendship
    const query = `
      MATCH (requester:User {userId: $requestUserId})-[r:SENT_REQUEST_TO]->(currentUser:User {userId: $currentUserId})
      DELETE r
      MERGE (currentUser)-[:IS_FRIENDS_WITH]->(requester)
      MERGE (requester)-[:IS_FRIENDS_WITH]->(currentUser)
    `;
    
    await session.run(query, { currentUserId, requestUserId });
    
    return NextResponse.json({ success: true, message: 'Friend request accepted.' });
  } catch (error) {
    console.error('Neo4j accept friend request error:', error);
    return NextResponse.json({ success: false, message: 'Failed to accept friend request.' }, { status: 500 });
  } finally {
    await session.close();
  }
}