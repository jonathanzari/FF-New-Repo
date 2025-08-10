import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId, userName, inviteCode } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'Group ID and user ID are required' },
        { status: 400 }
      );
    }

    // Get the study group
    const groupRef = doc(db, 'studyGroups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      );
    }

    const groupData = groupDoc.data();

    // Check if group is private and invite code is required
    if (groupData.isPrivate && groupData.inviteCode !== inviteCode) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    if (groupData.members.includes(userId)) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Add user to the group
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
      memberCount: increment(1),
      updatedAt: new Date()
    });

    // Add welcome message to chat
    const chatRef = doc(db, 'studyGroups', groupId, 'chat', Date.now().toString());
    await setDoc(chatRef, {
      message: `${userName} joined the study group!`,
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(),
      type: 'system'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully joined study group' 
    });

  } catch (error) {
    console.error('Error joining study group:', error);
    return NextResponse.json(
      { error: 'Failed to join study group' },
      { status: 500 }
    );
  }
} 
