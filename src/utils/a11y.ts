/**
 * Accessibility utilities for focus management and ARIA attributes
 */

/**
 * Checks if an element is currently focused
 */
export function isFocused(element: HTMLElement): boolean {
  return document.activeElement === element;
}

/**
 * Focuses an element with accessibility considerations
 */
export function focusElement(element: HTMLElement, options: { scrollIntoView?: boolean } = {}): void {
  if (options.scrollIntoView) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  element.focus();
}

/**
 * Adds focus visible class to an element when keyboard navigation is detected
 */
export function addFocusVisibleClass(element: HTMLElement): void {
  const handleFocus = (e: FocusEvent) => {
    if (e.target === element) {
      element.classList.add('focus-visible');
    }
  };

  const handleBlur = (e: FocusEvent) => {
    if (e.target === element) {
      element.classList.remove('focus-visible');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      element.classList.add('focus-visible');
    }
  };

  element.addEventListener('focus', handleFocus);
  element.addEventListener('blur', handleBlur);
  element.addEventListener('keydown', handleKeyDown);
}

/**
 * Removes focus visible class event listeners
 */
export function removeFocusVisibleClass(element: HTMLElement): void {
  element.classList.remove('focus-visible');
}

/**
 * Sets appropriate ARIA attributes for a button
 */
export function setButtonAriaAttributes(
  element: HTMLElement,
  options: {
    pressed?: boolean;
    expanded?: boolean;
    controls?: string;
    label?: string;
  } = {}
): void {
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', '0');
  
  if (options.pressed !== undefined) {
    element.setAttribute('aria-pressed', String(options.pressed));
  }
  
  if (options.expanded !== undefined) {
    element.setAttribute('aria-expanded', String(options.expanded));
  }
  
  if (options.controls) {
    element.setAttribute('aria-controls', options.controls);
  }
  
  if (options.label) {
    element.setAttribute('aria-label', options.label);
  }
}

/**
 * Sets appropriate ARIA attributes for a menu
 */
export function setMenuAriaAttributes(
  menuElement: HTMLElement,
  options: {
    labelledBy?: string;
    orientation?: 'horizontal' | 'vertical';
  } = {}
): void {
  menuElement.setAttribute('role', 'menu');
  
  if (options.labelledBy) {
    menuElement.setAttribute('aria-labelledby', options.labelledBy);
  }
  
  if (options.orientation) {
    menuElement.setAttribute('aria-orientation', options.orientation);
  }
}

/**
 * Sets appropriate ARIA attributes for a menu item
 */
export function setMenuItemAriaAttributes(
  menuItemElement: HTMLElement,
  options: {
    disabled?: boolean;
  } = {}
): void {
  menuItemElement.setAttribute('role', 'menuitem');
  
  if (options.disabled) {
    menuItemElement.setAttribute('aria-disabled', 'true');
  }
}

/**
 * Checks if the user is navigating with keyboard
 */
export function isKeyboardNavigation(): boolean {
  return document.body.classList.contains('keyboard-navigation');
}

/**
 * Enables keyboard navigation detection
 */
export function enableKeyboardNavigationDetection(): void {
  // Check if already initialized
  if ((window as any).__keyboardNavInitialized) {
    return;
  }
  
  (window as any).__keyboardNavInitialized = true;
  
  let keyboardNavigation = false;

  const handleKeyDown = () => {
    if (!keyboardNavigation) {
      keyboardNavigation = true;
      document.body.classList.add('keyboard-navigation');
    }
  };

  const handleMouseDown = () => {
    if (keyboardNavigation) {
      keyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);
}