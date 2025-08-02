"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, Settings, LogIn, User as UserIcon, Timer, BrainCircuit, Handshake} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/*

MainLayout: Simplifies the header button layout and replicates it for each defined page 

*/

interface MainLayoutProps {
  children: React.ReactNode;
  onNavigate: (page: "timer" | "calendar" | "analysis" | "settings" | "profile" | "ai-assistant" | "friends") => void;
  onSignInClick: () => void;
  theme: { primary: string; secondary: string; };
}

export default function MainLayout({ children, onNavigate, onSignInClick, theme }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})`,
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 bg-[#4a9b8e] rounded-2xl flex items-center justify-center shadow-lg">
                <div className="relative w-11 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-r-sm">
                    <div className="absolute left-0 top-0 w-2 h-full bg-orange-600 rounded-l-sm"></div>
                    <div className="absolute left-0.5 top-1 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-2 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-3 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-4 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-5 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-6 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-7 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                    <div className="absolute left-0.5 top-8 w-1 h-0.5 bg-[#4a9b8e] rounded-full"></div>
                </div>

                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-3 border-[#4a9b8e] flex items-center justify-center shadow-sm">
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-[#4a9b8e] rounded-full transform -translate-x-1/2 -translate-y-full origin-bottom rotate-12"></div>
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-1.5 bg-[#4a9b8e] rounded-full transform -translate-x-1/2 -translate-y-full origin-bottom rotate-90"></div>
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#4a9b8e] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">FOCUS FLOW</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate("timer")} variant="secondary" size="sm" className="bg-white text-gray-800 border-0 font-medium">
            <Timer className = "w-4 h-4 mr-1" /> 
           Timer
          </Button>
          <Button onClick={() => onNavigate("calendar")} variant="secondary" size="sm" className="bg-white text-gray-800 border-0 font-medium">
            <Calendar className="w-4 h-4 mr-1" /> 
            <div className = "cursor-pointer">Calendar</div>
          </Button>
          <Button onClick={() => onNavigate("analysis")} variant="secondary" size="sm" className="bg-white text-gray-800 border-0 font-medium">
            <BarChart3 className="w-4 h-4 mr-1" /> 
           Analysis
          </Button>
          <Button onClick={() => onNavigate("settings")} variant="secondary" size="sm" className="bg-white text-gray-800 border-0 font-medium">
            <Settings className="w-4 h-4 mr-1" /> 
           Settings
          </Button>
          <Button onClick={() => onNavigate("ai-assistant")} variant= "secondary" size= "sm" className="bg-white text-gray-800 border-0 font-medium">
            <BrainCircuit className="w-4 h-4 mr-1" /> 
           AI Assistant
          </Button>
          <Button onClick={() => onNavigate("friends")} variant= "secondary" size= "sm" className="bg-white text-gray-800 border-0 font-medium">
            <Handshake className="w-4 h-4 mr-1" /> 
           Friends
          </Button>
          

          {user ? (
              <Button onClick={() => onNavigate("profile")} variant="secondary" size="sm" className="bg-white text-gray-800 border-0 font-medium">
                <UserIcon className="w-4 h-4 mr-1" /> 
               Profile
              </Button>
            
          ) : (
            <Button onClick={onSignInClick} variant="secondary" size="sm" className="bg-white text-gray-800 border-0 font-medium">
              <LogIn className="w-4 h-4 mr-1" /> 
             Sign In
            </Button>
          )}
        </div>
      </div>
      
      <main>
        {children}
      </main>
    </div>
  );
}