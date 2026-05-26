import { create } from "zustand"

interface LoadingState {
  isLoading: boolean
  loadingCount: number
  setLoading: (loading: boolean) => void
  startLoading: () => void
  stopLoading: () => void
}

export const useLoadingStore = create<LoadingState>()((set) => ({
  isLoading: false,
  loadingCount: 0,
  setLoading: (loading) => set({ isLoading: loading }),
  startLoading: () =>
    set((state) => {
      return { isLoading: true, loadingCount: state.loadingCount + 1 }
    }),
  stopLoading: () => {
    setTimeout(() => {
      set((state) => {
        const loadingCount = Math.max(0, state.loadingCount - 1)
        return {
          isLoading: loadingCount > 0,
          loadingCount,
        }
      })
    }, 500)
  },
}))
