import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

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
