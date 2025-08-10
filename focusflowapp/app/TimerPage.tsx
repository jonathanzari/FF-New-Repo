"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { type AppSettings } from "@/settings-page";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';

/*

Things To Work On:
Saving tasks that the user creates in the page

Adding editing functionality to the tasks

Adding notification sound to the timers (can be changed in settings)

When a full timer session has been completed, it is tracked (if user is logged in)

*/


interface TimerPageProps {
  settings: AppSettings;
  currentTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onSessionComplete: (session: any) => void;
}

export default function TimerPage({ settings, currentTheme, onSessionComplete }: TimerPageProps) {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState("Pomodoro");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [tasks, setTasks] = useState<{ id: string | number, text: string, completed: boolean }[]>([{ id: 1, text: "Task #1", completed: false }]);
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const modes = {
    Pomodoro: settings.pomodoroDuration * 60, // Back to original 25 minutes
    "Short Break": settings.shortBreakDuration * 60,
    "Long Break": settings.longBreakDuration * 60,
  };

  // Load tasks from Firebase on component mount and restore timer state
  useEffect(() => {
    if (user) {
      loadTasks();
    }
    
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    
    // Restore timer state from localStorage
    const savedTimerState = localStorage.getItem('timerState');
    if (savedTimerState) {
      const { isRunning: savedIsRunning, timeLeft: savedTimeLeft, selectedMode: savedMode, startTime } = JSON.parse(savedTimerState);
      
      if (savedIsRunning && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, savedTimeLeft - elapsed);
        
        if (remaining > 0) {
          setSelectedMode(savedMode);
          setTimeLeft(remaining);
          setIsRunning(true);
          setTimerStartTime(startTime);
        } else {
          // Timer has finished while away
          localStorage.removeItem('timerState');
        }
      }
    }
  }, [user]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            setTimerStartTime(null);
            localStorage.removeItem('timerState');
            completeSession();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft]);

  // Reset timer when mode changes
  useEffect(() => {
    setTimeLeft(modes[selectedMode as keyof typeof modes]);
  }, [selectedMode, settings]);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const tasksQuery = query(
        collection(db, "users", user.uid, "timerTasks"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(tasksQuery);
      const loadedTasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        completed: doc.data().completed,
        createdAt: doc.data().createdAt
      }));
      setTasks(loadedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async (task: { id: string | number, text: string, completed: boolean }) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, "users", user.uid, "timerTasks"), {
        text: task.text,
        completed: task.completed,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const updateTask = async (taskId: string, updates: any) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, "users", user.uid, "timerTasks", taskId), updates);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTaskFromFirebase = async (taskId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, "users", user.uid, "timerTasks", taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };



  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Light ding sound - higher frequency for a pleasant tone
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      
      // Smooth fade-out over 0.8 seconds
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const showBrowserNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Timer Complete! 🎉', {
        body: `${selectedMode} session has finished!`,
        icon: '/FocusFlow.png',
        badge: '/FocusFlow.png',
        tag: 'timer-complete',
        requireInteraction: true
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  const completeSession = async () => {
    // Show visual notification
    setShowNotification(true);
    
    // Play sound
    playNotificationSound();
    
    // Show browser notification
    showBrowserNotification();
    
    // Hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
    
    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: selectedMode as "Pomodoro" | "Short Break" | "Long Break",
      duration: modes[selectedMode as keyof typeof modes],
      completed: true,
    };
    
    // Save session to Firebase if user is logged in
    if (user) {
      try {
        await addDoc(collection(db, "users", user.uid, "timerSessions"), {
          ...session,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }
    
    onSessionComplete(session);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    setIsRunning(false);
    setTimerStartTime(null);
    localStorage.removeItem('timerState');
  };

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    
    if (newIsRunning) {
      // Start/Resume timer
      const startTime = Date.now();
      setTimerStartTime(startTime);
      setIsRunning(true);
      localStorage.setItem('timerState', JSON.stringify({
        isRunning: true,
        timeLeft: timeLeft,
        selectedMode,
        startTime
      }));
    } else {
      // Pause timer
      setTimerStartTime(null);
      setIsRunning(false);
      localStorage.setItem('timerState', JSON.stringify({
        isRunning: false,
        timeLeft: timeLeft,
        selectedMode,
        startTime: null
      }));
    }
  };
  
  const deleteTask = async (id: string | number) => {
    setTasks(tasks.filter((task) => task.id !== id));
    if (typeof id === 'string') {
      await deleteTaskFromFirebase(id);
    }
  };
  
  const toggleTask = async (id: string | number) => {
    const updatedTasks = tasks.map((task) => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    if (typeof id === 'string') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        await updateTask(id, { completed: !task.completed });
      }
    }
  };

  const addTask = async () => {
    if (newTaskText.trim()) {
      const newTask = {
        id: Date.now(),
        text: newTaskText.trim(),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      
      // Save to Firebase
      await saveTask(newTask);
      
      setNewTaskText("");
      setShowAddInput(false);
    }
  };

  const showAddTaskInput = () => setShowAddInput(true);
  const cancelAddTask = () => {
    setNewTaskText("");
    setShowAddInput(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
             {/* Timer Completion Notification */}
       {showNotification && (
         <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
           <div className="bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
             <div className="text-2xl">🎉</div>
             <div>
               <div className="font-bold">You did it! Take a break!</div>
               <div className="text-sm opacity-90">{selectedMode} session finished</div>
             </div>
             <button 
               onClick={() => setShowNotification(false)}
               className="ml-4 text-white hover:text-gray-200"
             >
               ✕
             </button>
           </div>
         </div>
       )}
      
      <Card className="border-0 p-8 mb-6" style={{ backgroundColor: currentTheme.accent }}>
        <div className="flex justify-center gap-4 mb-8">
          {Object.keys(modes).map((mode) => (
            <Button
              key={mode}
              onClick={() => handleModeChange(mode)}
              variant={selectedMode === mode ? "default" : "secondary"}
              className={`px-6 py-2 rounded-full ${selectedMode === mode ? "bg-white text-gray-800 hover:bg-gray-100" : "text-white hover:bg-white/20"}`}
              style={selectedMode !== mode ? { backgroundColor: currentTheme.secondary } : {}}
            >
              {mode}
            </Button>
          ))}
        </div>
        <div className="text-center mb-8">
          <div className="text-8xl font-bold text-white mb-6 font-mono">{formatTime(timeLeft)}</div>
          <Button onClick={toggleTimer} className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-12 py-3 rounded-full text-lg">
            {isRunning ? "PAUSE" : "START"}
          </Button>
        </div>
      </Card>
      <div className="text-center mb-6">
        <h2 className="text-white text-xl font-semibold">Lock in!</h2>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: currentTheme.accent }}>
            <div className="flex items-center gap-3">
              <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-800" />
              <span className={`text-white ${task.completed ? "line-through opacity-60" : ""}`}>{task.text}</span>
            </div>
            <Button onClick={() => deleteTask(task.id)} variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {showAddInput ? (
          <div className="rounded-lg p-4 flex items-center gap-3" style={{ backgroundColor: currentTheme.accent }}>
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter task name..."
              className="flex-1 bg-white rounded px-3 py-2 text-gray-800 placeholder-gray-500"
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && addTask()}
            />
            <Button onClick={addTask} disabled={!newTaskText.trim()} className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2">Add</Button>
            <Button onClick={cancelAddTask} variant="ghost" className="text-white hover:bg-white/20 px-4 py-2">Cancel</Button>
          </div>
        ) : (
          <Button onClick={showAddTaskInput} variant="outline" className="w-full border-2 border-dashed bg-transparent text-white hover:bg-white/10 hover:border-solid py-6" style={{ borderColor: currentTheme.accent }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    </div>
  );
}
