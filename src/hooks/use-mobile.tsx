import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    // Use the MediaQueryListEvent's `matches` property to avoid explicit layout reads (e.g. window.innerWidth),
    // which can trigger forced reflows. This keeps the hook purely event-driven and more performant.
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    mql.addEventListener("change", onChange)
    // Initialize state without forcing a synchronous reflow.
    setIsMobile(mql.matches)

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
