// app/api/users/suggested/route.ts
import { NextRequest, NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  const session = driver.session();
  
  try {
    const { currentUserId, currentUsername } = await request.json();

    // Ensure current user exists in Neo4j
    await session.run(
      `MERGE (u:User {userId: $currentUserId}) SET u.username = $currentUsername`,
      { currentUserId, currentUsername }
    );

    // Get suggested users (users who are not friends and not the current user)
    const result = await session.run(
      `MATCH (u:User)
       WHERE u.userId <> $currentUserId
       AND NOT EXISTS((u)-[:IS_FRIENDS_WITH]-(:User {userId: $currentUserId}))
       AND NOT EXISTS((u)-[:SENT_REQUEST]-(:User {userId: $currentUserId}))
       AND NOT EXISTS((:User {userId: $currentUserId})-[:SENT_REQUEST]-(u))
       RETURN DISTINCT u.userId as userId, u.username as username
       LIMIT 10`,
      { currentUserId }
    );

    const suggestedUsers = result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username')
    }));

    return NextResponse.json(suggestedUsers);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return NextResponse.json([]);
  } finally {
    await session.close();
  }
}