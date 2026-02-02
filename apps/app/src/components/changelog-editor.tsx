import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@thoughtbase/backend/convex/_generated/api";
import { Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { upload } from "@vercel/blob/client";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ImageIcon,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { TiptapEditor } from "./tiptap-editor";

interface ChangelogEditorProps {
  organizationId: string;
  initialData?: {
    id?: string;
    title: string;
    content?: string;
    featuredImage?: string;
    publishedAt?: Date | string;
    status: "draft" | "published";
    ideas: { id: Id<"idea">; title: string }[];
  };
  onSubmit: (data: {
    title: string;
    content: string;
    featuredImage?: string;
    publishedAt?: string;
    status: "draft" | "published";
    ideaIds: Id<"idea">[];
  }) => void;
  isSubmitting?: boolean;
}

export function ChangelogEditor({
  organizationId,
  initialData,
  onSubmit,
  isSubmitting,
}: ChangelogEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [featuredImage, setFeaturedImage] = useState<string | undefined>(
    initialData?.featuredImage,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(
    initialData?.publishedAt ? new Date(initialData.publishedAt) : new Date(),
  );
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status || "draft",
  );
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<Id<"idea">[]>(
    initialData?.ideas.map((i) => i.id) || [],
  );
  const [ideaSelectOpen, setIdeaSelectOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all completed ideas
  const { data: allIdeas = [] } = useQuery(
    convexQuery(api.changelogs.getIdeasForChangelogSelection, {
      organizationId,
    }),
  );

  // Get suggested ideas (completed since last changelog)
  const { data: suggestedIdeas = [] } = useQuery(
    convexQuery(api.changelogs.getCompletedIdeasSinceLastChangelog, {
      organizationId,
    }),
  );

  const suggestedIdeaIds = new Set<Id<"idea">>(suggestedIdeas.map((i) => i.id));
  const selectedIdeas = allIdeas.filter((i) => selectedIdeaIds.includes(i.id));

  const handleToggleIdea = (ideaId: Id<"idea">) => {
    setSelectedIdeaIds((prev) =>
      prev.includes(ideaId) ? prev.filter((id) => id !== ideaId) : [...prev, ideaId],
    );
  };

  const handleAddSuggested = () => {
    const newIds = suggestedIdeas
      .map((i) => i.id)
      .filter((id) => !selectedIdeaIds.includes(id));
    setSelectedIdeaIds((prev) => [...prev, ...newIds]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setFeaturedImage(blob.url);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFeaturedImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      content,
      featuredImage,
      publishedAt: publishedAt ? publishedAt.toISOString() : undefined,
      status,
      ideaIds: selectedIdeaIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's new in this release?"
          required
        />
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <Label>Featured Image (optional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
        {featuredImage ? (
          <div className="relative">
            <img
              src={featuredImage}
              alt="Featured"
              className="h-48 w-full rounded-lg border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemoveImage}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-32 w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="text-muted-foreground h-8 w-8" />
              <span className="text-muted-foreground text-sm">
                {isUploading ? "Uploading..." : "Click to upload an image"}
              </span>
            </div>
          </Button>
        )}
      </div>

      {/* Content Editor */}
      <div className="space-y-2">
        <Label>Content</Label>
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Describe the changes, improvements, and new features..."
        />
      </div>

      {/* Linked Ideas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Linked Ideas</Label>
          {suggestedIdeas.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddSuggested}
              className="h-7 gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              Add {suggestedIdeas.length} suggested
            </Button>
          )}
        </div>

        <Popover open={ideaSelectOpen} onOpenChange={setIdeaSelectOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={ideaSelectOpen}
                className="w-full justify-between"
              >
                {selectedIdeaIds.length > 0
                  ? `${selectedIdeaIds.length} idea${selectedIdeaIds.length > 1 ? "s" : ""} selected`
                  : "Select ideas to include..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            }
          />

          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search ideas..." />
              <CommandList>
                <CommandEmpty>No ideas found.</CommandEmpty>
                {suggestedIdeas.length > 0 && (
                  <CommandGroup heading="Suggested (completed since last changelog)">
                    {suggestedIdeas.map((idea) => (
                      <CommandItem
                        key={idea.id}
                        value={idea.title}
                        onSelect={() => handleToggleIdea(idea.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIdeaIds.includes(idea.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span className="truncate">{idea.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup heading="All completed ideas">
                  {allIdeas
                    .filter((idea) => !suggestedIdeaIds.has(idea.id))
                    .map((idea) => (
                      <CommandItem
                        key={idea.id}
                        value={idea.title}
                        onSelect={() => handleToggleIdea(idea.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIdeaIds.includes(idea.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span className="truncate">{idea.title}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected ideas badges */}
        {selectedIdeas.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedIdeas.map((idea) => (
              <Badge key={idea.id} variant="secondary" className="gap-1 pr-1">
                <span className="max-w-[200px] truncate">{idea.title}</span>
                <button
                  type="button"
                  onClick={() => handleToggleIdea(idea.id)}
                  className="hover:bg-muted-foreground/20 ml-1 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Publishing Date and Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label>Publishing Date</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !publishedAt && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {publishedAt ? format(publishedAt, "PPP") : "Pick a date"}
                </Button>
              }
            />

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={publishedAt}
                onSelect={(date) => {
                  setPublishedAt(date);
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-3 pb-1">
          <Label htmlFor="status" className="text-sm">
            Published
          </Label>
          <Switch
            id="status"
            checked={status === "published"}
            onCheckedChange={(checked) => setStatus(checked ? "published" : "draft")}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting || !title}>
          {isSubmitting
            ? "Saving..."
            : initialData?.id
              ? "Update Changelog"
              : "Create Changelog"}
        </Button>
      </div>
    </form>
  );
}
