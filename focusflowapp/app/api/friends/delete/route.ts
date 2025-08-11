import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId, friendUserId } = await request.json();
  
  if (!currentUserId || !friendUserId) {
    return NextResponse.json({ success: false, message: 'User IDs are required.' }, { status: 400 });
  }

  const session = driver.session();
  try {
    // Delete the friendship relationship in both directions
    const query = `
      MATCH (currentUser:User {userId: $currentUserId})-[r1:IS_FRIENDS_WITH]-(friend:User {userId: $friendUserId})
      DELETE r1
      WITH currentUser, friend
      MATCH (friend)-[r2:IS_FRIENDS_WITH]->(currentUser)
      DELETE r2
      RETURN currentUser, friend
    `;
    
    await session.run(query, { currentUserId, friendUserId });
    
    return NextResponse.json({ success: true, message: 'Friend removed successfully.' });
  } catch (error) {
    console.error('Neo4j delete friend error:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove friend.' }, { status: 500 });
  } finally {
    await session.close();
  }
} 