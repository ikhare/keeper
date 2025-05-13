"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TagPicker } from "@/components/tag-picker";
import { Id } from "@/convex/_generated/dataModel";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TodoDialog({ open, onOpenChange }: TodoDialogProps) {
  const createItem = useMutation(api.items.create);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>([]);
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  // Reset todo fields when dialog opens
  useEffect(() => {
    if (open) {
      setNewTodoTitle("");
      setSelectedTags([]);
      setDueDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    }
  }, [open]);

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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#23325A] hover:bg-[#23325A]/90 text-white">
          Add Todo (t)
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Create New Todo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Todo title..."
            className="border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572]"
            onKeyDown={(e) =>
              e.key === "Enter" && void handleCreateTodo()
            }
          />
          <DatePicker
            date={dueDate}
            onSelect={(date) => date && setDueDate(date)}
          />
          <TagPicker
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
          <Button
            onClick={() => void handleCreateTodo()}
            className="w-full bg-[#23325A] hover:bg-[#23325A]/90 text-white"
          >
            Create Todo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}