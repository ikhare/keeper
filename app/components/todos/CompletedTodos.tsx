"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

// Create a helper type for items with tags
type WithTags<T extends "items"> = Doc<T> & { tags: (Doc<"tags"> | null)[] }; // Allow null tags

// import { UsePaginatedQueryResult } from "convex/react"; // Removed unused import

interface CompletedTodosProps {
  completedTodos: WithTags<"items">[] | undefined | null; // Changed to array
  completedTodosStatus: "LoadingFirstPage" | "CanLoadMore" | "Exhausted" | "LoadingMore";
  loadMoreCompletedTodos: (numItems: number) => void;
}

export function CompletedTodos({ 
  completedTodos, 
  completedTodosStatus, 
  loadMoreCompletedTodos 
}: CompletedTodosProps) {
  const router = useRouter();
  const updateItem = useMutation(api.items.update);
  const [completedPopoverOpen, setCompletedPopoverOpen] = useState(false);

  const handleToggleTodo = async (todoId: Id<"items">, completed: boolean) => {
    await updateItem({
      _id: todoId,
      completed,
    });
  };

  // Log the data
  console.log("CompletedTodos full data:", JSON.stringify(completedTodos, null, 2));

  // Handle loading first page state
  if (completedTodosStatus === "LoadingFirstPage" && !completedTodos) { // Check !completedTodos as well
    // Don't show a spinner for the popup since it's not visible by default
    return (
      <Popover open={completedPopoverOpen} onOpenChange={setCompletedPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="text-sm px-3 py-1 rounded-full transition-colors bg-[#23325A]/10 text-[#23325A] hover:bg-[#23325A]/20"
          >
            Show Completed
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 border-b border-[#23325A]/10">
            <h3 className="font-semibold text-[#23325A]">Completed Todos</h3>
          </div>
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23325A]" />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={completedPopoverOpen} onOpenChange={setCompletedPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="text-sm px-3 py-1 rounded-full transition-colors bg-[#23325A]/10 text-[#23325A] hover:bg-[#23325A]/20"
        >
          Show Completed
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b border-[#23325A]/10">
          <h3 className="font-semibold text-[#23325A]">Completed Todos</h3>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {completedTodos && Array.isArray(completedTodos) && completedTodos.map((todo) => { // Iterate over completedTodos directly
                // Ensure tags are valid and filter out nulls
                const validTags = Array.isArray(todo.tags)
                  ? todo.tags.filter((tag): tag is Doc<"tags"> => tag !== null) // todo.tags should now be (Doc<"tags"> | null)[]
                  : [];
                const todoWithValidTags = { ...todo, tags: validTags };

                return (
                <motion.div
                  key={todoWithValidTags._id}
                  initial={{ height: "auto", opacity: 1 }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    margin: 0,
                    padding: 0,
                    transition: { duration: 0.15 },
                  }}
                  className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm cursor-pointer border border-[#23325A]/10 hover:border-[#E7A572] transition-colors overflow-hidden"
                  onClick={() => {
                    router.push(`/items/${todoWithValidTags._id}`);
                    setCompletedPopoverOpen(false);
                  }}
                >
                  <Checkbox
                    checked={todoWithValidTags.completed}
                    onCheckedChange={(checked) => {
                      void handleToggleTodo(todoWithValidTags._id, checked as boolean);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 text-[#E7A572] border-[#E7A572] rounded-md cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-[#23325A] line-through opacity-75">{todoWithValidTags.title}</span>
                    <span className="ml-2 text-sm text-[#782B42] opacity-75">
                      due {new Date(todoWithValidTags.dueDate!).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
            {completedTodosStatus === "CanLoadMore" && (
              <Button
                onClick={() => loadMoreCompletedTodos(5)}
                variant="outline"
                size="sm"
                className="w-full text-[#23325A] hover:bg-[#23325A]/5 mt-2"
              >
                Load More
              </Button>
            )}
            {completedTodosStatus === "LoadingMore" && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#23325A]" />
              </div>
            )}
            {(!completedTodos || completedTodos.length === 0) && ( // Check completedTodos.length
              <div className="py-4 text-center text-[#23325A]/50">
                No completed todos
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}