// NOTE: You can remove this file. Declaring the shape
// of the database is entirely optional in Convex.
// See https://docs.convex.dev/database/schemas.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - linked to Clerk auth
  users: defineTable({
    name: v.string(),
    clerkId: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  // Main items table - for both notes and todos
  items: defineTable({
    title: v.string(),
    note: v.string(),
    creatorId: v.id("users"),
    // Optional fields that make an item a todo
    dueDate: v.optional(v.number()), // Unix timestamp
    priority: v.optional(v.number()), // 1-3 for priority levels
    assigneeId: v.optional(v.id("users")),
    completed: v.optional(v.boolean()),
    // Search status fields
    isSearching: v.optional(v.boolean()),
    hasUnseenResults: v.optional(v.boolean()),
  })
    // Indexes for querying
    .index("by_creator", ["creatorId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_due_date", ["dueDate"])
    // Compound index for filtering todos by creator and due date
    .index("by_creator_and_due_date", ["creatorId", "dueDate"])
    // Compound index for filtering todos by creator, completed status and due date
    .index("by_creator_due_date_completed", [
      "creatorId",
      "completed",
      "dueDate",
    ])
    // Compound index for filtering todos by assignee and due date
    .index("by_assignee_and_due_date", ["assigneeId", "dueDate"]),

  // Tags table - global tags
  tags: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  // Junction table for items<->tags many-to-many relationship
  itemTags: defineTable({
    itemId: v.id("items"),
    tagId: v.id("tags"),
  })
    .index("by_item", ["itemId"])
    .index("by_tag", ["tagId"])
    .index("by_item_and_tag", ["itemId", "tagId"]),
});
