import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Plus, Search, Trash2, Pencil, X, Users, CalendarDays } from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "job-kanban-scheduler-v1";

const initialData = {
  teamMembers: [
    { id: "unassigned", name: "Unassigned", role: "Holding bay" },
    { id: "gary", name: "Gary", role: "Supervisor" },
    { id: "mick", name: "Mick", role: "Carpentry" },
    { id: "drew", name: "Drew", role: "Plumbing" },
    { id: "gaz", name: "Gaz", role: "Electrical" }
  ],
  jobs: [
    {
      id: crypto.randomUUID(),
      title: "Repair damaged roller door rail",
      client: "Sodexo FM",
      location: "Paraburdoo",
      dueDate: "2026-07-15",
      priority: "High",
      status: "Booked",
      assignedTo: "unassigned",
      notes: "Cut out damaged RHS, weld new rail, paint welds, demobilise."
    },
    {
      id: crypto.randomUUID(),
      title: "Install Colorbond fencing",
      client: "Residential",
      location: "Busselton",
      dueDate: "2026-07-18",
      priority: "Medium",
      status: "Ready",
      assignedTo: "mick",
      notes: "Confirm materials, services, set out and install."
    },
    {
      id: crypto.randomUUID(),
      title: "AC vent patching and painting",
      client: "Property Team",
      location: "Village accommodation",
      dueDate: "2026-07-20",
      priority: "Medium",
      status: "Awaiting access",
      assignedTo: "gary",
      notes: "Tenant may need transit room before works proceed."
    }
  ]
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  } catch {
    return initialData;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function emptyJob(assignedTo = "unassigned") {
  return {
    id: crypto.randomUUID(),
    title: "",
    client: "",
    location: "",
    dueDate: "",
    priority: "Medium",
    status: "Not started",
    assignedTo,
    notes: ""
  };
}

function App() {
  const [data, setData] = useState(loadData);
  const [query, setQuery] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [draggedJobId, setDraggedJobId] = useState(null);

  function updateData(next) {
    setData(next);
    saveData(next);
  }

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.jobs;
    return data.jobs.filter((job) =>
      [job.title, job.client, job.location, job.priority, job.status, job.notes]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data.jobs, query]);

  function addJob(assignedTo = "unassigned") {
    setEditingJob(emptyJob(assignedTo));
  }

  function saveJob(jobToSave) {
    const exists = data.jobs.some((j) => j.id === jobToSave.id);
    const nextJobs = exists
      ? data.jobs.map((j) => (j.id === jobToSave.id ? jobToSave : j))
      : [jobToSave, ...data.jobs];

    updateData({ ...data, jobs: nextJobs });
    setEditingJob(null);
  }

  function deleteJob(jobId) {
    const ok = confirm("Delete this job?");
    if (!ok) return;
    updateData({ ...data, jobs: data.jobs.filter((j) => j.id !== jobId) });
  }

  function moveJob(jobId, assignedTo) {
    updateData({
      ...data,
      jobs: data.jobs.map((job) =>
        job.id === jobId ? { ...job, assignedTo } : job
      )
    });
  }

  function addTeamMember() {
    const name = prompt("Team member name:");
    if (!name) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    updateData({
      ...data,
      teamMembers: [...data.teamMembers, { id, name, role: "" }]
    });
  }

  function removeTeamMember(memberId) {
    if (memberId === "unassigned") {
      alert("The Unassigned column cannot be removed.");
      return;
    }

    const ok = confirm("Remove this team member? Their jobs will move to Unassigned.");
    if (!ok) return;

    updateData({
      teamMembers: data.teamMembers.filter((m) => m.id !== memberId),
      jobs: data.jobs.map((j) =>
        j.assignedTo === memberId ? { ...j, assignedTo: "unassigned" } : j
      )
    });
  }

  function resetDemoData() {
    const ok = confirm("Reset all jobs and team members to the demo data?");
    if (!ok) return;
    updateData(initialData);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Job Scheduler</h1>
          <p>Drag jobs between team members to assign work.</p>
        </div>

        <div className="actions">
          <button className="secondary" onClick={addTeamMember}>
            <Users size={16} /> Add worker
          </button>
          <button className="primary" onClick={() => addJob()}>
            <Plus size={16} /> New job
          </button>
        </div>
      </header>

      <section className="toolbar">
        <div className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, clients, locations, notes..."
          />
        </div>
        <button className="ghost" onClick={resetDemoData}>Reset demo data</button>
      </section>

      <main className="board">
        {data.teamMembers.map((member) => {
          const jobs = filteredJobs.filter((job) => job.assignedTo === member.id);
          return (
            <section
              key={member.id}
              className="column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedJobId) moveJob(draggedJobId, member.id);
                setDraggedJobId(null);
              }}
            >
              <div className="column-header">
                <div>
                  <h2>{member.name}</h2>
                  <span>{member.role || "Team member"} · {jobs.length} job{jobs.length === 1 ? "" : "s"}</span>
                </div>

                <div className="column-actions">
                  <button title="Add job here" onClick={() => addJob(member.id)}>
                    <Plus size={15} />
                  </button>
                  <button title="Remove worker" onClick={() => removeTeamMember(member.id)}>
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="cards">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onDragStart={() => setDraggedJobId(job.id)}
                    onEdit={() => setEditingJob(job)}
                    onDelete={() => deleteJob(job.id)}
                  />
                ))}

                {jobs.length === 0 && (
                  <div className="empty">Drop a job here</div>
                )}
              </div>
            </section>
          );
        })}
      </main>

      {editingJob && (
        <JobModal
          job={editingJob}
          teamMembers={data.teamMembers}
          onClose={() => setEditingJob(null)}
          onSave={saveJob}
        />
      )}
    </div>
  );
}

function JobCard({ job, onDragStart, onEdit, onDelete }) {
  return (
    <article className="card" draggable onDragStart={onDragStart}>
      <div className="card-top">
        <span className={`priority ${job.priority.toLowerCase()}`}>{job.priority}</span>
        <div className="card-actions">
          <button onClick={onEdit} title="Edit job"><Pencil size={14} /></button>
          <button onClick={onDelete} title="Delete job"><Trash2 size={14} /></button>
        </div>
      </div>

      <h3>{job.title || "Untitled job"}</h3>

      <div className="meta">
        {job.client && <span>{job.client}</span>}
        {job.location && <span>{job.location}</span>}
      </div>

      <div className="status-row">
        <span className="status">{job.status}</span>
        {job.dueDate && (
          <span className="date">
            <CalendarDays size={13} /> {formatDate(job.dueDate)}
          </span>
        )}
      </div>

      {job.notes && <p>{job.notes}</p>}
    </article>
  );
}

function JobModal({ job, teamMembers, onClose, onSave }) {
  const [form, setForm] = useState(job);

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Please enter a job title.");
      return;
    }
    onSave(form);
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <h2>{job.title ? "Edit job" : "New job"}</h2>
          <button type="button" className="icon" onClick={onClose}><X size={18} /></button>
        </div>

        <label>
          Job title
          <input value={form.title} onChange={(e) => update("title", e.target.value)} />
        </label>

        <div className="two-col">
          <label>
            Client
            <input value={form.client} onChange={(e) => update("client", e.target.value)} />
          </label>

          <label>
            Location
            <input value={form.location} onChange={(e) => update("location", e.target.value)} />
          </label>
        </div>

        <div className="two-col">
          <label>
            Due date
            <input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
          </label>

          <label>
            Assigned to
            <select value={form.assignedTo} onChange={(e) => update("assignedTo", e.target.value)}>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="two-col">
          <label>
            Priority
            <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </label>

          <label>
            Status
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option>Not started</option>
              <option>Ready</option>
              <option>Booked</option>
              <option>Awaiting access</option>
              <option>In progress</option>
              <option>Completed</option>
              <option>On hold</option>
            </select>
          </label>
        </div>

        <label>
          Notes
          <textarea
            rows="5"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Save job</button>
        </div>
      </form>
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

createRoot(document.getElementById("root")).render(<App />);