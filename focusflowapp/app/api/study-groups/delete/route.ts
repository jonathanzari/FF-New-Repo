import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

export async function DELETE(request: NextRequest) {
  try {
    const { groupId, userId } = await request.json();
    
    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Group ID and user ID are required' }, { status: 400 });
    }

    // Get the group document
    const groupRef = doc(db, 'studyGroups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 });
    }

    const groupData = groupDoc.data();
    
    // Check if the user is the host
    if (groupData.hostId !== userId) {
      return NextResponse.json({ error: 'Only the host can delete the group' }, { status: 403 });
    }

    // Delete all chat messages first
    const chatCollectionRef = collection(db, 'studyGroups', groupId, 'chat');
    const chatSnapshot = await getDocs(chatCollectionRef);
    
    const deletePromises = chatSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the group document
    await deleteDoc(groupRef);

    return NextResponse.json({ success: true, message: 'Study group deleted successfully' });
  } catch (error) {
    console.error('Error deleting study group:', error);
    return NextResponse.json({ error: 'Failed to delete study group' }, { status: 500 });
  }
} 
