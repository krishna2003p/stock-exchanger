import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useGoTo() {
  const router = useRouter();

  // Memoized function that works with any path
  const goTo = useCallback(
    (path) => {
      router.push(path);
    },
    [router]
  );

  return goTo;
}
