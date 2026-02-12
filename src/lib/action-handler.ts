/**
 * Action-Handler für tap, hold, double_tap – orientiert an ha-floorplan / boilerplate-card
 */
import { noChange } from 'lit';
import { AttributePart, directive, Directive } from 'lit/directive.js';
import type { ActionHandlerOptions } from 'custom-card-helpers';
import { fireEvent } from 'custom-card-helpers';

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

interface ActionHandlerElement extends HTMLElement {
  _roomPlanActionHandler?: boolean;
}

declare global {
  interface HASSDomEvents {
    action: { action: string };
  }
}

class ActionHandler extends HTMLElement {
  public holdTime = 500;
  protected timer?: number;
  protected held = false;
  private dblClickTimeout?: number;

  public connectedCallback(): void {
    Object.assign(this.style, {
      position: 'absolute',
      width: isTouch ? '100px' : '50px',
      height: isTouch ? '100px' : '50px',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '999',
    });
  }

  public bind(element: ActionHandlerElement, options: ActionHandlerOptions): void {
    if (element._roomPlanActionHandler) return;
    element._roomPlanActionHandler = true;

    element.addEventListener('contextmenu', (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    });

    const start = (): void => {
      this.held = false;
      this.timer = window.setTimeout(() => {
        this.held = true;
      }, this.holdTime);
    };

    const end = (ev: Event): void => {
      if (['touchend', 'touchcancel'].includes(ev.type) && this.timer === undefined) return;
      ev.preventDefault();
      clearTimeout(this.timer);
      this.timer = undefined;

      if (this.held) {
        fireEvent(element, 'action', { action: 'hold' });
      } else if (options.hasDoubleClick) {
        const clickEv = ev as MouseEvent;
        if ((ev.type === 'click' && clickEv.detail < 2) || !this.dblClickTimeout) {
          this.dblClickTimeout = window.setTimeout(() => {
            this.dblClickTimeout = undefined;
            fireEvent(element, 'action', { action: 'tap' });
          }, 250);
        } else {
          clearTimeout(this.dblClickTimeout);
          this.dblClickTimeout = undefined;
          fireEvent(element, 'action', { action: 'double_tap' });
        }
      } else {
        fireEvent(element, 'action', { action: 'tap' });
      }
    };

    const cancel = (): void => {
      clearTimeout(this.timer);
      this.timer = undefined;
    };

    ['touchcancel', 'mouseout', 'mouseup', 'touchmove', 'mouseleave'].forEach((evType) => {
      element.addEventListener(evType, cancel, { passive: true });
    });

    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchend', end);
    element.addEventListener('touchcancel', end);
    element.addEventListener('mousedown', start, { passive: true });
    element.addEventListener('click', end);

    element.addEventListener('keyup', (ev: KeyboardEvent) => {
      if (ev.key === 'Enter' || ev.keyCode === 13) end(ev);
    });
  }
}

customElements.define('action-handler-room-plan', ActionHandler);

const getActionHandler = (): ActionHandler => {
  let el = document.body.querySelector('action-handler-room-plan') as ActionHandler;
  if (!el) {
    el = document.createElement('action-handler-room-plan') as ActionHandler;
    document.body.appendChild(el);
  }
  return el;
};

export const actionHandlerBind = (element: ActionHandlerElement, options?: ActionHandlerOptions): void => {
  getActionHandler().bind(element, options ?? {});
};

export const actionHandler = directive(
  class extends Directive {
    update(part: AttributePart, [options]: [ActionHandlerOptions]) {
      actionHandlerBind(part.element as ActionHandlerElement, options);
      return noChange;
    }
    render(_options?: ActionHandlerOptions) {
      return noChange;
    }
  },
);
