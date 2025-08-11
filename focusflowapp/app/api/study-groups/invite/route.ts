import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, arrayUnion, getDoc, increment, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { groupId, groupName, inviterId, inviterName, inviteeEmail } = await request.json();

    if (!groupId || !inviterId || !inviteeEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the study group to check if it exists and get current members
    const groupRef = doc(db, 'studyGroups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 });
    }

    const groupData = groupDoc.data();
    
    // Find the user by email to get their UID
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', inviteeEmail)
    );
    
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      return NextResponse.json({ 
        error: 'User with this email address not found. They need to sign up first.' 
      }, { status: 404 });
    }
    
    const userDoc = userSnapshot.docs[0];
    const inviteeUserId = userDoc.id;
    const inviteeUserData = userDoc.data();
    const inviteeDisplayName = inviteeUserData.displayName || inviteeEmail;
    
    // Check if the invited user is already a member
    if (groupData.members && groupData.members.includes(inviteeUserId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'User is already a member of this group' 
      });
    }

    // Add the invited user directly to the group using their UID
    await updateDoc(groupRef, {
      members: arrayUnion(inviteeUserId),
      memberCount: increment(1),
      updatedAt: new Date()
    });

    // Add system message to group chat
    const chatMessage = {
      senderId: 'system',
      senderName: 'System',
      message: `${inviterName} invited ${inviteeDisplayName} to join the group`,
      messageType: 'system',
      timestamp: new Date()
    };

    await addDoc(collection(db, 'studyGroups', groupId, 'chat'), chatMessage);

    // Add welcome message for the new member
    const welcomeMessage = {
      senderId: 'system',
      senderName: 'System',
      message: `${inviteeDisplayName} joined the study group!`,
      messageType: 'system',
      timestamp: new Date()
    };

    await addDoc(collection(db, 'studyGroups', groupId, 'chat'), welcomeMessage);

    return NextResponse.json({ 
      success: true, 
      message: `${inviteeDisplayName} successfully added to the study group` 
    });

  } catch (error) {
    console.error('Error adding user to group:', error);
    return NextResponse.json({ error: 'Failed to add user to group' }, { status: 500 });
  }
} 
