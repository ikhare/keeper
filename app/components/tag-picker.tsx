"use client";

import { Tag, TagInput } from "emblor";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface TagPickerProps {
  selectedTags: Id<"tags">[];
  onTagsChange: (tags: Id<"tags">[]) => void;
}

interface EmblorTag extends Tag {
  id: Id<"tags">;
}

export function TagPicker({ selectedTags, onTagsChange }: TagPickerProps) {
  const tags = useQuery(api.tags.list);
  const createTag = useMutation(api.tags.create);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [localTags, setLocalTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (tags && selectedTags) {
      const initialTags = selectedTags
        .map((id) => {
          const tag = tags.find((t) => t._id === id);
          return tag ? { id: tag._id, text: tag.name } : null;
        })
        .filter((tag): tag is EmblorTag => tag !== null);

      setLocalTags(initialTags);
    }
  }, [tags, selectedTags]);

  // Handle changes from TagInput
  const handleTagsChange = (newTags: Tag[]) => {
    setLocalTags(newTags);
    const tagIds = newTags.map((tag) => tag.id as Id<"tags">);
    onTagsChange(tagIds);
  };

  return (
    <div className="w-full">
      <TagInput
        placeholder="Add tags..."
        tags={localTags}
        setTags={handleTagsChange}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        enableAutocomplete={true}
        autocompleteOptions={
          tags?.map((tag) => ({
            id: tag._id,
            text: tag.name,
          })) ?? []
        }
        className="w-full border rounded-md p-2 bg-white border-[#23325A]/20 focus-within:border-[#E7A572] focus-within:ring-1 focus-within:ring-[#E7A572]"
        inputClassName="focus:outline-none"
        tagClassName="bg-[#F7E6D3] text-[#23325A] border-none"
      />
    </div>
  );
}
