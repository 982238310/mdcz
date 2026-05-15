import { toErrorMessage } from "@mdcz/shared/error";
import type { LibraryEntryDto } from "@mdcz/shared/serverDtos";
import type { LibraryAvailabilityFilter } from "@mdcz/views/library";
import { LibraryDeleteDialog, LibraryIndexView } from "@mdcz/views/library";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { api, getLibraryAssetSrc } from "../client";
import { AppLink } from "../routeCommon";

export function LibraryPage() {
  const [query, setQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<LibraryAvailabilityFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<LibraryEntryDto | null>(null);
  const libraryQ = useQuery({
    queryKey: ["library", "search", query],
    queryFn: () => api.library.search({ query, limit: 300 }),
    retry: false,
  });

  return (
    <>
      <LibraryIndexView
        availabilityFilter={availabilityFilter}
        entries={libraryQ.data?.entries ?? []}
        errorMessage={libraryQ.error ? toErrorMessage(libraryQ.error) : null}
        getImageSrc={(path, entry) => getLibraryAssetSrc({ path, rootId: entry.rootId })}
        isLoading={libraryQ.isLoading}
        linkComponent={LibraryEntryLink}
        onAvailabilityFilterChange={setAvailabilityFilter}
        onDeleteEntry={setDeleteTarget}
        onQueryChange={setQuery}
        onRefresh={() => {
          void libraryQ.refetch();
        }}
        query={query}
        total={libraryQ.data?.total ?? 0}
      />
      <LibraryDeleteDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          if (!target) return;
          void deleteLibraryEntry(target, () => {
            setDeleteTarget(null);
            void libraryQ.refetch();
          });
        }}
      />
    </>
  );
}

async function deleteLibraryEntry(entry: LibraryEntryDto, onSuccess: () => void) {
  try {
    await api.library.delete({ id: entry.id });
    toast.success("已从媒体库移除");
    onSuccess();
  } catch (error) {
    toast.error(toErrorMessage(error));
  }
}

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryEntryLink({
  children,
  className,
  entry,
}: {
  children: ReactNode;
  className?: string;
  entry: { scrapeOutputId: string | null };
}) {
  if (!entry.scrapeOutputId) {
    return null;
  }

  return (
    <AppLink className={className} to={`/scrape/${encodeURIComponent(entry.scrapeOutputId)}`}>
      {children}
    </AppLink>
  );
}
