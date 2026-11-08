"use client";

import { createPortal } from "react-dom";
import AuthModal from "./AuthModal";

/**
 * Sign-in modal for buttons that live inside a product card link.
 * Rendering it into <body> takes it out of the link in the DOM, and stopping
 * propagation keeps React from bubbling its clicks up to the card's link.
 */
export default function DetachedAuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  return createPortal(
    <div onClick={stop} onMouseDown={stop} onPointerDown={stop} onKeyDown={stop} onSubmit={stop}>
      <AuthModal open={open} onClose={onClose} />
    </div>,
    document.body
  );
}
