"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Query string access for statically exported routes.
 *
 * `await searchParams` opts a page into request-time rendering, which
 * `output: "export"` does not support. This store keeps the exported HTML
 * deterministic (the server snapshot is empty) and re-renders with the real
 * query string right after hydration, using the same external-store contract
 * as the theme preference.
 */
const emptySearch = "";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);

  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
}

function getSnapshot() {
  return window.location.search;
}

function getServerSnapshot() {
  return emptySearch;
}

export function useClientSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => new URLSearchParams(search), [search]);
}
