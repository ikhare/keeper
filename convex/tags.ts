import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Check if tag already exists
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) return existing._id;

    // Create new tag if doesn't exist
    return await ctx.db.insert("tags", { name: args.name });
  },
});

export const addToItem = mutation({
  args: {
    itemId: v.id("items"),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    // Check if association already exists
    const existing = await ctx.db
      .query("itemTags")
      .withIndex("by_item_and_tag", (q) =>
        q.eq("itemId", args.itemId).eq("tagId", args.tagId)
      )
      .first();

    if (existing) return;

    // Create new association
    return await ctx.db.insert("itemTags", {
      itemId: args.itemId,
      tagId: args.tagId,
    });
  },
});

export const removeFromItem = mutation({
  args: {
    itemId: v.id("items"),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const itemTag = await ctx.db
      .query("itemTags")
      .withIndex("by_item_and_tag", (q) =>
        q.eq("itemId", args.itemId).eq("tagId", args.tagId)
      )
      .first();

    if (itemTag) {
      await ctx.db.delete(itemTag._id);
    }
  },
});
