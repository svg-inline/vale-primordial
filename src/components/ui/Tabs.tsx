"use client";

import type { ReactNode } from "react";

export interface TabItem {
  content: ReactNode;
  id: string;
  label: string;
}

interface TabsProps {
  activeId: string;
  ariaLabel: string;
  onChange: (id: string) => void;
  tabs: TabItem[];
}

export function Tabs({ activeId, ariaLabel, onChange, tabs }: TabsProps) {
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="app-tabs">
      <div className="app-tabs__list" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const selected = tab.id === activeTab?.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              className="app-tabs__tab"
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab ? (
        <div
          id={`${activeTab.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTab.id}-tab`}
          className="app-tabs__panel"
        >
          {activeTab.content}
        </div>
      ) : null}
    </div>
  );
}
