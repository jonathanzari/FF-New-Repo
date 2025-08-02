"use client";

import { useState } from "react";
import MainLayout from "@/app/MainLayout";
import TimerPage from "@/app/TimerPage";
import SignInPage from "./sign-in-page";
import CalendarPage from "./calendar-page";
import SettingsPage, { type AppSettings } from "./settings-page";
import AnalysisPage from "./analysis-page";
import ProfilePage from "./profile-page";
import ForgotPasswordPage from "./forgot-password-page";
import AIAssistantPage from "./ai-assistant-page";
import FriendsPage from "./friends-page";

/*

Any settings being changed gets transferred over to the other pages

*/

const defaultSettings: AppSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  colorTheme: "blue",
  soundEnabled: true,
  soundVolume: 50,
  notificationsEnabled: true,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

const colorThemes = {
  blue: { primary: "#007ba7", secondary: "#3395b9", accent: "#66b0ca" },
  green: { primary: "#2d5a27", secondary: "#4a7c59", accent: "#6b9b37" },
  purple: { primary: "#6b46c1", secondary: "#8b5cf6", accent: "#a78bfa" },
  orange: { primary: "#ea580c", secondary: "#fb923c", accent: "#fdba74" },
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState<string>("timer");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const currentTheme = colorThemes[settings.colorTheme];

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const addStudySession = (session: any) => {
    setStudySessions(prevSessions => [...prevSessions, session]);
  };

  const handleLoginSuccess = () => {
    setCurrentPage("timer");
  };


  if (currentPage === "log in") {
    return (
      <SignInPage 
        onLoginSuccess={handleLoginSuccess}
        onNavigateToForgotPassword={() => setCurrentPage("forgot-password")}
      />
    );
  }

  if (currentPage === "forgot-password") {
    return (
      <ForgotPasswordPage
        onNavigateToSignIn={() => setCurrentPage("log in")}
      />
    );
  }



  return (
    <MainLayout
      onNavigate={setCurrentPage as any}
      onSignInClick={() => setCurrentPage("log in")}
      theme={currentTheme}
    >
      {currentPage === "timer" && <TimerPage settings={settings} currentTheme={currentTheme} onSessionComplete={addStudySession} />}
      {currentPage === "calendar" && <CalendarPage settings={settings} currentTheme={currentTheme}/>}
      {currentPage === "analysis" && <AnalysisPage studySessions={studySessions} settings={settings} currentTheme={currentTheme} />}
      {currentPage === "settings" && <SettingsPage settings={settings} onSettingsChange={handleSettingsChange} />}
      {currentPage === "profile" && <ProfilePage onNavigate = {setCurrentPage as any} />}
      {currentPage === "ai-assistant" && <AIAssistantPage /> }
      {currentPage === "friends" && <FriendsPage /> }
    </MainLayout>
  );
}