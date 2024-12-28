"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { TagPicker } from "@/app/components/tag-picker";

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
  const todos = useQuery(api.items.listTodos);
  const createItem = useMutation(api.items.create);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>([]);

  const handleCreateTodo = async () => {
    if (!newTodoTitle.trim()) return;
    await createItem({
      title: newTodoTitle,
      note: "",
      dueDate: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
      tagIds: selectedTags,
    });
    setNewTodoTitle("");
    setSelectedTags([]);
  };

  // const handleCreateNote = async () => {
  //   if (!newNoteTitle.trim()) return;
  //   await createItem({
  //     title: newNoteTitle,
  //     note: newNoteContent,
  //   });
  //   setNewNoteTitle("");
  //   setNewNoteContent("");
  // };

  // const handleToggleTodo = async (todoId: string, completed: boolean) => {
  //   await updateItem({
  //     id: todoId,
  //     completed,
  //   });
  // };

  return (
    <div className="space-y-8">
      {/* Todos Section */}
      <section className="bg-white/80 rounded-lg shadow-lg p-6 border border-[#23325A]/10">
        <h2 className="text-2xl font-bold mb-4 text-[#23325A]">Todos</h2>
        <div className="space-y-4">
          {todos?.map((todo) => (
            <div
              key={todo._id}
              className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm"
            >
              <Checkbox
                checked={todo.completed}
                // onCheckedChange={(checked) =>
                //   void handleToggleTodo(todo._id, checked as boolean)
                // }
                className="text-[#E7A572] border-[#E7A572]"
              />
              <div className="flex-1">
                <span className="text-[#23325A]">{todo.title}</span>
                <span className="ml-2 text-sm text-[#782B42]">
                  due {new Date(todo.dueDate!).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                {todo.tags.map((tag) => (
                  <Badge
                    key={tag._id}
                    variant="secondary"
                    className="bg-[#F7E6D3] text-[#23325A]"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <Input
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add new todo..."
              className="flex-1 border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572]"
              onKeyDown={(e) => e.key === "Enter" && void handleCreateTodo()}
            />
            <Button
              onClick={() => void handleCreateTodo()}
              className="bg-[#23325A] hover:bg-[#23325A]/90 text-white"
            >
              Add
            </Button>
          </div>
          <TagPicker
            onTagsChange={setSelectedTags}
          />
        </div>
      </section>

      {/* Notes Section */}
      {/* <section className="bg-white/80 rounded-lg shadow-lg p-6 border border-[#23325A]/10">
        <h2 className="text-2xl font-bold mb-4 text-[#23325A]">Notes</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white shadow-sm border-[#23325A]/10">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title"
              className="mb-2 border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572]"
            />
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Note content"
              className="min-h-[100px] border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572]"
            />
            <Button
              onClick={handleCreateNote}
              className="mt-2 w-full bg-[#23325A] hover:bg-[#23325A]/90 text-white"
            >
              Save Note
            </Button>
          </div>
          {notes?.map((note) => (
            <div
              key={note._id}
              className="border rounded-lg p-4 bg-white shadow-sm border-[#23325A]/10 hover:border-[#E7A572] transition-colors"
            >
              <h3 className="font-semibold mb-2 text-[#23325A]">
                {note.title}
              </h3>
              <p className="text-[#23325A]/70">{note.note}</p>
              <div className="flex gap-2 mt-2">
                {note.tags?.map((tag) => (
                  <Badge
                    key={tag._id}
                    variant="secondary"
                    className="bg-[#F7E6D3] text-[#23325A]"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section> */}
    </div>
  );
}
