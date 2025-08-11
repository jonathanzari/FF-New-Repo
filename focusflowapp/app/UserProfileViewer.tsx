"use client";

import { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";

interface UserProfile {
  username: string;
  photoURL?: string;
  education?: string;
  interests?: string[];
}

const Avatar = ({ src, alt }: { src: string | null | undefined, alt: string }) => (
    <img
        src={src || '/default-avatar.png'}
        alt={alt}
        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto"
    />
);

export default function UserProfileViewer({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]); 

  if (loading) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center p-8">User profile not found.</div>;
  }

  return (
    <Card className="border-0">
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <Avatar src={profile.photoURL} alt={profile.username} />
        <h2 className="text-2xl font-bold mt-4">{profile.username}</h2>
        {profile.education && <Badge className="mt-2">{profile.education}</Badge>}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {profile.interests?.map(interest => (
            <Badge key={interest} variant="secondary">{interest}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}