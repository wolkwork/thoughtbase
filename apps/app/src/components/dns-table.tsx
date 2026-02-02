import { Check, Copy } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

// DNSRecord type - matches the type from Convex backend
export type DNSRecord = {
  type: "CNAME" | "A" | "TXT";
  name: string;
  value: string;
};

export type DNSCopyButtonProps = {
  text: string;
  copyTimeout?: number;
};

export const DNSCopyButton = ({ text, copyTimeout = 2000 }: DNSCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, copyTimeout);
  };

  return (
    <Button
      className="hover:bg-muted h-8 w-8 p-0"
      onClick={handleCopy}
      size="sm"
      variant="ghost"
    >
      {isCopied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">Copy {text}</span>
    </Button>
  );
};

export type DNSTableProps = ComponentProps<typeof Table> & {
  records: DNSRecord[];
  copyTimeout?: number;
};

export const DNSTable = ({ records, className, ...props }: DNSTableProps) => {
  if (records.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-background overflow-hidden rounded-lg border", className)}>
      <Table {...props}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={`${record.type}-${record.name}-${index}`}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="break-all">{record.type}</span>
                  <DNSCopyButton text={record.type} />
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="break-all">{record.name}</span>
                  <DNSCopyButton text={record.name} />
                </div>
              </TableCell>
              <TableCell className="truncate font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="max-w-md truncate break-all">{record.value}</span>
                  <DNSCopyButton text={record.value} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
