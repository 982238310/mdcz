import type { MediaRootAvailabilityResponse } from "@mdcz/shared";
import { toErrorMessage } from "@mdcz/shared/error";
import { PathAutocompleteInput, type PathAutocompleteResult } from "@mdcz/views/path";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../client";
import { ErrorBanner, formatDate, Notice } from "../routeCommon";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "../ui";

const loadMediaRootPathSuggestions = async (value: string): Promise<PathAutocompleteResult> => {
  const result = await api.serverPaths.suggest({ path: value, intent: "media-root" });
  return {
    accessible: result.accessible,
    error: result.error,
    entries: result.entries.map((entry) => ({ label: entry.label, path: entry.path })),
  };
};

export function MediaDirectoriesSection() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("媒体");
  const [hostPath, setHostPath] = useState("");
  const [editingRootId, setEditingRootId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const [editingHostPath, setEditingHostPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<MediaRootAvailabilityResponse | null>(null);
  const rootsQ = useQuery({ queryKey: ["mediaRoots"], queryFn: () => api.mediaRoots.list(), retry: false });
  const createM = useMutation({ mutationFn: () => api.mediaRoots.create({ displayName, hostPath, enabled: true }) });

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      const result = await action();
      if (result && typeof result === "object" && "availability" in result) {
        setAvailability(result as MediaRootAvailabilityResponse);
      }
      await queryClient.invalidateQueries({ queryKey: ["mediaRoots"] });
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (runError) {
      setError(toErrorMessage(runError));
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">服务端媒体目录</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          WebUI 的扫描、媒体库和工具文件操作都限制在这些已注册目录内。
        </p>
      </div>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      {availability && (
        <Notice>
          {availability.root.displayName}: {availability.availability.available ? "可访问" : "不可访问"} · 检查于{" "}
          {formatDate(availability.availability.checkedAt)}
          {availability.availability.error ? ` · ${availability.availability.error}` : ""}
        </Notice>
      )}
      <Card>
        <CardHeader>
          <CardTitle>添加媒体目录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-end">
            <div className="grid gap-2 text-sm font-medium">
              <label htmlFor="media-root-display-name">显示名称</label>
              <Input
                id="media-root-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="grid gap-2 text-sm font-medium">
              <label htmlFor="media-root-host-path">主机路径</label>
              <PathAutocompleteInput
                id="media-root-host-path"
                value={hostPath}
                onChange={setHostPath}
                loadSuggestions={loadMediaRootPathSuggestions}
                inputClassName="h-10"
                placeholder="E:/Media"
              />
            </div>
            <Button onClick={() => void run(() => createM.mutateAsync())}>添加</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {rootsQ.data?.roots.map((root) => {
          const editing = editingRootId === root.id;
          return (
            <Card key={root.id}>
              <CardHeader>
                <CardTitle>{root.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto] lg:items-end">
                    <div className="grid gap-2 text-sm font-medium">
                      <label htmlFor={`media-root-edit-name-${root.id}`}>显示名称</label>
                      <Input
                        id={`media-root-edit-name-${root.id}`}
                        value={editingDisplayName}
                        onChange={(event) => setEditingDisplayName(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2 text-sm font-medium">
                      <label htmlFor={`media-root-edit-path-${root.id}`}>主机路径</label>
                      <PathAutocompleteInput
                        id={`media-root-edit-path-${root.id}`}
                        value={editingHostPath}
                        onChange={setEditingHostPath}
                        loadSuggestions={loadMediaRootPathSuggestions}
                        inputClassName="h-10"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        run(() =>
                          api.mediaRoots.update({
                            id: root.id,
                            displayName: editingDisplayName,
                            hostPath: editingHostPath,
                          }),
                        ).then(() => {
                          setEditingRootId(null);
                        })
                      }
                    >
                      保存
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingRootId(null)}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="break-all font-mono text-sm text-muted-foreground">{root.hostPath}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{root.enabled ? "已启用" : "已停用"}</Badge>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingRootId(root.id);
                          setEditingDisplayName(root.displayName);
                          setEditingHostPath(root.hostPath);
                        }}
                      >
                        编辑
                      </Button>
                      <Button variant="secondary" onClick={() => void run(() => api.scans.start({ rootId: root.id }))}>
                        扫描
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => void run(() => api.mediaRoots.availability({ id: root.id }))}
                      >
                        检查
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void run(() =>
                            root.enabled
                              ? api.mediaRoots.disable({ id: root.id })
                              : api.mediaRoots.enable({ id: root.id }),
                          )
                        }
                      >
                        {root.enabled ? "停用" : "启用"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => void run(() => api.mediaRoots.delete({ id: root.id }))}
                      >
                        删除
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
        {rootsQ.data?.roots.length === 0 && (
          <div className="rounded-[var(--radius-quiet-xl)] border border-border/40 bg-surface px-6 py-8 text-center text-sm text-muted-foreground">
            尚未注册媒体目录。
          </div>
        )}
      </div>
    </section>
  );
}
