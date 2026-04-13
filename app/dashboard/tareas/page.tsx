"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, CheckSquare, Square, Clock } from "lucide-react";
import { supabase, Task } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { syncClassroom } from "@/lib/syncClassroom";

function formatDue(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { label: "Vencida", color: "text-red-500" };
  if (days === 0) return { label: "Hoy", color: "text-amber-500" };
  if (days === 1) return { label: "Mañana", color: "text-amber-400" };
  return { label: `${days}d`, color: "text-surface-800/40" };
}

let isSyncing = false;
export default function TareasPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.provider_token;
      if (!token) return;

      // Checar si ya hay tareas de classroom para este usuario
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("source", "classroom");

      // Solo sincronizar si no hay tareas O si el usuario presionó el botón manualmente
      if (count === 0) {
        syncClassroom(token, user.id).then(() => loadTasks());
      }
    });
  }, [user?.id]);

async function connectClassroom() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.provider_token

  if (token) {
    await syncClassroom(token, user!.id)
    loadTasks()
  } else {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
        redirectTo: `${window.location.origin}/dashboard/tareas`,  // ← cambia esto
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account consent',
        },
      },
    })
  }
}

  async function loadTasks() {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  }

  async function addTask() {
    if (!title.trim() || !user) return;
    const { data } = await supabase
      .from("tasks")
      .insert({ user_id: user.id, title, due_date: dueDate || null })
      .select()
      .single();
    if (data) setTasks([data, ...tasks]);
    setTitle("");
    setDueDate("");
  }

  async function toggleTask(id: string, completed: boolean) {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !completed } : t)),
    );
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(tasks.filter((t) => t.id !== id));
  }

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const pending = tasks.filter((t) => !t.completed).length;

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-surface-900">Tareas</h1>
        <p className="text-sm text-surface-800/50 mt-1">
          {pending} tareas pendientes
        </p>

        <button
          onClick={connectClassroom}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-xs bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
        >
          🎓 Sincronizar Google Classroom
        </button>
      </div>

      {/* Input */}
      <div className="card mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva tarea..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1 px-3 py-2 text-sm rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-accent/20 text-surface-800/60"
          />
          <button
            onClick={addTask}
            className="p-2 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all shadow-sm"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              filter === f
                ? "bg-accent text-white"
                : "bg-white text-surface-800/50 border border-surface-100 hover:border-surface-200"
            }`}
          >
            {{ all: "Todas", pending: "Pendientes", done: "Completadas" }[f]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {/* Lista */}
      <div className="space-y-2">
        {filtered
          .filter((t) => {
            if (!t.due_date) return true;
            return new Date(t.due_date).getTime() >= Date.now();
          })
          .map((task) => {
            const due = formatDue(task.due_date);
            return (
              <div
                key={task.id}
                className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                  task.completed
                    ? "bg-surface-50 border-surface-100 opacity-60"
                    : "bg-white border-surface-100 hover:border-surface-200 shadow-soft"
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id, task.completed)}
                  className="text-surface-800/30 hover:text-accent transition-colors flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckSquare size={18} className="text-accent" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${task.completed ? "line-through text-surface-800/40" : "text-surface-900"}`}
                  >
                    {task.title}
                  </p>
                  {task.source === "classroom" && (
                    <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">
                      Google Classroom
                    </span>
                  )}
                </div>
                {due && (
                  <span
                    className={`text-[10px] flex items-center gap-1 font-medium ${due.color}`}
                  >
                    <Clock size={11} /> {due.label}
                  </span>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-surface-800/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        {filtered.filter(
          (t) => !t.due_date || new Date(t.due_date).getTime() >= Date.now(),
        ).length === 0 && (
          <div className="text-center py-12">
            <CheckSquare
              size={32}
              className="text-surface-800/10 mx-auto mb-2"
            />
            <p className="text-sm text-surface-800/30">No hay tareas aquí</p>
          </div>
        )}
      </div>

      {/* Sección vencidas */}
      {filtered.filter(
        (t) => t.due_date && new Date(t.due_date).getTime() < Date.now(),
      ).length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3">
            Vencidas (
            {
              filtered.filter(
                (t) =>
                  t.due_date && new Date(t.due_date).getTime() < Date.now(),
              ).length
            }
            )
          </p>
          <div className="space-y-2 opacity-60">
            {filtered
              .filter(
                (t) =>
                  t.due_date && new Date(t.due_date).getTime() < Date.now(),
              )
              .map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 p-3.5 rounded-xl border border-red-100 bg-red-50/30 transition-all"
                >
                  <button
                    onClick={() => toggleTask(task.id, task.completed)}
                    className="text-surface-800/30 hover:text-accent transition-colors flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare size={18} className="text-accent" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through text-surface-800/40">
                      {task.title}
                    </p>
                    {task.source === "classroom" && (
                      <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">
                        Google Classroom
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] flex items-center gap-1 font-medium text-red-400">
                    <Clock size={11} /> Vencida
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-surface-800/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
