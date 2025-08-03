// app/api/users/suggested/route.ts
import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j';

export async function POST(request: Request) {
  const { currentUserId } = await request.json();
  if (!currentUserId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  const session = driver.session();
  try {
    // This query finds users (u2) that the current user (u1) is not
    // connected to by any friendship or request relationship.
    const query = `
      MATCH (u1:User {userId: $currentUserId})
      MATCH (u2:User)
      WHERE u1 <> u2 AND NOT (u1)-[]-(u2)
      RETURN u2.userId AS userId, u2.username AS username
      LIMIT 10
    `;
    const result = await session.run(query, { currentUserId });
    const suggestions = result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred.' }, { status: 500 });
  } finally {
    await session.close();
  }
}