"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

import MainLayout from "./app/MainLayout";
import TimerPage from "./app/TimerPage";
import SignInPage from "./sign-in-page";
import ProfilePage from "./profile-page";
import FriendsPage from "./friends-page";
import AIAssistantPage from "./ai-assistant-page";
import ForgotPasswordPage from "./forgot-password-page";
import CalendarPage from "./calendar-page";
import SettingsPage, { type AppSettings } from "./settings-page";
import AnalysisPage from "./analysis-page";
import StudyGroupsPage from "./study-groups-page";


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


interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function Home() {
  const { user, userSettings } = useAuth();
  const [currentPage, setCurrentPage] = useState("timer");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const currentTheme = colorThemes[settings.colorTheme];

  const [selectedMode, setSelectedMode] = useState("Pomodoro");
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  
  const [audioElement] = useState(() => typeof window !== "undefined" ? new Audio('/notification.mp3') : null);

  const modes = useMemo(() => ({
    Pomodoro: settings.pomodoroDuration * 60,
    "Short Break": settings.shortBreakDuration * 60,
    "Long Break": settings.longBreakDuration * 60,
  }), [settings]);

  const [timeLeft, setTimeLeft] = useState(modes.Pomodoro);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      completeSession();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (user) loadTasks();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
    const savedTimerState = localStorage.getItem('timerState');
    if (savedTimerState) {
      const { isRunning, timeLeft, selectedMode, startTime } = JSON.parse(savedTimerState);
      if (isRunning && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, timeLeft - elapsed);
        if (remaining > 0) {
          setSelectedMode(selectedMode);
          setTimeLeft(remaining);
          setIsRunning(true);
          setTimerStartTime(startTime);
          return;
        }
      }
    }
    setTimeLeft(modes[selectedMode as keyof typeof modes]);
    localStorage.removeItem('timerState');
  }, [user]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(modes[selectedMode as keyof typeof modes]);
    }
  }, [selectedMode, settings, modes]);

  useEffect(() => {
    if (user && userSettings) {
      setSettings(userSettings);
    } else {
      setSettings(defaultSettings);
      setTasks([]); 
    }
  }, [user, userSettings]);

  const playNotificationSound = () => {
    if (!audioElement || !settings.soundEnabled) return;
    try {
      audioElement.currentTime = 0;
      audioElement.volume = settings.soundVolume / 100;
      audioElement.play();
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const showBrowserNotification = () => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Timer Complete! 🎉', {
        body: `${selectedMode} session has finished!`,
        icon: '/FocusFlow.png',
      });
      notification.onclick = () => { window.focus(); notification.close(); };
    }
  };

  const addStudySession = (session: any) => {
    setStudySessions(prevSessions => [...prevSessions, session]);
  };

  const completeSession = () => {
    setShowNotification(true);
    playNotificationSound();
    showBrowserNotification();
    setTimeout(() => setShowNotification(false), 5000);
    
    const session = {
      id: Date.now(), date: new Date().toISOString(), type: selectedMode,
      duration: modes[selectedMode as keyof typeof modes], completed: true,
    };
    addStudySession(session);

    if (user) {
      addDoc(collection(db, "users", user.uid, "timerSessions"), {
        ...session, createdAt: serverTimestamp()
      }).catch(error => console.error("Error saving session:", error));
    }

    if (selectedMode === "Pomodoro") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      handleModeChange(newCount % 4 === 0 ? "Long Break" : "Short Break");
    } else {
      handleModeChange("Pomodoro");
    }
  };

  const handleModeChange = (mode: string) => {
    setIsRunning(false);
    setSelectedMode(mode);
    setTimerStartTime(null);
    localStorage.removeItem('timerState');
  };

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    if (newIsRunning && audioElement) {
        audioElement.play().catch(() => {});
        audioElement.pause();
    }
    setIsRunning(newIsRunning);
    if (newIsRunning) {
      const startTime = Date.now();
      setTimerStartTime(startTime);
      localStorage.setItem('timerState', JSON.stringify({
        isRunning: true, timeLeft, selectedMode, startTime
      }));
    } else {
      setTimerStartTime(null);
      localStorage.removeItem('timerState');
    }
  };

  const loadTasks = async () => {
    if (!user) return;
    const tasksQuery = query(collection(db, "users", user.uid, "timerTasks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(tasksQuery);
    setTasks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
  };

  const addTask = async () => {
    if (!user || !newTaskText.trim()) return;
    const text = newTaskText.trim();
    setNewTaskText("");
    setShowAddInput(false);
    await addDoc(collection(db, "users", user.uid, "timerTasks"), {
      text: text, completed: false, createdAt: serverTimestamp()
    });
    await loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "timerTasks", taskId));
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  const toggleTask = async (task: Task) => {
    if (!user) return;
    const newCompletedStatus = !task.completed;
    await updateDoc(doc(db, "users", user.uid, "timerTasks", task.id), { completed: newCompletedStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompletedStatus } : t));
  };
  
  const showAddTaskInput = () => setShowAddInput(true);
  const cancelAddTask = () => { setNewTaskText(""); setShowAddInput(false); };
  const handleSettingsChange = (newSettings: AppSettings) => setSettings(newSettings);
  const handleLoginSuccess = () => setCurrentPage("timer");

  if (currentPage === "log in") {
    return <SignInPage onLoginSuccess={handleLoginSuccess} onNavigateToForgotPassword={() => setCurrentPage("forgot-password")} />;
  }
  if (currentPage === "forgot-password") {
    return <ForgotPasswordPage onNavigateToSignIn={() => setCurrentPage("log in")} />;
  }

  return (
    <MainLayout
      onNavigate={setCurrentPage}
      onSignInClick={() => setCurrentPage("log in")}
      theme={currentTheme}
    >
      {currentPage === "timer" && (
        <TimerPage
          timeLeft={timeLeft}
          isRunning={isRunning}
          selectedMode={selectedMode}
          modes={modes}
          toggleTimer={toggleTimer}
          handleModeChange={handleModeChange}
          tasks={tasks}
          newTaskText={newTaskText}
          showAddInput={showAddInput}
          setNewTaskText={setNewTaskText}
          addTask={addTask}
          deleteTask={deleteTask}
          toggleTask={toggleTask}
          showAddTaskInput={showAddTaskInput}
          cancelAddTask={cancelAddTask}
          settings={settings}
          currentTheme={currentTheme}
          onSessionComplete={addStudySession}
          showNotification={showNotification}
          setShowNotification={setShowNotification}
        />
      )}
      {currentPage === "calendar" && <CalendarPage settings={settings} currentTheme={currentTheme}/>}
      {currentPage === "analysis" && <AnalysisPage settings={settings} currentTheme={currentTheme} />}
      {currentPage === "settings" && <SettingsPage settings={settings} onSettingsChange={handleSettingsChange} />}
      {currentPage === "profile" && <ProfilePage onNavigate = {setCurrentPage as any} />}
      {currentPage === "ai-assistant" && <AIAssistantPage /> }
      {currentPage === "friends" && <FriendsPage /> }
      {currentPage === "study-groups" && <StudyGroupsPage settings={settings} currentTheme={currentTheme} />}

    </MainLayout>
  );
}