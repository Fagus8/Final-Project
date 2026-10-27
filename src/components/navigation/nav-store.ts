import { useSyncExternalStore } from "react";

// მობილური მენიუს მდგომარეობა. Header-ის hamburger ღილაკი layout-შია, sidebar კი
// თითოეულ გვერდზე, ამიტომ React context-ის ნაცვლად პატარა საერთო store-ს ვიყენებთ.
// open — მენიუ ღიაა; drawers — რამდენი sidebar არის გვერდზე (0 → ღილაკი არ ჩანს,
// მაგ: შესვლის გვერდზე)
type NavState = { open: boolean; drawers: number };

const serverState: NavState = { open: false, drawers: 0 };
let state = serverState;
const listeners = new Set<() => void>();

function update(next: Partial<NavState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const navStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
  getServerSnapshot: () => serverState,
  toggle: () => update({ open: !state.open }),
  close: () => {
    if (state.open) update({ open: false });
  },
  // sidebar გვერდზე ჩნდება — აბრუნებს გასუფთავების ფუნქციას (useEffect-ისთვის)
  register: () => {
    update({ drawers: state.drawers + 1 });
    return () => update({ drawers: state.drawers - 1, open: false });
  },
};

export function useNav() {
  return useSyncExternalStore(navStore.subscribe, navStore.getSnapshot, navStore.getServerSnapshot);
}
