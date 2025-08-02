"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; 
import { useAuth } from "@/contexts/AuthContext";

/*

Page is pretty much done

*/

interface ForgotPasswordPageProps {
  onNavigateToSignIn: () => void;
}

export default function forgotPasswordPage({ 
    onNavigateToSignIn
 }: ForgotPasswordPageProps) {
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleResetPassword = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setError('Failed to send reset email. Please check if the email address is correct.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#007ba7] to-[#3395b9] p-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password ?</h1>
        </div>
        <Card className="bg-white border-0 shadow-lg">
          <CardContent className="space-y-4 pt-6">
            {message && <p className="text-green-600 text-center text-sm">{message}</p>}
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            
            {!message && (
              <>
                <p className="text-sm text-center text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
                <div>
                  <label className="text-md text-gray-600" htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleResetPassword} 
                  disabled={loading}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </>
            )}
            <Button onClick={onNavigateToSignIn} variant="link" className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}