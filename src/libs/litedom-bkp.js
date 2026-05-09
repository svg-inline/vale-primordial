/**
 * LiteDom.js — v3.0.0
 * Reactive primitives + global store + DOM with its own identity.
 * No dependencies. No transpilation. ~6KB minified.
 *
 * ── Hooks (inside component()) ───────────────────────────────────────────────
 *   useState(v)           — reactive state with auto re-render
 *   useEffect(fn, deps)   — side effect with cleanup and dep comparison
 *   useRef(v?)            — mutable ref without re-render
 *   useMemo(fn, deps)     — memoized computed value
 *   useCallback(fn, deps) — stable memoized function reference
 *   use(promise)          — suspense-like: resolves a Promise during render
 *   memo(fn, compare?)    — skip re-render when props are unchanged
 *
 * ── Component ─────────────────────────────────────────────────────────────────
 *   component(el, renderFn, props?) — mounts a reactive component into the DOM
 *
 * ── Global Store ──────────────────────────────────────────────────────────────
 *   createStore(init, opts?) — Zustand-like store with persist + broadcast
 *   useStore(store, sel?)    — hook: subscribe to a store slice inside component()
 *
 * ── DOM — LiteDom's own API ───────────────────────────────────────────────────
 *   ld(sel, ctx?)    — selector → chainable NodeSet
 *     Traversal : .within()  .closest()  .parent()  .children()  .siblings()
 *     Filters   : .where()  .except()  .has()  .first()  .last()  .at()
 *     Events    : .on()  .off()  .once()  .emit()
 *     Content   : .html()  .text()  .val()  .attr()  .data()  .prop()
 *                 .append()  .prepend()  .empty()  .remove()  .clone()  .wrap()
 *     Classes   : .clsAdd()  .clsRemove()  .clsToggle()  .clsHas()
 *     Styles    : .style()  .show()  .hide()  .toggle()
 *     Metrics   : .width()  .height()  .offset()
 *     Animation : .animate()  .fadeIn()  .fadeOut()  .slideDown()  .slideUp()
 *     Form      : .serialize()
 *
 * ── HTTP ──────────────────────────────────────────────────────────────────────
 *   ldFetch(url, opts?) — fetch client with LiteDom's own interface
 *     opts: { method, body, headers, as, signal, nonce }
 *     returns: { data, status, ok, headers }
 *
 * ── Utilities ─────────────────────────────────────────────────────────────────
 *   lazyLoad(sel, opts?) — lazy load via IntersectionObserver
 *   onReady(fn)          — run fn when the DOM is ready
 */

(function (global) {
  "use strict";

  // ─── Internal scheduler ───────────────────────────────────────────────────
  let _scheduled = false;
  const _queue = new Set();

  function _schedule(fn) {
    _queue.add(fn);
    if (!_scheduled) {
      _scheduled = true;
      queueMicrotask(() => {
        _scheduled = false;
        const jobs = [..._queue];
        _queue.clear();
        jobs.forEach((j) => j());
      });
    }
  }

  // ─── Hook context ─────────────────────────────────────────────────────────
  let _currentComponent = null;
  let _hookIndex = 0;

  function _withComponent(comp, fn) {
    const prev = _currentComponent;
    const prevIdx = _hookIndex;
    _currentComponent = comp;
    _hookIndex = 0;
    try {
      return fn();
    } finally {
      _currentComponent = prev;
      _hookIndex = prevIdx;
    }
  }

  // ─── useState ─────────────────────────────────────────────────────────────
  /**
   * useState(initialValue) → [getValue, setValue]
   *
   * Reactive state. Calling setValue triggers a re-render of the
   * component that owns this hook (batched via microtask).
   *
   * @example
   * const [count, setCount] = useState(0);
   * setCount(c => c + 1);
   */
  function useState(initial) {
    const comp = _currentComponent;
    if (!comp) throw new Error("useState must be called inside a component()");

    const idx = _hookIndex++;
    if (!comp._hooks[idx]) {
      comp._hooks[idx] = {
        value: typeof initial === "function" ? initial() : initial,
      };
    }

    const slot = comp._hooks[idx];

    function setValue(next) {
      const nextVal = typeof next === "function" ? next(slot.value) : next;
      if (Object.is(nextVal, slot.value)) return;
      slot.value = nextVal;
      _schedule(() => comp._render());
    }

    return [slot.value, setValue];
  }

  // ─── useEffect ────────────────────────────────────────────────────────────
  /**
   * useEffect(fn, deps?)
   *
   * Runs fn after render. Returns cleanup via fn's return value.
   * Skipped if deps are unchanged (shallow comparison).
   *
   * @example
   * useEffect(() => {
   *   const id = setInterval(() => tick(), 1000);
   *   return () => clearInterval(id);
   * }, []);
   */
  function useEffect(fn, deps) {
    const comp = _currentComponent;
    if (!comp) throw new Error("useEffect must be called inside a component()");

    const idx = _hookIndex++;
    const slot = comp._hooks[idx] || (comp._hooks[idx] = { deps: undefined, cleanup: undefined });

    const changed =
      !slot.deps ||
      !deps ||
      deps.some((d, i) => !Object.is(d, slot.deps[i]));

    if (changed) {
      comp._effects.push(() => {
        if (typeof slot.cleanup === "function") slot.cleanup();
        slot.cleanup = fn();
        slot.deps = deps ? [...deps] : undefined;
      });
    }
  }

  // ─── useRef ───────────────────────────────────────────────────────────────
  /**
   * useRef(initial?) → { current }
   *
   * Mutable container. Does NOT trigger re-renders.
   * Use ref="myRef" attribute to auto-bind DOM nodes.
   *
   * @example
   * const inputRef = useRef();
   * // <input ref="inputRef" />
   * inputRef.current.focus();
   */
  function useRef(initial = null) {
    const comp = _currentComponent;
    const idx = _hookIndex++;
    if (!comp._hooks[idx]) comp._hooks[idx] = { current: initial };
    return comp._hooks[idx];
  }

  // ─── useMemo ──────────────────────────────────────────────────────────────
  /**
   * useMemo(fn, deps) → value
   *
   * Returns a memoized value. Recomputes only when deps change.
   *
   * @example
   * const sorted = useMemo(() => [...list].sort(), [list]);
   */
  function useMemo(fn, deps) {
    const comp = _currentComponent;
    const idx = _hookIndex++;
    const slot = comp._hooks[idx] || (comp._hooks[idx] = { deps: undefined, value: undefined });

    const changed =
      !slot.deps ||
      !deps ||
      deps.some((d, i) => !Object.is(d, slot.deps[i]));

    if (changed) {
      slot.value = fn();
      slot.deps = [...deps];
    }

    return slot.value;
  }

  // ─── useCallback ──────────────────────────────────────────────────────────
  /**
   * useCallback(fn, deps) → fn
   *
   * Returns a stable function reference. Re-creates only when deps change.
   *
   * @example
   * const handleClick = useCallback(() => doSomething(id), [id]);
   */
  function useCallback(fn, deps) {
    return useMemo(() => fn, deps);
  }

  // ─── use() ────────────────────────────────────────────────────────────────
  /**
   * use(promise) → value | throws
   *
   * Suspense-like primitive. Throws while pending, returns value when resolved.
   * Wrap the component render in a try/catch or use the built-in suspend UI.
   *
   * @example
   * const data = use(fetchData(url));
   */
  const _promiseCache = new WeakMap();

  function use(promise) {
    if (!_promiseCache.has(promise)) {
      let status = "pending";
      let result;
      const entry = {
        status,
        promise: promise.then(
          (v) => { entry.status = "fulfilled"; result = v; },
          (e) => { entry.status = "rejected"; result = e; }
        ),
        get value() {
          if (entry.status === "fulfilled") return result;
          if (entry.status === "rejected") throw result;
          throw entry.promise;
        },
      };
      _promiseCache.set(promise, entry);
    }
    return _promiseCache.get(promise).value;
  }

  // ─── memo() ───────────────────────────────────────────────────────────────
  /**
   * memo(componentFn, compareFn?)
   *
   * Wraps a component function. Skips re-render if props are shallowly equal.
   *
   * @example
   * const Card = memo(({ title, body }) => `<div>${title}: ${body}</div>`);
   */
  function memo(fn, compare) {
    const _compare =
      compare ||
      ((prev, next) =>
        Object.keys(next).every((k) => Object.is(prev[k], next[k])));

    fn._memo = true;
    fn._compare = _compare;
    fn._lastProps = null;
    fn._lastOutput = null;
    return fn;
  }

  // ─── lazyLoad() ───────────────────────────────────────────────────────────
  /**
   * lazyLoad(selector, options?)
   *
   * Lazy-loads images and iframes using IntersectionObserver.
   * Swaps data-src → src when element enters viewport.
   *
   * options: { root, rootMargin, threshold, onLoad, onError }
   *
   * @example
   * lazyLoad('img[data-src]', { rootMargin: '200px' });
   */
  function lazyLoad(selector, options = {}) {
    const {
      root = null,
      rootMargin = "150px",
      threshold = 0,
      onLoad = null,
      onError = null,
    } = options;

    if (!("IntersectionObserver" in window)) {
      // Fallback: load everything immediately
      document.querySelectorAll(selector).forEach(_loadElement);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          _loadElement(entry.target);
          io.unobserve(entry.target);
        });
      },
      { root, rootMargin, threshold }
    );

    function _loadElement(el) {
      const src = el.dataset.src;
      if (!src) return;
      el.src = src;
      delete el.dataset.src;
      el.classList.add("lazy--loaded");
      if (el.complete && onLoad) onLoad(el);
      else if (onLoad) el.addEventListener("load", () => onLoad(el), { once: true });
      if (onError) el.addEventListener("error", () => onError(el), { once: true });
    }

    document.querySelectorAll(selector).forEach((el) => io.observe(el));

    return {
      observe: (el) => io.observe(el),
      unobserve: (el) => io.unobserve(el),
      disconnect: () => io.disconnect(),
    };
  }

  // ─── component() ──────────────────────────────────────────────────────────
  /**
   * component(el, renderFn, initialProps?)
   *
   * Mounts a reactive component into a DOM element.
   * renderFn receives current props and should return an HTML string.
   *
   * Returns a controller: { setProps, getProps, destroy, el }
   *
   * @example
   * component('#counter', ({ start }) => {
   *   const [count, setCount] = useState(start);
   *   useEffect(() => { document.title = `Count: ${count}`; }, [count]);
   *   return `
   *     <p>Count: ${count}</p>
   *     <button data-action="inc">+</button>
   *   `;
   * }, { start: 0 });
   */
  function component(el, renderFn, initialProps = {}) {
    const root =
      typeof el === "string" ? document.querySelector(el) : el;

    if (!root) throw new Error(`component(): element not found — "${el}"`);

    const comp = {
      el: root,
      _hooks: [],
      _effects: [],
      _props: { ...initialProps },
      _mounted: false,
      _destroyed: false,
      _renderFn: renderFn,
    };

    // Check memo cache
    comp._render = function () {
      if (comp._destroyed) return;

      if (
        comp._renderFn._memo &&
        comp._renderFn._lastProps &&
        comp._renderFn._compare(comp._renderFn._lastProps, comp._props)
      ) {
        return; // skip — props unchanged
      }

      comp._effects = [];
      let html;

      try {
        html = _withComponent(comp, () => renderFn(comp._props));
      } catch (suspended) {
        if (suspended instanceof Promise) {
          root.innerHTML = comp._suspenseHTML || "<span>Loading...</span>";
          suspended.then(() => comp._render());
          return;
        }
        throw suspended;
      }

      if (comp._renderFn._memo) {
        comp._renderFn._lastProps = { ...comp._props };
      }

      // Diff: only update if HTML changed
      if (root.innerHTML !== html) {
        root.innerHTML = html;

        // Bind refs
        root.querySelectorAll("[ref]").forEach((node) => {
          const refName = node.getAttribute("ref");
          const refSlot = Object.values(comp._hooks).find(
            (h) => h && h.current !== undefined && comp._refNames && comp._refNames[refName] === h
          );
          if (refSlot) refSlot.current = node;
        });
      }

      // Flush effects after paint
      if (comp._effects.length) {
        requestAnimationFrame(() => comp._effects.forEach((e) => e()));
      }

      comp._mounted = true;
    };

    comp._render();

    // ─── Event delegation ──────────────────────────────────────────────────
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const handler = comp._handlers && comp._handlers[action];
      if (handler) handler(e, btn);
    });

    root.addEventListener("input", (e) => {
      const input = e.target.closest("[data-bind]");
      if (!input) return;
      const key = input.dataset.bind;
      if (key in comp._props) {
        comp._props[key] = input.value;
        _schedule(() => comp._render());
      }
    });

    return {
      el: root,
      getProps: () => ({ ...comp._props }),
      setProps(nextProps) {
        Object.assign(comp._props, nextProps);
        _schedule(() => comp._render());
      },
      on(action, handler) {
        comp._handlers = comp._handlers || {};
        comp._handlers[action] = handler;
        return this;
      },
      suspense(html) {
        comp._suspenseHTML = html;
        return this;
      },
      destroy() {
        comp._destroyed = true;
        // Run all cleanups
        comp._hooks.forEach((h) => {
          if (h && typeof h.cleanup === "function") h.cleanup();
        });
        root.innerHTML = "";
      },
    };
  }

  // ─── ld() — DOM selector with LiteDom's own identity ────────────────────
  /**
   * ld(selector, context?) → NodeSet
   *
   * Returns a NodeSet — a chainable collection of DOM elements.
   * LiteDom's own identity: no jQuery heritage, no $ symbol.
   *
   * Traversal : .within(sel)  .closest(sel)  .parent()  .children(sel)  .siblings(sel)
   * Filters   : .where(sel|fn)  .except(sel)  .has(sel)  .first()  .last()  .at(n)
   * Events    : .on(ev, [delegate,] fn)  .off(ev, fn)  .once(ev, fn)  .emit(ev, detail)
   * Content   : .html(v?)  .text(v?)  .val(v?)  .attr(n,v?)  .data(k,v?)  .prop(k,v?)
   *             .append(content)  .prepend(content)  .empty()  .remove()  .clone()  .wrap(html)
   * Classes   : .clsAdd(...cls)  .clsRemove(...cls)  .clsToggle(cls)  .clsHas(cls)
   * Styles    : .style(prop,v?)  .show()  .hide()  .toggle()
   * Metrics   : .width()  .height()  .offset()
   * Animation : .animate(kf, opts?)  .fadeIn(ms?)  .fadeOut(ms?)  .slideDown(ms?)  .slideUp(ms?)
   * Iteration : .each(fn)  .map(fn)  .nodes()  [Symbol.iterator]
   * Form      : .serialize()
   *
   * @example
   * ld('#menu').on('click', 'a', (e, el) => el.classList.toggle('active'));
   * ld('.card').clsAdd('featured').style('color', 'red');
   * ld('form').on('submit', e => e.preventDefault());
   */
  function ld(selector, context) {
    return new NodeSet(selector, context);
  }

  class NodeSet {
    constructor(selector, context = document) {
      if (selector instanceof NodeSet) return selector;
      if (selector instanceof Element || selector instanceof Document || selector instanceof Window) {
        this._nodes = [selector];
      } else if (typeof selector === "string") {
        this._nodes = Array.from(context.querySelectorAll(selector));
      } else if (Array.isArray(selector) || selector instanceof NodeList) {
        this._nodes = Array.from(selector);
      } else {
        this._nodes = selector ? [selector] : [];
      }
      this.length = this._nodes.length;
    }

    // ── Iteration ─────────────────────────────────────────────────────────────
    each(fn) { this._nodes.forEach((n, i) => fn.call(n, n, i)); return this; }
    map(fn)  { return this._nodes.map(fn); }
    nodes()  { return [...this._nodes]; }
    [Symbol.iterator]() { return this._nodes[Symbol.iterator](); }

    // ── Traversal ─────────────────────────────────────────────────────────────
    first()         { return new NodeSet(this._nodes.slice(0, 1)); }
    last()          { return new NodeSet(this._nodes.slice(-1)); }
    at(i)           { return new NodeSet([this._nodes[i]]); }
    within(sel)     { return new NodeSet(this._nodes.flatMap(n => Array.from(n.querySelectorAll(sel)))); }
    closest(sel)    { return new NodeSet(this._nodes.map(n => n.closest(sel)).filter(Boolean)); }
    parent()        { return new NodeSet(this._nodes.map(n => n.parentElement).filter(Boolean)); }
    children(sel)   {
      const kids = this._nodes.flatMap(n => Array.from(n.children));
      return sel ? new NodeSet(kids.filter(k => k.matches(sel))) : new NodeSet(kids);
    }
    siblings(sel)   {
      const sibs = this._nodes.flatMap(n => Array.from(n.parentElement?.children || [])).filter(n => !this._nodes.includes(n));
      return sel ? new NodeSet(sibs.filter(s => s.matches(sel))) : new NodeSet(sibs);
    }

    // ── Filters ───────────────────────────────────────────────────────────────
    where(sel)  { return new NodeSet(typeof sel === "function" ? this._nodes.filter(sel) : this._nodes.filter(n => n.matches(sel))); }
    except(sel) { return new NodeSet(this._nodes.filter(n => !n.matches(sel))); }
    has(sel)    { return this._nodes.some(n => n.matches(sel)); }

    // ── Events ────────────────────────────────────────────────────────────────
    /**
     * .on(events, [delegate,] handler)
     * Registers a listener. Supports event delegation via optional selector.
     * @example
     * ld('ul').on('click', 'li', (e, el) => el.classList.toggle('active'))
     */
    on(events, del, fn) {
      const [handler, delegated] = typeof del === "function" ? [del, null] : [fn, del];
      events.split(" ").forEach(ev => {
        this._nodes.forEach(n => {
          const h = delegated
            ? e => { const t = e.target.closest(delegated); if (t && n.contains(t)) handler.call(t, e, t); }
            : e => handler.call(n, e, n);
          n.addEventListener(ev, h);
          n._ldEvents = n._ldEvents || {};
          (n._ldEvents[ev] = n._ldEvents[ev] || []).push({ h, original: handler, del: delegated });
        });
      });
      return this;
    }

    /**
     * .off(events, fn?) — removes a listener registered with .on()
     */
    off(events, fn) {
      events.split(" ").forEach(ev => {
        this._nodes.forEach(n => {
          const list = (n._ldEvents && n._ldEvents[ev]) || [];
          list.filter(e => !fn || e.original === fn).forEach(e => n.removeEventListener(ev, e.h));
          if (n._ldEvents) n._ldEvents[ev] = list.filter(e => fn && e.original !== fn);
        });
      });
      return this;
    }

    /** .once(events, fn) — fires once then removes itself */
    once(events, fn) {
      const wrap = e => { fn.call(e.target, e); this.off(events, wrap); };
      return this.on(events, wrap);
    }

    /** .emit(event, detail?) — dispatches a bubbling CustomEvent */
    emit(event, detail) {
      const e = new CustomEvent(event, { bubbles: true, detail });
      this._nodes.forEach(n => n.dispatchEvent(e));
      return this;
    }

    // ── Content ───────────────────────────────────────────────────────────────
    html(v)  { if (v === undefined) return this._nodes[0]?.innerHTML;   this._nodes.forEach(n => n.innerHTML   = v); return this; }
    text(v)  { if (v === undefined) return this._nodes[0]?.textContent; this._nodes.forEach(n => n.textContent = v); return this; }
    val(v)   { if (v === undefined) return this._nodes[0]?.value;       this._nodes.forEach(n => n.value       = v); return this; }
    attr(name, v) {
      if (v === undefined) return this._nodes[0]?.getAttribute(name);
      this._nodes.forEach(n => v === null ? n.removeAttribute(name) : n.setAttribute(name, v));
      return this;
    }
    data(key, v) {
      if (v === undefined) return this._nodes[0]?.dataset[key];
      this._nodes.forEach(n => n.dataset[key] = v);
      return this;
    }
    prop(key, v) {
      if (v === undefined) return this._nodes[0]?.[key];
      this._nodes.forEach(n => n[key] = v);
      return this;
    }

    /** .append(html|NodeSet|Element) — inserts at end (beforeend) */
    append(content) {
      this._nodes.forEach(n => {
        if (typeof content === "string") n.insertAdjacentHTML("beforeend", content);
        else n.appendChild(content instanceof NodeSet ? content._nodes[0] : content);
      });
      return this;
    }

    /** .prepend(html|NodeSet|Element) — inserts at start (afterbegin) */
    prepend(content) {
      this._nodes.forEach(n => {
        if (typeof content === "string") n.insertAdjacentHTML("afterbegin", content);
        else n.insertBefore(content instanceof NodeSet ? content._nodes[0] : content, n.firstChild);
      });
      return this;
    }

    empty()           { this._nodes.forEach(n => n.innerHTML = ""); return this; }
    remove()          { this._nodes.forEach(n => n.remove()); return this; }
    clone(deep = true){ return new NodeSet(this._nodes.map(n => n.cloneNode(deep))); }

    /** .wrap(html) — wraps each node with the given wrapper element */
    wrap(html) {
      this._nodes.forEach(n => {
        const w = document.createRange().createContextualFragment(html).firstElementChild;
        n.parentNode.insertBefore(w, n);
        w.appendChild(n);
      });
      return this;
    }

    // ── Classes ───────────────────────────────────────────────────────────────
    clsAdd(...cls)        { this._nodes.forEach(n => n.classList.add(...cls.flatMap(c => c.split(" ")))); return this; }
    clsRemove(...cls)     { this._nodes.forEach(n => n.classList.remove(...cls.flatMap(c => c.split(" ")))); return this; }
    clsToggle(cls, force) { this._nodes.forEach(n => n.classList.toggle(cls, force)); return this; }
    clsHas(cls)           { return this._nodes.some(n => n.classList.contains(cls)); }

    // ── Styles ────────────────────────────────────────────────────────────────
    /**
     * .style(prop, value?) — reads or sets inline style
     * .style({ color: 'red', opacity: '0' }) — sets multiple at once
     */
    style(prop, v) {
      if (typeof prop === "object") { Object.entries(prop).forEach(([k, val]) => this.style(k, val)); return this; }
      if (v === undefined) return getComputedStyle(this._nodes[0])?.[prop];
      this._nodes.forEach(n => n.style[prop] = v);
      return this;
    }

    show(display = "") { this._nodes.forEach(n => n.style.display = display || ""); return this; }
    hide()             { this._nodes.forEach(n => n.style.display = "none"); return this; }
    toggle(display)    { this._nodes.forEach(n => n.style.display = n.style.display === "none" ? (display || "") : "none"); return this; }

    // ── Metrics ───────────────────────────────────────────────────────────────
    width()  { return this._nodes[0]?.getBoundingClientRect().width; }
    height() { return this._nodes[0]?.getBoundingClientRect().height; }
    offset() { const r = this._nodes[0]?.getBoundingClientRect(); return r ? { top: r.top + scrollY, left: r.left + scrollX } : null; }

    // ── Animation (Web Animations API) ────────────────────────────────────────
    /**
     * .animate(keyframes, options?) → Promise
     * Uses native WAAPI — no dependencies.
     * @example
     * ld('.card').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
     */
    animate(kf, opts = {}) {
      const anims = this._nodes.map(n => n.animate(kf, { duration: 300, easing: "ease", fill: "forwards", ...opts }));
      return Promise.all(anims.map(a => a.finished));
    }

    fadeIn(ms = 300)    { return this.style("opacity", "0").show().animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms }); }
    fadeOut(ms = 300)   { return this.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms }).then(() => this.hide()); }
    slideDown(ms = 300) {
      this._nodes.forEach(n => {
        n.style.overflow = "hidden"; n.style.height = "0"; n.style.display = "";
        const h = n.scrollHeight;
        n.animate([{ height: "0px" }, { height: h + "px" }], { duration: ms, fill: "forwards" })
         .finished.then(() => { n.style.height = ""; n.style.overflow = ""; });
      });
      return this;
    }
    slideUp(ms = 300) {
      this._nodes.forEach(n => {
        const h = n.scrollHeight;
        n.animate([{ height: h + "px" }, { height: "0px" }], { duration: ms, fill: "forwards" })
         .finished.then(() => { n.style.display = "none"; n.style.height = ""; });
      });
      return this;
    }

    // ── Form ──────────────────────────────────────────────────────────────────
    /** .serialize() — returns a URL-encoded query string from a form */
    serialize() {
      const pairs = [];
      this._nodes.forEach(form => {
        new FormData(form).forEach((v, k) => pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`));
      });
      return pairs.join("&");
    }
  }

  // ─── ldFetch() — HTTP client with LiteDom's own identity ─────────────────
  /**
   * ldFetch(url, options?) → Promise<{ data, status, ok, headers }>
   *
   * Thin wrapper over fetch() with LiteDom's own interface.
   * No static methods, no $.ajax, no generic shorthands.
   *
   * options: {
   *   method  : 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'  (default: 'GET')
   *   body    : object | string | FormData                     (request payload)
   *   headers : object                                         (extra headers)
   *   as      : 'json' | 'text' | 'blob' | 'raw'             (default: 'json')
   *   signal  : AbortSignal                                    (cancellation)
   *   nonce   : string                                         (X-WP-Nonce)
   * }
   *
   * Returns a normalised response object:
   * {
   *   data    — parsed body (json / text / blob) or raw Response
   *   status  — HTTP status code
   *   ok      — true if 200-299
   *   headers — response Headers object
   * }
   *
   * @example
   * // GET
   * const { data } = await ldFetch('/api/posts');
   *
   * // POST with JSON body
   * const { data, status } = await ldFetch('/api/save', {
   *   method: 'POST',
   *   body: { title: 'Hello', content: '...' },
   * });
   *
   * // WordPress REST API with nonce
   * const { data } = await ldFetch('/wp-json/wp/v2/posts?per_page=9', {
   *   nonce: wpApiSettings.nonce,
   * });
   *
   * // WordPress wp_ajax with FormData
   * const fd = new FormData();
   * fd.append('action', 'my_action');
   * fd.append('nonce', ldAjax.nonce);
   * const { data } = await ldFetch(ldAjax.url, { method: 'POST', body: fd });
   *
   * // Cancellation via AbortController
   * const ctrl = new AbortController();
   * ldFetch('/api/stream', { signal: ctrl.signal });
   * ctrl.abort();
   */
  async function ldFetch(url, options = {}) {
    const {
      method  = "GET",
      body    = undefined,
      headers = {},
      as      = "json",
      signal  = undefined,
      nonce   = undefined,
    } = options;

    const hdrs = { ...headers };

    // Attach WordPress nonce when provided
    if (nonce) hdrs["X-WP-Nonce"] = nonce;

    // Set Content-Type for plain objects only — FormData sets its own boundary
    const resolvedBody = (() => {
      if (!body || method === "GET") return undefined;
      if (body instanceof FormData || body instanceof URLSearchParams) return body;
      hdrs["Content-Type"] = hdrs["Content-Type"] || "application/json";
      return JSON.stringify(body);
    })();

    const response = await fetch(url, {
      method,
      headers: hdrs,
      body:    resolvedBody,
      signal,
    });

    const parsers = {
      json: () => response.json(),
      text: () => response.text(),
      blob: () => response.blob(),
      raw:  () => Promise.resolve(response),
    };

    const parse = parsers[as] || parsers.json;

    if (!response.ok && as !== "raw") {
      let msg;
      try { msg = await response.text(); } catch { msg = response.statusText; }
      const err = new Error(`ldFetch: HTTP ${response.status} — ${msg}`);
      err.status  = response.status;
      err.headers = response.headers;
      throw err;
    }

    return {
      data:    await parse(),
      status:  response.status,
      ok:      response.ok,
      headers: response.headers,
    };
  }

  // ─── onReady() — run a callback when the DOM is ready ────────────────────
  /**
   * onReady(fn)
   *
   * Runs fn as soon as the DOM is available.
   * If the document is already ready, schedules fn as a microtask.
   *
   * @example
   * onReady(() => {
   *   ld('#app').clsAdd('ready');
   * });
   */
  function onReady(fn) {
    if (document.readyState !== "loading") queueMicrotask(fn);
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  // ─── createStore ──────────────────────────────────────────────────────────
  /**
   * createStore(initializer, options?) → store
   *
   * Zustand-inspired global store. Works across components, files and pages.
   *
   * initializer: (set, get) => initialState
   *   - set(partial | fn)  — merge partial state (like Zustand)
   *   - get()              — read current state snapshot
   *
   * options:
   *   name        {string}  — key for persistence / devtools
   *   persist     {boolean|'local'|'session'} — persist to storage (default: false)
   *   broadcast   {boolean} — sync across tabs via BroadcastChannel (default: false)
   *   middleware  {fn[]}    — array of middleware: (set, get, api) => newSet
   *
   * Returned store api:
   *   store.getState()              — snapshot of current state
   *   store.setState(partial|fn)    — update state, notify subscribers
   *   store.subscribe(fn, selector?) — subscribe to changes; returns unsubscribe fn
   *   store.destroy()               — remove all listeners / channels
   *
   * useStore(store, selector?) hook:
   *   Inside component() only. Returns selected slice, re-renders on change.
   *
   * @example
   * // store/cart.js
   * const useCart = createStore((set, get) => ({
   *   items: [],
   *   total: 0,
   *   add: (item) => set(s => ({
   *     items: [...s.items, item],
   *     total: s.total + item.price,
   *   })),
   *   clear: () => set({ items: [], total: 0 }),
   * }), { name: 'cart', persist: 'local', broadcast: true });
   *
   * // page-a.js
   * const { items, add } = useStore(useCart);
   *
   * // page-b.js — reacts to changes from page-a automatically
   * const total = useStore(useCart, s => s.total);
   */
  function createStore(initializer, options = {}) {
    const {
      name       = "litedom_store_" + Math.random().toString(36).slice(2),
      persist    = false,
      broadcast  = false,
      middleware = [],
    } = options;

    // ── storage helpers ──────────────────────────────────────────────────────
    const _storage =
      persist === "session"
        ? (typeof sessionStorage !== "undefined" ? sessionStorage : null)
        : persist
        ? (typeof localStorage !== "undefined" ? localStorage : null)
        : null;

    function _loadPersistedState() {
      if (!_storage) return null;
      try {
        const raw = _storage.getItem(name);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }

    function _persistState(state) {
      if (!_storage) return;
      try {
        // Only persist plain data — strip functions
        const plain = Object.fromEntries(
          Object.entries(state).filter(([, v]) => typeof v !== "function")
        );
        _storage.setItem(name, JSON.stringify(plain));
      } catch { /* quota exceeded, etc */ }
    }

    // ── BroadcastChannel (cross-tab sync) ────────────────────────────────────
    let _channel = null;
    if (broadcast && typeof BroadcastChannel !== "undefined") {
      _channel = new BroadcastChannel("litedom:" + name);
    }

    // ── subscriber registry ──────────────────────────────────────────────────
    // Each entry: { fn, selector, lastSelected }
    const _subscribers = new Set();

    function _notify(prevState) {
      _subscribers.forEach((sub) => {
        const next = sub.selector ? sub.selector(_state) : _state;
        const prev = sub.lastSelected;
        // Shallow-compare selected slice
        const changed = typeof next !== "object" || next === null
          ? !Object.is(next, prev)
          : Object.keys(next).some((k) => !Object.is(next[k], prev && prev[k]));
        if (changed) {
          sub.lastSelected = next;
          sub.fn(next, prevState);
        }
      });
    }

    // ── core set ─────────────────────────────────────────────────────────────
    function _set(partial) {
      const prevState = _state;
      const patch = typeof partial === "function" ? partial(_state) : partial;
      _state = Object.assign({}, _state, patch);
      _persistState(_state);
      if (_channel) {
        // Broadcast only data keys
        const data = Object.fromEntries(
          Object.entries(_state).filter(([, v]) => typeof v !== "function")
        );
        _channel.postMessage({ type: "sync", payload: data });
      }
      _schedule(() => _notify(prevState));
    }

    function _get() { return _state; }

    // ── apply middleware chain ────────────────────────────────────────────────
    // Each middleware wraps set: (set, get, api) => wrappedSet
    let _coreSet = _set;
    const _api = { getState: _get, setState: null, subscribe: null, destroy: null };
    for (let i = middleware.length - 1; i >= 0; i--) {
      _coreSet = middleware[i](_coreSet, _get, _api);
    }

    // ── initialise state ─────────────────────────────────────────────────────
    let _state = initializer(_coreSet, _get);

    // Merge persisted data (only non-function keys)
    const persisted = _loadPersistedState();
    if (persisted) {
      _state = Object.assign({}, _state, persisted);
    }

    // ── cross-tab receiver ────────────────────────────────────────────────────
    if (_channel) {
      _channel.onmessage = (e) => {
        if (e.data?.type !== "sync") return;
        const prevState = _state;
        // Restore data keys only; keep action functions from initializer
        _state = Object.assign({}, _state, e.data.payload);
        _schedule(() => _notify(prevState));
      };
    }

    // ── public API ────────────────────────────────────────────────────────────
    const store = {
      /** Read current state */
      getState: _get,

      /** Update state — accepts partial object or updater fn */
      setState: _coreSet,

      /**
       * subscribe(listener, selector?)
       * listener: (selectedState, fullPrevState) => void
       * selector: state => slice  (optional; defaults to full state)
       * Returns unsubscribe function.
       */
      subscribe(fn, selector) {
        const sub = {
          fn,
          selector: selector || null,
          lastSelected: selector ? selector(_state) : _state,
        };
        _subscribers.add(sub);
        return () => _subscribers.delete(sub);
      },

      /** Tear down channel and all subscriptions */
      destroy() {
        _subscribers.clear();
        if (_channel) { _channel.close(); _channel = null; }
        if (_storage) _storage.removeItem(name);
      },
    };

    // Wire api ref for middleware access
    Object.assign(_api, store);

    return store;
  }

  // ─── useStore hook ────────────────────────────────────────────────────────
  /**
   * useStore(store, selector?) → selectedState
   *
   * Must be called inside a component().
   * Subscribes the current component to store changes.
   * Re-renders only when the selected slice changes.
   *
   * @example
   * component('#header', () => {
   *   const user = useStore(authStore, s => s.user);
   *   return `<span>${user.name}</span>`;
   * });
   */
  function useStore(store, selector) {
    const comp = _currentComponent;
    if (!comp) throw new Error("useStore must be called inside a component()");

    const idx = _hookIndex++;
    const slot = comp._hooks[idx] || (comp._hooks[idx] = { unsub: null });

    // Subscribe once — cleanup handled by component lifecycle
    if (!slot.unsub) {
      slot.unsub = store.subscribe(() => {
        _schedule(() => comp._render());
      }, selector);

      // Register cleanup so it's called on destroy()
      const origDestroy = comp._destroyHooks || [];
      comp._destroyHooks = [...origDestroy, () => slot.unsub && slot.unsub()];
    }

    const state = store.getState();
    return selector ? selector(state) : state;
  }

  // ─── Exports ──────────────────────────────────────────────────────────────
  const LiteDom = {
    // hooks
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    use,
    memo,
    // componente
    component,
    // store
    createStore,
    useStore,
    // DOM
    ld,
    onReady,
    // HTTP
    ldFetch,
    // lazy
    lazyLoad,
  };

  // ── Sempre expõe no global (window) ──────────────────────────────────────
  global.LiteDom      = LiteDom;
  global.useState     = useState;
  global.useEffect    = useEffect;
  global.useRef       = useRef;
  global.useMemo      = useMemo;
  global.useCallback  = useCallback;
  global.use          = use;
  global.memo         = memo;
  global.component    = component;
  global.createStore  = createStore;
  global.useStore     = useStore;
  global.ld           = ld;
  global.onReady      = onReady;
  global.ldFetch      = ldFetch;
  global.lazyLoad     = lazyLoad;

  // ── Compatibilidade com bundlers (webpack, rollup, vite) ─────────────────
  if (typeof module !== "undefined" && module.exports) {
    module.exports = LiteDom;
  }
  if (typeof define === "function" && define.amd) {
    define([], () => LiteDom);
  }

})(typeof globalThis !== "undefined" ? globalThis : window);
