import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a friendly AI voice onboarding assistant for a study-abroad platform. You speak with the student through their microphone to collect four things, in order:

1. STUDY GOAL — intended degree (Bachelor's, Master's, MBA, PhD), field of study, and target intake year.
2. BUDGET — max yearly tuition budget in USD and funding plan (Self-funded, Scholarship-dependent, Loan-dependent, Partially funded).
3. COUNTRY PREFERENCES — at least one preferred country (USA, UK, Canada, Australia, Germany, Netherlands, Switzerland, Singapore, New Zealand, Ireland).
4. EXAM READINESS — status of IELTS, TOEFL, GRE, GMAT, and SOP. Status values: not_started, preparing, scheduled, completed.

## Voice style
- Speak in 1-2 short conversational sentences. No markdown, no lists, no emojis — this will be spoken aloud.
- Ask ONE focused question at a time. Be warm and natural.
- If the student answers multiple things at once, capture all of them.
- If an answer is unclear, ask a quick clarifier.
- When you have everything, say a short warm confirmation and set done=true.

## Tool use
You MUST always reply by calling the tool 'update_onboarding'. Pass:
- spoken_reply: the next thing to say to the student (or final confirmation).
- updates: any new fields you extracted from the latest user message (omit fields you didn't learn).
- done: true ONLY when intended_degree, field_of_study, budget_max, funding_plan, at least one preferred_country, and all 5 exam statuses are known.
`;

const tools = [
  {
    type: "function",
    function: {
      name: "update_onboarding",
      description: "Reply to the student and persist any newly captured profile fields.",
      parameters: {
        type: "object",
        properties: {
          spoken_reply: { type: "string", description: "What to speak to the student next." },
          done: { type: "boolean", description: "True when all required fields are collected." },
          updates: {
            type: "object",
            properties: {
              intended_degree: { type: "string", enum: ["Bachelor's", "Master's", "MBA", "PhD"] },
              field_of_study: { type: "string" },
              target_intake_year: { type: "number" },
              preferred_countries: { type: "array", items: { type: "string" } },
              budget_min: { type: "number" },
              budget_max: { type: "number" },
              funding_plan: { type: "string", enum: ["Self-funded", "Scholarship-dependent", "Loan-dependent", "Partially funded"] },
              ielts_status: { type: "string", enum: ["not_started", "preparing", "scheduled", "completed"] },
              toefl_status: { type: "string", enum: ["not_started", "preparing", "scheduled", "completed"] },
              gre_status: { type: "string", enum: ["not_started", "preparing", "scheduled", "completed"] },
              gmat_status: { type: "string", enum: ["not_started", "preparing", "scheduled", "completed"] },
              sop_status: { type: "string", enum: ["not_started", "preparing", "scheduled", "completed"] },
            },
            additionalProperties: false,
          },
        },
        required: ["spoken_reply", "done"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, collected } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const stateMsg = `## Already collected so far\n${JSON.stringify(collected ?? {}, null, 2)}\n\nAsk for whatever is still missing next.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\n" + stateMsg },
          ...(messages ?? []),
        ],
        tools,
        tool_choice: { type: "function", function: { name: "update_onboarding" } },
      }),
    });

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
    const call = choice.tool_calls?.[0];
    let parsed: any = { spoken_reply: choice.content ?? "", done: false, updates: {} };
    if (call?.function?.arguments) {
      try {
        const args = typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments;
        parsed = { spoken_reply: args.spoken_reply ?? "", done: !!args.done, updates: args.updates ?? {} };
      } catch (e) {
        console.error("parse tool args failed", e);
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-onboarding error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
