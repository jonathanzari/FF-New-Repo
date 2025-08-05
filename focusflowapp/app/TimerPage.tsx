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

When a full timer session has been completed, it is tracked (if user is logged in)

Need it to not reset when the user navigates away from the page

*/


interface TimerPageProps {
  timeLeft: number;
  isRunning: boolean;
  selectedMode: string;
  modes: { [key: string]: number };
  toggleTimer: () => void;
  handleModeChange: (mode: string) => void;
  settings: AppSettings;
  tasks: { id: number; text: string; completed: boolean }[];
  newTaskText: string;
  showAddInput: boolean;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
  addTask: () => void;
  cancelAddTask: () => void;  
  setNewTaskText: (text: string) => void;
  showAddTaskInput: () => void;
  currentTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onSessionComplete: (session: any) => void;
} 

export default function TimerPage({ 
  settings, currentTheme, onSessionComplete, timeLeft, isRunning, selectedMode, modes, toggleTimer, handleModeChange,
   tasks, newTaskText, showAddInput, toggleTask, deleteTask, addTask, cancelAddTask, setNewTaskText, showAddTaskInput
}: TimerPageProps) {


 
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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