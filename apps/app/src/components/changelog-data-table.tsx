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
import {
  ArrowDown01,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash,
} from "lucide-react";
import * as React from "react";

import { Doc, Id } from "@thoughtbase/backend/convex/_generated/dataModel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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

type Changelog = Doc<"changelog"> & {
  ideas: Doc<"idea">[];
};

// Custom global filter for title
const globalSearchFilter: FilterFn<Changelog> = (row, columnId, filterValue: string) => {
  const search = filterValue.toLowerCase();
  const title = row.original.title.toLowerCase();
  return title.includes(search);
};

const createColumns = (
  orgSlug?: string,
  onDelete?: (id: Id<"changelog">) => void,
): ColumnDef<Changelog>[] => [
  {
    accessorKey: "title",
    header: "Title",
    size: 400,
    minSize: 250,
    maxSize: 600,
    cell: ({ row }) =>
      orgSlug ? (
        <Link
          to="/dashboard/$orgSlug/changelog/$changelogId"
          params={{ orgSlug, changelogId: row.original._id }}
          className="hover:text-primary flex min-w-0 flex-1 items-center gap-2 font-medium hover:underline"
          title={row.original.title}
          style={{ width: "100%" }}
        >
          <span className="min-w-0 flex-1 truncate">{row.original.title}</span>
        </Link>
      ) : (
        <div
          className="flex min-w-0 flex-1 items-center gap-2 font-medium"
          title={row.original.title}
          style={{ width: "100%" }}
        >
          <span className="min-w-0 flex-1 truncate">{row.original.title}</span>
        </div>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === "published" ? "default" : "secondary"}>{status}</Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "publishedAt",
    header: "Published",
    cell: ({ row }) => {
      const publishedAt = row.original.publishedAt;
      return (
        <div className="text-muted-foreground text-sm">
          {publishedAt ? format(publishedAt, "MMM d, yyyy") : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "ideas",
    header: "Linked Ideas",
    cell: ({ row }) => {
      const ideas = row.original.ideas;
      if (!ideas || ideas.length === 0)
        return <span className="text-muted-foreground text-xs">-</span>;

      return (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {ideas.slice(0, 2).map((idea) => (
            <Badge
              key={idea._id}
              variant="outline"
              className="h-5 px-1 py-0 text-[10px] font-normal"
            >
              {idea.title}
            </Badge>
          ))}
          {ideas.length > 2 && (
            <Badge
              variant="outline"
              className="text-muted-foreground h-5 px-1 py-0 text-[10px] font-normal"
            >
              +{ideas.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground text-sm">
          {format(row.original._creationTime, "MMM d, yyyy")}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />

          <DropdownMenuContent align="end">
            {orgSlug && (
              <DropdownMenuItem
                render={
                  <Link
                    to="/dashboard/$orgSlug/changelog/$changelogId"
                    params={{ orgSlug, changelogId: row.original._id }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                }
              />
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(row.original._id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface ChangelogDataTableProps {
  data: Changelog[];
  initialStatus?: string;
  orgSlug?: string;
  onDelete?: (id: Id<"changelog">) => void;
}

export function ChangelogDataTable({
  data,
  initialStatus,
  orgSlug,
  onDelete,
}: ChangelogDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialStatus ? [{ id: "status", value: [initialStatus] }] : [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  React.useEffect(() => {
    if (initialStatus) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((f) => f.id !== "status");
        return [...otherFilters, { id: "status", value: [initialStatus] }];
      });
    } else {
      setColumnFilters((prev) => prev.filter((f) => f.id !== "status"));
    }
  }, [initialStatus]);

  const tableData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
    }));
  }, [data]);

  const tableColumns = React.useMemo(
    () => createColumns(orgSlug, onDelete),
    [orgSlug, onDelete],
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
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

  const handleSortChange = (value: string | null) => {
    switch (value) {
      case "newest":
        setSorting([{ id: "createdAt", desc: true }]);
        break;
      case "oldest":
        setSorting([{ id: "createdAt", desc: false }]);
        break;
      case "published":
        setSorting([{ id: "publishedAt", desc: true }]);
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
              placeholder="Search changelogs..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
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
              }
            />

            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["draft", "published"].map((status) => (
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
                  <Badge
                    variant={status === "published" ? "default" : "secondary"}
                    className="mr-2"
                  >
                    {status}
                  </Badge>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={handleSortChange} defaultValue="newest">
            <SelectTrigger className="w-[130px]">
              <ArrowDown01 />
              <SelectValue data-placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="published">Published</SelectItem>
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
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  No changelogs found.
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
