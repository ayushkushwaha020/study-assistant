"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen,
  BrainCircuit, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Command, FileText, Flame, Focus, GraduationCap, LayoutDashboard,
  LibraryBig, ListTodo, Menu, MessageCircle, Mic, MoreHorizontal, Plus, Search,
  Send, Settings2, Sparkles, Target, Timer, Upload, X, Zap
} from "lucide-react";

type Task = { id: string; title: string; subject: string; time: string; done: boolean; priority: "High" | "Medium" | "Low" };
type ChatMessage = { role: "user" | "assistant"; text: string };

const initialTasks: Task[] = [
  { id: "t1", title: "Revise electrostatics formulas", subject: "Physics", time: "20 min", done: false, priority: "High" },
  { id: "t2", title: "Complete organic chemistry quiz", subject: "Chemistry", time: "25 min", done: false, priority: "High" },
  { id: "t3", title: "Review calculus flashcards", subject: "Mathematics", time: "15 min", done: true, priority: "Medium" },
  { id: "t4", title: "Read chapter 6 notes", subject: "Biology", time: "30 min", done: false, priority: "Low" },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI study buddy", icon: BrainCircuit },
  { label: "My planner", icon: CalendarDays },
  { label: "My library", icon: LibraryBig },
  { label: "Focus room", icon: Timer },
];

const subjects = [
  { name: "Physics", detail: "Electrostatics · 4 topics left", value: 72, tone: "lilac", initials: "PH" },
  { name: "Mathematics", detail: "Calculus · 2 topics left", value: 84, tone: "mint", initials: "MA" },
  { name: "Chemistry", detail: "Organic · 5 topics left", value: 48, tone: "peach", initials: "CH" },
];

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskDraft, setTaskDraft] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hey! 👋 I'm here to make studying feel a little easier. What are you working on today?" },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusStarted, setFocusStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("studyos-tasks-v1");
      if (saved) setTasks(JSON.parse(saved) as Task[]);
    } catch { /* Keep the safe starter tasks if local storage is unavailable. */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem("studyos-tasks-v1", JSON.stringify(tasks)); } catch { /* Storage is optional. */ }
  }, [tasks, mounted]);

  useEffect(() => {
    if (!focusRunning) return;
    const interval = window.setInterval(() => setFocusSeconds((seconds) => {
      if (seconds <= 1) {
        window.clearInterval(interval);
        setFocusRunning(false);
        setToast("Focus session complete — lovely work!");
        return 0;
      }
      return seconds - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [focusRunning]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const completedCount = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const pendingCount = tasks.length - completedCount;
  const focusTime = `${String(Math.floor(focusSeconds / 60)).padStart(2, "0")}:${String(focusSeconds % 60).padStart(2, "0")}`;
  const visibleTasks = useMemo(() => tasks.slice(0, 4), [tasks]);

  function toggleTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function addTask() {
    const title = taskDraft.trim();
    if (!title) return;
    setTasks((current) => [{ id: crypto.randomUUID(), title, subject: "Personal", time: "20 min", done: false, priority: "Medium" }, ...current]);
    setTaskDraft("");
    setShowAddTask(false);
    setToast("Task added to your study list");
  }

  async function sendMessage(text = chatInput) {
    const message = text.trim();
    if (!message || chatLoading) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The tutor is temporarily unavailable.");
      setMessages((current) => [...current, { role: "assistant", text: data.answer }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The tutor is temporarily unavailable.";
      setMessages((current) => [...current, { role: "assistant", text: `I couldn't reach the live AI tutor just now. ${detail} You can still use your planner, focus timer, and task list. To enable AI, add OPENAI_API_KEY to your deployment environment.` }]);
    } finally {
      setChatLoading(false);
    }
  }

  function navigate(label: string) {
    setActiveNav(label);
    setMobileMenuOpen(false);
    if (label === "AI study buddy") setToast("Your AI study buddy is ready below.");
    if (label === "My planner") setToast("Your plan is right here — let's make it happen.");
    if (label === "My library") setToast("Your study library is ready to grow.");
    if (label === "Focus room") setToast("Start a focus session from the focus card.");
    if (label === "Overview") setToast("You're back at your overview.");
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={23} strokeWidth={2.3} /></div>
          <div className="brand-word">study<span>os</span><small>YOUR STUDY SPACE</small></div>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={19} /></button>
        </div>
        <button className="workspace-switcher" onClick={() => setToast("Personal workspace selected")}>
          <div className="avatar avatar-small">A</div><span><b>My workspace</b><small>Personal space</small></span><ChevronDown size={16} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? "nav-active" : ""}`} onClick={() => navigate(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === "AI study buddy" && <span className="nav-new">AI</span>}
            </button>
          ))}
        </nav>
        <div className="nav-label subjects-label">YOUR SUBJECTS <button aria-label="Add subject" onClick={() => setToast("Subject management is coming soon.")}><Plus size={15} /></button></div>
        <div className="subject-nav">
          <button onClick={() => setToast("Physics selected")}><span className="subject-dot dot-purple" />Physics</button>
          <button onClick={() => setToast("Mathematics selected")}><span className="subject-dot dot-green" />Mathematics</button>
          <button onClick={() => setToast("Chemistry selected")}><span className="subject-dot dot-orange" />Chemistry</button>
        </div>
        <div className="sidebar-spacer" />
        <div className="streak-card">
          <div className="streak-icon"><Flame size={19} fill="currentColor" /></div>
          <div><b>You're on a roll!</b><p>Keep your momentum going.</p><div className="streak-days"><span className="day-done">M</span><span className="day-done">T</span><span className="day-done">W</span><span className="day-today">T</span><span>F</span><span>S</span><span>S</span></div></div>
        </div>
        <button className="profile-row" onClick={() => setToast("Profile settings coming soon.")}>
          <div className="avatar">AK</div><span><b>Student account</b><small>Free plan</small></span><MoreHorizontal size={19} />
        </button>
      </aside>

      {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><button className="mobile-menu-button icon-button" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button><span>Workspace</span><ChevronRight size={14} /><b>{activeNav}</b></div>
          <div className="topbar-actions">
            <button className="search-button" onClick={() => setSearchOpen(!searchOpen)}><Search size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast("You're all caught up!")}><Bell size={19} /><i /></button>
          </div>
        </header>

        {searchOpen && <div className="search-popover"><Search size={17} /><input autoFocus placeholder="Search tasks, subjects, notes..." onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter") { setToast("Search is ready as your library grows."); setSearchOpen(false); } }} /><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={17} /></button></div>}

        <div className="page-content">
          <div className="welcome-row">
            <div><div className="date-line"><span className="date-spark">✳</span> WEDNESDAY, OCTOBER 21</div><h1>{getGreeting()}, Ayush <span className="wave">✌️</span></h1><p className="welcome-subtitle">A little progress each day adds up to big results.</p></div>
            <button className="primary-button top-plan-button" onClick={() => { setShowAddTask(true); setActiveNav("My planner"); }}><Plus size={17} /> Add a task</button>
          </div>

          <section className="hero-card">
            <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
            <div className="hero-copy"><div className="hero-eyebrow"><Sparkles size={14} /> YOUR DAILY STUDY PLAN</div><h2>Small steps.<br /><em>Big breakthroughs.</em></h2><p>You're building something great. Let's make today count, one focused session at a time.</p><button className="hero-button" onClick={() => { setActiveNav("My planner"); setToast("Let's work through your study plan."); }}>View my study plan <ArrowRight size={16} /></button></div>
            <div className="hero-art" aria-hidden="true"><div className="art-halo" /><div className="art-book book-back" /><div className="art-book book-front"><div className="book-lines"><i /><i /><i /><i /></div><div className="book-sun">✳</div></div><div className="art-star star-a">✦</div><div className="art-star star-b">✳</div><div className="art-orbit" /><div className="art-pill pill-top"><CheckCircle2 size={14} /> One step at a time</div><div className="art-pill pill-bottom"><Zap size={14} /> You've got this!</div></div>
            <div className="hero-pagination"><span className="active-dot" /><span /><span /></div>
          </section>

          <section className="stats-grid" aria-label="Study statistics">
            <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-lilac"><Target size={18} /></span><span className="stat-caption">THIS WEEK</span></div><div className="stat-value">8.5 <small>hrs</small></div><div className="stat-bottom"><span className="positive"><ArrowUpRight size={14} /> 12.5%</span><span>vs. last week</span><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></div></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-mint"><CheckCircle2 size={18} /></span><span className="stat-caption">TASKS DONE</span></div><div className="stat-value">{completedCount}<small> / {tasks.length}</small></div><div className="stat-bottom"><span className="stat-muted">{pendingCount} left to go</span><div className="stat-progress"><span style={{ width: `${progress}%` }} /></div></div></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-peach"><Flame size={18} /></span><span className="stat-caption">CURRENT STREAK</span></div><div className="stat-value">4 <small>days</small></div><div className="stat-bottom"><span className="stat-muted">You're on fire 🔥</span><div className="streak-mini"><i /><i /><i /><i /><i /><i /><i /></div></div></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon stat-blue"><BrainCircuit size={18} /></span><span className="stat-caption">AVG. ACCURACY</span></div><div className="stat-value">86<small>%</small></div><div className="stat-bottom"><span className="positive"><ArrowUpRight size={14} /> 4.2%</span><span>looking good!</span><div className="accuracy-ring"><span /></div></div></div>
          </section>

          <div className="content-grid">
            <section className="panel tasks-panel">
              <div className="panel-heading"><div><div className="panel-title-row"><h3>Today's focus</h3><span className="count-badge">{pendingCount} tasks</span></div><p>Make room for what matters most.</p></div><button className="text-button" onClick={() => { setActiveNav("My planner"); setToast("Showing your task list."); }}>View all <ArrowRight size={15} /></button></div>
              {showAddTask && <form className="add-task-form" onSubmit={(event) => { event.preventDefault(); addTask(); }}><input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="What do you need to do?" autoFocus aria-label="New task title" /><button type="submit" className="icon-button add-confirm" aria-label="Save task"><Check size={17} /></button><button type="button" className="icon-button" aria-label="Cancel" onClick={() => setShowAddTask(false)}><X size={17} /></button></form>}
              <div className="task-list">{visibleTasks.map((task) => <div className={`task-row ${task.done ? "task-complete" : ""}`} key={task.id}><button className={`task-check ${task.done ? "checked" : ""}`} aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} onClick={() => toggleTask(task.id)}>{task.done && <Check size={14} />}</button><div className="task-main"><b>{task.title}</b><div className="task-meta"><span className={`task-subject subject-${task.subject.toLowerCase()}`}>{task.subject}</span><span className="meta-separator">·</span><Clock3 size={12} /><span>{task.time}</span></div></div><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span><button className="task-more icon-button" aria-label={`More options for ${task.title}`} onClick={() => { setTasks((current) => current.filter((item) => item.id !== task.id)); setToast("Task removed"); }}><MoreHorizontal size={18} /></button></div>)}</div>
              <button className="add-task-link" onClick={() => setShowAddTask(!showAddTask)}><Plus size={16} /> Add a new task</button>
            </section>

            <section className="panel focus-panel">
              <div className="panel-heading"><div><h3>Focus room</h3><p>A little quiet goes a long way.</p></div><span className="live-badge"><span /> FOCUS TIME</span></div>
              <div className="focus-content"><div className="focus-ring"><div className="focus-ring-inner"><span className="focus-label">{focusRunning ? "YOU'RE IN THE ZONE" : "TIME TO FOCUS"}</span><strong>{focusTime}</strong><span className="focus-session">{focusStarted ? "Keep going, you've got this" : "25 min session"}</span></div></div><div className="focus-actions"><button className="focus-start" onClick={() => { if (focusSeconds === 0) setFocusSeconds(25 * 60); setFocusRunning(!focusRunning); setFocusStarted(true); }}>{focusRunning ? "Pause session" : focusStarted && focusSeconds > 0 ? "Resume focus" : "Start focusing"}{focusRunning ? <span>Ⅱ</span> : <ArrowRight size={16} />}</button><button className="focus-reset" onClick={() => { setFocusRunning(false); setFocusSeconds(25 * 60); setFocusStarted(false); }}>Reset</button></div></div>
              <div className="focus-footer"><span><span className="focus-footer-dot" /> Stay present, one thing at a time.</span><button aria-label="Focus settings" onClick={() => setToast("Timer is set to 25 minutes. Custom durations are coming soon.")}><Settings2 size={15} /></button></div>
            </section>
          </div>

          <div className="bottom-grid">
            <section className="panel subjects-panel"><div className="panel-heading"><div><h3>Your subjects</h3><p>Look how far you've come.</p></div><button className="text-button" onClick={() => setToast("More subjects coming soon.")}>All subjects <ArrowRight size={15} /></button></div><div className="subject-cards">{subjects.map((subject) => <button className="subject-card" key={subject.name} onClick={() => { setActiveNav("My library"); setToast(`${subject.name} workspace selected`); }}><div className="subject-card-top"><div className={`subject-monogram ${subject.tone}`}>{subject.initials}</div><MoreHorizontal size={18} /></div><b>{subject.name}</b><span>{subject.detail}</span><div className="subject-progress-label"><span>Course progress</span><b>{subject.value}%</b></div><div className="subject-progress"><span className={subject.tone} style={{ width: `${subject.value}%` }} /></div></button>)}</div></section>
            <section className="panel buddy-panel"><div className="buddy-heading"><div className="buddy-icon"><BrainCircuit size={19} /></div><div><h3>Your AI study buddy</h3><p>Curious about something? Ask away.</p></div><span className="online-dot" /></div><div className="buddy-prompt"><span className="buddy-spark"><Sparkles size={15} /></span><p>Need a little clarity? Let's break down a tricky concept together.</p></div><div className="suggestion-chips"><button onClick={() => { setActiveNav("AI study buddy"); void sendMessage("Explain a difficult concept in simple terms."); }}>Explain a concept <ArrowUpRight size={13} /></button><button onClick={() => { setActiveNav("AI study buddy"); void sendMessage("Create 5 quick revision questions for me."); }}>Quick quiz <ArrowUpRight size={13} /></button></div><form className="buddy-input" onSubmit={(event) => { event.preventDefault(); setActiveNav("AI study buddy"); void sendMessage(); }}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask me anything..." aria-label="Ask your AI study buddy" /><button type="button" className="mic-button" aria-label="Voice input is not enabled yet" onClick={() => setToast("Voice input is coming soon.")}><Mic size={16} /></button><button type="submit" className="send-button" aria-label="Send question" disabled={!chatInput.trim() || chatLoading}><Send size={15} /></button></form><div className="buddy-messages" aria-live="polite">{messages.slice(-4).map((message, index) => <div className={`mini-message ${message.role}`} key={index}>{message.role === "assistant" && <Sparkles size={13} />}<span>{message.text}</span></div>)}{chatLoading && <div className="mini-message assistant"><span className="typing-dots">Thinking<span>.</span><span>.</span><span>.</span></span></div>}</div></section>
          </div>

          <footer className="page-footer"><span>Made for your next little breakthrough <span className="footer-heart">♥</span></span><span><span className="footer-status" /> Your study space is ready <span className="footer-separator">·</span> <button onClick={() => setToast("StudyOS v1.0 · Your data stays in this browser until you configure a backend.")}>About StudyOS</button></span></footer>
        </div>
      </section>
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
    </main>
  );
}
