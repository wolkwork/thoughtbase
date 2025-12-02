import { Link } from "@tanstack/react-router";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RoadmapCardProps {
  idea: any;
  publicOrgSlug?: string;
}

export function RoadmapCard({ idea, publicOrgSlug }: RoadmapCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea.id, data: { idea } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex flex-col gap-2 rounded-md border bg-card p-3 transition-all hover:border-primary/50 cursor-grab active:cursor-grabbing",
        isDragging && "z-50 ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2">
            {idea.title}
        </h4>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
         <div className="flex items-center gap-2">
             <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>{idea.reactionCount}</span>
             </div>
             <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{idea.commentCount}</span>
             </div>
         </div>
         
         {idea.author.image ? (
            <img 
                src={idea.author.image} 
                alt={idea.author.name} 
                className="w-5 h-5 rounded-full object-cover ring-1 ring-border" 
            />
        ) : (
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium ring-1 ring-border">
                {idea.author.name.charAt(0)}
            </div>
        )}
      </div>
      
       {/* Invisible link overlay for navigation, but allowing drag */}
       {/* We can't easily have a full overlay link AND drag. 
           Best pattern is usually to have a specific handle or make the whole card draggable 
           and have a button/icon for detail view, OR handle click vs drag.
           For now, let's just add a small view button or make the title a link that stops propagation?
           Actually dnd-kit handles click vs drag well usually. 
           Let's try adding an absolute link that's lower z-index? 
           Or just a small button. 
           Let's keep it simple: The whole card is draggable. 
           Maybe a small icon to open? 
       */}
       
       {publicOrgSlug ? (
           <Link 
             to="/org/$slug/$ideaId" 
             params={{ slug: publicOrgSlug, ideaId: idea.id }}
             className="absolute inset-0 z-0"
           />
       ) : (
           <Link 
             to="/dashboard/ideas/$ideaId" 
             params={{ ideaId: idea.id }}
             className="absolute inset-0 z-0"
           />
       )}
       {/* Re-cover with relative content so interactions work? 
           Actually, wrapping everything in Link is tricky with dnd-kit.
           Better to just have a specific "View" area or rely on double click?
           Or just make the title a link.
       */}
    </div>
  );
}

