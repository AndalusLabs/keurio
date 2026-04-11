import { create } from "zustand";

type InspectionRunState = {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  next: (max: number) => void;
  prev: () => void;
  reset: () => void;
};

export const useInspectionRunStore = create<InspectionRunState>((set, get) => ({
  activeIndex: 0,
  setActiveIndex: (index) => set({ activeIndex: index }),
  next: (max) => {
    const i = get().activeIndex;
    if (i < max - 1) set({ activeIndex: i + 1 });
  },
  prev: () => {
    const i = get().activeIndex;
    if (i > 0) set({ activeIndex: i - 1 });
  },
  reset: () => set({ activeIndex: 0 }),
}));
