import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(authenticated)/dashboard")({
  component: Outlet,
});
