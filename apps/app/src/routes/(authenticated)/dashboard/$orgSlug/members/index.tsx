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

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/members/")({
  component: MembersPage,
});

function MembersPage() {
  const { orgSlug } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="bg-muted rounded-full p-3">
              <Users className="text-muted-foreground h-6 w-6" />
            </div>
          </div>
          <CardTitle>Members Moved</CardTitle>
          <CardDescription>
            Team management has been moved to the Settings page under the Team tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={
              <Link
                to="/dashboard/$orgSlug/settings"
                params={{ orgSlug }}
                search={{ success: false }}
              >
                Go to Settings
              </Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
