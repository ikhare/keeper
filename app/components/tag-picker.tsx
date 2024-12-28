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

export function TagPicker({ onTagsChange }: TagPickerProps) {
  const tags = useQuery(api.tags.list);
  const createTag = useMutation(api.tags.create);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [localTags, setLocalTags] = useState<Tag[]>([]);

  // Handle changes from TagInput
  useEffect(() => {
    const updateTags = async () => {
      const tagIds = await Promise.all(
        localTags.map(async (tag) => {
          // Check if tag already exists in tags list
          const existingTag = tags?.find((t) => t.name === tag.text);
          if (existingTag) {
            return existingTag._id;
          }

          // Create new tag if it doesn't exist
          return await createTag({ name: tag.text });
        })
      );
      onTagsChange(tagIds);
    };
    void updateTags();
  }, [localTags, createTag, onTagsChange, tags]);

  return (
    <div className="w-full">
      <TagInput
        placeholder="Add tags..."
        tags={localTags}
        setTags={setLocalTags}
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
