"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wind } from "lucide-react";

export default function LoginPage(){
  const router=useRouter();
  const [mode,setMode]=useState<"signin"|"signup">("signin");
  const [name,setName]=useState("Divya K.");
  const [email,setEmail]=useState("divya@imd.demo");
  const [password,setPassword]=useState("forecast123");
  const [message,setMessage]=useState("");
  function submit(e:FormEvent){
    e.preventDefault();
    if(!email.includes("@")){setMessage("Enter a valid email address.");return;}
    if(password.length<6){setMessage("Password must be at least 6 characters.");return;}
    const displayName=name.trim()||email.split("@")[0];
    localStorage.setItem("capacity-connect-session-v1",JSON.stringify({name:displayName,role:"Senior Forecaster",email,createdAt:new Date().toISOString()}));
    router.replace("/");
  }
  return <main className="login-page">
    <section className="login-brief"><Link className="brand" href="/"><span className="brand-mark"><Wind size={17}/></span><span>Capacity Connect</span></Link><div className="login-brief-copy"><span>IMD ACADEMY · FORECAST TRAINING</span><h1>Read the atmosphere.<br/>Trust your craft.</h1><p>A learning desk for forecasters to build skill through focused courses, field notes, and practical assessments.</p><div className="login-brief-data"><span><b>05</b><small>sample courses</small></span><span><b>06</b><small>forecast skills</small></span><span><b>24.5h</b><small>weekly practice</small></span></div></div><div className="login-brief-foot">A local demonstration workspace · all learner records are sample data</div></section>
    <section className="login-form-shell"><form className="login-card" onSubmit={submit}>
      <span className="login-card-eyebrow">Your learning workspace</span><h1>{mode==="signin"?"Welcome back":"Create your profile"}</h1><p>{mode==="signin"?"Sign in to continue to your forecast desk.":"Set up a local mock profile. No email is sent."}</p>
      {mode==="signup"&&<label>Name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
      <label>Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"}/></label>
      {message&&<p className="login-message" role="status">{message}</p>}
      <button className="primary-action login-submit">{mode==="signin"?"Sign in":"Create account"}</button>
      {mode==="signin"&&<button type="button" className="forgot-link" onClick={()=>setMessage("Demo sign-in: divya@imd.demo · forecast123")}>Forgot password?</button>}
      <p className="login-switch">{mode==="signin"?"New here?":"Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("");}}>{mode==="signin"?"Create account":"Sign in"}</button></p>
      <p className="login-demo">Demo account: divya@imd.demo · forecast123</p>
    </form></section>
  </main>;
}
