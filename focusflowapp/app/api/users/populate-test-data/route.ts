import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const session = driver.session();
  try {
    // Create some test users
    const testUsers = [
      { userId: 'user1', username: 'Alice Johnson' },
      { userId: 'user2', username: 'Bob Smith' },
      { userId: 'user3', username: 'Carol Davis' },
      { userId: 'user4', username: 'David Wilson' },
      { userId: 'user5', username: 'Eva Brown' }
    ];

    // Create users in Neo4j
    for (const user of testUsers) {
      await session.run(`
        MERGE (u:User {userId: $userId})
        SET u.username = $username
        RETURN u
      `, user);
    }

    // Create some friendship relationships
    const friendships = [
      { user1: 'user1', user2: 'user2' },
      { user1: 'user1', user3: 'user3' },
      { user1: 'user2', user2: 'user4' },
      { user1: 'user3', user2: 'user5' }
    ];

    for (const friendship of friendships) {
      await session.run(`
        MATCH (u1:User {userId: $user1})
        MATCH (u2:User {userId: $user2})
        MERGE (u1)-[:IS_FRIENDS_WITH]->(u2)
        MERGE (u2)-[:IS_FRIENDS_WITH]->(u1)
      `, friendship);
    }

    // Create some friend requests
    const requests = [
      { from: 'user4', to: 'user1' },
      { from: 'user5', to: 'user2' }
    ];

    for (const request of requests) {
      await session.run(`
        MATCH (from:User {userId: $from})
        MATCH (to:User {userId: $to})
        MERGE (from)-[:SENT_REQUEST_TO]->(to)
      `, request);
    }

    await session.close();

    return NextResponse.json({ 
      status: 'success', 
      message: 'Test data populated successfully',
      users: testUsers.length,
      friendships: friendships.length,
      requests: requests.length
    });
  } catch (error) {
    console.error('Error populating test data:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to populate test data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 