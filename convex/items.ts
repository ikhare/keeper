import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// Helper function to get authenticated user
async function getAuthenticatedUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized: Please sign in to access this item");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) {
    throw new ConvexError("User not found");
  }

  return user;
}

// Helper function to check item access
async function checkItemAccess(
  ctx: QueryCtx,
  itemId: Id<"items">,
  requireCreator = false,
) {
  const user = await getAuthenticatedUser(ctx);
  const item = await ctx.db.get(itemId);

  if (!item) {
    throw new ConvexError("Item not found");
  }

  if (requireCreator && item.creatorId !== user._id) {
    throw new ConvexError(
      "Unauthorized: Only the creator can perform this action",
    );
  } else if (
    !requireCreator &&
    item.creatorId !== user._id &&
    item.assigneeId !== user._id
  ) {
    throw new ConvexError("Unauthorized: You don't have access to this item");
  }

  return { user, item };
}

async function fetchTagsForItems(ctx: QueryCtx, items: Doc<"items">[]) {
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
    }),
  );
}

async function getItemsForUser(ctx: QueryCtx, withDueDate: boolean) {
  const user = await getAuthenticatedUser(ctx);

  const items = await ctx.db
    .query("items")
    .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
    .filter((q) =>
      withDueDate
        ? q.neq(q.field("dueDate"), undefined)
        : q.eq(q.field("dueDate"), undefined),
    )
    .order("desc")
    .collect();

  return fetchTagsForItems(ctx, items);
}

export const listTodos = query({
  args: {},
  handler: async (ctx) => getItemsForUser(ctx, true),
});

export const listNotes = query({
  args: {},
  handler: async (ctx) => getItemsForUser(ctx, false),
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
    const user = await getAuthenticatedUser(ctx);

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
          }),
        ),
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
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    // Check access - allow both creator and assignee to update
    await checkItemAccess(ctx, args._id);

    // Update tags if provided
    if (args.tagIds) {
      // Delete existing tags
      await ctx.db
        .query("itemTags")
        .withIndex("by_item", (q) => q.eq("itemId", args._id))
        .collect()
        .then((itemTags) =>
          Promise.all(itemTags.map((it) => ctx.db.delete(it._id))),
        );

      // Add new tags
      await Promise.all(
        args.tagIds.map((tagId) =>
          ctx.db.insert("itemTags", { itemId: args._id, tagId }),
        ),
      );
    }

    // Update item
    const { tagIds, ...itemUpdate } = args;
    return await ctx.db.patch(args._id, itemUpdate);
  },
});

export const remove = mutation({
  args: { _id: v.id("items") },
  handler: async (ctx, args) => {
    // Check access - only creator can delete
    await checkItemAccess(ctx, args._id, true);

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

export const get = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    try {
      const { item } = await checkItemAccess(ctx, args.id);
      const itemWithTags = await fetchTagsForItems(ctx, [item]);
      return itemWithTags[0];
    } catch (error) {
      if (error instanceof ConvexError) return null;
      throw error;
    }
  },
});
