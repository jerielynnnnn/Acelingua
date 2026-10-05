"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { flattenCourseLessons, getActiveLesson } from "./courseMapUtils";

export default function useCourseMap(courseId, userId) {
  const [snapshot, setSnapshot] = useState(null);
  const request = useRef(0);
  const invalidate = useCallback(() => { ++request.current; }, []);
  const key = `${courseId ?? ""}:${userId ?? ""}`;
  const refresh = useCallback(async () => {
    const token = ++request.current;
    if (!courseId || !userId) return;
    try {
      const supabase = createClient();
      const [courseResult, unitsResult] = await Promise.all([
        supabase.from("courses").select("id, title, language_id").eq("id", courseId).single(),
        supabase.from("units")
          .select("id, title, unit_order, course_id, lessons(id, title, lesson_order, unit_id)")
          .eq("course_id", courseId).order("unit_order", { ascending: true })
          .order("lesson_order", { referencedTable: "lessons", ascending: true }),
      ]);
      if (courseResult.error) throw courseResult.error;
      if (unitsResult.error) throw unitsResult.error;
      const units = unitsResult.data ?? [];
      const ids = units.flatMap((unit) => (unit.lessons ?? []).map((lesson) => lesson.id));
      // Join in memory: user filtering here keeps other learners' progress out of the map.
      // Batch IDs to avoid oversized Supabase URLs for larger courses.
      const progress = [];
      for (let start = 0; start < ids.length; start += 100) {
        const result = await supabase.from("lesson_progress")
          .select("lesson_id, status").eq("user_id", userId).in("lesson_id", ids.slice(start, start + 100));
        if (result.error) throw result.error;
        progress.push(...(result.data ?? []));
      }
      if (token === request.current) setSnapshot({ key, course: courseResult.data, units, progress, error: null });
    } catch (error) {
      if (token === request.current) setSnapshot((previous) => ({
        ...(previous?.key === key ? previous : { course: null, units: [], progress: [] }),
        key, error: error?.message ?? "Unable to load your course map.",
      }));
    }
  }, [courseId, userId, key]);

  useEffect(() => {
    if (!courseId || !userId) return;
    void refresh();
    const supabase = createClient();
    const channel = supabase.channel(`course-map:${courseId}:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_progress", filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      invalidate();
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [courseId, userId, refresh, invalidate]);

  const current = snapshot?.key === key ? snapshot : null;
  const lessons = useMemo(() => flattenCourseLessons(current?.units ?? [], current?.progress ?? []), [current]);
  return { course: current?.course ?? null, units: current?.units ?? [], lessons,
    activeLesson: getActiveLesson(lessons), loading: Boolean(courseId && userId && !current),
    error: current?.error ?? null, refresh };
}
