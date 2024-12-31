import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Queries
export const listTodos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user id from clerk id
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Get all items with due dates for this user
    const todos = await ctx.db
      .query("items")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .filter((q) => q.neq(q.field("dueDate"), undefined))
      .collect();

    // Return todos with their tags
    return await Promise.all(
      todos.map(async (todo) => {
        const itemTags = await ctx.db
          .query("itemTags")
          .withIndex("by_item", (q) => q.eq("itemId", todo._id))
          .collect();

        const tags = (
          await Promise.all(itemTags.map((it) => ctx.db.get(it.tagId)))
        ).filter((tag) => tag !== null);

        return { ...todo, tags: tags.filter(Boolean) };
      })
    );
  },
});

export const listNotes = query({
  args: {
    includeWithDueDate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user id from clerk id
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Query base: all items for this user
    let itemsQuery = ctx.db
      .query("items")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id));

    if (args.includeWithDueDate === false) {
      itemsQuery = itemsQuery.filter((q) =>
        q.eq(q.field("dueDate"), undefined)
      );
    }

    const items = await itemsQuery.collect();

    // Return items with their tags using the same pattern as listTodos
    return await Promise.all(
      items.map(async (item) => {
        const itemTags = await ctx.db
          .query("itemTags")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .collect();

        const tags = (
          await Promise.all(itemTags.map((it) => ctx.db.get(it.tagId)))
        ).filter((tag) => tag !== null);

        return { ...item, tags: tags.filter(Boolean) };
      })
    );
  },
});

// Mutations
export const create = mutation({
  args: {
    title: v.string(),
    note: v.string(),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.number()),
    assigneeId: v.optional(v.id("users")),
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get user id from clerk id
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Create the item
    const itemId = await ctx.db.insert("items", {
      title: args.title,
      note: args.note,
      creatorId: user._id,
      dueDate: args.dueDate,
      priority: args.priority,
      assigneeId: args.assigneeId,
      completed: false,
    });

    // Add tags if provided
    if (args.tagIds) {
      await Promise.all(
        args.tagIds.map((tagId) =>
          ctx.db.insert("itemTags", {
            itemId,
            tagId,
          })
        )
      );
    }

    return itemId;
  },
});

export const update = mutation({
  args: {
    _id: v.id("items"),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.number()),
    assigneeId: v.optional(v.id("users")),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const item = await ctx.db.get(args._id);
    if (!item) throw new Error("Item not found");

    // Only creator or assignee can update
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    if (item.creatorId !== user._id && item.assigneeId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args._id, {
      ...args,
    });
  },
});

export const remove = mutation({
  args: { _id: v.id("items") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const item = await ctx.db.get(args._id);
    if (!item) throw new Error("Item not found");

    // Only creator can delete
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || item.creatorId !== user._id) throw new Error("Unauthorized");

    // Delete all tag associations
    await ctx.db
      .query("itemTags")
      .withIndex("by_item", (q) => q.eq("itemId", args._id))
      .collect()
      .then((itemTags) => {
        return Promise.all(itemTags.map((it) => ctx.db.delete(it._id)));
      });

    // Delete the item
    await ctx.db.delete(args._id);
  },
});
