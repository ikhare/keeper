"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TagPicker } from "@/components/tag-picker";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ItemPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const item = useQuery(api.items.get, { id: params.id as Id<"items"> });
  const updateItem = useMutation(api.items.update);
  const deleteItem = useMutation(api.items.remove);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item?.title ?? "");
  const [editedNote, setEditedNote] = useState(item?.note ?? "");
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    if (item) {
      setEditedTitle(item.title);
      setEditedNote(item.note);
    }
  }, [item]);

  const handleSave = async () => {
    await updateItem({
      _id: item!._id,
      title: editedTitle,
      note: editedNote,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteItem({ _id: item!._id });
      setIsDeleted(true);
      toast({
        title: "Item deleted",
        description: "The item has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the item.",
        variant: "destructive",
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) void updateItem({ _id: item!._id, dueDate: date.getTime() });
  };

  const handleCompletedChange = (checked: boolean) => {
    void updateItem({ _id: item!._id, completed: checked });
  };

  const handleTagsChange = (tags: Id<"tags">[]) => {
    void updateItem({
      _id: item!._id,
      tagIds: tags,
      title: undefined,
      note: undefined,
      dueDate: undefined,
      completed: undefined,
      priority: undefined,
      assigneeId: undefined,
    });
  };

  // Handle deleted or non-existent item
  if (isDeleted || item === undefined) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-[#23325A] mb-4">
            Item not found
          </h1>
          <p className="text-gray-600 mb-6">
            This item may have been deleted or does not exist.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-[#23325A] text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (item === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23325A]" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="text-[#23325A]"
        >
          ← Back
        </Button>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-[#23325A] text-white"
        >
          {isEditing ? "Done" : "Edit"}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {isEditing ? (
          <>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572]"
            />
            <Textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Content (supports markdown)"
              className="min-h-[400px] font-mono text-sm border-[#23325A]/20 focus:border-[#E7A572] focus:ring-[#E7A572] whitespace-pre-wrap"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => void handleSave()}
                className="bg-[#23325A] text-white"
              >
                Save
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this item and remove all of its data from the server.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDelete()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#23325A]">{item.title}</h1>
            <MarkdownContent content={item.note} />
          </>
        )}

        <div className="pt-4 border-t">
          {item.dueDate && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[#23325A] mb-2">
                Due Date
              </h3>
              <DatePicker
                date={new Date(item.dueDate)}
                onSelect={handleDateChange}
              />
            </div>
          )}

          {item.dueDate && (
            <div className="mb-4 flex items-center gap-2">
              <Checkbox
                checked={item.completed}
                onCheckedChange={handleCompletedChange}
                className="h-5 w-5 text-[#E7A572] border-[#E7A572] rounded-md cursor-pointer"
              />
              <span className="text-sm text-[#23325A]">Completed</span>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-[#23325A] mb-2">Tags</h3>
            <TagPicker
              selectedTags={item.tags.map((tag) => tag._id)}
              onTagsChange={handleTagsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
