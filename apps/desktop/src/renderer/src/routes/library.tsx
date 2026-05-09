import { toErrorMessage } from "@mdcz/shared/error";
import { LibraryIndexView } from "@mdcz/views/library";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ipc } from "@/client/ipc";

export function LibraryPage() {
  const [query, setQuery] = useState("");
  const [rootId, setRootId] = useState("");
  const libraryQ = useQuery({
    queryKey: ["library", "list", query, rootId],
    queryFn: () => ipc.library.list({ query, rootId: rootId || undefined }),
  });

  return (
    <LibraryIndexView
      entries={libraryQ.data?.entries ?? []}
      errorMessage={libraryQ.error ? toErrorMessage(libraryQ.error) : null}
      isLoading={libraryQ.isLoading}
      onQueryChange={setQuery}
      onRefresh={() => void libraryQ.refetch()}
      onRootChange={setRootId}
      query={query}
      rootId={rootId}
      roots={[]}
      total={libraryQ.data?.total ?? 0}
    />
  );
}

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});
