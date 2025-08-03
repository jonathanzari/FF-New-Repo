import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId } = await request.json();

  if (!currentUserId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }
  
  const session = driver.session();
  try {
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

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred.' }, { status: 500 });
  } finally {
    await session.close();
  }
}