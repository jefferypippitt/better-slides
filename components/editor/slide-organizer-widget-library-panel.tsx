interface WidgetLibraryPanelState {
  attachedWidgetSet: Set<string>;
  sectionWidgetMap: Record<string, string | undefined>;
  selectedSectionId: string | null;
  widgetNames: string[];
}

interface WidgetLibraryPanelProps {
  onAttachFromLibrary: (componentName: string) => void;
  state: WidgetLibraryPanelState;
}

function getLibraryStatusText({
  isAttachedAnywhere,
  isAttachedToSelected,
}: {
  isAttachedAnywhere: boolean;
  isAttachedToSelected: boolean;
}): string {
  if (isAttachedToSelected) {
    return "click to detach";
  }
  if (isAttachedAnywhere) {
    return "in use";
  }
  return ".tsx component";
}

export function WidgetLibraryPanel({
  onAttachFromLibrary,
  state,
}: WidgetLibraryPanelProps) {
  const {
    attachedWidgetSet,
    sectionWidgetMap,
    selectedSectionId,
    widgetNames,
  } = state;

  return (
    <aside className="flex w-52 shrink-0 flex-col border-l bg-muted/20">
      <div className="border-b px-3 py-2.5">
        <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
          Component Library
        </p>
        {selectedSectionId ? (
          <p className="mt-0.5 text-[10px] text-primary">
            Click to attach to selected node
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] text-muted-foreground/60">
            Select a node on the left first
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {widgetNames.length === 0 ? (
          <p className="mt-4 text-center text-[11px] text-muted-foreground/60 italic">
            No components yet.
            <br />
            Upload a TSX file above.
          </p>
        ) : (
          widgetNames.map((name) => {
            const isAttachedToSelected =
              selectedSectionId !== null &&
              sectionWidgetMap[selectedSectionId] === name;
            const isAttachedAnywhere = attachedWidgetSet.has(name);

            return (
              <button
                className={[
                  "w-full rounded border px-2.5 py-2 text-left transition-colors",
                  selectedSectionId
                    ? "cursor-pointer hover:border-border hover:bg-muted"
                    : "cursor-default opacity-60",
                  isAttachedToSelected
                    ? "border-border bg-muted"
                    : "border-border/50 bg-background",
                ].join(" ")}
                data-nodrag
                key={name}
                onClick={(e) => {
                  e.stopPropagation();
                  onAttachFromLibrary(name);
                }}
                type="button"
              >
                <p className="truncate font-medium text-xs">{name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {getLibraryStatusText({
                    isAttachedAnywhere,
                    isAttachedToSelected,
                  })}
                </p>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
