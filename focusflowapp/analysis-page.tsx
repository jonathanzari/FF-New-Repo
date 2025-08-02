"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, Timer, CheckCircle } from "lucide-react"
import { AppSettings } from "./settings-page"

/*

Work to be done: 
Functionality for analysis must be worked on && 
saved if user is logged in (into firestore for retrieval when logged back in)

*/

interface StudySession {
  id: number
  date: string
  type: "Pomodoro" | "Short Break" | "Long Break"
  duration: number
  completed: boolean
}

interface AnalysisPageProps {
  studySessions?: StudySession[];
  settings: AppSettings;
  currentTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
};



export default function AnalysisPage({
  studySessions = [],
  settings,
  currentTheme
}: AnalysisPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week")

  // Calculate statistics
  const completedSessions = studySessions.filter((session) => session.completed)
  const pomodoroSessions = completedSessions.filter((session) => session.type === "Pomodoro")
  const totalStudyTime = pomodoroSessions.reduce((total, session) => total + session.duration, 0)
  const totalBreakTime = completedSessions
    .filter((session) => session.type !== "Pomodoro")
    .reduce((total, session) => total + session.duration, 0)

  // Get recent sessions (last 7 days)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentSessions = completedSessions.filter((session) => new Date(session.date) >= weekAgo)

  // Format time in hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Get daily study data for the last 7 days
  const getDailyStudyData = () => {
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split("T")[0]
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

      const daySessions = completedSessions.filter(
        (session) => session.date.startsWith(dateStr) && session.type === "Pomodoro",
      )
      const dayMinutes = daySessions.reduce((total, session) => total + session.duration, 0) / 60

      dailyData.push({
        day: dayName,
        date: dateStr,
        minutes: Math.round(dayMinutes),
        sessions: daySessions.length,
      })
    }
    return dailyData
  }

  const dailyData = getDailyStudyData()
  const maxMinutes = Math.max(...dailyData.map((d) => d.minutes), 1)

  return (
    
    <div className="min-h-screen p-6"
      style={{
      background: `currentTheme.primary, currentTheme.secondary`}}
    >
      {/* Header > Main Layout */}

      {/* Analysis Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Study Analysis</h1>
          <p className="text-blue-100">Track your productivity and study patterns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Study Time</CardTitle>
              <Timer className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{formatTime(totalStudyTime)}</div>
              <p className="text-xs text-gray-500 mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Sessions</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{pomodoroSessions.length}</div>
              <p className="text-xs text-gray-500 mt-1">Pomodoro sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Session</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {pomodoroSessions.length > 0 ? formatTime(totalStudyTime / pomodoroSessions.length) : "0m"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Per session</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Study Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {recentSessions.length > 0 ? Math.min(recentSessions.length, 7) : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Days this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Weekly Study Activity</CardTitle>
            <p className="text-sm text-gray-600">Your study time over the last 7 days</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyData.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#007ba7] to-[#3395b9] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-gray-700">
                        {day.minutes > 0 ? `${day.minutes}m` : "No study"}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-500 text-right">
                    {day.sessions} {day.sessions === 1 ? "session" : "sessions"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Sessions</CardTitle>
            <p className="text-sm text-gray-600">Your latest completed study sessions</p>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions
                  .slice(-10)
                  .reverse()
                  .map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            session.type === "Pomodoro"
                              ? "bg-green-500"
                              : session.type === "Short Break"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                          }`}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-800">{session.type}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(session.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600">{formatTime(session.duration)}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Timer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No study sessions yet</p>
                <p className="text-sm">Start a Pomodoro session to see your progress here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
