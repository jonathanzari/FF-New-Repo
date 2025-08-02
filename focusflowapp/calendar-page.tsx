"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { type AppSettings } from "@/settings-page";

/*
Work to be done:

Saving all the tasks that the user has created, restored when the user signs in (firebase)

Adding ability to edit the task

*/

interface Task {
  id: number
  title: string
  desc: string
  date: string
  priority: "low" | "normal" | "high"
}

interface CalendarPageProps {
  settings: AppSettings;
  currentTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

const priorityColors = {
  low: "bg-green-500",
  normal: "bg-blue-500",
  high: "bg-red-500",
}

const priorityLabels = {
  low: "Low Priority",
  normal: "Normal Priority",
  high: "High Priority",
}

export default function CalendarPage({
  settings,
  currentTheme
}: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", desc: "", priority: "normal" as "low" | "normal" | "high" })

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, month + (direction === "next" ? 1 : -1), 1))
  }

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const getTasksForDate = (date: string) => {
    return tasks.filter((task) => task.date === date)
  }

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(day)
    setSelectedDate(dateStr)
    setIsDialogOpen(true)
  }

  const addTask = () => {
    if (newTask.title.trim() && selectedDate) {
      const task: Task = {
        id: Date.now(),
        title: newTask.title.trim(),
        desc: newTask.desc.trim(),
        date: selectedDate,
        priority: newTask.priority,
      }
      setTasks([...tasks, task])
      setNewTask({ title: "", desc: "", priority: "normal" })
      setIsDialogOpen(false)
    }
  }

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day)
      const dayTasks = getTasksForDate(dateStr)
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 transition-colors ${
            isToday ? "bg-blue-100 border-blue-300" : "bg-white"
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>{day}</div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className={`text-xs px-1 py-0.5 rounded text-white truncate ${priorityColors[task.priority]}`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && <div className="text-xs text-gray-500">+{dayTasks.length - 2} more</div>}
          </div>
        </div>,
      )
    }
    return days
  }

  return (
    <div className="min-h-screen p-6"
      style={{
      background: `currentTheme.primary, currentTheme.secondary`}}
    >
      {/* Header > Main Layout */}
      
      <div className = "max-w-4xl mx-auto space-y-6">
        <div className = "text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2"> Calendar </h1>
          <p className = "text-white/80"> Add tasks for each day and set priorities</p>  
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white border-0 shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {monthNames[month]} {year}
              </h1>
              <div className="flex gap-1">
                <Button onClick={() => navigateMonth("prev")} variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button onClick={() => navigateMonth("next")} variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Priority Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Normal Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Low Priority</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="h-10 flex items-center justify-center font-medium text-gray-600 border-b">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0 border-l border-t">{renderCalendarDays()}</div>
          </div>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task for {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Task Subject</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title/subject..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Task Description</Label>
              <Input
                id = "task-description"
                value={newTask.desc}
                onChange={(e)=> setNewTask({ ...newTask, desc: e.target.value})}
                placeholder="Enter task description..."
                className="mt-1"
                />
            </div>

            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: "low" | "normal" | "high") => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      High Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      Normal Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      Low Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show existing tasks for this date */}
            {selectedDate && getTasksForDate(selectedDate).length > 0 && (
              <div>
                <Label>Existing Tasks</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {getTasksForDate(selectedDate).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${priorityColors[task.priority]}`}></div>
                        <span className="text-m">
                        <b>{task.title + ":"}</b>
                        </span>
                        <span className = "text-xs">{task.desc}</span>
                      </div>
                      <Button
                        onClick={() => deleteTask(task.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={addTask} disabled={!newTask.title.trim()} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
