
import { NextResponse } from 'next/server';
import driver from '@/lib/neo4j'; 

export async function POST(request: Request) {
  const { userId, username, email } = await request.json();

  if (!userId || !username || !email) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields.' },
      { status: 400 }
    );
  }

  const session = driver.session();
  
  try {
    const query = `
      MERGE (u:User {userId: $userId})
      ON CREATE SET u.username = $username, u.email = $email, u.createdAt = timestamp()
      RETURN u
    `;
    await session.run(query, { userId, username, email });
    
    return NextResponse.json(
      { success: true, message: 'User created in Neo4j.' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the user.' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}