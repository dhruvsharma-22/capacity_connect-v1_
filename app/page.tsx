"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { demoCourses, demoSkills } from "@/lib/demo-data";
import { PortalLayout } from "@/components/portal-layout";
import { Activity, ArrowRight, Bell, BookOpen, BrainCircuit, Check, ChevronDown, CircleHelp, FileText, GraduationCap, LayoutDashboard, MessageCircle, MoreHorizontal, Search, Send, Sparkles, Target, Users, X } from "lucide-react";

const initialMessages = [{ role: "ai", text: "Ask about monsoon dynamics, CAPE, or your next course." }];
const suggestions = ["Explain monsoon onset", "Recommend my next course", "What is CAPE?"];
const courses = demoCourses;
const skillProgress = demoSkills;
const matches = [
  { initials: "AN", name: "Dr. Ananya Nair", role: "Synoptic Meteorology", score: 96, tone: "rose" },
  { initials: "RK", name: "Prof. R. Krishnan", role: "Numerical Weather Prediction", score: 91, tone: "blue" },
  { initials: "SM", name: "Dr. S. Menon", role: "Climate Data & Modelling", score: 87, tone: "gold" },
];

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [courseContext, setCourseContext] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [trainerScores, setTrainerScores] = useState(matches.map(trainer => trainer.score));
  const [matchingTrainers, setMatchingTrainers] = useState(false);
  const [performanceReport, setPerformanceReport] = useState("");
  const [courseAdvice, setCourseAdvice] = useState("");
  const [courseProgress, setCourseProgress] = useState(courses.map(course => course.progress));
  const [utilityPanel, setUtilityPanel] = useState(false);


  useEffect(() => {
    try {
      const chat = localStorage.getItem("capacity-connect-chat-v1");
      const progress = localStorage.getItem("capacity-connect-progress-v1");
      if (chat) setMessages(JSON.parse(chat));
      if (progress) {
        const saved = JSON.parse(progress);
        if (Array.isArray(saved)) setCourseProgress(courses.map((course, index) => {
          const value = Number(saved[index] ?? course.progress);
          return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : course.progress;
        }));
      }
    } catch { /* Ignore invalid local demo data and start fresh. */ }
    setPersistenceReady(true);
  }, []);

  useEffect(() => {
    if (!persistenceReady) return;
    try { localStorage.setItem("capacity-connect-chat-v1", JSON.stringify(messages)); } catch { /* Keep the current session usable if storage is full. */ }
  }, [messages, persistenceReady]);

  useEffect(() => {
    if (persistenceReady) try { localStorage.setItem("capacity-connect-progress-v1", JSON.stringify(courseProgress)); } catch { /* Keep the current session usable if storage is full. */ }
  }, [courseProgress, persistenceReady]);

  async function importPDF(file: File) {
    setPdfLoading(true); 
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/ai/ingest", {method:"POST",body:form});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read this PDF.");
      setCourseContext(data.text); setPdfFileName(file.name);
      setNotice("PDF text extracted for this local demo. It was not saved to a shared course library.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not read this PDF."); }
    finally { setPdfLoading(false); }
  }

  function continueCourse(index: number, title: string) {
    setCourseProgress(previous => previous.map((value, i) => i === index ? Math.min(100, value + 8) : value));
    announce(`${title} progress saved`);
  }

  function ask(value: string) {
    const q = value.trim(); if (!q) return;
    setMessages(previous => [...previous, { role: "you", text: q }].slice(-60));
    setPrompt(""); setAssistantLoading(true);
    window.setTimeout(() => {
      const lower = q.toLowerCase();
      const answer = lower.includes("cape")
        ? "CAPE (convective available potential energy) estimates the buoyant energy available to an ascending air parcel. Check it together with inhibition, moisture, and forcing; CAPE alone does not guarantee thunderstorms."
        : lower.includes("monsoon")
          ? "The sample course describes monsoon onset through sustained rainfall, strengthening westerly winds, increased lower-tropospheric moisture, and a northward shift of the ITCZ."
          : lower.includes("recommend") || lower.includes("next course")
            ? "Based on the sample skill profile, Numerical Weather Prediction is a useful next course, followed by Climate Data & Modelling."
            : `For “${q}”, start by connecting the observation to its synoptic setting, then compare it with your course notes and check forecast uncertainty.${courseContext.trim() ? " I’ve included your notes as context for this mock response." : " Add course notes if you want to keep a reference beside your question."}`;
      setMessages(previous => [...previous, { role: "ai", text: answer }].slice(-60)); setAssistantLoading(false);
    }, 350);
  }

  function recommendTrainers() {
    setMatchingTrainers(true);
    window.setTimeout(() => {
      setTrainerScores([96, 91, 87]);
      setMatchingTrainers(false);
      setNotice("Sample teacher matches refreshed.");
    }, 300);
  }

  function analyzePerformance() {
    setPerformanceReport("Strength: Synoptic Meteorology · Focus: Climate Data & Modelling");
  }

  function recommendCourses() {
    setCourseAdvice("Next course: Numerical Weather Prediction");
  }

  function announce(label: string) { setNotice(label); window.setTimeout(() => setNotice(""), 2600); }

  function openPanel() { setUtilityPanel(true); }

  return <PortalLayout>
    <div className="dashboard-view">
        <div className="pdf-import-bar"><div><b>Course notes</b><span>{pdfFileName || "No file loaded"}</span></div><label className="pdf-upload-label">{pdfLoading ? "Reading PDF…" : "Upload PDF"}<input type="file" accept="application/pdf,.pdf" disabled={pdfLoading} onChange={e => {const file=e.target.files?.[0]; if(file) void importPDF(file); e.currentTarget.value="";}} /></label></div>
        <div className="welcome-row"><div><h1>Good morning, Divya</h1><p className="welcome-copy">Your learning desk is ready. Here’s the latest on your forecast practice.</p></div><button className="date-btn" onClick={() => openPanel()}>Monday, 16 June <ChevronDown size={14}/></button></div>

        <section className="synoptic-field" aria-label="Sample monsoon forecast outlook">
          <div className="synoptic-copy"><span className="field-status"><i/> SAMPLE FORECAST OUTLOOK</span><h2>Westerly flow is building over the Arabian Sea.</h2><p>Review the onset signals in your current monsoon lesson and connect the circulation pattern to rainfall over the subcontinent.</p><div className="field-readout"><span><small>REGION</small><b>Arabian Sea</b></span><span><small>LEVEL</small><b>850 hPa</b></span><span><small>FLOW</small><b>Westerly · strengthening</b></span></div><Link href="/courses/monsoon-dynamics" className="field-link">Review monsoon lesson <ArrowRight size={14}/></Link></div>
          <div className="synoptic-visual" role="img" aria-label="Illustrative monsoon wind field with westerly flow and pressure contours"><svg viewBox="0 0 560 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="field-grid" width="56" height="50" patternUnits="userSpaceOnUse"><path d="M 56 0 L 0 0 0 50" fill="none" stroke="#c9e1dd" strokeOpacity=".11" strokeWidth="1"/></pattern><marker id="wind-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="none" stroke="#e5f2e8" strokeWidth="1.2"/></marker></defs><rect width="560" height="300" fill="url(#field-grid)"/><g fill="none" stroke="#b9ddd5" strokeOpacity=".55"><path d="M-30 225 C65 180 92 182 156 205 S259 248 329 193 S453 120 598 157"/><path d="M-20 248 C61 210 104 208 166 228 S273 262 347 215 S462 153 589 183"/><path d="M-36 197 C46 154 98 153 150 174 S254 216 316 163 S437 91 599 124"/><path d="M-30 166 C46 124 98 124 145 144 S244 184 302 133 S423 62 590 91"/><path d="M-30 134 C40 94 83 91 131 111 S226 150 281 99 S410 34 595 59"/></g><g stroke="#e7f4ed" strokeOpacity=".83" strokeWidth="1.5" markerEnd="url(#wind-arrow)"><path d="M67 214 C117 202 144 187 180 168"/><path d="M133 242 C187 225 218 204 248 181"/><path d="M210 218 C255 202 282 183 310 159"/><path d="M290 236 C334 219 360 198 386 177"/><path d="M366 204 C411 190 441 170 466 147"/></g><g fill="#f2cc83"><circle cx="181" cy="168" r="3"/><circle cx="248" cy="181" r="3"/><circle cx="386" cy="177" r="3"/></g><g fill="#f4f2e9" fontFamily="Arial,sans-serif" fontSize="9"><text x="383" y="65" letterSpacing="1">INDIA</text><text x="72" y="272" letterSpacing="1">ARABIAN SEA</text></g><circle cx="440" cy="116" r="34" fill="none" stroke="#e3b86f" strokeOpacity=".7" strokeDasharray="3 4"/><text x="426" y="119" fill="#f4d395" fontFamily="Arial,sans-serif" fontSize="9">LOW</text></svg><div className="field-map-caption"><span><i/>Westerly flow</span><span>Illustrative training map</span></div></div>
        </section>

        <div className="metrics">
          <article className="metric-card"><div className="metric-top">Learning hours</div><div className="metric-value">24.5 <small>hrs</small></div></article>
          <article className="metric-card"><div className="metric-top">Skills in progress</div><div className="metric-value">6</div></article>
          <article className="metric-card"><div className="metric-top">Assessment score</div><div className="metric-value">86<small>%</small></div></article>
        </div>

        <div className="performance-action"><button onClick={analyzePerformance}>Review learning insights <ArrowRight size={13}/></button><button onClick={recommendCourses}>Recommend a course <ArrowRight size={13}/></button><Link href="/quiz" className="dashboard-quiz-link">Take a quiz <ArrowRight size={13}/></Link>{performanceReport && <span>{performanceReport}</span>}{courseAdvice && <span>{courseAdvice}</span>}</div>
        <div className="section-heading"><div><h2>Pick up where you left off</h2></div><Link className="see-all" href="/courses">All courses <ArrowRight size={14}/></Link></div>
        <div className="course-grid">{courses.slice(0, 2).map((course, i) => { const progress = courseProgress[i] ?? course.progress; const completed = Math.round(course.lessons * progress / 100); return <article className="course-card" key={course.title}><Link href={`/courses/${course.slug}`} className={`course-art ${course.iconClass}`}><course.icon size={20}/><span className="course-kicker">{course.category}</span></Link><div className="course-info"><div className="course-title-row"><div><h3><Link href={`/courses/${course.slug}`}>{course.title}</Link></h3><p className="instructor"><Link href={`/trainers/${course.teacherSlug}`}>{course.instructor}</Link></p></div><button className="dots" onClick={() => router.push(`/courses/${course.slug}`)} aria-label={`${course.title} details`}><MoreHorizontal size={18}/></button></div><div className="progress-label"><span>{completed} of {course.lessons} lessons</span><b>{progress}%</b></div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div><div className="course-bottom"><span><span className="clock-dot">◷</span> {progress === 100 ? "Completed" : course.time}</span><button onClick={() => continueCourse(i, course.title)} className="continue-btn">{progress === 0 ? "Start course" : progress === 100 ? "Review" : "Continue"} <ArrowRight size={14}/></button></div></div></article>; })}</div>

        <section className="learning-insights" aria-label="Learning insights">
          <div className="insight-heading"><h2>Skills</h2><Link className="see-all" href="/skills">View all</Link></div>
          <div className="skill-progress-list">{skillProgress.map(skill => <div className="skill-progress-row" key={skill.name}><div className="skill-progress-meta"><b>{skill.name}</b><span>{skill.score}%</span></div><div className="progress-track"><span className="skill-fill" style={{width:`${skill.score}%`}}/></div></div>)}</div>
        </section>

        <div className="lower-grid">
          <article className="assistant-card"><div className="assistant-head"><h2>Meteorology assistant</h2></div><div className="chat-body">{messages.slice(-3).map((m, i) => <div key={i} className={`chat-row ${m.role === "you" ? "from-user" : ""}`}><div className={`chat-bubble ${m.role}`}>{m.text}</div></div>)}{assistantLoading && <div className="chat-row"><div className="chat-bubble ai">Thinking through that…</div></div>}<div className="suggestions">{suggestions.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div></div>{showContext && <textarea className="chat-context-input" aria-label="Course material to ground answers" placeholder="Paste course notes or an excerpt here…" value={courseContext} onChange={e => setCourseContext(e.target.value)} /> }<form className="chat-input" onSubmit={e => {e.preventDefault(); ask(prompt);}}><input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask about a concept, course, or skill..." disabled={assistantLoading}/><button aria-label="Send message" disabled={assistantLoading}><Send size={16}/></button></form><div className="assistant-foot"><button onClick={() => setShowContext(value => !value)}>{showContext ? "Hide course notes" : "Add course notes"} <ArrowRight size={12}/></button></div></article>
          <article className="trainer-card"><div className="trainer-head"><div><h2>Recommended teachers</h2></div></div><div className="match-list">{matches.map((m,index) => <div className="match-row" key={m.name}><div className="avatar">{m.initials}</div><div className="match-person"><b>{m.name}</b><small>{m.role}</small></div><div className="match-score"><strong>{trainerScores[index]}%</strong><small>match</small></div></div>)}</div><button className="find-mentor" onClick={recommendTrainers} disabled={matchingTrainers}>{matchingTrainers ? "Matching…" : "Refresh matches"} <ArrowRight size={14}/></button></article>
        </div>
        
    </div>
    {utilityPanel && <div className="modal-backdrop utility-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setUtilityPanel(false);}}><section className="utility-modal" role="dialog" aria-modal="true" aria-labelledby="utility-title"><header><div><h2 id="utility-title">Your learning schedule</h2></div><button className="quiz-close" aria-label="Close" onClick={() => setUtilityPanel(false)}><X size={18}/></button></header>
      {utilityPanel && <div className="utility-list"><div className="schedule-date"><b>Mon, 16 June</b><span>2h 30m</span></div>{[["09:00","Monsoon Dynamics","Lesson 9 · Active and break phases","45 min"],["11:30","Forecast review","Practice: interpret a synoptic chart","60 min"],["14:00","Mentor session","Dr. Ananya Nair · Synoptic Meteorology","45 min"]].map(([time,title,description,duration])=><div className="schedule-item" key={time}><time>{time}</time><i/><span><b>{title}</b><small>{description}</small></span><em>{duration}</em></div>)}</div>}

    </section></div>}
    {notice && <div className="toast"><Check size={16}/>{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={14}/></button></div>}
  </PortalLayout>;
}
