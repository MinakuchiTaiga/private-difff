export function query<T extends HTMLElement>(selector: string, scope: ParentNode = document): T {
  const element = scope.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}
