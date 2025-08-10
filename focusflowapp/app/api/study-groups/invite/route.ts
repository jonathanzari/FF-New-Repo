import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { groupId, groupName, inviterId, inviterName, inviteeEmail } = await request.json();

    if (!groupId || !inviterId || !inviteeEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create invitation in Firestore
    const invitationData = {
      groupId,
      groupName,
      inviterId,
      inviterName,
      inviteeEmail,
      status: 'pending', // pending, accepted, declined
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    // Add to invitations collection
    await addDoc(collection(db, 'invitations'), invitationData);

    // Add system message to group chat
    const chatMessage = {
      senderId: 'system',
      senderName: 'System',
      message: `${inviterName} invited ${inviteeEmail} to join the group`,
      messageType: 'system',
      timestamp: new Date()
    };

    await addDoc(collection(db, 'studyGroups', groupId, 'chat'), chatMessage);

    return NextResponse.json({ success: true, message: 'Invitation sent successfully' });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
} 
