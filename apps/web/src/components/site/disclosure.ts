const bound = new WeakSet<HTMLElement>();

// Native popovers own interaction; script only reconciles the inline wide layout.
export function bindNavDisclosure(header: HTMLElement): void {
  if (bound.has(header)) return;
  bound.add(header);
  const menu = header.querySelector<HTMLElement>('#site-nav');
  const button = header.querySelector<HTMLButtonElement>('[popovertarget="site-nav"]');
  if (!menu || !button) return;
  const wide = window.matchMedia('(width >= 992px)');
  const sync = () => {
    const wasOpen = menu.matches(':popover-open');
    if (wide.matches) {
      menu.removeAttribute('popover');
    } else if (!menu.hasAttribute('popover')) {
      menu.setAttribute('popover', 'auto');
    }
    if (wasOpen && !wide.matches && !menu.matches(':popover-open')) {
      menu.showPopover({ source: button });
    }
  };
  sync();
  wide.addEventListener('change', sync);
}
