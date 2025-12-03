import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const Route = createFileRoute("/(authenticated)/dashboard/members/")({
  component: MembersPage,
});

function MembersPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>Members Moved</CardTitle>
          <CardDescription>
            Team management has been moved to the Settings page under the Team tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard/settings" search={{ success: false }}>
              Go to Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
