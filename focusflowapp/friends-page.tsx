"use client";

import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext";
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, User, Users, Lock, Globe, UserMinus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserProfileViewer from "@/app/UserProfileViewer";




/*

Profile Picture
Major/Topic of Interest
Level of Education & College Institution


Work to be done:
> Implement Neo4J in order for "suggested friends" to be implemented (friends of friends are in suggested friends)

> Implement search option to look for friends based on username

> Implement "sent friend requests" and "pending friend requests" (already displayed under profile picture, where you can accept or decline requests)
(You can also remove a friend, which will remove the connection between you and the other user)
(You can withdraw a sent friend request, which will remove the "sent_request" connection between you and the other user)
(You can decline a friend request, places user back in suggested)
(You can accept a friend request which will be automatically refreshed and be shown in friends section)



Study Groups (What is needed and its function)
> You can join a public study group if one of its members is a connection

> Can set a study group to "private" and only accessible if a user has a code 
(or invited by a host, only one host per study group, when host leaves group, the study group is disbanded)
(As a host, you can kick other users out)

>> If a study group is public but user is not a connection to anyone...
you can request to join by either sending a connection request to one of its members or request to join group

>>> When joined, should be a chat-box where all members can send messages, present files (to all members), ...
(Possible pomodor timer too for all users ? -> Only host can set a pomodoro timer -> Will be a button to enable or disable pomodoro timer)
(Any user can present a file (only pdf) )

(Should just be a popup, not a separate page, "Friends Page" darked with the below being displayed)

(Host enables Pomodoro Timer)
_______________ ______________ _______________
|  Chat Box   | |   Present  | | Pomodoro    |
| ...         | |    Files   | |   Timer     |
|             | |     Here   | |             |
| ...         | |            | |             |
|             | |            | |             |
|             | |            | |             |
|_____________| |____________| |_____________|
// Settings for host can be here 
// including the disable pomodoro timer 
// and leave button (for all users)


(Not enabled)

____________________ ______________________       
|  Chat Box        | |   Present          |              
| ...              | |    Files           | 
|                  | |     Here           | 
| ...              | |                    | 
|                  | |                    | 
|                  | |                    |
|__________________| |____________________| 
// Settings for host can be here 
// including the enable pomodoro timer 
// and leave button (for all users)


*/

interface Friend {
    userId: string;
    username: string;
    photoURL?: string;
}

const Avatar = ({ src, alt }: { src: string | null | undefined, alt: string }) => {

  const imageSrc = src || '/default-avatar.png'; 

  return (
    <img
        src={imageSrc}
        alt={alt}
        className="w-20 h-20 rounded-full object-cover"
    />
  );
};

interface SuggestedUser {
  userId: string;
  username: string;
}

interface FriendRequest {
  userId: string;
  username: string;
}

interface AuthUser {
    uid: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
}



export default function FriendsPage(
){
    const { user } = useAuth() as { user: AuthUser | null };
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [educationLevel, setEducationLevel] = useState<string>('');
    const [suggestedUsers, setSuggestedUsers] =  useState<SuggestedUser[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);

    const [friends, setFriends] = useState<Friend[]>([]);
    const [studyGroups, setStudyGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

      useEffect(() => {
        const fetchUserData = async () => {
          if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setSelectedInterests(data.interests || []);
              setEducationLevel(data.education || '');
            }
          }
        };
        fetchUserData();

        setLoading(true);
        const fetchSuggestedUsers = async () => {
          if (!user) return;
          try {
            const response = await fetch('/api/users/suggested', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                currentUserId: user.uid,
                currentUsername: user.displayName || 'Unknown User'
              }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // Filter out any duplicate users by userId to prevent React key conflicts
            const uniqueUsers = data.filter((user: any, index: number, self: any[]) => 
              index === self.findIndex((u: any) => u.userId === user.userId)
            );
            setSuggestedUsers(uniqueUsers);
          } catch (error) {
            console.error("Failed to display suggestions:", error);
            // Set empty array to prevent UI issues
            setSuggestedUsers([]);
          } finally {
            setLoading(false);
          }
        };
        fetchSuggestedUsers();

        const fetchFriendRequests = async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/friends/pending-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                currentUserId: user.uid,
                currentUsername: user.displayName || 'Unknown User'
              }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // Filter out any duplicate users by userId to prevent React key conflicts
            const uniqueRequests = data.filter((user: any, index: number, self: any[]) => 
              index === self.findIndex((u: any) => u.userId === user.userId)
            );
            setRequests(uniqueRequests);
        } catch (error) {
            console.error("Failed to fetch friend requests:", error);
            // Set empty array to prevent UI issues
            setRequests([]);
        }
        };
        fetchFriendRequests();

        const fetchFriends = async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  currentUserId: user.uid,
                  currentUsername: user.displayName || 'Unknown User'
                }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // Filter out any duplicate users by userId to prevent React key conflicts
            const uniqueFriends = data.filter((user: any, index: number, self: any[]) => 
              index === self.findIndex((u: any) => u.userId === user.userId)
            );
            setFriends(uniqueFriends);
        } catch (error) {
            console.error("Failed to fetch friends:", error);
            // Set empty array to prevent UI issues
            setFriends([]);
        }
        };
        fetchFriends();

        // Load user's study groups
        const groupsQuery = query(
          collection(db, 'studyGroups'),
          where('members', 'array-contains', user?.uid)
        );

        const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
          const groupsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          // Sort by updatedAt in JavaScript instead of Firestore
          groupsData.sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.() || new Date(0);
            const bTime = b.updatedAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });
          setStudyGroups(groupsData);
        });

        return () => unsubscribe();

      }, [user]);



    const handleSendRequest = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.uid,
          targetUserId: targetUserId,
          targetUsername: targetUsername,
        }),
      });

      setSuggestedUsers(prev => prev.filter(u => u.userId !== targetUserId));
        } catch (error) {
        console.error("Failed to send friend request:", error);
        }
    };

    const handleAcceptRequest = async (requestUserId: string) => {
    if (!user) return;
    try {   
        await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.uid,
          currentUsername: user.displayName || 'Unknown User',
          requestUserId: requestUserId,
        }),
      });
      setRequests(prev => prev.filter(req => req.userId !== requestUserId));
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleDeleteFriend = async (friendUserId: string) => {
    if (!user) return;
    try {
      await fetch('/api/friends/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.uid,
          friendUserId: friendUserId,
        }),
      });
      
      // Remove the friend from the local state
      setFriends(prev => prev.filter(friend => friend.userId !== friendUserId));
    } catch (error) {
      console.error("Failed to delete friend:", error);
    }
  };

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
  };

    return(
    
        <div className= "min-h-screen p-6">
            <div className = "max-w-4xl mx-auto space-y-6">
                                 <div className="text-center mb-8">
                     <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
                     <p className = "text-white/80">Connect with colleagues and other like-minded people surrounding <br/> your topics of interest! </p>                    
                 </div>
                    {user ? (
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                                <Card className = "bg-white border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className = "text-center ">
                                            Visible Profile
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Card className= "bg-white shadow-lg mb-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="text-center mb-8 flex flex-col items-center">
                                                    <Avatar src={user?.photoURL} alt={user?.displayName || 'User profile picture'}/>
                                                    <h1 className="text-2xl font-bold text-black mt-2 text-center">{user?.displayName}</h1>
                                                    <Badge className="mt-2">{educationLevel}</Badge>
                                                </div>
                                                <div>
                                                    <CardTitle className="mb-4">Interest(s): </CardTitle>
                                                    <div className="flex justify-center flex-wrap gap-3 mt-2 mb-2">
                                                    {selectedInterests.map(interest => (
                                                    <Badge key={interest} variant="secondary">{interest}</Badge>
                                                    ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                            <CardTitle className="text-center">
                                                    Pending Friend Requests
                                            </CardTitle>

                                            {requests.length === 0 ? (
                                            <p className="text-sm text-center text-gray-500 mt-4">No new requests.</p>
                                            ) : (
                                            <div className="space-y-4 overflow-y-auto h-60">
                                            {requests.map((request) => (
                                            <div 
                                            key={`request-${request.userId}`} 
                                            className="flex items-center justify-between mt-4"
                                            >
                                                    <span
                                                    className="p-2 rounded-lg hover:bg-gray-100"
                                                    onClick={() => handleViewProfile(request.userId)}  
                                                    >{request.username}</span>
                                                    <Button size="sm" onClick={() => handleAcceptRequest(request.userId)}>
                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                        Accept
                                                    </Button>
                                                </div>
                                            ))}
                                            </div>
                                            )}


                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 gap-2">           
                                    <Card className = "bg-white border-0 shadow-lg">

                                        <CardHeader>
                                            <CardTitle className = "text-center">
                                                Suggested Friends
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent>
                                          <div className="space-y-4 overflow-y-auto h-50 mb-2">
                                            {loading && <p className="text-center text-gray-500">Loading suggestions...</p>}
                                            {suggestedUsers.map((suggestedUser) => (
                                              <div 
                                              key={`suggested-${suggestedUser.userId}`} 
                                              className="flex items-center justify-between"
                                              >
                                                <span 
                                                className="p-2 rounded-lg hover:bg-gray-100"
                                                onClick={() => handleViewProfile(suggestedUser.userId)}
                                                >{suggestedUser.username}</span>
                                                <Button size="sm" onClick={() => handleSendRequest(suggestedUser.userId, suggestedUser.username)}>
                                                   <UserPlus className="w-4 h-4 mr-2" />
                                                   Add Friend
                                                 </Button>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          
                                          <CardTitle className="text-center mb-4">Friends</CardTitle>

                                          <div className="space-y-4 overflow-y-auto h-65 mb-2">
                                          {friends.map((friend) => (
                                            <div 
                                            key={`friend-${friend.userId}`} 
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 overflow-y-auto"
                                            onClick={() => handleViewProfile(friend.userId)}
                                            >
                                              <div className="flex items-center gap-4">
                                                <Avatar src={friend.photoURL} alt={friend.username} />
                                                <span className="font-medium">{friend.username}</span>
                                              </div>
                                              <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleDeleteFriend(friend.userId)}
                                                className="text-red-600 border-red-300 hover:bg-red-50"
                                              >
                                                <UserMinus className="w-4 h-4 mr-2" />
                                                Remove
                                              </Button>
                                            </div>
                                              ))}
                                          </div>
                                          
                                        </CardContent>
                                    </Card>

                                </div>
                            </div>
                            <Card className = "bg-white border-0 shadow-lg">
                                     <CardHeader>
                                         <CardTitle className = "text-center">
                                             Existing Study Groups
                                         </CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                       {studyGroups.length === 0 ? (
                                         <div className="text-center py-4">
                                           <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                           <p className="text-gray-500 text-sm">No study groups yet</p>
                                         </div>
                                       ) : (
                                         <div className="space-y-3">
                                           {studyGroups.map((group) => (
                                             <div key={group.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                               <div className="flex items-center gap-2">
                                                 {group.isPrivate ? (
                                                   <Lock className="w-4 h-4 text-orange-500" />
                                                 ) : (
                                                   <Globe className="w-4 h-4 text-blue-500" />
                                                 )}
                                                 <div>
                                                   <p className="font-medium text-sm">{group.name}</p>
                                                   <p className="text-xs text-gray-500">{group.memberCount} members</p>
                                                 </div>
                                               </div>
                                               <Badge variant="secondary" className="text-xs">
                                                 {group.hostId === user?.uid ? 'Host' : 'Member'}
                                               </Badge>
                                             </div>
                                           ))}
                                         </div>
                                       )}
                                     </CardContent>
                            </Card>

                             
                        </div>
                    ) : (
                        <div>
                            <Card className = "w-66 mx-auto bg-white border-0 shadow-lg">
                                <CardContent>
                                    <CardTitle>
                                    Log in to join the community!
                                    </CardTitle>
                                </CardContent>
                            </Card>
                        </div>
                    )}
            </div>

              <Dialog open={!!viewingUserId} onOpenChange={(isOpen) => !isOpen && setViewingUserId(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>User Profile</DialogTitle>
                  </DialogHeader>
                  {viewingUserId && <UserProfileViewer userId={viewingUserId} />}
                </DialogContent>
              </Dialog>

        </div>
    )
}
