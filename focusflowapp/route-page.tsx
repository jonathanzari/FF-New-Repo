"use client";

import { useState, useEffect, useMemo } from "react";
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

  const [selectedMode, setSelectedMode] = useState("Pomodoro");
  const [isRunning, setIsRunning] = useState(false);

  const [tasks, setTasks] = useState([{ id: 1, text: "Task #1", completed: false }]);
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  const audioElement = new Audio('/notification.mp3');

  const modes = useMemo(() => ({
    Pomodoro: settings.pomodoroDuration * 60,
    "Short Break": settings.shortBreakDuration * 60,
    "Long Break": settings.longBreakDuration * 60,
  }), [settings]);

  const [timeLeft, setTimeLeft] = useState(modes.Pomodoro);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(modes[selectedMode as keyof typeof modes]);
    }
  }, [selectedMode, settings, modes]); 

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      completeSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const completeSession = () => {

    var sessionCount = 0;

    // Session is logged 
    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: selectedMode as "Pomodoro" | "Short Break" | "Long Break",
      duration: modes[selectedMode as keyof typeof modes],
      completed: true,
    };
    // Play notification sound
    audioElement.currentTime = 0; // Reset audio to start
    audioElement.volume = settings.soundVolume/100; // Adjust volume based on settings
    audioElement.loop = false; // Play sound once
    audioElement.play();

    // Automatically switch to the next mode
    // For every two pomodoros, switch to a long break, else switch to a short break
    if (selectedMode === "Pomodoro" && sessionCount < 2) {
      setSelectedMode("Short Break");
    } else if (selectedMode === "Short Break" && sessionCount < 2) {
      setSelectedMode("Pomodoro");
      sessionCount++;
    } else if (selectedMode === "Pomodoro" && sessionCount >= 2) {
      setSelectedMode("Long Break");
      sessionCount = 0; // Reset for next cycle
    } else if (selectedMode === "Long Break" && sessionCount == 0) {
      setSelectedMode("Pomodoro");
    }

  };
  
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    setTimeLeft(modes[mode as keyof typeof modes]);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setIsRunning(false); // Stop timer when settings change
  };

  const addStudySession = (session: any) => {
    setStudySessions(prevSessions => [...prevSessions, session]);
  };

  const handleLoginSuccess = () => {
    setCurrentPage("timer");
  };

  const deleteTask = (id: number) => setTasks(tasks.filter((task) => task.id !== id));
  const toggleTask = (id: number) => setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now(),
        text: newTaskText.trim(),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskText("");
      setShowAddInput(false);
    }
  };

  const showAddTaskInput = () => setShowAddInput(true);
  const cancelAddTask = () => {
    setNewTaskText("");
    setShowAddInput(false);
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
      {/* All handlers and props have to be transferred to this page where it does NOT change, essentially keeps from the timer and created tasks from disappearing when going tab to tab */}

      {currentPage === "timer" && (

      <TimerPage timeLeft = {timeLeft} isRunning = {isRunning} selectedMode = {selectedMode} modes = {modes} toggleTimer = {toggleTimer} handleModeChange = {handleModeChange} tasks = {tasks} newTaskText = {newTaskText}
      showAddInput = {showAddInput} toggleTask = {toggleTask} deleteTask = {deleteTask} addTask = {addTask} cancelAddTask = {cancelAddTask} setNewTaskText = {setNewTaskText} showAddTaskInput = {showAddTaskInput}
      settings={settings} currentTheme={currentTheme} onSessionComplete={addStudySession} /> )}

      {currentPage === "calendar" && <CalendarPage settings={settings} currentTheme={currentTheme}/>}
      {currentPage === "analysis" && <AnalysisPage studySessions={studySessions} settings={settings} currentTheme={currentTheme} />}
      {currentPage === "settings" && <SettingsPage settings={settings} onSettingsChange={handleSettingsChange} />}
      {currentPage === "profile" && <ProfilePage onNavigate = {setCurrentPage as any} />}
      {currentPage === "ai-assistant" && <AIAssistantPage /> }
      {currentPage === "friends" && <FriendsPage /> }
    </MainLayout>
  );
}