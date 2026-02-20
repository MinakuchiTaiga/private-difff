export type IconName =
  | "lock"
  | "chip"
  | "github"
  | "help"
  | "compass"
  | "type"
  | "align"
  | "bolt"
  | "fileCode"
  | "printer"
  | "file"
  | "folder"
  | "split"
  | "layout"
  | "settings"
  | "plus"
  | "minus"
  | "equal"
  | "trash";

export function hydrateStaticIcons(root: HTMLElement): void {
  const iconElements = root.querySelectorAll<HTMLElement>("[data-icon]");
  for (const element of iconElements) {
    const iconName = element.dataset.icon as IconName | undefined;
    if (!iconName) {
      continue;
    }
    element.innerHTML = icon(iconName);
  }
}

export function icon(name: IconName): string {
  const common =
    'class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  if (name === "lock") {
    return `<svg ${common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
  }
  if (name === "chip") {
    return `<svg ${common}><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/></svg>`;
  }
  if (name === "github") {
    return `<svg ${common} viewBox="0 0 24 24" stroke-width="1.5"><path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-1.03-.01-1.87-2.5.46-3.15-.61-3.35-1.17-.11-.28-.58-1.17-.99-1.41-.34-.18-.82-.62-.01-.63.76-.01 1.3.7 1.48.99.87 1.46 2.26 1.05 2.82.8.09-.63.34-1.05.61-1.29-2.22-.25-4.54-1.11-4.54-4.92 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.26.1-2.62 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.31 2.75-1.03 2.75-1.03.55 1.36.2 2.37.1 2.62.64.7 1.03 1.59 1.03 2.69 0 3.82-2.33 4.67-4.55 4.92.35.3.67.88.67 1.79 0 1.29-.01 2.33-.01 2.65 0 .26.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>`;
  }
  if (name === "help") {
    return `<svg ${common}><path d="M9.4 9a2.6 2.6 0 1 1 4.6 1.7c-.6.7-1.6 1.1-1.6 2.3"/><path d="M12 17.2h.01"/></svg>`;
  }
  if (name === "compass") {
    return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="m10 14 2-4 2 4-4 0z"/></svg>`;
  }
  if (name === "type") {
    return `<svg ${common}><path d="M4 7h16M8 7v10M16 7v10M6 17h12"/></svg>`;
  }
  if (name === "align") {
    return `<svg ${common}><path d="M4 7h16M7 12h10M4 17h16"/></svg>`;
  }
  if (name === "bolt") {
    return `<svg ${common}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`;
  }
  if (name === "fileCode") {
    return `<svg ${common}><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>`;
  }
  if (name === "printer") {
    return `<svg ${common}><path d="M6 9V4h12v5"/><rect x="6" y="14" width="12" height="7" rx="1"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/></svg>`;
  }
  if (name === "file") {
    return `<svg ${common}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/></svg>`;
  }
  if (name === "folder") {
    return `<svg ${common}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
  }
  if (name === "split") {
    return `<svg ${common}><path d="M6 3v18M18 3v18M10 7h8M10 17h8"/></svg>`;
  }
  if (name === "layout") {
    return `<svg ${common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/></svg>`;
  }
  if (name === "settings") {
    return `<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 1.87l-.09 1.16a7.7 7.7 0 0 0-1.56.65l-.95-.63a2 2 0 0 0-2.54.2l-.31.31a2 2 0 0 0-.2 2.54l.63.95a7.7 7.7 0 0 0-.65 1.56l-1.16.09a2 2 0 0 0-1.87 2v.44a2 2 0 0 0 1.87 2l1.16.09c.16.55.38 1.08.65 1.56l-.63.95a2 2 0 0 0 .2 2.54l.31.31a2 2 0 0 0 2.54.2l.95-.63c.48.27 1.01.49 1.56.65l.09 1.16a2 2 0 0 0 2 1.87h.44a2 2 0 0 0 2-1.87l.09-1.16a7.7 7.7 0 0 0 1.56-.65l.95.63a2 2 0 0 0 2.54-.2l.31-.31a2 2 0 0 0 .2-2.54l-.63-.95c.27-.48.49-1.01.65-1.56l1.16-.09a2 2 0 0 0 1.87-2v-.44a2 2 0 0 0-1.87-2l-1.16-.09a7.7 7.7 0 0 0-.65-1.56l.63-.95a2 2 0 0 0-.2-2.54l-.31-.31a2 2 0 0 0-2.54-.2l-.95.63a7.7 7.7 0 0 0-1.56-.65l-.09-1.16a2 2 0 0 0-2-1.87z"/></svg>`;
  }
  if (name === "plus") {
    return `<svg ${common}><path d="M12 5v14M5 12h14"/></svg>`;
  }
  if (name === "minus") {
    return `<svg ${common}><path d="M5 12h14"/></svg>`;
  }
  if (name === "equal") {
    return `<svg ${common}><path d="M5 9h14M5 15h14"/></svg>`;
  }

  return `<svg ${common}><path d="M4 7h16M7 7v13h10V7"/><path d="M10 11v6M14 11v6"/></svg>`;
}
