import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { name, description, isPrivate, hostId, hostName } = await request.json();

    if (!name || !hostId) {
      return NextResponse.json(
        { error: 'Group name and host ID are required' },
        { status: 400 }
      );
    }

    // Generate invite code for private groups
    const inviteCode = isPrivate ? generateInviteCode() : null;

    // Create the study group
    const groupData = {
      name,
      description: description || '',
      isPrivate,
      inviteCode,
      hostId,
      hostName,
      members: [hostId], // Host is automatically a member
      memberCount: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };

    const groupRef = await addDoc(collection(db, 'studyGroups'), groupData);

    // Create the group chat collection
    await setDoc(doc(db, 'studyGroups', groupRef.id, 'chat', 'welcome'), {
      message: `Welcome to ${name}! Start your study session.`,
      senderId: 'system',
      senderName: 'System',
      timestamp: serverTimestamp(),
      type: 'system'
    });

    return NextResponse.json({ 
      success: true, 
      groupId: groupRef.id,
      inviteCode 
    });

  } catch (error) {
    console.error('Error creating study group:', error);
    return NextResponse.json(
      { error: 'Failed to create study group' },
      { status: 500 }
    );
  }
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
} 
