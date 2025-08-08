/*
   
________________      ______________________     
[AI Chat Prompt]      [Saved Notes Section ]
|              |      |(Folder1) > Note #1 | <<< Selected Note
|              |      |(Folder1) > Note #2 |
|...           |      |(Folder2) > Note #1 |
|______________|      |...                 |
|Prompt..._____|      |..._________________|

___________________________________________
[Note Taking Section: Note #1             ]
|...                                      |
|...                                      |
|...                                      |
|                                         |
|_________________________________________|      

(Could attach images, utilize microphone, etc. -> AI Chat Prompt)

(Highlight, text change color, possible font changing, bullet points, 
highlight text, and ask AI about it -> Note Taking Section)

()

Missing work so far for page:

Ability to edit and delete pages in Saved Notes Section
> When clicked on edit page, the title and content should appear in the "Note Taking Section"


*/


"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, Send, Bot, User, History, Plus, X, Pencil, Trash } from 'lucide-react';


interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  folderId?: string;
}
interface Folder {
  id: string;
  name: string;
}

/*--------------------------------------*/

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const SUGGESTIONS = [
  { label: "Math Help", value: "Help with algebra, calculus, geometry, and more." },
  { label: "Science", value: "Physics, chemistry, biology concepts explained." },
  { label: "Study Tips", value: "Effective study strategies and techniques." },
]

const HISTORY_KEY = "ai_studybot_history"

function saveSessionToHistory(messages: Message[]) {
  if (messages.length === 0) return;
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.unshift({
    id: Date.now(),
    messages,
    date: new Date().toLocaleString(),
    preview: messages[0]?.text?.slice(0, 40) || "Session"
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteFolderId, setNoteFolderId] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means "All Notes"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /////////////////////////////////////////////////////////////
  // AI Assistant //


  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(getHistory());


  const fetchFoldersAndNotes = async () => {
    if (!user) return;
    setLoading(true);
    
    const foldersQuery = query(collection(db, "users", user.uid, "folders"), orderBy("name"));
    const foldersSnapshot = await getDocs(foldersQuery);
    const fetchedFolders = foldersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
    setFolders(fetchedFolders);

    const notesQuery = query(collection(db, "users", user.uid, "notes"), orderBy("createdAt", "desc"));
    const notesSnapshot = await getDocs(notesQuery);
    const fetchedNotes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
    setNotes(fetchedNotes);

    setLoading(false);
  };

  useEffect(() => {
    fetchFoldersAndNotes();
  }, [user]);

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
      await addDoc(collection(db, "users", user.uid, "folders"), {
        name: newFolderName,
        createdAt: serverTimestamp(),
      });
      setNewFolderName('');
      await fetchFoldersAndNotes(); 
    } catch (err) {
      setError("Failed to create folder.");
    }
  };
  
  const handleSaveNote = async () => {
    if (!user || !newNoteContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "users", user.uid, "notes"), {
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: serverTimestamp(),
        folderId: noteFolderId || null, 
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setNoteFolderId('');
      await fetchFoldersAndNotes(); 
    } catch (err) {
      setError("Failed to save note.");
    } finally {
      setLoading(false);
    }
  };

  
  const filteredNotes = useMemo(() => {
    if (!selectedFolderId) {
      return notes; 
    }
    return notes.filter(note => note.folderId === selectedFolderId);
  }, [notes, selectedFolderId]);


  //////////////////////////////////////////////////////////////////////////////

  /* Handlers for the AI Assistant */

  const sendMessage = async (msg?: string) => {
    const messageToSend = msg ?? input
    if (!messageToSend.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setCharCount(0)
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend })
      })
      const data = await response.json()
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "bot",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = () => {
    if (messages.length > 0) {
      saveSessionToHistory(messages)
      setHistory(getHistory())
    }
    setMessages([])
  }

  const openHistory = () => {
    setHistory(getHistory())
    setShowHistory(true)
  }

  const restoreSession = (session: any) => {
    setMessages(session.messages)
    setShowHistory(false)
  }

  const handleEditNote = () => {

  }

  const handleDeleteNote = () => {
    
  }


    return (
        <div className= "min-h-screen p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">AI Assistant</h1>
                <p className = "text-white/80">Combine simple note-taking with our Gemini-powered AI for faster and clearer understanding of any topic!</p>                    
              </div>

            { /* User is signed in, display notes & AI, if not, display simple card telling the person to sign in to utilize the tools */}

            { user ? ( 
                <div>
                    <div className = "flex justify-center gap-6 p-4">
                        <Card className="flex flex-col flex-shrink-0 shadow-lg bg-white border border-gray-200" style={{ height: 575, maxHeight: '100vh', width: 450, maxWidth: '90vh' }}>
                            <div className="flex items-center justify-between px-6 py-7 border-b bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl -mt-6">
                                <div className="flex items-center gap-2 text-white">
                                    <Bot className="w-5 h-5" />
                                    <h2 className="font-semibold text-lg">AI Study Assistant</h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="text-white opacity-80 hover:opacity-100" onClick={openHistory}>
                                        <History className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-white opacity-80 hover:opacity-100" onClick={startNewChat}>
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* If no history exists, "no previous sessions" is displayed, else, display the stored history information (with ability to restore previous messages) */}
                            { showHistory && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                                <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowHistory(false)}>
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-semibold mb-4">Chat History</h3>
                                    {history.length === 0 ? (
                                    <div className="text-gray-400 text-center">No previous sessions.</div>
                                    ) : (
                                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                                    {history.map((session: any) => (
                                        <li key={session.id}>
                                            <button
                                            className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100"
                                            onClick={() => restoreSession(session)}
                                            >
                                                <div className="font-medium text-sm text-gray-800 truncate">{session.preview}</div>
                                                <div className="text-xs text-gray-400">{session.date}</div>
                                            </button>
                                        </li>
                                    ))}
                                    </ul>
                                    )}
                                </div>
                            </div>
                            )}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                
                                {messages.length === 0 && (
                                <div className="text-gray-400 text-center mt-8">Hello! I'm your AI Study Assistant. I'm here to help you with your studies, answer questions, explain concepts, and provide guidance. What would you like to learn about today?</div>
                                )}
                                {messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-xs px-4 py-3 rounded-xl shadow-sm text-sm whitespace-pre-line ${
                                      message.sender === "user"
                                        ? "bg-blue-500 text-white rounded-br-md"
                                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      {message.sender === "user" ? (
                                        <User className="w-3 h-3 opacity-80" />
                                      ) : (
                                        <Bot className="w-3 h-3 opacity-80" />
                                      )}
                                      <span className="text-xs opacity-60">
                                        {message.sender === "user" ? "You" : "AI Assistant"}
                                      </span>
                                    </div>
                                    <p>{message.text}</p>
                                  </div>
                                </div>
                              ))}
                              {isLoading && (
                                <div className="flex justify-start">
                                  <div className="bg-white text-gray-800 px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-2">
                                      <Bot className="w-3 h-3 opacity-80" />
                                      <span className="text-xs opacity-60">AI Assistant</span>
                                    </div>
                                    <p>Thinking...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="translate-y-6">
                            <div className="flex gap-2 px-4 py-4 border-t bg-gray-50">
                              {SUGGESTIONS.map((s) => (
                                <Button
                                  key={s.label}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full text-xs px-3 py-1 border-gray-300"
                                  onClick={() => sendMessage(s.value)}
                                  disabled={isLoading}
                                >
                                  {s.label}
                                </Button>
                              ))}
                            </div>
                            <form
                              className="flex items-center gap-2 px-6 py-4 border-t bg-white rounded-b-2xl"
                              onSubmit={e => {
                                e.preventDefault();
                                sendMessage();
                              }}
                            >
                              <Input
                                value={input}
                                onChange={e => {
                                  setInput(e.target.value)
                                  setCharCount(e.target.value.length)
                                }}
                                placeholder="Ask me anything about your studies..."
                                maxLength={200}
                                disabled={isLoading}
                                className="flex-1"
                              />
                              <Button type="submit" disabled={isLoading || !input.trim()}>
                                <Send className="w-4 h-4" />
                              </Button>
                              <span className="text-xs text-gray-400 ml-2">{charCount}/200</span>
                            </form>
                            </div>
                        </Card>
                                

            {/*---------- End Of "AI Assistant" Card ---------- */}

            {/*---------- "Folder & Note Viewing" Card ---------- */}
                        <Card className="flex flex-col flex-shrink-0 shadow-lg bg-white border border-gray-200" style={{ height: 575, maxHeight: '100vh', width: 450, maxWidth: '90vh' }}>
                            <CardHeader>
                                <CardTitle className="text-center">Create New Folder</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                <Input 
                                placeholder="New Folder Name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                />
                                <Button onClick={handleCreateFolder}>
                                    <FolderPlus className="w-4 h-4 mr-2" /> Create Folder
                                </Button>
                            </CardContent>

                            <CardTitle className="text-center">Existing Folders</CardTitle>

                            <div>
                                <div className="flex justify-start gap-2 mb-4 overflow-x-auto">
                                    <Button variant={!selectedFolderId ? 'default' : 'secondary'} onClick={() => setSelectedFolderId(null)}>All Notes</Button>
                                
                                    {folders.map(folder => (
                                    <Button 
                                      key={folder.id} 
                                      variant={selectedFolderId === folder.id ? 'default' : 'secondary'} 
                                      onClick={() => setSelectedFolderId(folder.id)}
                                    >
                                    {folder.name}
                                    </Button>
                                    ))}
                                </div>
                                
                                <div className="space-y-2 max-h-76 overflow-y-auto">
                                    {filteredNotes.map(note => (
                                    <Card key={note.id} className="bg-white">
                                        <CardHeader>
                                            <CardTitle className="text-center">{note.title || "Untitled Note"}</CardTitle>
                                            
                                            <Button 
                                            variant="secondary"
                                            onClick={handleEditNote}
                                            >
                                                <Pencil className="w-5 h-5" /> Edit Note
                                            </Button>

                                            <Button
                                            onClick={handleDeleteNote}
                                            >
                                                <Trash className="w-5 h-5" /> Delete Note
                                            </Button>

                                        </CardHeader>
                                        <CardContent>
                                            <p className="whitespace-pre-wrap">{note.content}</p>
                                        </CardContent>
                                    </Card>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

            {/*---------- End Of "Folder & Note Viewing" Card ---------- */}

            {/*---------- "Create New Note" Card ----------- */}
                    <div>
                        <Card className="flex bg-white border-0 shadow-lg w-200 h-120 mx-auto mt-2">
                            <CardHeader>
                                <CardTitle className="text-center">Create New Note</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4 overflow-auto">
                                <Input 
                                placeholder="Note Title"
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                />
                                <Textarea 
                                className="h-55"
                                placeholder="What's on your mind?"
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                />

                                <Select value={noteFolderId} onValueChange={setNoteFolderId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a folder (optional)" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {folders.map(folder => (
                                            <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button onClick={handleSaveNote} disabled={loading} className="w-full">
                                    {loading ? "Saving..." : "Save Note"}
                                </Button>

                                {error && <p className="text-red-500 text-sm">{error}</p>}

                            </CardContent>
                        </Card>
                    </div>

                {/*--------- End of "Create New Note" Card ----------*/}

                </div> ) 
                :
                (
                <div>
                    {/* Centered card telling user to sign in */}
                    <Card className = "w-115 mx-auto bg-white border-0 shadow-lg">
                        <CardContent>
                            <CardTitle>Sign in to take advantage of our AI (powered by Gemini)!</CardTitle>
                        </CardContent>
                    </Card>
                </div>
                )}
            </div> 
        </div> 
    );
}