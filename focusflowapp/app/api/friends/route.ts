import { NextRequest, NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    const { currentUserId, currentUsername } = await request.json();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Current user ID is required' }, { status: 400 });
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

      // Find all friends of the current user
      const query = `
        MATCH (currentUser:User {userId: $currentUserId})-[:IS_FRIENDS_WITH]-(friend:User)
        RETURN DISTINCT friend.userId AS userId, friend.username AS username
      `;
      
      const result = await session.run(query, { currentUserId });
      const friends = result.records.map(record => ({
        userId: record.get('userId'),
        username: record.get('username') || 'Unknown User',
        photoURL: null // Neo4j doesn't store photo URLs, so we'll use null for now
      }));

      console.log(`Found ${friends.length} friends for user ${currentUserId}`);
      return NextResponse.json(friends);
    } catch (error) {
      console.error('Neo4j friends error:', error);
      return NextResponse.json([]);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
} 
