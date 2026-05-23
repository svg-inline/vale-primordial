"use client";

import Image from "next/image";
import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { assetPath } from "@/lib/data/format";
import type { DivineBookListEntry, DivineBookTreeNode } from "@/types/divine-books";

interface DivineBookTreeViewProps {
  rootItemId: string;
  tree: DivineBookTreeNode | null;
  listItems: DivineBookListEntry[];
  progress: Record<string, boolean>;
  onToggleNode: (nodeId: string, value: boolean) => void;
  onReset: () => void;
}

export function DivineBookTreeView({
  rootItemId,
  tree,
  listItems,
  progress,
  onToggleNode,
  onReset,
}: DivineBookTreeViewProps) {
  const [mode, setMode] = useState<"tree" | "list">("tree");

  if (!tree) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted p-4">
        <div>
          <h2 className="font-extrabold text-text">Arvore de materiais</h2>
          <p className="app-muted text-sm">{Object.keys(progress).length} ponto(s) marcados.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("tree")}
            aria-pressed={mode === "tree"}
            className="app-button app-button--sm app-button--secondary"
          >
            Arvore
          </button>
          <button
            type="button"
            onClick={() => setMode("list")}
            aria-pressed={mode === "list"}
            className="app-button app-button--sm app-button--secondary"
          >
            Lista
          </button>
          <button
            type="button"
            onClick={onReset}
            className="app-button app-button--sm app-button--ghost"
            aria-label={`Resetar progresso de ${rootItemId}`}
          >
            <RotateCcw size={16} aria-hidden />
          </button>
        </div>
      </header>

      <div className="p-4">
        {mode === "tree" ? (
          <TreeNode node={tree} onToggleNode={onToggleNode} />
        ) : (
          <ListView items={listItems} />
        )}
      </div>
    </section>
  );
}

function TreeNode({
  node,
  onToggleNode,
}: {
  node: DivineBookTreeNode;
  onToggleNode: (nodeId: string, value: boolean) => void;
}) {
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => onToggleNode(node.nodeId, !node.completed)}
        className={`flex items-center gap-3 rounded border px-3 py-2 text-left ${
          node.completed
            ? "border-accent bg-accent-soft"
            : "border-border bg-surface-muted"
        }`}
      >
        {node.icon ? (
          <Image
            src={assetPath(node.icon)}
            alt=""
            width={28}
            height={28}
            style={{ width: "28px", height: "28px" }}
            className="rounded object-contain"
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-text">{node.name}</span>
          <span className="app-muted block text-xs">
            Necessario x{node.quantity}, obtido x{node.ownedQuantity}
          </span>
        </span>
        {node.completed ? <Check size={16} className="text-accent" aria-hidden /> : null}
      </button>

      {node.children.length > 0 ? (
        <div className="ml-5 grid gap-2 border-l border-border pl-3">
          {node.children.map((child) => (
            <TreeNode key={child.nodeId} node={child} onToggleNode={onToggleNode} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ListView({ items }: { items: DivineBookListEntry[] }) {
  if (items.length === 0) {
    return <p className="app-muted text-sm">Nenhum item na lista.</p>;
  }

  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li
          key={item.itemId}
          className="flex items-center gap-3 rounded border border-border bg-surface-muted px-3 py-2"
        >
          {item.icon ? (
            <Image
              src={assetPath(item.icon)}
              alt=""
              width={28}
              height={28}
              style={{ width: "28px", height: "28px" }}
              className="rounded object-contain"
            />
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-text">{item.name}</span>
            <span className="app-muted block text-xs">
              Necessario x{item.requiredQuantity}, obtido x{item.ownedQuantity}
            </span>
          </span>
          <span className="text-sm font-black text-accent">Falta x{item.missingQuantity}</span>
        </li>
      ))}
    </ul>
  );
}
