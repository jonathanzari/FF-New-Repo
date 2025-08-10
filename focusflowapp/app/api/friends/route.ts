import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { currentUserId } = await request.json();
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Current user ID is required' }, { status: 400 });
    }

    // Get the current user's document to find their friends
    const userDocRef = doc(db, 'users', currentUserId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const friends = userData.friends || [];

    // Fetch friend details for each friend ID
    const friendsWithDetails = await Promise.all(
      friends.map(async (friendId: string) => {
        const friendDocRef = doc(db, 'users', friendId);
        const friendDoc = await getDoc(friendDocRef);
        
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          return {
            userId: friendId,
            username: friendData.displayName || friendData.email || 'Unknown User',
            photoURL: friendData.photoURL || null
          };
        } else {
          return {
            userId: friendId,
            username: 'Unknown User',
            photoURL: null
          };
        }
      })
    );

    return NextResponse.json(friendsWithDetails);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
} 
