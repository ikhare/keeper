"use client";

import { useState, useEffect } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TodoList } from "./todos/TodoList";
import { CompletedTodos } from "./todos/CompletedTodos";
import { TodoDialog } from "./todos/TodoDialog";
import { NotesList } from "./notes/NotesList";
import { NoteDialog } from "./notes/NoteDialog";

// Wrapper component for user initialization
export function InitUser({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    const initUser = async () => {
      const id = await getOrCreateUser();
      setUserId(id);
    };
    void initUser();
  }, [getOrCreateUser]);

  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23325A]" />
      </div>
    );
  }

  return children;
}

// Main content component for signed-in users
export function TodosAndNotes() {
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  // Fetch active todos
  const {
    results: todos,
    status: todosStatus,
    loadMore: loadMoreTodos,
  } = usePaginatedQuery(
    api.items.listTodos,
    { showCompleted: false },
    { initialNumItems: 5 },
  );

  // Fetch completed todos
  const {
    results: completedTodos,
    status: completedTodosStatus,
    loadMore: loadMoreCompletedTodos,
  } = usePaginatedQuery(
    api.items.listTodos,
    { showCompleted: true },
    { initialNumItems: 10 },
  );

  // Fetch notes
  const {
    results: notes,
    status: notesStatus,
    loadMore: loadMoreNotes,
  } = usePaginatedQuery(api.items.listNotes, {}, { initialNumItems: 10 });

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if we're in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "t") {
        event.preventDefault();
        setTodoDialogOpen(true);
      } else if (event.key === "n") {
        event.preventDefault();
        setNoteDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Simplified direct logging
  console.log(JSON.stringify({
    todos: { results: todos, status: todosStatus },
    completedTodos: { results: completedTodos, status: completedTodosStatus },
    notes: { results: notes, status: notesStatus }
  }, null, 2));

  return (
    <div className="space-y-8">
      {/* Todos Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-[#23325A]">Todos</h2>
            <CompletedTodos 
              completedTodos={completedTodos} 
              completedTodosStatus={completedTodosStatus} 
              loadMoreCompletedTodos={loadMoreCompletedTodos}
            />
          </div>
          <TodoDialog 
            open={todoDialogOpen} 
            onOpenChange={setTodoDialogOpen} 
          />
        </div>
        <TodoList 
          todos={todos} 
          todosStatus={todosStatus} 
          loadMoreTodos={loadMoreTodos} 
        />
      </section>

      {/* Notes Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#23325A]">Notes</h2>
          <NoteDialog 
            open={noteDialogOpen} 
            onOpenChange={setNoteDialogOpen} 
          />
        </div>
        <NotesList 
          notes={notes} 
          notesStatus={notesStatus} 
          loadMoreNotes={loadMoreNotes} 
        />
      </section>
    </div>
  );
}