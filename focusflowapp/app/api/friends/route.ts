import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId } = await request.json();

  if (!currentUserId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  const session = driver.session();
  try {
    const query = `
      MATCH (currentUser:User {userId: $currentUserId})-[:IS_FRIENDS_WITH]->(friend:User)
      RETURN friend.userId AS userId, friend.username AS username, friend.photoURL AS photoURL
    `;
    const result = await session.run(query, { currentUserId });
    
    const friends = result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
      photoURL: record.get('photoURL'),
    }));

    return NextResponse.json(friends);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred fetching friends.' }, { status: 500 });
  } finally {
    await session.close();
  }
}