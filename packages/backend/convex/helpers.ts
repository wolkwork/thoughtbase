import { QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

export async function getUnifiedAuthor(
  ctx: QueryCtx,
  object: Doc<"idea"> | Doc<"comment"> | Doc<"reaction">,
) {
  let authorId: string | undefined;
  if ("authorId" in object) {
    authorId = object.authorId;
  } else if ("userId" in object) {
    authorId = object.userId;
  }

  if (!authorId) {
    return undefined;
  }

  if (object.authorType === "external") {
    const author = await ctx.db
      .get(authorId as Id<"externalUser">)
      .catch(() => undefined);

    if (author) {
      return {
        name: author.name,
        email: author.email,
        image: author.avatarUrl,
        revenue: author.revenue,
        metadata: author.metadata,
      };
    }
  }

  // if (object.authorType === "internal") {
  const author = await ctx
    .runQuery(components.betterAuth.functions.getUserById, {
      id: authorId,
    })
    .catch(() => undefined);

  if (author) {
    return {
      name: author.name,
      email: author.email,
      image: author.image,
    };
  }
  // }

  return undefined;
}
