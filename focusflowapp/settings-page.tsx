"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Palette, Volume2, Timer, Save } from "lucide-react"
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/*
Work to be done for page:

Save all the configurations done in this page to the user's account (if any is done)
Meaning the next time the user signs in, all the configuration that the user has set is restored...

Maybe have a section where you're able to choose a specific tone for the timer notification ? 

*/

interface SettingsPageProps {
  settings?: AppSettings
  onSettingsChange?: (settings: AppSettings) => void
}

export interface AppSettings {
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  colorTheme: "blue" | "green" | "purple" | "orange"
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
}

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
}

const colorThemes = {
  blue: {
    name: "Ocean Blue",
    primary: "#007ba7",
    secondary: "#3395b9",
    accent: "#66b0ca",
  },
  green: {
    name: "Forest Green",
    primary: "#2d5a27",
    secondary: "#4a7c59",
    accent: "#6b9b37",
  },
  purple: {
    name: "Royal Purple",
    primary: "#6b46c1",
    secondary: "#8b5cf6",
    accent: "#a78bfa",
  },
  orange: {
    name: "Sunset Orange",
    primary: "#ea580c",
    secondary: "#fb923c",
    accent: "#fdba74",
  },
}

export default function SettingsPage({ settings, onSettingsChange }: SettingsPageProps) {
  const { user } = useAuth();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings ?? defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // This effect keeps the local state in sync with the global state from props
  useEffect(() => {
    setLocalSettings(settings ?? defaultSettings);
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // This is the single, correct function to save settings
  const handleSave = async () => {
    if (!user) {
      alert("You must be logged in to save settings.");
      return;
    }
    
    try {
      // Save the new settings to a 'settings' collection with the user's ID
      const settingsDocRef = doc(db, "settings", user.uid);
      await setDoc(settingsDocRef, localSettings, { merge: true });
      
      // Call the parent's handler to update the global state instantly
      if (onSettingsChange) {
        onSettingsChange(localSettings);
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const resetSettings = () => {
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  const currentTheme = colorThemes[localSettings.colorTheme];

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `currentTheme.primary, currentTheme.secondary`,
      }}
    >
      {/* Header > Main Layout*/}

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/80">Customize your Focus Flow experience</p>
        </div>

        {/* Save/Reset Actions */}
        {hasChanges && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">You have unsaved changes</p>
                <div className="flex gap-2">
                  <Button onClick={resetSettings} variant="outline" size="sm">
                    Reset to Default
                  </Button>
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Settings */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-gray-700" />
                Timer Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="pomodoro-duration">Pomodoro Duration (minutes)</Label>
                <Input
                  id="pomodoro-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.pomodoroDuration}
                  onChange={(e) => updateSetting("pomodoroDuration", Number.parseInt(e.target.value) || 25)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="short-break-duration">Short Break Duration (minutes)</Label>
                <Input
                  id="short-break-duration"
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => updateSetting("shortBreakDuration", Number.parseInt(e.target.value) || 5)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="long-break-duration">Long Break Duration (minutes)</Label>
                <Input
                  id="long-break-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => updateSetting("longBreakDuration", Number.parseInt(e.target.value) || 15)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-start-breaks">Auto-start breaks</Label>
                  <Switch
                    id="auto-start-breaks"
                    checked={localSettings.autoStartBreaks}
                    onCheckedChange={(checked) => updateSetting("autoStartBreaks", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-start-pomodoros">Auto-start pomodoros</Label>
                  <Switch
                    id="auto-start-pomodoros"
                    checked={localSettings.autoStartPomodoros}
                    onCheckedChange={(checked) => updateSetting("autoStartPomodoros", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-gray-700" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="color-theme">Color Theme</Label>
                <Select
                  value={localSettings.colorTheme}
                  onValueChange={(value: "blue" | "green" | "purple" | "orange") => updateSetting("colorTheme", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(colorThemes).map(([key, theme]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                          {theme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Preview */}
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Theme Preview</p>
                <div
                  className="h-20 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{
                    background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  }}
                >
                  {currentTheme.name} 
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sound Settings */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-gray-700" />
                Sound & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled">Enable sounds</Label>
                <Switch
                  id="sound-enabled"
                  checked={localSettings.soundEnabled}
                  onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
                />
              </div>

              {localSettings.soundEnabled && (
                <div>
                  <Label htmlFor="sound-volume">Sound Volume</Label>
                  <div className="mt-2">
                    <Slider
                      id="sound-volume"
                      min={0}
                      max={100}
                      step={10}
                      value={[localSettings.soundVolume]}
                      onValueChange={(value) => updateSetting("soundVolume", value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>{localSettings.soundVolume}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Browser notifications</Label>
                <Switch
                  id="notifications-enabled"
                  checked={localSettings.notificationsEnabled}
                  onCheckedChange={(checked) => updateSetting("notificationsEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
