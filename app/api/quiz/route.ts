import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!body || Object.keys(body).length !== 3 || !uuid.test(body.lessonId) || !uuid.test(body.questionId) || typeof body.answer !== "string" || !body.answer.trim() || body.answer.length > 2000) return NextResponse.json({ error: "Submit a valid quiz answer." }, { status: 400, headers });
  const client = await createClient(); const { data: { user }, error: authError } = await client.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers });
  const result = await client.rpc("acelingua_submit_quiz_answer", { p_lesson: body.lessonId, p_question: body.questionId, p_answer: body.answer });
  if (result.error) return NextResponse.json({ error: ["PGRST202", "42883"].includes(result.error.code) ? "Quiz heart checks need database activation before you can submit." : "Your quiz answer could not be submitted. Please retry." }, { status: 400, headers });
  return NextResponse.json(result.data, { headers });
}
