"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";

const manager = ToastPrimitive.createToastManager();

export function notify(message: string): void {
  manager.add({ title: message });
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={manager} timeout={6000}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-4 top-5 z-[60] mx-auto flex w-auto max-w-[28rem] flex-col items-center gap-2 outline-none">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className="pointer-events-auto rounded-full bg-berry px-5 py-3 text-center text-sm font-bold text-white shadow-lift transition-[opacity,transform] duration-200 data-starting-style:-translate-y-2 data-starting-style:opacity-0 data-ending-style:opacity-0"
    >
      <ToastPrimitive.Title className="contents" />
    </ToastPrimitive.Root>
  ));
}
