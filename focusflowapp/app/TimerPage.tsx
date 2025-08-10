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
  const [tasks, setTasks] = useState<{ id: string | number, text: string, completed: boolean }[]>([{ id: 1, text: "Task #1", completed: false }]);
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const modes = {
    Pomodoro: settings.pomodoroDuration * 60,
    "Short Break": settings.shortBreakDuration * 60,
    "Long Break": settings.longBreakDuration * 60,
  };

  // Load tasks from Firebase on component mount
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      completeSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (!isRunning) {
      const newTime = modes[selectedMode as keyof typeof modes];
      setTimeLeft(newTime);
    }
  }, [settings, selectedMode]);

  const completeSession = async () => {
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
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
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
