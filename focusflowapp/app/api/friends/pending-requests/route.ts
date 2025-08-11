import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId, currentUsername } = await request.json();
  
  if (!currentUserId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  const session = driver.session();
  try {
    // First, ensure the current user exists in Neo4j with their username
    const checkUserQuery = `
      MERGE (u:User {userId: $currentUserId})
      SET u.username = $currentUsername
      RETURN u
    `;
    await session.run(checkUserQuery, { currentUserId, currentUsername });

    // This query finds users (requester) who sent a request to the current user.
    const query = `
      MATCH (requester:User)-[:SENT_REQUEST_TO]->(currentUser:User {userId: $currentUserId})
      RETURN requester.userId AS userId, requester.username AS username
    `;
    const result = await session.run(query, { currentUserId });
    const requests = result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
    }));

    console.log(`Found ${requests.length} pending requests for ${currentUserId}`);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Neo4j connection error:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([]);
  } finally {
    await session.close();
  }
}