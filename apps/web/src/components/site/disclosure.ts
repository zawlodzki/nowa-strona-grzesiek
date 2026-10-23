export type Disclosure = 'closed' | 'open';

export function openDisclosure(_state: Disclosure): 'open' {
  return 'open';
}

export function closeDisclosure(_state: Disclosure): 'closed' {
  return 'closed';
}

export function toggleDisclosure(state: Disclosure): Disclosure {
  return state === 'closed' ? openDisclosure(state) : closeDisclosure(state);
}

const bound = new WeakSet<HTMLElement>();

export function bindNavDisclosure(header: HTMLElement): void {
  if (bound.has(header)) return;
  // The set is the idempotence record. A logo-only header is recorded too.
  bound.add(header);
  const button = header.querySelector('button[aria-controls]');
  if (button === null) return;

  const read = (): Disclosure => (button.getAttribute('aria-expanded') === 'true' ? 'open' : 'closed');
  const write = (state: Disclosure) => {
    button.setAttribute('aria-expanded', state === 'open' ? 'true' : 'false');
  };

  button.addEventListener('click', () => {
    write(toggleDisclosure(read()));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const state = read();
    if (state === 'open') event.preventDefault();
    write(closeDisclosure(state));
  });
}
