import type { useTransitionRouter } from "next-view-transitions"

type SlideDirection = "forward" | "backward"
type TransitionRouter = ReturnType<typeof useTransitionRouter>
type NavigationRequest = {
  direction: SlideDirection
  href: string
  router: TransitionRouter
}

const TRANSITION_STATE_KEY = "slideDir"
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

let isNavigating = false
let isProcessingQueue = false
type QueuedNavigation = NavigationRequest & {
  reject: (error: Error) => void
  resolve: () => void
}
const navigationQueue: QueuedNavigation[] = []

function isReducedMotionPreferred(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function isViewTransitionSupported(): boolean {
  return "startViewTransition" in document
}

function clearDirectionState(): void {
  delete document.documentElement.dataset[TRANSITION_STATE_KEY]
}

async function runTransitionNavigation({
  direction,
  href,
  router,
}: NavigationRequest): Promise<void> {
  isNavigating = true
  document.documentElement.dataset[TRANSITION_STATE_KEY] = direction

  if (isViewTransitionSupported() && !isReducedMotionPreferred()) {
    const transition = document.startViewTransition(() => {
      router.push(href)
    })

    try {
      await transition.finished
    } catch {
      // Transition was skipped or interrupted
    }
  } else {
    router.push(href)
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  clearDirectionState()
  isNavigating = false

}

async function processNavigationQueue(): Promise<void> {
  if (isProcessingQueue) {
    return
  }
  isProcessingQueue = true

  try {
    while (navigationQueue.length > 0) {
      const nextNavigation = navigationQueue.shift()
      if (!nextNavigation) {
        break
      }
      try {
        await runTransitionNavigation(nextNavigation)
        nextNavigation.resolve()
      } catch (error) {
        const wrappedError =
          error instanceof Error
            ? error
            : new Error("Slide transition navigation failed")
        nextNavigation.reject(wrappedError)
      }
    }
  } finally {
    isProcessingQueue = false
  }
}

/**
 * Programmatic slide navigation using next-view-transitions with a direction
 * data-attribute that drives global CSS keyframes.
 * Uses stop-and-go logic: only one navigation at a time, next ones wait for completion.
 */
export async function navigateSlideWithTransition({
  direction,
  href,
  router,
}: {
  direction: SlideDirection
  href: string
  router: TransitionRouter
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    navigationQueue.push({ direction, href, reject, resolve, router })
    void processNavigationQueue()
  })
}

export function canNavigate(): boolean {
  return !isNavigating && navigationQueue.length === 0 && !isProcessingQueue
}

export function getIsNavigating(): boolean {
  return isNavigating || navigationQueue.length > 0 || isProcessingQueue
}
