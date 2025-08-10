import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Send a message to group chat
export async function POST(request: NextRequest) {
  try {
    const { groupId, senderId, senderName, message, messageType = 'text' } = await request.json();

    if (!groupId || !senderId || !message) {
      return NextResponse.json(
        { error: 'Group ID, sender ID, and message are required' },
        { status: 400 }
      );
    }

    const messageData = {
      senderId,
      senderName,
      message,
      messageType,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'studyGroups', groupId, 'chat'), messageData);

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Get chat messages for a group
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const limitCount = parseInt(searchParams.get('limit') || '50');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const chatQuery = query(
      collection(db, 'studyGroups', groupId, 'chat'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(chatQuery);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // Reverse to get chronological order

    return NextResponse.json({ 
      success: true, 
      messages 
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 
