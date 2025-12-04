import { Link } from "@tanstack/react-router";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowDown01, Search, SlidersHorizontal } from "lucide-react";
import * as React from "react";

import { CommentBadge, LikeBadge } from "~/components/engagement-badges";
import { StatusBadge } from "~/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

// Define the Idea type based on what we receive from the API
export type Idea = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  author: {
    name: string;
    image?: string | null;
  };
  tags: {
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
  commentCount: number;
  reactionCount: number;
  // Placeholder for revenue
  revenue?: number;
};

// Custom filter for tags
const tagsFilter: FilterFn<Idea> = (row, columnId, filterValue: string[]) => {
  const tags = row.getValue(columnId) as Idea["tags"];
  if (!filterValue || filterValue.length === 0) return true;
  const tagNames = tags.map((t) => t.tag.name);
  return filterValue.some((val) => tagNames.includes(val));
};

// Custom global filter for title, description, and user
const globalSearchFilter: FilterFn<Idea> = (row, columnId, filterValue: string) => {
  const search = filterValue.toLowerCase();
  const title = row.original.title.toLowerCase();
  const description = row.original.description?.toLowerCase() || "";
  const authorName = row.original.author.name.toLowerCase();

  return (
    title.includes(search) || description.includes(search) || authorName.includes(search)
  );
};

export const columns: ColumnDef<Idea>[] = [
  {
    accessorKey: "title",
    header: "Title",
    size: 400, // Give this column more space
    minSize: 250,
    maxSize: 600,
    cell: ({ row }) => (
      <Link
        to="/dashboard/ideas/$ideaId"
        params={{ ideaId: row.original.id }}
        className="hover:text-primary flex min-w-0 flex-1 items-center gap-2 font-medium hover:underline"
        title={row.getValue("title")}
        style={{ width: "100%" }}
      >
        <StatusBadge showLabel={false} status={row.original.status} />
        <span className="min-w-0 flex-1 truncate">{row.getValue("title")}</span>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableHiding: true, // Allow hiding
  },
  {
    id: "engagement",
    header: "Engagement",
    accessorFn: (row) => row.commentCount + row.reactionCount,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1.5">
          <CommentBadge count={row.original.commentCount} />
          <LikeBadge count={row.original.reactionCount} />
        </div>
      );
    },
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("revenue") || "0");
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground text-sm">
          {format(row.getValue("createdAt"), "MMM d, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "author",
    header: "User",
    cell: ({ row }) => {
      const author = row.original.author;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.image || undefined} alt={author.name} />
            <AvatarFallback className="text-[10px]">
              {author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate text-sm" title={author.name}>
            {author.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags;
      if (!tags || tags.length === 0)
        return <span className="text-muted-foreground text-xs">-</span>;

      return (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {tags.slice(0, 2).map((t) => (
            <Badge
              key={t.tag.id}
              variant="outline"
              className="h-5 px-1 py-0 text-[10px] font-normal"
            >
              {t.tag.name}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge
              variant="outline"
              className="text-muted-foreground h-5 px-1 py-0 text-[10px] font-normal"
            >
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: tagsFilter,
  },
];

interface IdeasDataTableProps {
  data: Idea[];
  initialStatus?: string;
}

export function IdeasDataTable({ data, initialStatus }: IdeasDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialStatus ? [{ id: "status", value: [initialStatus] }] : [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    status: false,
  });
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  React.useEffect(() => {
    if (initialStatus) {
      setColumnFilters((prev) => {
        // If status filter already exists, replace it, otherwise add it
        const otherFilters = prev.filter((f) => f.id !== "status");
        return [...otherFilters, { id: "status", value: [initialStatus] }];
      });
    } else {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "status"));
    }
  }, [initialStatus]);

  // We use useMemo to keep it stable across renders unless data changes
  const tableData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
    }));
  }, [data]);

  // Extract unique tags for filter
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    data.forEach((idea) => {
      idea.tags.forEach((t) => tags.add(t.tag.name));
    });
    return Array.from(tags).sort();
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalSearchFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Handlers for custom sort select
  const handleSortChange = (value: string) => {
    switch (value) {
      case "newest":
        setSorting([{ id: "createdAt", desc: true }]);
        break;
      case "top": // Top = most reactions
        // We don't have a direct 'reactionCount' column accessor, but we can sort by engagement or add a hidden column.
        // Actually 'engagement' is sum of both.
        // Let's add a hidden column for reactionCount if we want strict "Top" as just reactions, or use engagement.
        // The user said "Top" usually implies "Top Rated" (reactions).
        // Let's assume "Top" means sort by reactionCount.
        // Since we don't have a column for just reactionCount visible, we can sort by the engagement column which is close enough,
        // or better, let's just use the engagement column for "Top" and "Trending" for now.
        // Or I can programmatically sort by a key that exists in data even if not a column?
        // TanStack table sorts by column IDs.
        // I'll add a specific sort handler that accesses the raw data if needed, but easier to just map to existing columns.
        // I'll use "engagement" for Top.
        setSorting([{ id: "engagement", desc: true }]);
        break;
      case "trending":
        // For trending, ideally we'd have recent stats. We'll use engagement for now as a proxy.
        setSorting([{ id: "engagement", desc: true }]);
        break;
      case "revenue":
        setSorting([{ id: "revenue", desc: true }]);
        break;
      default:
        setSorting([]);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full md:max-w-sm">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search title, description, user..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative border-dashed">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Status
                {(table.getColumn("status")?.getFilterValue() as string[])?.length >
                  0 && (
                  <div className="bg-primary absolute top-0 right-0 flex size-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-medium text-white">
                    {(table.getColumn("status")?.getFilterValue() as string[])?.length}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                "pending",
                "reviewing",
                "planned",
                "in_progress",
                "completed",
                "closed",
              ].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={(
                    table.getColumn("status")?.getFilterValue() as string[]
                  )?.includes(status)}
                  onCheckedChange={(checked) => {
                    const column = table.getColumn("status");
                    const filterValue = (column?.getFilterValue() as string[]) || [];
                    if (checked) {
                      column?.setFilterValue([...filterValue, status]);
                    } else {
                      column?.setFilterValue(filterValue.filter((val) => val !== status));
                    }
                  }}
                >
                  <StatusBadge status={status} showLabel={true} className="mr-2" />
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-dashed">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Tags
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={(
                      table.getColumn("tags")?.getFilterValue() as string[]
                    )?.includes(tag)}
                    onCheckedChange={(checked) => {
                      const column = table.getColumn("tags");
                      const filterValue = (column?.getFilterValue() as string[]) || [];
                      if (checked) {
                        column?.setFilterValue([...filterValue, tag]);
                      } else {
                        column?.setFilterValue(filterValue.filter((val) => val !== tag));
                      }
                    }}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={handleSortChange} defaultValue="newest">
            <SelectTrigger className="w-[130px]">
              <ArrowDown01 />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
