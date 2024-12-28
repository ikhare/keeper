import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getOrCreateUser without authentication");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) return existing._id;

    // Create new user if doesn't exist
    return await ctx.db.insert("users", {
      name: identity.name!,
      email: identity.email!,
      clerkId: identity.subject,
    });
  },
});
