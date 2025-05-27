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

  // Synchronously update localTags state
  const handleSetLocalTags: React.Dispatch<React.SetStateAction<Tag[]>> = (newTagsOrUpdater) => {
    setLocalTags(newTagsOrUpdater);
  };

  // Asynchronously process tag changes
  useEffect(() => {
    const processTagChangesAsync = async () => {
      if (!tags) return; // Convex query for all tags might not be ready

      // Create any new tags and get their Convex IDs
      const newTagIdsPromises = localTags.map(async (tag) => {
        // If the tag already has a valid Convex ID and exists in the fetched tags, use it
        if (tag.id && tags.some((t) => t._id === tag.id)) {
          return tag.id as Id<"tags">;
        }
        // Check if a tag with the same text already exists
        const existingTag = tags.find(t => t.name === tag.text);
        if (existingTag) {
          return existingTag._id;
        }
        // Otherwise create a new tag
        return await createTag({ name: tag.text });
      });

      const newTagIds = (await Promise.all(newTagIdsPromises)).filter(id => id !== null) as Id<"tags">[];

      // Compare with selectedTags to avoid unnecessary updates
      const sortedNewTagIds = [...newTagIds].sort();
      const sortedSelectedTags = [...selectedTags].sort();

      if (JSON.stringify(sortedNewTagIds) !== JSON.stringify(sortedSelectedTags)) {
        onTagsChange(newTagIds);
      }
    };

    // We need to compare localTags (Emblor's format) with selectedTags (Convex ID format)
    // to decide if we should run the async processing.
    // This check helps prevent running async logic if the change to localTags
    // was triggered by selectedTags prop change that's already reflected.
    const localTagIds = localTags.map(lt => lt.id).filter(id => id !== undefined).sort();
    const currentSelectedIds = [...selectedTags].sort();
    if (JSON.stringify(localTagIds) !== JSON.stringify(currentSelectedIds) || localTags.some(lt => !lt.id)) {
      void (async () => {
        try {
          await processTagChangesAsync();
        } catch (error) {
          console.error("Failed to process tag changes:", error);
          // Optionally, handle the error in the UI
        }
      })();
    }

  }, [localTags, tags, createTag, onTagsChange, selectedTags]);

  return (
    <div className="w-full">
      <TagInput
        placeholder="Add tags..."
        tags={localTags}
        setTags={handleSetLocalTags} // Changed to synchronous handler
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
