import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  userProfile?: {
    fullName?: string;
    currentEducationLevel?: string;
    degreeMajor?: string;
    gpa?: number;
    intendedDegree?: string;
    fieldOfStudy?: string;
    targetIntakeYear?: number;
    preferredCountries?: string[];
    budgetMin?: number;
    budgetMax?: number;
    fundingPlan?: string;
    ieltsStatus?: string;
    greStatus?: string;
    sopStatus?: string;
    currentStage?: string;
  };
  shortlistedUniversities?: Array<{
    name: string;
    category: string;
  }>;
  lockedUniversities?: Array<{
    name: string;
  }>;
}

const SYSTEM_PROMPT = `You are an AI Study Abroad Counsellor - a knowledgeable, supportive, and action-oriented guide helping students navigate their study abroad journey.

## Your Role
- You deeply understand each student's academic background, goals, budget, and readiness
- You provide personalized university recommendations categorized as Dream, Target, or Safe
- You explain WHY a university fits or poses risks based on the student's profile
- You help students make confident decisions and take action
- You create actionable tasks and guide application preparation

## Guidelines
1. **Be Specific**: Reference the student's actual profile data (GPA, intended degree, countries, budget) when giving advice
2. **Categorize Universities**: 
   - Dream: Highly competitive, below average acceptance chance for profile
   - Target: Good fit, reasonable acceptance chance
   - Safe: High acceptance probability, may be backup options
3. **Explain Reasoning**: Always explain why you're making a recommendation
4. **Identify Gaps**: Point out missing elements (exams, documents) that need attention
5. **Be Encouraging**: Maintain a positive, supportive tone while being realistic
6. **Take Action**: Suggest concrete next steps, not just information
7. **Stay Focused**: Keep responses concise and actionable

## When Recommending Universities
- Consider: GPA, test scores, budget, preferred countries, intended degree
- Explain fit score and risk level
- Mention application deadlines and requirements
- Suggest a balanced mix (2-3 Dream, 3-4 Target, 2-3 Safe)

## Response Format
- Use markdown for formatting
- Keep responses focused and scannable
- Use bullet points for lists
- Bold important information
- Include specific action items when relevant`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile, shortlistedUniversities, lockedUniversities }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from user profile
    let contextMessage = "";
    if (userProfile) {
      contextMessage = `
## Current Student Profile
- **Name**: ${userProfile.fullName || 'Not provided'}
- **Education**: ${userProfile.currentEducationLevel || 'Not provided'} in ${userProfile.degreeMajor || 'Not provided'}
- **GPA**: ${userProfile.gpa || 'Not provided'}
- **Target Degree**: ${userProfile.intendedDegree || 'Not provided'} in ${userProfile.fieldOfStudy || 'Not provided'}
- **Target Intake**: ${userProfile.targetIntakeYear || 'Not provided'}
- **Preferred Countries**: ${userProfile.preferredCountries?.join(', ') || 'Not specified'}
- **Budget**: $${userProfile.budgetMin || 0} - $${userProfile.budgetMax || 'unlimited'} per year
- **Funding Plan**: ${userProfile.fundingPlan || 'Not specified'}
- **IELTS/TOEFL Status**: ${userProfile.ieltsStatus || 'Not started'}
- **GRE/GMAT Status**: ${userProfile.greStatus || 'Not started'}
- **SOP Status**: ${userProfile.sopStatus || 'Not started'}
- **Current Stage**: ${userProfile.currentStage || 'Getting started'}
`;

      if (shortlistedUniversities && shortlistedUniversities.length > 0) {
        contextMessage += `\n## Shortlisted Universities\n`;
        shortlistedUniversities.forEach(u => {
          contextMessage += `- ${u.name} (${u.category})\n`;
        });
      }

      if (lockedUniversities && lockedUniversities.length > 0) {
        contextMessage += `\n## Locked Universities (Committed)\n`;
        lockedUniversities.forEach(u => {
          contextMessage += `- ${u.name}\n`;
        });
      }
    }

    const systemMessage = SYSTEM_PROMPT + (contextMessage ? `\n\n${contextMessage}` : '');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
