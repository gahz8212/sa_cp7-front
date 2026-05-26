export type GlobalContextType = {
  isBrowser: boolean
  startPageTransition: (callback: () => void) => void
}
