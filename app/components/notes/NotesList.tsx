"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { MarkdownContent } from "@/components/ui/markdown-content";

// Create a helper type for items with tags
import { Doc } from "@/convex/_generated/dataModel";
type WithTags<T extends "items"> = Doc<T> & { tags: Doc<"tags">[] };

interface NotesListProps {
  notes: WithTags<"items">[] | undefined | null;
  notesStatus: "LoadingFirstPage" | "CanLoadMore" | "Exhausted" | "LoadingMore";
  loadMoreNotes: (numItems: number) => void;
}

export function NotesList({
  notes,
  notesStatus,
  loadMoreNotes,
}: NotesListProps) {
  const router = useRouter();
  const removeTag = useMutation(api.tags.removeFromItem);

  const handleRemoveTag = async (itemId: Id<"items">, tagId: Id<"tags">) => {
    await removeTag({
      itemId,
      tagId,
    });
  };

  // Debug log to check what's actually received
  console.log("NotesList received notes:", notes);

  // First log exactly what we received
  console.log("NotesList full data:", JSON.stringify(notes, null, 2));

  // Handle loading and empty states
  if (notesStatus === "LoadingFirstPage") {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23325A]" />
      </div>
    );
  }

  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return <div className="text-center py-6 text-gray-500">No notes found</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.isArray(notes) &&
          notes.map((note) => (
            <div
              key={note._id}
              className={`bg-white p-4 rounded-md shadow-sm hover:border-[#E7A572] transition-colors border cursor-pointer relative ${
                note.hasUnseenResults
                  ? "border-[#E7A572]"
                  : "border-[#23325A]/10"
              }`}
              onClick={() => router.push(`/items/${note._id}`)}
            >
              {note.hasUnseenResults && (
                <div className="absolute top-2 right-2 bg-[#23325A]/90 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                  New results available
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-[#23325A]">{note.title}</h3>
              </div>
              {note.isSearching ? (
                <div className="flex items-center justify-center py-8 space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#23325A]" />
                  <span className="text-[#23325A]">Searching...</span>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="max-h-[200px] overflow-hidden">
                      <MarkdownContent content={note.note} className="mb-3" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                  </div>
                  <div className="flex gap-2 mt-2">
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
                </>
              )}
            </div>
          ))}
      </div>
      {notesStatus === "CanLoadMore" && (
        <div className="mt-4">
          <Button
            onClick={() => loadMoreNotes(10)}
            variant="outline"
            size="sm"
            className="text-[#23325A] hover:bg-[#23325A]/5"
          >
            Load More Notes
          </Button>
        </div>
      )}
      {notesStatus === "LoadingMore" && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#23325A]" />
        </div>
      )}
    </div>
  );
}
