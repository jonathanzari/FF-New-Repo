import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId, requestUserId } = await request.json();
  const session = driver.session();
  
  try {
    const query = `
      MATCH (requester:User {userId: $requestUserId})-[r:SENT_REQUEST_TO]->(currentUser:User {userId: $currentUserId})
      DELETE r
      MERGE (currentUser)-[:IS_FRIENDS_WITH]->(requester)
      MERGE (requester)-[:IS_FRIENDS_WITH]->(currentUser)
    `;
    
    await session.run(query, { currentUserId, requestUserId });
    
    return NextResponse.json({ success: true, message: 'Friend request accepted.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'An error occurred.' }, { status: 500 });
  } finally {
    await session.close();
  }
}