import {
  ColumnDef,
  FilterFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowDown01, Search } from "lucide-react";
import * as React from "react";

import { CommentBadge, LikeBadge } from "~/components/engagement-badges";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
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

export type Member = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  type: "internal" | "external";
  revenue: number;
  commentCount: number;
  likeCount: number;
  lastActiveAt: Date | null;
  createdAt: Date;
};

// Custom global filter for name and email
const globalSearchFilter: FilterFn<Member> = (row, columnId, filterValue: string) => {
  const search = filterValue.toLowerCase();
  const name = row.original.name.toLowerCase();
  const email = row.original.email?.toLowerCase() || "";

  return name.includes(search) || email.includes(search);
};

const columns: ColumnDef<Member>[] = [
  {
    id: "user",
    accessorFn: (row) => row.name,
    header: "User",
    size: 300,
    minSize: 200,
    maxSize: 400,
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.image || undefined} alt={member.name} />
            <AvatarFallback className="text-xs">
              {member.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium" title={member.name}>
              {member.name}
            </span>
            {member.email && (
              <span
                className="text-muted-foreground truncate text-xs"
                title={member.email}
              >
                {member.email}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => {
      const amount = row.original.revenue || 0;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    id: "engagement",
    header: "Engagement",
    accessorFn: (row) => row.commentCount + row.likeCount,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1.5">
          <CommentBadge count={row.original.commentCount} />
          <LikeBadge count={row.original.likeCount} />
        </div>
      );
    },
  },
  {
    accessorKey: "commentCount",
    header: "Comments",
    enableHiding: true,
  },
  {
    accessorKey: "likeCount",
    header: "Likes",
    enableHiding: true,
  },
  {
    accessorKey: "lastActiveAt",
    header: "Last Active",
    cell: ({ row }) => {
      const lastActive = row.original.lastActiveAt;
      return (
        <div className="text-muted-foreground text-sm">
          {lastActive ? format(lastActive, "MMM d, yyyy") : "-"}
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
          {format(row.original.createdAt, "MMM d, yyyy")}
        </div>
      );
    },
  },
];

interface MembersDataTableProps {
  data: Member[];
}

export function MembersDataTable({ data }: MembersDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "lastActiveAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const tableData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
    }));
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalSearchFilter,
    state: {
      sorting,
      globalFilter,
      columnVisibility: {
        commentCount: false,
        likeCount: false,
      },
    },
  });

  const handleSortChange = (value: string | null) => {
    switch (value) {
      case "lastActive":
        setSorting([{ id: "lastActiveAt", desc: true }]);
        break;
      case "created":
        setSorting([{ id: "createdAt", desc: true }]);
        break;
      case "revenue":
        setSorting([{ id: "revenue", desc: true }]);
        break;
      case "comments":
        setSorting([{ id: "commentCount", desc: true }]);
        break;
      case "likes":
        setSorting([{ id: "likeCount", desc: true }]);
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
              placeholder="Search by name or email..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={handleSortChange} defaultValue="lastActive">
            <SelectTrigger className="w-[140px]">
              <ArrowDown01 />
              <SelectValue data-placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastActive">Last Active</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
              <SelectItem value="likes">Likes</SelectItem>
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
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} member(s)
        </div>
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
