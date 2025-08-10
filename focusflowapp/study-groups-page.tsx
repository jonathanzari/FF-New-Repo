"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { type AppSettings } from './settings-page';
import { 
  Users, 
  Plus, 
  Lock, 
  Globe, 
  MessageCircle, 
  Clock, 
  UserPlus, 
  Trash2,
  FileText,
  Volume2
} from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  inviteCode?: string;
  hostId: string;
  hostName: string;
  members: string[];
  memberCount: number;
  createdAt: any;
  updatedAt?: any;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'file' | 'system';
  timestamp: any;
}

interface StudyGroupsPageProps {
  settings?: AppSettings;
  currentTheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export default function StudyGroupsPage({ settings, currentTheme }: StudyGroupsPageProps) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<StudyGroup | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [joinCode, setJoinCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Load user's study groups
  useEffect(() => {
    if (!user) return;

    const groupsQuery = query(
      collection(db, 'studyGroups'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudyGroup[];
      // Sort by updatedAt in JavaScript instead of Firestore
      groupsData.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      setGroups(groupsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Load chat messages when group is selected
  useEffect(() => {
    if (!selectedGroup) return;

    const messagesQuery = query(
      collection(db, 'studyGroups', selectedGroup.id, 'chat')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      // Sort by timestamp in JavaScript instead of Firestore
      messagesData.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0);
        const bTime = b.timestamp?.toDate?.() || new Date(0);
        return aTime.getTime() - bTime.getTime();
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedGroup]);

  const createGroup = async () => {
    if (!user || !newGroup.name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/study-groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newGroup,
          hostId: user.uid,
          hostName: user.displayName || user.email
        })
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewGroup({ name: '', description: '', isPrivate: false });
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!user || !joinCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/study-groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: joinCode,
          userId: user.uid,
          userName: user.displayName || user.email,
          inviteCode: joinCode
        })
      });

      if (response.ok) {
        setIsJoinDialogOpen(false);
        setJoinCode('');
      }
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedGroup || !newMessage.trim()) return;

    try {
      await fetch('/api/study-groups/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          senderId: user.uid,
          senderName: user.displayName || user.email,
          message: newMessage.trim()
        })
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/study-groups/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: groupId,
          userId: user.uid
        })
      });

      if (response.ok) {
        // Group will be automatically removed from the list due to real-time updates
        console.log('Group deleted successfully');
      } else {
        console.error('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const isHost = (group: StudyGroup) => group.hostId === user?.uid;

  const inviteToGroup = async () => {
    if (!user || !selectedGroupForInvite || !inviteEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/study-groups/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupForInvite.id,
          groupName: selectedGroupForInvite.name,
          inviterId: user.uid,
          inviterName: user.displayName || user.email,
          inviteeEmail: inviteEmail.trim()
        })
      });

      if (response.ok) {
        setIsInviteDialogOpen(false);
        setInviteEmail('');
        setSelectedGroupForInvite(null);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Study Groups</h1>
          <p className="text-blue-100 mb-6">Create and join study groups to collaborate with friends, share resources, and study together in real-time!</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline" className="bg-white text-gray-800 border-gray-300 hover:bg-gray-50">
              <UserPlus className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Study Groups Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Study Groups</h2>
          
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven't joined any study groups yet.</p>
              <p className="text-sm text-gray-400">Create a new group or join an existing one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsGroupChatOpen(true);
                      }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {group.isPrivate ? <Lock className="w-4 h-4 text-orange-500" /> : <Globe className="w-4 h-4 text-blue-500" />}
                        {group.name}
                      </CardTitle>
                      {isHost(group) && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Host</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{group.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.memberCount} members
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {group.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                      {isHost(group) && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-300 text-green-600 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroupForInvite(group);
                              setIsInviteDialogOpen(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGroup(group.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name..."
                />
              </div>
              <div>
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Enter group description..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-private"
                  checked={newGroup.isPrivate}
                  onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                />
                <Label htmlFor="is-private">Private Group (Requires invite code)</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={createGroup} disabled={loading || !newGroup.name.trim()} className="flex-1">
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Group Dialog */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join Study Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="join-code">Group ID or Invite Code</Label>
                <Input
                  id="join-code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter group ID or invite code..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={joinGroup} disabled={loading || !joinCode.trim()} className="flex-1">
                  {loading ? 'Joining...' : 'Join Group'}
                </Button>
                <Button onClick={() => setIsJoinDialogOpen(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Group Chat Dialog */}
        <Dialog open={isGroupChatOpen} onOpenChange={setIsGroupChatOpen}>
          <DialogContent className="sm:max-w-4xl h-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {selectedGroup?.name} - Study Chat
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-full">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.senderId === user?.uid 
                        ? 'bg-blue-500 text-white' 
                        : message.senderId === 'system'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-white text-gray-900 border'
                    }`}>
                      {message.senderId !== 'system' && (
                        <div className="text-xs opacity-75 mb-1">{message.senderName}</div>
                      )}
                      <div>{message.message}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite to Group Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite to Study Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Friend's Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter friend's email address..."
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Inviting to: <strong>{selectedGroupForInvite?.name}</strong></p>
                <p className="mt-1">Your friend will receive an invitation to join this study group.</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={inviteToGroup} disabled={loading || !inviteEmail.trim()} className="flex-1">
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button onClick={() => {
                  setIsInviteDialogOpen(false);
                  setInviteEmail('');
                  setSelectedGroupForInvite(null);
                }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 
