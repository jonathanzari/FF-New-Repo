"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

/*

Page is done pretty much

*/

interface SignInPageProps {
  onLoginSuccess: () => void;
  onNavigateToForgotPassword: () => void;
}

export default function SignInPage({ 
  onLoginSuccess,
  onNavigateToForgotPassword
 }: SignInPageProps) {
  const [username, setUsername] = useState(''); 
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false); 
  // Set to show the login page initially

 
  const handleSignIn = async () => {
    /*
    Handler function allows for the usage of a username (or email) as a form of signing in
    */
    setError(null);

    // If no login identifier (email/username) or password is presented, then an error is thrown.
    if (!loginIdentifier || !password)
    {
      setError("Please enter your credentials.");
      return;
    }

    //Try & Catch
    try{
      
      //Assumes user gives an email
      let userEmail = loginIdentifier;
      
      //CASE: Where user gives a username (Does not contain any @'s)
      if (!loginIdentifier.includes('@')) {
        //References the collection 
        const userRef = collection(db, "users");

        //Creates a query where the given username is equal to an existing username in the database
        const q = query(userRef, where ("username", "==", loginIdentifier));

        // Waits for query to return
        const querySnapshot = await getDocs(q);

        // If the return query is empty (meaning no account exists with the username given)...
        if (querySnapshot.empty)
        {
          //Error is thrown (no account exists with the given username)
          setError("Invalid username.");
          return;
        }

        //CASE: If the returned query is NOT empty, a unique user was found

        //Extracts the user details (specifically, the email) from the returned query ([0] since there is only one user with that username)
        const userDoc = querySnapshot.docs[0];
        //Sets userEmail var to the extracted email
        userEmail = userDoc.data().email;
      }
      
      //Signs in with the email (either given by user or extracted from DB)
      await signInWithEmailAndPassword(auth, userEmail, password);

      //Log in was successful
      onLoginSuccess();
    }
    catch (err: any) {
      // Could either be an invalid email or password.
      setError("Invalid credentials, please check your details and try again.");
      return;
    }
  };
  

  const handleSignUp = async () => {
    /*
    Handler function for signing up.
    */
    setError(null);

    // Enforcing username length & symbol usage (specifically '@' since the sign in handler relies on username not utilizing @'s)
    if (username.length < 3 )
    {
      setError("Username must be at least 3 characters long.");
      return;
    }
    else if (username.includes('@'))
    {
      setError("Username contains the '@' symbol. Please choose another username.")
      return;
    }

    /*
    References database, checks if the given username is taken, if so, error is thrown.
    */
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty)
    {
      setError("Username is already taken.");
      return;
    }
    else{
      try {
        //Creates account and takes the username thats associate with the user
        const userCredential = await createUserWithEmailAndPassword(auth, loginIdentifier, password);
        const user = userCredential.user;

        //Updates profile 
        await updateProfile(user, {
          displayName: username,
        });

        //Creates document in firestore to store user's uid (from fireAuth), their associated email and username
        await setDoc(doc(db, "users", user.uid), {
          username: username,
          email: user.email,
        });
        
        await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            username: username,
            email: user.email,
          }),
        });
        
        onLoginSuccess();
      }
      catch (err: any) {
        //Specific case of when the email is already being used.
        if (err.code === 'auth/email-already-in-use') {
          setError("This email address is already in use.");
          return;
        } 
        //Any other case...
        else {
          setError("Failed to create an account. Please try again.");
          return;
        }
      }
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#007ba7] to-[#3395b9] p-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          {/* Conditionally showing text of -> if the user is signing up or logging in (log in by default)*/}
          <h1 className="text-3xl font-bold text-white mb-2">{isSigningUp ? 'Create Account' : 'Sign In'}</h1>
          <p className ="text-md font-semibold text-white/60">{isSigningUp? 'Sign up and track your stats, save tasks, make connections, and more!' : 'Welcome back to Focus Flow!'}</p>
        </div>
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="space-y-4 pt-3">
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            
            {/* Conditionally showing the username field (meaning user is signing up) */}
            {isSigningUp && (
              <div>
                <label className="text-md text-gray-600" htmlFor="username">Username</label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}
            
            <div> 

              <label className="text-md text-gray-600" htmlFor="email">{isSigningUp ?  'Email' : 'Username or Email' }</label>
    
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com"
                value={loginIdentifier} 
                onChange={(e) => setLoginIdentifier(e.target.value)} />
            </div>
            <div>
              <label className="text-md text-gray-600" htmlFor="password">Password</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2 pt-2">

              {/* Conditionally showing if the button appears as sign in or sign up */}
              {isSigningUp ? (
                  <Button onClick={handleSignUp}>Sign Up</Button>
              ) : (
                  <Button onClick={handleSignIn}>Sign In</Button>
              )}

              <div className="text-center text-sm text-gray-400">--- OR ---</div>
              <Button onClick={() => setIsSigningUp(!isSigningUp)} variant="link">
                {isSigningUp ? 'Already have an account? Sign In!' : "Don't have an account? Sign Up!"}
              </Button>
            </div>

            {/* Appearing only if the user is logging in */}
            {!isSigningUp && (
              <p className="text-center">
                <span className="text-sm text-gray-600 underline cursor-pointer" onClick={onNavigateToForgotPassword}>
                  Forgot Password?
                </span>
              </p>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}