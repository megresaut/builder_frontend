import { useContext, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TabContext } from "./useTabContext";

/**
 * Hook for navigating to modal-like pages (e.g., Record Bill, View Bill)
 * These pages are "temporary" overlays that don't affect the tab's main history
 * 
 * Usage:
 * const { navigateToModal, returnFromModal } = useModalNavigation();
 * 
 * // To open modal:
 * navigateToModal("/bills/record");
 * 
 * // To close modal and return:
 * returnFromModal();
 */
export const useModalNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabContext = useContext(TabContext);

  // Navigate to a modal-like page without updating tab history
  const navigateToModal = useCallback(
    (path: string) => {
      // Store the return page in sessionStorage for retrieval when closing the modal
      if (typeof window !== "undefined") {
        sessionStorage.setItem("modalReturnPage", location.pathname);
      }
      navigate(path);
    },
    [navigate, location.pathname]
  );

  // Return from a modal and go back to the page where it was opened
  const returnFromModal = useCallback(() => {
    // Try to get the return page from sessionStorage
    let returnPage: string | null = null;
    
    if (typeof window !== "undefined") {
      returnPage = sessionStorage.getItem("modalReturnPage");
      sessionStorage.removeItem("modalReturnPage");
    }

    // If we have a stored return page, navigate there
    if (returnPage) {
      navigate(returnPage);
      return;
    }

    // Fallback to tab history
    if (tabContext) {
      const selectedTab = tabContext.selectedTab;
      const metadata = tabContext.tabMetadata[selectedTab];
      const currentIndex = metadata?.historyIndex ?? -1;
      const history = metadata?.history || [];

      // Can we go back in this tab's history?
      if (currentIndex > 0) {
        const previousRoute = history[currentIndex - 1];
        if (previousRoute) {
          const newIndex = currentIndex - 1;
          tabContext.setTabMetadata(selectedTab, {
            ...metadata,
            historyIndex: newIndex,
            route: previousRoute,
          });
          navigate(previousRoute);
          return;
        }
      }
    }

    // Final fallback to browser history
    navigate(-1);
  }, [navigate, tabContext]);

  return { navigateToModal, returnFromModal };
};
