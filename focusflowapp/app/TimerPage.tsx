"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { type AppSettings } from "@/settings-page";

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
  const [selectedMode, setSelectedMode] = useState("Pomodoro");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState([{ id: 1, text: "Task #1", completed: false }]);
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  const audioElement = new Audio('/notification.mp3');
  
  const modes = {
    Pomodoro: settings.pomodoroDuration * 60,
    "Short Break": settings.shortBreakDuration * 60,
    "Long Break": settings.longBreakDuration * 60,
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
    onSessionComplete(session);

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
    }


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

  const toggleTimer = () => {
    setIsRunning(!isRunning);
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