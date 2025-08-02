"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Upload, Trash2, Shredder, UserPen, Check } from 'lucide-react'; 
import { storage, db, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


/*

Things To Work On:
Erase Account functionality needs to be implemented

Recent Study Groups card needs to display the recent 2-3 study groups the user has joined
(Needs Neo4J implementation first)

*/


const allInterests = [
    "Software Engineering", "Cyber Security", "Data Analysis", "Computer Architecture",
    "Mobile Development", "Backend", "Frontend", "Fullstack", "AI/ML"
];

const educationLevels = [
    "Undergraduate", "Masters Student", "Doctoral Student", "A.S. Graduate", "B.S. Graduate", 
    "M.S. Graduate", "PhD Graduate"
];


const Avatar = ({ src, alt }: { src: string | null | undefined, alt: string }) => (
    <img
        src={src || '/default-avatar.png'}
        alt={''}
        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
    />
);


interface ProfilePageProps {
  onNavigate: (page: "timer") => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, setUser, updateUserEmail } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');


  const [loading, setLoading] = useState(false);

  /*
  Seemingly redundant, might condense to a single error message instead of their individual card sections
  */

  const [errorImg, setErrorImg] = useState<string | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorInterest, setErrorInterest] = useState<string | null>(null);
  const [errorEducation, setErrorEducation] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emailChange, setEmailChange] = useState(false);

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


  const handleInterestChange = (interest: string) => {
    setSelectedInterests(prev => {
      const isSelected = prev.includes(interest);
      if (isSelected) {
        // If it's already selected, unselect it
        return prev.filter(item => item !== interest);
      } else {
        // If it's not selected, add it, but only if less than 3 are already selected
        if (prev.length < 3) {
          return [...prev, interest];
        }
        // If 3 are already selected, do nothing
        return prev;
      }
    });
  };

  const handleUpdateInterests = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        interests: selectedInterests,
        //education: educationLevel
      });
      setSuccess("Interests updated successfully!");
    } catch (error) {
      //console.error("Error updating interests: ", error);
      setErrorInterest("Error updating interests, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowForm = async() => {
    setEmailChange(true);
  };

  const handleCancel = async() =>{
    setEmailChange(false);
    setNewEmail('');
    setCurrentPassword('');
    setErrorEmail(null);
  }

  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }

    if (fileInputRef.current)
    {
        fileInputRef.current.value = "";
    }
    
  };

  const handleUpload = async (file: File) => {
    if (user){
        setLoading(true);
        setErrorImg(null);

        try {
          // 1. Create a storage reference (e.g., profile-pictures/userId.jpg)
          const storageRef = ref(storage, `profile-pictures/${user.uid}`);

          // 2. Upload the file
          const uploadTask = await uploadBytes(storageRef, file);

          // 3. Get the public URL of the uploaded file
          const downloadURL = await getDownloadURL(uploadTask.ref);

          // 4. Update the user's profile in Firebase Auth
          await updateProfile(auth.currentUser!, { photoURL: downloadURL });

          // 5. Update the user's document in Firestore
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { photoURL: downloadURL });

          setUser(prevUser => {
            if (!prevUser) return null;
            return { ...prevUser, photoURL: downloadURL };
          });
        } catch (err) {
          setErrorImg("Failed to upload image. Please try again.");
          //console.error(err);
        } finally {
          setLoading(false);
        }
    }
  };

  const handleRemovePicture = async () => {
    if (!user || !user.photoURL) {
      alert("No profile picture to remove.");
      return;
    }

    setLoading(true);
    setErrorImg(null);
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);

      await deleteObject(storageRef);

      await updateProfile(auth.currentUser!, { photoURL: null });

      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, { photoURL: null });

      setUser(prevUser => {
        if (!prevUser) return null;
            // Create a new object with all previous user properties,
            // but explicitly set photoURL to null.
        return { ...prevUser, photoURL: null };
      });

    } catch (err) {
      setErrorImg("Failed to remove picture. Please try again.");
      //console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate("timer");
  };
  

  /*
  Disabled email enumeration protection to get the error message to work 
  */

  const handleEmailChange = async () => {
    //console.log(`Attempting to update email with:`, {
        //newEmail: newEmail,
        //currentPassword: currentPassword,
    //});

    setSuccess('');
    setErrorEmail('');
    //setLoading(true);
    try {
      //console.log("Entered try-catch")  
      await updateUserEmail(currentPassword, newEmail);
      //console.log("Left updateUserEmail function") 
      
      setSuccess(`Verification link has been sent to ${newEmail}! Please check your email.`);
      setNewEmail('');
      setCurrentPassword('');
      setEmailChange(false); 
      // Hide form on success
    } 
    catch (err: any) {
      //console.error("Firebase Error Details:", err);
      if (err.code === 'auth/invalid-credential') {
        setErrorEmail("Incorrect password. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorEmail("This email is already in use by another account.");
      } else {
        setErrorEmail("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEducation = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        education: educationLevel
      });
      setSuccess("Education updated successfully!");
    } catch (error) {
      //console.error("Error updating profile: ", error);
      setErrorEducation("Error updating education, please try again.");
    } finally {
      setLoading(false);
    }
  };

  /*
  Erase Account handler; not yet implemented...
  */
  const handleEraseAccount = async () => {

  };



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white text-center mb-2">Profile</h1>   
         <p className = "text-white/80 text-center">Edit profile, view recent study groups, and more! </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="text-center flex flex-col items-center">
            <Avatar src={user?.photoURL} alt={user?.displayName || 'User profile picture'} />
            <h1 className="text-3xl font-bold text-white mt-4">{user?.displayName}</h1>
            <p className="text-white/80">{user?.email}</p>
            <Badge key = {educationLevel} variant="default">{educationLevel}</Badge>
            <div className="flex justify-center flex-wrap gap-2 mt-2">
              {selectedInterests.map(interest => (
              <Badge key={interest} variant="secondary">{interest}</Badge>
              ))}
            </div>

            {success && 
        <div>
            <Card className="bg-white border-0 shadow-lg w-62 mx-auto mt-4">
                <CardContent className="text-green-500 text-center text-sm">
                    {success}
                </CardContent>
            </Card>
        </div>
        }

        </div>
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-1" />
              {loading ? "Loading..." : "Change Profile Picture"}
            </Button>
            
            <Button
              onClick={handleRemovePicture}
              disabled={loading || !user?.photoURL}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove Profile Picture
            </Button>

            
            {errorImg && <p className="text-red-500 text-left text-sm">{errorImg}</p>}
          </CardContent>
        </Card>

        <Card className='bg-white border-0 shadow-lg'>
            <CardHeader className="text-center">
                <CardTitle>
                    Account Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleLogout} className="w-full">
                    <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                </Button>

                {emailChange ?
                (
                <div className="space-y-2">

                    <div>
                        <label className="text-sm font-medium" htmlFor="new-email">New Email</label>
                        <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-sm font-medium" htmlFor="current-password">Current Password</label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(p) => setCurrentPassword(p.target.value)} />
                    </div>
                        <Button onClick={handleEmailChange} className = "w-full">Save Changes</Button>
                        <Button onClick={handleCancel} className="w-full" variant = "secondary" >Cancel</Button>
                </div>

                ) : (
                <div>    
                    <Button onClick={handleShowForm} variant = "outline" className="w-full">
                        <UserPen className="w-4 h-4 mr-1" />
                        Change Email
                    </Button>
                </div>
                )}
                <Button onClick= {handleEraseAccount} variant= "destructive" className= "w-full text-white">
                    <Shredder className= "w-4 h-4 mr-1" />
                    Erase Account
                </Button>
                
                {errorEmail && <p className="text-red-500 text-left text-sm">{errorEmail}</p>}

            </CardContent>
        </Card>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className = "text-center">
                    Select Your Interests (Up To 3)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allInterests.map(interest => (
                      <div key={interest} className="flex items-center gap-2">
                        <Checkbox
                          id={interest}
                          checked={selectedInterests.includes(interest)}
                          onCheckedChange={() => handleInterestChange(interest)}
                          disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 3}
                        />
                        <label htmlFor={interest} className="text-sm font-medium">
                          {interest}
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleUpdateInterests} disabled={loading} className="w-full mt-4">
                    <Check className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Interests"}
                  </Button>
                  {errorInterest && <p className="text-red-500 text-left text-sm">{errorInterest}</p>}
                </CardContent>
              </Card>
              <div className="grid grid-rows-1 lg:grid-rows-2 gap-6">
                <Card className="bg-white border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center">
                            Select Level of Education
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="flex items-center justify-between gap-4">
                            
                                <label className="text-sm font-medium">Education Level</label>
                                    <Select
                                    value={educationLevel}
                                    onValueChange={setEducationLevel}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your education level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {educationLevels.map(level => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                </Select>
                        
                            
                                <Button onClick={handleUpdateEducation} disabled={loading}>
                                    <Check className="w-4 h-4 mr-2" />
                                    {loading ? "Saving..." : "Save Education"}
                                </Button>

                                {errorEducation && <p className="text-red-500 text-left text-sm">{errorEducation}</p>}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center">
                            Recent Study Groups
                        </CardTitle>
                    </CardHeader>
                </Card>
              </div>
        </div>
    </div>
  );
}