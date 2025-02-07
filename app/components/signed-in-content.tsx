"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { TagPicker } from "@/app/components/tag-picker";
import { Id } from "@/convex/_generated/dataModel";
import { DatePicker } from "@/app/components/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { MarkdownContent } from "@/components/ui/markdown-content";

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
  const router = useRouter();
  const todos = useQuery(api.items.listTodos);
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const removeTag = useMutation(api.tags.removeFromItem);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>([]);
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const notes = useQuery(api.items.listNotes);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const handleCreateTodo = async () => {
    if (!newTodoTitle.trim()) return;
    await createItem({
      title: newTodoTitle,
      note: "",
      dueDate: dueDate.getTime(),
      tagIds: selectedTags,
    });
    setNewTodoTitle("");
    setSelectedTags([]);
  };

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

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    await createItem({
      title: newNoteTitle,
      note: newNoteContent,
      tagIds: selectedTags,
    });
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedTags([]);
  };

  const search = useAction(api.perplexity.search);

  const handleSearch = async () => {
    if (!newNoteTitle.trim()) return;
    try {
      const searchResult = await search({ query: newNoteTitle });
      setNewNoteContent(searchResult);
    } catch (error) {
      console.error('Search failed:', error);
      // You might want to show a toast notification here
    }
  };

  return (
    <div className="space-y-8">
      {/* Todos Section */}
      <section className="bg-white/80 rounded-lg shadow-lg p-6 border border-[#23325A]/10">
        <h2 className="text-2xl font-bold mb-4 text-[#23325A]">Todos</h2>
        <div className="space-y-4">
          {todos?.map((todo) => (
            <div
              key={todo._id}
              className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm cursor-pointer hover:bg-[#F7E6D3]/50 transition-colors"
              onClick={() => router.push(`/items/${todo._id}`)}
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={(checked) =>
                  void handleToggleTodo(todo._id, checked as boolean)
                }
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 text-[#E7A572] border-[#E7A572] rounded-md cursor-pointer"
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
                    className="bg-[#F7E6D3] text-[#23325A] flex items-center gap-1 group"
                  >
                    {tag.name}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        void handleRemoveTag(todo._id, tag._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          {/* Todo Creation Area */}
          <div className="bg-white p-4 rounded-md shadow-sm space-y-3">
            <div className="flex gap-2">
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
            <DatePicker
              date={dueDate}
              onSelect={(date) => date && setDueDate(date)}
            />
            <TagPicker
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        </div>
      </section>

      {/* Notes Section */}
      <section className="bg-white/80 rounded-lg shadow-lg p-6 border border-[#23325A]/10">
        <h2 className="text-2xl font-bold mb-4 text-[#23325A]">Notes</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-md shadow-sm space-y-3">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title"
              className="border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572]"
            />
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Note content (supports markdown)"
              className="min-h-[200px] font-mono text-sm border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572] whitespace-pre-wrap"
            />
            <TagPicker
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => void handleCreateNote()}
                className="flex-1 bg-[#23325A] hover:bg-[#23325A]/90 text-white"
              >
                Save Note
              </Button>
              <Button
                onClick={() => void handleSearch()}
                className="flex-1 bg-[#E7A572] hover:bg-[#E7A572]/90 text-white"
              >
                Do Search
              </Button>
            </div>
          </div>
          {notes?.map((note) => (
            <div
              key={note._id}
              className="bg-white p-4 rounded-md shadow-sm hover:border-[#E7A572] transition-colors border border-[#23325A]/10 cursor-pointer"
              onClick={() => router.push(`/items/${note._id}`)}
            >
              <h3 className="font-semibold mb-2 text-[#23325A]">
                {note.title}
              </h3>
              <MarkdownContent content={note.note} className="mb-3 overflow-hidden" />
              <div className="flex gap-2">
                {note.tags.map((tag) => (
                  <Badge
                    key={tag._id}
                    variant="secondary"
                    className="bg-[#F7E6D3] text-[#23325A] flex items-center gap-1 group"
                  >
                    {tag.name}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        void handleRemoveTag(note._id, tag._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
