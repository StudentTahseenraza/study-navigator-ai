import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI Voice Study Abroad Counsellor speaking to the student through their microphone and speakers. You are proactive, conversational, and action-oriented.

## Your Voice Style
- Speak naturally like a friendly mentor, in short conversational sentences (1-3 sentences per turn).
- No markdown, no bullet points, no headings — this will be SPOKEN aloud.
- Avoid emojis and special characters.
- Ask ONE question at a time and wait for the student's reply.

## Your Mission (in order)
1. Greet the student by name and acknowledge their profile.
2. Ask follow-up questions about their study plan: target intake, dream universities, budget concerns, exam progress, SOP status, biggest worries.
3. Evaluate their profile out loud — strengths, gaps, realistic chances.
4. Recommend 5-8 specific universities (mix of dream/target/safe) and use the shortlist_university tool to add each one.
5. For top 1-2 choices, suggest locking and use lock_university tool when student agrees.
6. Generate concrete tasks (SOP draft, IELTS booking, transcript request, etc.) using create_task tool.
7. Set deadline reminders for critical dates using create_reminder tool.
8. Keep checking in: ask which task they want to tackle first, mark tasks complete via complete_task when student confirms done.

## Rules
- Always CALL TOOLS to take action. Do not just describe what you would do.
- Confirm verbally before destructive actions (locking a university).
- Use the universities list provided in context — only shortlist universities that exist there (use exact university_id).
- After each tool call, briefly tell the student what you just did in one sentence.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const profile = context?.profile || {};
    const universities = context?.universities || [];
    const shortlist = context?.shortlist || [];
    const locked = context?.locked || [];
    const tasks = context?.tasks || [];

    const universitiesList = universities
      .slice(0, 60)
      .map(
        (u: any) =>
          `- id=${u.id} | ${u.name} (${u.country}) rank=${u.ranking ?? "?"} min_gpa=${u.min_gpa ?? "?"} tuition=$${u.tuition_min ?? "?"}-${u.tuition_max ?? "?"}`,
      )
      .join("\n");

    const contextMsg = `
## Student Profile
- Name: ${profile.full_name ?? "Unknown"}
- Education: ${profile.current_education_level ?? "?"} in ${profile.degree_major ?? "?"}, GPA: ${profile.gpa ?? "?"}
- Target: ${profile.intended_degree ?? "?"} in ${profile.field_of_study ?? "?"}, intake ${profile.target_intake_year ?? "?"}
- Countries: ${(profile.preferred_countries || []).join(", ") || "any"}
- Budget: $${profile.budget_min ?? 0}-${profile.budget_max ?? "unlimited"}/yr, funding: ${profile.funding_plan ?? "?"}
- IELTS: ${profile.ielts_status ?? "?"} (${profile.ielts_score ?? "-"}), GRE: ${profile.gre_status ?? "?"}, SOP: ${profile.sop_status ?? "?"}

## Currently Shortlisted (${shortlist.length})
${shortlist.map((s: any) => `- ${s.universities?.name} [${s.category}]`).join("\n") || "(none yet)"}

## Locked Universities (${locked.length})
${locked.map((l: any) => `- ${l.universities?.name}`).join("\n") || "(none yet)"}

## Open Tasks (${tasks.length})
${tasks.slice(0, 15).map((t: any) => `- task_id=${t.id}: ${t.title} [${t.status}]`).join("\n") || "(none)"}

## Available Universities (use these exact IDs)
${universitiesList}
`;

    const tools = [
      {
        type: "function",
        function: {
          name: "shortlist_university",
          description: "Add a university to the student's shortlist with a category.",
          parameters: {
            type: "object",
            properties: {
              university_id: { type: "number" },
              category: { type: "string", enum: ["dream", "target", "safe"] },
              fit_score: { type: "number", description: "0-100" },
              reasoning: { type: "string", description: "Why this fits" },
            },
            required: ["university_id", "category", "reasoning"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "lock_university",
          description: "Commit/lock a university the student wants to apply to.",
          parameters: {
            type: "object",
            properties: {
              university_id: { type: "number" },
              notes: { type: "string" },
            },
            required: ["university_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Create an actionable task for the student.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: { type: "string", enum: ["exam", "document", "application", "research", "other"] },
              priority: { type: "string", enum: ["low", "medium", "high"] },
              due_date: { type: "string", description: "YYYY-MM-DD" },
              university_id: { type: "number" },
            },
            required: ["title", "priority"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "complete_task",
          description: "Mark a task as completed when the student confirms it's done.",
          parameters: {
            type: "object",
            properties: { task_id: { type: "number" } },
            required: ["task_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_reminder",
          description: "Create a deadline reminder for the student.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              deadline_date: { type: "string", description: "YYYY-MM-DD" },
              reminder_type: { type: "string", enum: ["application_deadline", "document_deadline", "task_due", "custom"] },
              university_id: { type: "number" },
            },
            required: ["title", "deadline_date", "reminder_type"],
          },
        },
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextMsg },
            ...messages,
          ],
          tools,
          tool_choice: "auto",
        }),
      },
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message ?? {};

    return new Response(
      JSON.stringify({
        content: choice.content ?? "",
        tool_calls: choice.tool_calls ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("voice-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
