import { useCallback, useEffect, useRef, useState } from "react";
import { useTabContext } from "./useTabContext";

/**
 * Per-tab page state — survives tab switches and (after the persistence whitelist
 * fix) survives refresh too.
 *
 * Keyed by `(selectedTab, key)`. Two tabs viewing the same URL get isolated
 * state; within the same tab, navigating away and back preserves the value.
 *
 * NOTE: prior to 2026-05-23 this hook keyed by URL path, which meant two tabs
 * on the same page shared state — that contradicted the tab model. Existing
 * pageState in sessionStorage from before this change will be ignored on next
 * load (sessionStorage clears on browser close anyway).
 */
export function usePageState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const { selectedTab, tabMetadata, setTabMetadata } = useTabContext();

  const stored = (tabMetadata[selectedTab]?.pageState?.[key] as T | undefined) ?? undefined;
  const [value, setValueState] = useState<T>(stored !== undefined ? stored : initialValue);

  // Track the tab this state instance is bound to. If it changes (e.g. user
  // switched tabs while the component was somehow kept mounted — rare but
  // possible with KeepAlive), re-read from the new tab's bucket.
  const lastTabRef = useRef(selectedTab);
  useEffect(() => {
    if (lastTabRef.current !== selectedTab) {
      lastTabRef.current = selectedTab;
      const next = tabMetadata[selectedTab]?.pageState?.[key] as T | undefined;
      if (next !== undefined && next !== value) {
        setValueState(next);
      }
    }
  }, [selectedTab, tabMetadata, key, value]);

  // When stored value changes externally (e.g. restore from persistence on
  // mount after a refresh), pull it in.
  useEffect(() => {
    if (stored !== undefined && stored !== value) {
      setValueState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      // Provider does a deep merge on pageState, so this only writes `key`.
      setTabMetadata(selectedTab, { pageState: { [key]: next } });
    },
    [selectedTab, setTabMetadata, key, tabMetadata],
  );

  return [value, setValue];
}
