import { queryOptions } from "@tanstack/react-query";
import { $getSession } from "./functions";

export const authQueryOptions = () =>
  queryOptions({
    queryKey: ["session"],
    queryFn: ({ signal }) => $getSession({ signal }),
  });

export type AuthQueryResult = Awaited<ReturnType<typeof $getSession>>;
