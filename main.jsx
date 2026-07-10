import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Plus, Search, Trash2, Pencil, X, Users, CalendarDays, ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "job-calendar-scheduler-v2";

const initialData = {
  teamMembers: [
    { id: "gary", name: "Gary", role: "Supervisor" },
    { id: "mick", name: "Mick", role: "Carpentry" },
    { id: "drew", name: "Drew", role: "Plumbing" },
    { id: "gaz", name: "Gaz", role: "Electrical" },
    { id: "unassigned-worker", name: "Unassigned", role: "Holding row" }
  ],
  jobs: [
    { id: crypto.randomUUID(), title: "Repair damaged roller door rail", client: "Sodexo FM", location: "Paraburdoo", scheduledDate: getIsoDate(addDays(new Date(), 0)), priority: "High", status: "Booked", assignedTo: "gary", notes: "Cut out damaged RHS, weld new rail, paint welds, demobilise." },
    { id: crypto.randomUUID(), title: "Install Colorbond fencing", client: "Residential", location: "Busselton", scheduledDate: getIsoDate(addDays(new Date(), 1)), priority: "Medium", status: "Ready", assignedTo: "mick", notes: "Confirm materials, services, set out and install." },
    { id: crypto.randomUUID(), title: "AC vent patching and painting", client: "Property Team", location: "Village accommodation", scheduledDate: getIsoDate(addDays(new Date(), 3)), priority: "Medium", status: "Awaiting access", assignedTo: "gary", notes: "Tenant may need transit room before works proceed." },
    { id: crypto.randomUUID(), title: "Quote shower room ceiling", client: "FM Team", location: "Site TBC", scheduledDate: "", priority: "Low", status: "Not scheduled", assignedTo: "unassigned-worker", notes: "Unscheduled job example. Drag onto the calendar when ready." }
  ]
};

function App() {
  const [data, setData] = useState(loadData);
  const [query, setQuery] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [draggedJobId, setDraggedJobId] = useState(null);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.jobs;
    return data.jobs.filter((job) => [job.title, job.client, job.location, job.priority, job.status, job.notes, job.scheduledDate, getWorkerName(data.teamMembers, job.assignedTo)].join(" ").toLowerCase().includes(q));
  }, [data.jobs, data.teamMembers, query]);

  const scheduledJobs = filteredJobs.filter((job) => job.scheduledDate);
  const unscheduledJobs = filteredJobs.filter((job) => !job.scheduledDate);

  function updateData(next) { setData(next); saveData(next); }
  function addJob(defaults = {}) { setEditingJob(emptyJob(defaults)); }
  function saveJob(jobToSave) {
    const exists = data.jobs.some((j) => j.id === jobToSave.id);
    const nextJobs = exists ? data.jobs.map((j) => (j.id === jobToSave.id ? jobToSave : j)) : [jobToSave, ...data.jobs];
    updateData({ ...data, jobs: nextJobs });
    setEditingJob(null);
  }
  function deleteJob(jobId) {
    if (!confirm("Delete this job?")) return;
    updateData({ ...data, jobs: data.jobs.filter((j) => j.id !== jobId) });
  }
  function moveJob(jobId, assignedTo, scheduledDate) {
    updateData({ ...data, jobs: data.jobs.map((job) => job.id === jobId ? { ...job, assignedTo, scheduledDate } : job) });
  }
  function unscheduleJob(jobId) {
    updateData({ ...data, jobs: data.jobs.map((job) => job.id === jobId ? { ...job, scheduledDate: "" } : job) });
  }
  function addTeamMember() {
    const name = prompt("Worker name:");
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    updateData({ ...data, teamMembers: [...data.teamMembers, { id, name, role: "" }] });
  }
  function removeTeamMember(memberId) {
    if (memberId === "unassigned-worker") { alert("The Unassigned row cannot be removed."); return; }
    if (!confirm("Remove this worker? Their jobs will move to Unassigned.")) return;
    updateData({ teamMembers: data.teamMembers.filter((m) => m.id !== memberId), jobs: data.jobs.map((j) => j.assignedTo === memberId ? { ...j, assignedTo: "unassigned-worker" } : j) });
  }
  function resetDemoData() {
    if (!confirm("Reset all jobs and workers to the demo data?")) return;
    updateData(initialData); setWeekStart(getStartOfWeek(new Date()));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div><h1>Job Calendar Scheduler</h1><p>Workers are rows. Days are columns. Drag jobs to assign them to a worker and date.</p></div>
        <div className="actions"><button className="secondary" onClick={addTeamMember}><Users size={16} /> Add worker</button><button className="primary" onClick={() => addJob()}><Plus size={16} /> New job</button></div>
      </header>
      <section className="toolbar">
        <div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs, clients, locations, workers, notes..." /></div>
        <div className="week-controls"><button className="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /> Previous</button><button className="secondary" onClick={() => setWeekStart(getStartOfWeek(new Date()))}>This week</button><button className="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next <ChevronRight size={16} /></button></div>
      </section>
      <section className="unscheduled-panel" onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggedJobId) unscheduleJob(draggedJobId); setDraggedJobId(null); }}>
        <div className="unscheduled-header"><div><h2>Unscheduled jobs</h2><p>Drag jobs here if they are not booked to a date yet.</p></div><button className="secondary" onClick={() => addJob({ scheduledDate: "" })}><CalendarPlus size={16} /> Add unscheduled job</button></div>
        <div className="unscheduled-cards">
          {unscheduledJobs.map((job) => <JobCard key={job.id} job={job} compact workerName={getWorkerName(data.teamMembers, job.assignedTo)} onDragStart={() => setDraggedJobId(job.id)} onEdit={() => setEditingJob(job)} onDelete={() => deleteJob(job.id)} />)}
          {unscheduledJobs.length === 0 && <div className="empty small">No unscheduled jobs</div>}
        </div>
      </section>
      <main className="calendar-wrap">
        <div className="calendar-grid" style={{ "--day-count": days.length }}>
          <div className="corner-cell"><span>Workers</span></div>
          {days.map((day) => <div key={getIsoDate(day)} className={`day-header ${isToday(day) ? "today" : ""}`}><strong>{formatDayName(day)}</strong><span>{formatDateHeader(day)}</span></div>)}
          {data.teamMembers.map((member) => (
            <React.Fragment key={member.id}>
              <div className="worker-cell"><div><strong>{member.name}</strong><span>{member.role || "Team member"}</span></div><button title="Remove worker" onClick={() => removeTeamMember(member.id)}><X size={15} /></button></div>
              {days.map((day) => {
                const iso = getIsoDate(day);
                const cellJobs = scheduledJobs.filter((job) => job.assignedTo === member.id && job.scheduledDate === iso);
                return <div key={`${member.id}-${iso}`} className={`calendar-cell ${isToday(day) ? "today-cell" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggedJobId) moveJob(draggedJobId, member.id, iso); setDraggedJobId(null); }}>
                  <button className="add-cell-job" onClick={() => addJob({ assignedTo: member.id, scheduledDate: iso })}><Plus size={14} /> Add</button>
                  <div className="cell-jobs">{cellJobs.map((job) => <JobCard key={job.id} job={job} compact onDragStart={() => setDraggedJobId(job.id)} onEdit={() => setEditingJob(job)} onDelete={() => deleteJob(job.id)} />)}</div>
                </div>;
              })}
            </React.Fragment>
          ))}
        </div>
      </main>
      <footer className="footer-actions"><button className="ghost" onClick={resetDemoData}>Reset demo data</button></footer>
      {editingJob && <JobModal job={editingJob} teamMembers={data.teamMembers} onClose={() => setEditingJob(null)} onSave={saveJob} />}
    </div>
  );
}

function JobCard({ job, onDragStart, onEdit, onDelete, compact = false, workerName = "" }) {
  return <article className={`card ${compact ? "compact" : ""}`} draggable onDragStart={onDragStart}>
    <div className="card-top"><span className={`priority ${job.priority.toLowerCase()}`}>{job.priority}</span><div className="card-actions"><button onClick={onEdit} title="Edit job"><Pencil size={14} /></button><button onClick={onDelete} title="Delete job"><Trash2 size={14} /></button></div></div>
    <h3>{job.title || "Untitled job"}</h3>
    <div className="meta">{job.client && <span>{job.client}</span>}{job.location && <span>{job.location}</span>}{workerName && <span>{workerName}</span>}</div>
    <div className="status-row"><span className="status">{job.status}</span>{job.scheduledDate && <span className="date"><CalendarDays size={13} /> {formatShortDate(job.scheduledDate)}</span>}</div>
    {job.notes && <p>{job.notes}</p>}
  </article>;
}

function JobModal({ job, teamMembers, onClose, onSave }) {
  const [form, setForm] = useState(job);
  function update(field, value) { setForm({ ...form, [field]: value }); }
  function submit(e) { e.preventDefault(); if (!form.title.trim()) { alert("Please enter a job title."); return; } onSave(form); }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}>
    <div className="modal-header"><h2>{job.title ? "Edit job" : "New job"}</h2><button type="button" className="icon" onClick={onClose}><X size={18} /></button></div>
    <label>Job title<input value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
    <div className="two-col"><label>Client<input value={form.client} onChange={(e) => update("client", e.target.value)} /></label><label>Location<input value={form.location} onChange={(e) => update("location", e.target.value)} /></label></div>
    <div className="two-col"><label>Scheduled date<input type="date" value={form.scheduledDate} onChange={(e) => update("scheduledDate", e.target.value)} /></label><label>Assigned worker<select value={form.assignedTo} onChange={(e) => update("assignedTo", e.target.value)}>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div>
    <div className="two-col"><label>Priority<select value={form.priority} onChange={(e) => update("priority", e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label><label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option>Not scheduled</option><option>Not started</option><option>Ready</option><option>Booked</option><option>Awaiting access</option><option>In progress</option><option>Completed</option><option>On hold</option></select></label></div>
    <label>Notes<textarea rows="5" value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
    <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary">Save job</button></div>
  </form></div>;
}

function emptyJob(defaults = {}) { return { id: crypto.randomUUID(), title: "", client: "", location: "", scheduledDate: defaults.scheduledDate ?? getIsoDate(new Date()), priority: "Medium", status: defaults.scheduledDate === "" ? "Not scheduled" : "Not started", assignedTo: defaults.assignedTo ?? "unassigned-worker", notes: "", ...defaults }; }
function loadData() { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : initialData; } catch { return initialData; } }
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function addDays(date, amount) { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
function getStartOfWeek(date) { const copy = new Date(date); const day = copy.getDay(); const mondayOffset = day === 0 ? -6 : 1 - day; copy.setDate(copy.getDate() + mondayOffset); copy.setHours(0, 0, 0, 0); return copy; }
function getIsoDate(date) { const copy = new Date(date); const year = copy.getFullYear(); const month = String(copy.getMonth() + 1).padStart(2, "0"); const day = String(copy.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function formatDayName(date) { return new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(date); }
function formatDateHeader(date) { return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" }).format(date); }
function formatShortDate(value) { return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" }).format(new Date(value)); }
function isToday(date) { return getIsoDate(date) === getIsoDate(new Date()); }
function getWorkerName(teamMembers, id) { return teamMembers.find((member) => member.id === id)?.name || "Unassigned"; }

createRoot(document.getElementById("root")).render(<App />);
