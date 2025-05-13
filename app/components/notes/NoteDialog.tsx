"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TagPicker } from "@/components/tag-picker";
import { Id } from "@/convex/_generated/dataModel";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoteDialog({ open, onOpenChange }: NoteDialogProps) {
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const search = useAction(api.perplexity.search);
  
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>([]);

  // Reset note fields when dialog opens
  useEffect(() => {
    if (open) {
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedTags([]);
    }
  }, [open]);

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    await createItem({
      title: newNoteTitle,
      note: newNoteContent,
      tagIds: selectedTags,
    });
    resetForm();
  };

  const handleSearch = async () => {
    if (!newNoteTitle.trim()) return;

    // Create note with initial searching state
    const noteId = await createItem({
      title: newNoteTitle,
      note: "",
      tagIds: selectedTags,
      isSearching: true,
      hasUnseenResults: false,
    });

    // Close the dialog
    resetForm();

    try {
      // Perform the search
      const searchResult = await search({ query: newNoteTitle });

      // Update the note with results and mark as unseen
      await updateItem({
        _id: noteId,
        note: searchResult,
        isSearching: false,
        hasUnseenResults: true,
      });
    } catch (error) {
      console.error("Search failed:", error);
      // Update note to show error state
      await updateItem({
        _id: noteId,
        note: "Error performing search. Please try again.",
        isSearching: false,
        hasUnseenResults: false,
      });
    }
  };

  const resetForm = () => {
    setNewNoteTitle("");
    setNewNoteContent("");
    setSelectedTags([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#23325A] hover:bg-[#23325A]/90 text-white">
          Add Note (n)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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
      </DialogContent>
    </Dialog>
  );
}