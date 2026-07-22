// Element inspector (point-and-prompt) client script, injected on every page.
// Node/Astro analogue of the WP mu-plugin urumi-magic class-element-inspector.php.
// `__DASHBOARD_ORIGIN__` is substituted by the integration at astro:config:setup.
export const INSPECTOR_CLIENT = `
(function () {
  var inspectMode = false, overlay = null, label = null, parentOrigin = "__DASHBOARD_ORIGIN__";
  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "urumi-element-inspector-overlay";
    overlay.style.cssText = "position:fixed;pointer-events:none;z-index:999999;border:2px solid #8b5cf6;background-color:rgba(139,92,246,0.1);transition:all .1s ease-out;display:none;";
    document.body.appendChild(overlay);
    label = document.createElement("div");
    label.id = "urumi-element-inspector-label";
    label.style.cssText = "position:fixed;pointer-events:none;z-index:1000000;background-color:#8b5cf6;color:#fff;padding:2px 8px;font-size:12px;font-family:ui-monospace,monospace;border-radius:2px;display:none;white-space:nowrap;";
    document.body.appendChild(label);
  }
  function removeOverlay() { if (overlay) { overlay.remove(); overlay = null; } if (label) { label.remove(); label = null; } }
  function updateOverlay(el) {
    if (!overlay || !label || !el) return;
    var r = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.top = r.top + "px"; overlay.style.left = r.left + "px";
    overlay.style.width = r.width + "px"; overlay.style.height = r.height + "px";
    label.textContent = el.tagName.toLowerCase(); label.style.display = "block";
    label.style.top = (r.top > 24 ? r.top - 24 : r.bottom + 4) + "px"; label.style.left = r.left + "px";
  }
  function onMove(e) {
    if (!inspectMode) return;
    var el = e.target;
    if (el === overlay || el === label || el.tagName === "HTML" || el.tagName === "BODY") return;
    updateOverlay(el);
  }
  function onClick(e) {
    if (!inspectMode) return;
    e.preventDefault(); e.stopPropagation();
    var el = e.target;
    if (el === overlay || el === label) return;
    send(context(el)); toggle(false);
  }
  function domPath(el) {
    var path = [], cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      var s = cur.tagName.toLowerCase();
      if (cur.id) s += "#" + cur.id;
      else if (cur.className && typeof cur.className === "string") {
        var c = cur.className.trim().split(/\\s+/).slice(0, 2);
        if (c.length && c[0]) s += "." + c.join(".");
      }
      path.unshift(s); cur = cur.parentElement;
    }
    return path.join(" > ");
  }
  function uniqueSelector(el) {
    if (el.id) return "#" + el.id;
    var bn = el.getAttribute("data-block-name");
    if (bn) return '[data-block-name="' + bn + '"]';
    var path = [], cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.body) {
      var s = cur.tagName.toLowerCase();
      if (cur.id) { path.unshift("#" + cur.id); break; }
      if (!cur.parentNode || !cur.parentNode.children) { path.unshift(s); break; }
      var sib = Array.prototype.slice.call(cur.parentNode.children).filter(function (x) { return x.tagName === cur.tagName; });
      if (sib.length > 1) s += ":nth-of-type(" + (sib.indexOf(cur) + 1) + ")";
      path.unshift(s); cur = cur.parentNode;
    }
    return path.join(" > ");
  }
  function attrs(el) { var o = {}; for (var i = 0; i < el.attributes.length; i++) o[el.attributes[i].name] = el.attributes[i].value; return o; }
  function styles(el) { var c = getComputedStyle(el); return { color: c.color, backgroundColor: c.backgroundColor, fontSize: c.fontSize, fontFamily: c.fontFamily, display: c.display, position: c.position }; }
  function context(el) {
    var r = el.getBoundingClientRect();
    var oh = el.outerHTML; if (oh.length > 2000) oh = oh.slice(0, 2000) + "...";
    var it = el.innerText || ""; if (it.length > 500) it = it.slice(0, 500) + "...";
    return {
      tagName: el.tagName.toLowerCase(), id: el.id || null, className: el.className || "",
      path: domPath(el), attributes: attrs(el), computedStyles: styles(el),
      position: { top: Math.round(r.top), left: Math.round(r.left), pageTop: Math.round(r.top + scrollY), pageLeft: Math.round(r.left + scrollX), width: Math.round(r.width * 100) / 100, height: Math.round(r.height * 100) / 100 },
      uniqueSelector: uniqueSelector(el), innerText: it.trim(), outerHTML: oh, pageUrl: location.href
    };
  }
  function send(ctx) {
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: "WP_ELEMENT_SELECTED", element: ctx, timestamp: Date.now() }, parentOrigin); } catch (e) {}
    }
  }
  function toggle(on) {
    inspectMode = on;
    if (on) {
      createOverlay(); document.body.style.cursor = "crosshair";
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("click", onClick, true);
    } else {
      removeOverlay(); document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
    }
  }
  window.addEventListener("message", function (ev) {
    if (ev.data && ev.data.type === "URUMI_INSPECT_MODE") {
      if (ev.origin) parentOrigin = ev.origin;
      toggle(!!ev.data.enabled);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && inspectMode) {
      toggle(false);
      if (window.parent && window.parent !== window) {
        try { window.parent.postMessage({ type: "WP_INSPECT_MODE_CANCELLED", timestamp: Date.now() }, parentOrigin); } catch (er) {}
      }
    }
  });
})();
`;
