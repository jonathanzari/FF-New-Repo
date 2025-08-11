"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, Timer, CheckCircle } from "lucide-react"
import { AppSettings } from "./settings-page"
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

/*

Work to be done: 
Functionality for analysis must be worked on && 
saved if user is logged in (into firestore for retrieval when logged back in)

*/

interface StudySession {
  id: string
  date: string
  type: "Pomodoro" | "Short Break" | "Long Break"
  duration: number
  completed: boolean
  createdAt?: any
}

interface AnalysisPageProps {
  settings: AppSettings;
  currentTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
};



export default function AnalysisPage({
  settings,
  currentTheme
}: AnalysisPageProps) {
  const { user } = useAuth()
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week")

  // Loading study sessions from Firebase...
  useEffect(() => {
    if (!user) return

    setLoading(true)
    const sessionsQuery = query(
      collection(db, "users", user.uid, "timerSessions"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[]
      setStudySessions(sessionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Calculate statistics:
  const completedSessions = studySessions.filter((session: StudySession) => session.completed)
  const pomodoroSessions = completedSessions.filter((session: StudySession) => session.type === "Pomodoro")
  const totalStudyTime = pomodoroSessions.reduce((total: number, session: StudySession) => total + session.duration, 0)
  const totalBreakTime = completedSessions
    .filter((session: StudySession) => session.type !== "Pomodoro")
    .reduce((total: number, session: StudySession) => total + session.duration, 0)

  // Get recent sessions (last 7 days)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentSessions = completedSessions.filter((session: StudySession) => new Date(session.date) >= weekAgo)

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
        (session: StudySession) => session.date.startsWith(dateStr) && session.type === "Pomodoro",
      )
      const dayMinutes = daySessions.reduce((total: number, session: StudySession) => total + session.duration, 0) / 60

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
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading your study data...</p>
        </div>
      ) : (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Study Analysis</h1>
          <p className="text-blue-100">Track your productivity and study patterns</p>
          {!user && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
              <p className="text-yellow-800">Please log in to view your study analytics</p>
            </div>
          )}
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
                              <TrendingUp className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
              {
                (() => {
                  // Get the last 7 days (dates as YYYY-MM-DD)
                  const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                    return d.toISOString().split("T")[0]
                  })

                  // Find which of the last 7 days have at least one Pomodoro session
                  const daysWithSession = last7Days.filter(dateStr =>
                    completedSessions.some(
                      session => session.type === "Pomodoro" && session.date.startsWith(dateStr)
                    )
                  )

                  // Calculate streak: count consecutive days from today backwards
                  let streak = 0
                  for (const dateStr of daysWithSession) {
                    if (dateStr === last7Days[streak]) {
                      streak++
                    } else {
                      break
                    }
                  }
                  return streak
                })()
              }
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
                                : "bg-black"
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
      )}
    </div>
  )
}

