import { action } from "./_generated/server";
import { v } from "convex/values";

export const search = action({
  args: { query: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY is not set");
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: args.query }],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    const citations = data.citations || [];

    // Add formatted citations to the content if there are any
    if (citations.length > 0) {
      content += "\n\nReferences:\n";
      citations.forEach((citation: string, index: number) => {
        content += `[${index + 1}] ${citation}\n`;
      });
    }

    return content;
  },
});
