import { supabase } from '@/lib/supabase'

export async function syncClassroom(accessToken: string, userId: string) {
  const coursesRes = await fetch(
    'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await coursesRes.json()
  const courses = data.courses ?? []

  const allTasks: any[] = []
  const allEvents: any[] = []

  for (const course of courses) {
    const workRes = await fetch(
      `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const workData = await workRes.json()
    const courseWork = workData.courseWork ?? []

    for (const work of courseWork) {
      const dueDate = work.dueDate
        ? (() => {
            const hour = work.dueTime?.hours ?? 23
            const minute = work.dueTime?.minutes ?? 59
            const d = new Date(Date.UTC(
              work.dueDate.year,
              work.dueDate.month - 1,
              work.dueDate.day,
              hour,
              minute
            ))
            return d.toISOString()
          })()
        : null

      allTasks.push({
        user_id: userId,
        title: `[${course.name}] ${work.title}`,
        due_date: dueDate,
        source: 'classroom',
        completed: false,
        classroom_id: work.id,
      })

      if (dueDate) {
        allEvents.push({
          user_id: userId,
          title: work.title,
          event_date: dueDate,
          color: '#4285F4',
          classroom_id: work.id,
        })
      }
    }
  }

  // Una sola petición para todo
  if (allTasks.length > 0) {
    await supabase.from('tasks').upsert(allTasks, { onConflict: 'classroom_id' })
  }
  if (allEvents.length > 0) {
    await supabase.from('events').upsert(allEvents, { onConflict: 'classroom_id' })
  }
}