"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Create a helper type for items with tags
type WithTags<T extends "items"> = Doc<T> & { tags: (Doc<"tags"> | null)[] }; // Allow null tags

// import { UsePaginatedQueryResult } from "convex/react"; // Removed unused import

// Accept raw results from usePaginatedQuery
interface TodoListProps {
  todos: WithTags<"items">[] | undefined | null; // Changed to array
  todosStatus: "LoadingFirstPage" | "CanLoadMore" | "Exhausted" | "LoadingMore";
  loadMoreTodos: (numItems: number) => void;
}

// Import Document type from Convex
import { Doc } from "@/convex/_generated/dataModel";

export function TodoList({ todos, todosStatus, loadMoreTodos }: TodoListProps) {
  const router = useRouter();
  const updateItem = useMutation(api.items.update);
  const removeTag = useMutation(api.tags.removeFromItem);

  const handleToggleTodo = async (todoId: Id<"items">, completed: boolean) => {
    await updateItem({
      _id: todoId,
      completed,
    });
  };

  const handleRemoveTag = async (itemId: Id<"items">, tagId: Id<"tags">) => {
    await removeTag({
      itemId,
      tagId,
    });
  };

  // Debug log to check what's actually received
  console.log("TodoList received todos:", todos);
  
  // First log exactly what we received
  console.log("TodoList full data:", JSON.stringify(todos, null, 2));
  
  // Handle loading and empty states
  if (todosStatus === "LoadingFirstPage" && !todos) { // Check !todos
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23325A]" />
      </div>
    );
  }
  
  if (!todos || todos.length === 0) { // Check !todos or todos.length
    return (
      <div className="text-center py-6 text-gray-500">
        No active todos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {todos.map((todo) => { // Iterate over todos directly
          const validTags = Array.isArray(todo.tags)
            ? todo.tags.filter((tag): tag is Doc<"tags"> => tag !== null)
            : [];
          const todoWithValidTags = { ...todo, tags: validTags };

          return (
          <motion.div
            key={todoWithValidTags._id} // Use todoWithValidTags
            initial={{ height: "auto", opacity: 1 }}
            exit={{
              height: 0,
              opacity: 0,
              margin: 0,
              padding: 0,
              transition: { duration: 0.15 },
            }}
            className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm cursor-pointer border border-[#23325A]/10 hover:border-[#E7A572] transition-colors overflow-hidden"
            onClick={() => router.push(`/items/${todoWithValidTags._id}`)} // Use todoWithValidTags
          >
            <Checkbox
              checked={todoWithValidTags.completed} // Use todoWithValidTags
              onCheckedChange={(checked) => {
                void handleToggleTodo(todoWithValidTags._id, checked as boolean); // Use todoWithValidTags
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-5 text-[#E7A572] border-[#E7A572] rounded-md cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-[#23325A]">{todoWithValidTags.title}</span> {/* Use todoWithValidTags */}
              <span className="ml-2 text-sm text-[#782B42]">
                due {new Date(todoWithValidTags.dueDate!).toLocaleDateString()} {/* Use todoWithValidTags */}
              </span>
            </div>
            <div className="flex gap-2">
              {todoWithValidTags.tags.map((tag) => ( // Use todoWithValidTags
                <Badge
                  key={tag._id}
                  variant="secondary"
                  className="bg-[#F7E6D3] text-[#23325A] flex items-center gap-1 group"
                >
                  {tag.name}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      void handleRemoveTag(todoWithValidTags._id, tag._id); // Use todoWithValidTags
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
      {todosStatus === "CanLoadMore" && (
        <div className="mt-2">
          <Button
            onClick={() => loadMoreTodos(5)}
            variant="outline"
            size="sm"
            className="text-[#23325A] hover:bg-[#23325A]/5"
          >
            Load More Todos
          </Button>
        </div>
      )}
      {todosStatus === "LoadingMore" && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#23325A]" />
        </div>
      )}
    </div>
  );
}