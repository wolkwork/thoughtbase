import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/subdomain/$slug/.well-known")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/subdomain/$slug/.well-known"!</div>;
}
