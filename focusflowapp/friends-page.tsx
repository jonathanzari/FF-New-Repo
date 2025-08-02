"use client";

import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext";
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { Badge } from '@/components/ui/badge';



/*

Profile Picture
Major/Topic of Interest
Level of Education & College Institution


Work to be done:
Implement Neo4J in order for "suggested friends" to be implemented (friends of friends are in suggested friends)
Implement search option to look for friends based on username

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

const Avatar = ({ src, alt }: { src: string | null | undefined, alt: string }) => (
    <img
        src={src || '/default-avatar.png'}
        alt={''}
        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
    />
);

export default function FriendsPage(
){
    const {user} = useAuth();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [educationLevel, setEducationLevel] = useState<string>('');
    
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
      }, [user]);

    return(
    
        <div className= "min-h-screen p-6">
            <div className = "max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
                    <p className = "text-white/80">Connect with colleagues and other like-minded people surrounding <br/> your topic of interest, form study groups, and create study sessions! </p>                    
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
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="text-center mb-8 flex flex-col items-center">
                                                    <Avatar src={user?.photoURL} alt={user?.displayName || 'User profile picture'}/>
                                                    <h1 className="text-2xl font-bold text-black mt-2 text-center">{user?.displayName}</h1>
                                                    <Badge className="mt-2">{educationLevel}</Badge>
                                                </div>
                                                <div>
                                                    <h1>Interest(s): </h1>
                                                    <div className="flex justify-center flex-wrap gap-3 mt-2 mb-2">
                                                    {selectedInterests.map(interest => (
                                                    <Badge key={interest} variant="secondary">{interest}</Badge>
                                                    ))}
                                                    </div>
                                                    
                                                </div>
                                            </div>
                                    </CardContent>
                                </Card>
                                <Card className = "bg-white border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className = "text-center">
                                            Suggested Friends
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>

                                    </CardContent>
                                </Card>
                            </div>
                            <Card className = "bg-white border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className = "text-center">
                                            Existing Study Groups
                                        </CardTitle>
    
                                    </CardHeader>
                                    <CardContent>

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
        </div>
    )
}