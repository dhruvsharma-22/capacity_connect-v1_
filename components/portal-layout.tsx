"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, Bell, BookOpen, BrainCircuit, CircleHelp, GraduationCap, LayoutDashboard, LogOut, MessageCircle, Search, Target, Users, Wind } from "lucide-react";

const navItems = [
  {label:"Overview",href:"/",icon:LayoutDashboard},
  {label:"My learning",href:"/learning",icon:BookOpen},
  {label:"Assistant",href:"/assistant",icon:MessageCircle},
  {label:"Skill map",href:"/skills",icon:Target},
  {label:"Courses",href:"/courses",icon:GraduationCap},
  {label:"Teachers",href:"/trainers",icon:Users},
  {label:"Quiz studio",href:"/quiz",icon:BrainCircuit},
  {label:"Insights",href:"/insights",icon:Activity},
  {label:"Help & support",href:"/help",icon:CircleHelp},
];

export function PortalLayout({children}: {children:ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready,setReady] = useState(false);
  const [user,setUser] = useState({name:"Divya K.",role:"Senior Forecaster"});
  const [notice,setNotice] = useState("");
  useEffect(()=>{
    const raw=localStorage.getItem("capacity-connect-session-v1");
    if(!raw){router.replace("/login");return;}
    try{const session=JSON.parse(raw);if(session?.name)setUser({name:session.name,role:session.role||"Learner"});}catch{localStorage.removeItem("capacity-connect-session-v1");router.replace("/login");return;}
    setReady(true);
  },[router]);
  function signOut(){localStorage.removeItem("capacity-connect-session-v1");router.replace("/login");}
  const active=navItems.find(item=>item.href===pathname)?.label
    ||(pathname.startsWith("/trainers")?"Teachers"
    :pathname.startsWith("/courses")?"Courses"
    :pathname.startsWith("/profile")?"Profile"
    :"Overview");
  if(!ready)return <div className="portal-loading"><span className="portal-spinner"/>Loading…</div>;
  return <main className="shell portal-shell">
    <aside className="sidebar portal-sidebar">
      <Link className="brand" href="/"><span className="brand-mark"><Wind size={16}/></span><span>Capacity Connect</span></Link>
      <div className="workspace"><span><b>IMD Academy</b><small>Learning workspace</small></span></div>
      <nav className="portal-nav">{navItems.map(({label,href,icon:Icon})=><Link href={href} key={href} aria-label={label} title={label} className={`nav-item ${active===label?"selected":""}`}><Icon size={17}/><span>{label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/profile" className="profile profile-link" aria-label="Open account settings"><div className="avatar avatar-me">{user.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div><span><b>{user.name}</b><small>{user.role}</small></span></Link><button className="signout-icon" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={16}/><span>Sign out</span></button></div>
    </aside>
    <section className="main-area"><header className="topbar"><div className="breadcrumbs"><Link href="/">IMD Academy</Link><span>/</span><b>{active}</b></div><div className="top-actions"><Link className="search-btn portal-search" href="/courses"><Search size={15}/><span>Search courses</span></Link><button className="icon-btn" aria-label="Notifications" onClick={()=>setNotice("You're all caught up. These are sample notifications for the demo.")}><Bell size={18}/><i/></button></div></header><div className="content portal-content">{children}</div></section>
    {notice&&<div className="toast"><Bell size={15}/>{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss">×</button></div>}
  </main>;
}
