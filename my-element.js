var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@lit/reactive-element/css-tag.js
var t, e, s, o, n, r, i, S, c;
var init_css_tag = __esm({
  "node_modules/@lit/reactive-element/css-tag.js"() {
    t = globalThis;
    e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
    s = /* @__PURE__ */ Symbol();
    o = /* @__PURE__ */ new WeakMap();
    n = class {
      constructor(t3, e4, o5) {
        if (this._$cssResult$ = true, o5 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
        this.cssText = t3, this.t = e4;
      }
      get styleSheet() {
        let t3 = this.o;
        const s4 = this.t;
        if (e && void 0 === t3) {
          const e4 = void 0 !== s4 && 1 === s4.length;
          e4 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s4, t3));
        }
        return t3;
      }
      toString() {
        return this.cssText;
      }
    };
    r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
    i = (t3, ...e4) => {
      const o5 = 1 === t3.length ? t3[0] : e4.reduce((e5, s4, o6) => e5 + ((t4) => {
        if (true === t4._$cssResult$) return t4.cssText;
        if ("number" == typeof t4) return t4;
        throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
      })(s4) + t3[o6 + 1], t3[0]);
      return new n(o5, t3, s);
    };
    S = (s4, o5) => {
      if (e) s4.adoptedStyleSheets = o5.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
      else for (const e4 of o5) {
        const o6 = document.createElement("style"), n4 = t.litNonce;
        void 0 !== n4 && o6.setAttribute("nonce", n4), o6.textContent = e4.cssText, s4.appendChild(o6);
      }
    };
    c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
      let e4 = "";
      for (const s4 of t4.cssRules) e4 += s4.cssText;
      return r(e4);
    })(t3) : t3;
  }
});

// node_modules/@lit/reactive-element/reactive-element.js
var i2, e2, h, r2, o2, n2, a, c2, l, p, d, u, f, b, y;
var init_reactive_element = __esm({
  "node_modules/@lit/reactive-element/reactive-element.js"() {
    init_css_tag();
    init_css_tag();
    ({ is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object);
    a = globalThis;
    c2 = a.trustedTypes;
    l = c2 ? c2.emptyScript : "";
    p = a.reactiveElementPolyfillSupport;
    d = (t3, s4) => t3;
    u = { toAttribute(t3, s4) {
      switch (s4) {
        case Boolean:
          t3 = t3 ? l : null;
          break;
        case Object:
        case Array:
          t3 = null == t3 ? t3 : JSON.stringify(t3);
      }
      return t3;
    }, fromAttribute(t3, s4) {
      let i5 = t3;
      switch (s4) {
        case Boolean:
          i5 = null !== t3;
          break;
        case Number:
          i5 = null === t3 ? null : Number(t3);
          break;
        case Object:
        case Array:
          try {
            i5 = JSON.parse(t3);
          } catch (t4) {
            i5 = null;
          }
      }
      return i5;
    } };
    f = (t3, s4) => !i2(t3, s4);
    b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
    Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
    y = class extends HTMLElement {
      static addInitializer(t3) {
        this._$Ei(), (this.l ??= []).push(t3);
      }
      static get observedAttributes() {
        return this.finalize(), this._$Eh && [...this._$Eh.keys()];
      }
      static createProperty(t3, s4 = b) {
        if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
          const i5 = /* @__PURE__ */ Symbol(), h3 = this.getPropertyDescriptor(t3, i5, s4);
          void 0 !== h3 && e2(this.prototype, t3, h3);
        }
      }
      static getPropertyDescriptor(t3, s4, i5) {
        const { get: e4, set: r4 } = h(this.prototype, t3) ?? { get() {
          return this[s4];
        }, set(t4) {
          this[s4] = t4;
        } };
        return { get: e4, set(s5) {
          const h3 = e4?.call(this);
          r4?.call(this, s5), this.requestUpdate(t3, h3, i5);
        }, configurable: true, enumerable: true };
      }
      static getPropertyOptions(t3) {
        return this.elementProperties.get(t3) ?? b;
      }
      static _$Ei() {
        if (this.hasOwnProperty(d("elementProperties"))) return;
        const t3 = n2(this);
        t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
      }
      static finalize() {
        if (this.hasOwnProperty(d("finalized"))) return;
        if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
          const t4 = this.properties, s4 = [...r2(t4), ...o2(t4)];
          for (const i5 of s4) this.createProperty(i5, t4[i5]);
        }
        const t3 = this[Symbol.metadata];
        if (null !== t3) {
          const s4 = litPropertyMetadata.get(t3);
          if (void 0 !== s4) for (const [t4, i5] of s4) this.elementProperties.set(t4, i5);
        }
        this._$Eh = /* @__PURE__ */ new Map();
        for (const [t4, s4] of this.elementProperties) {
          const i5 = this._$Eu(t4, s4);
          void 0 !== i5 && this._$Eh.set(i5, t4);
        }
        this.elementStyles = this.finalizeStyles(this.styles);
      }
      static finalizeStyles(s4) {
        const i5 = [];
        if (Array.isArray(s4)) {
          const e4 = new Set(s4.flat(1 / 0).reverse());
          for (const s5 of e4) i5.unshift(c(s5));
        } else void 0 !== s4 && i5.push(c(s4));
        return i5;
      }
      static _$Eu(t3, s4) {
        const i5 = s4.attribute;
        return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
      }
      constructor() {
        super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
      }
      _$Ev() {
        this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
      }
      addController(t3) {
        (this._$EO ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
      }
      removeController(t3) {
        this._$EO?.delete(t3);
      }
      _$E_() {
        const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
        for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
        t3.size > 0 && (this._$Ep = t3);
      }
      createRenderRoot() {
        const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
        return S(t3, this.constructor.elementStyles), t3;
      }
      connectedCallback() {
        this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
      }
      enableUpdating(t3) {
      }
      disconnectedCallback() {
        this._$EO?.forEach((t3) => t3.hostDisconnected?.());
      }
      attributeChangedCallback(t3, s4, i5) {
        this._$AK(t3, i5);
      }
      _$ET(t3, s4) {
        const i5 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i5);
        if (void 0 !== e4 && true === i5.reflect) {
          const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
          this._$Em = t3, null == h3 ? this.removeAttribute(e4) : this.setAttribute(e4, h3), this._$Em = null;
        }
      }
      _$AK(t3, s4) {
        const i5 = this.constructor, e4 = i5._$Eh.get(t3);
        if (void 0 !== e4 && this._$Em !== e4) {
          const t4 = i5.getPropertyOptions(e4), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
          this._$Em = e4;
          const r4 = h3.fromAttribute(s4, t4.type);
          this[e4] = r4 ?? this._$Ej?.get(e4) ?? r4, this._$Em = null;
        }
      }
      requestUpdate(t3, s4, i5, e4 = false, h3) {
        if (void 0 !== t3) {
          const r4 = this.constructor;
          if (false === e4 && (h3 = this[t3]), i5 ??= r4.getPropertyOptions(t3), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r4._$Eu(t3, i5)))) return;
          this.C(t3, s4, i5);
        }
        false === this.isUpdatePending && (this._$ES = this._$EP());
      }
      C(t3, s4, { useDefault: i5, reflect: e4, wrapped: h3 }, r4) {
        i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t3) && (this._$Ej.set(t3, r4 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r4) || (this._$AL.has(t3) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t3, s4)), true === e4 && this._$Em !== t3 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t3));
      }
      async _$EP() {
        this.isUpdatePending = true;
        try {
          await this._$ES;
        } catch (t4) {
          Promise.reject(t4);
        }
        const t3 = this.scheduleUpdate();
        return null != t3 && await t3, !this.isUpdatePending;
      }
      scheduleUpdate() {
        return this.performUpdate();
      }
      performUpdate() {
        if (!this.isUpdatePending) return;
        if (!this.hasUpdated) {
          if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
            for (const [t5, s5] of this._$Ep) this[t5] = s5;
            this._$Ep = void 0;
          }
          const t4 = this.constructor.elementProperties;
          if (t4.size > 0) for (const [s5, i5] of t4) {
            const { wrapped: t5 } = i5, e4 = this[s5];
            true !== t5 || this._$AL.has(s5) || void 0 === e4 || this.C(s5, void 0, i5, e4);
          }
        }
        let t3 = false;
        const s4 = this._$AL;
        try {
          t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
        } catch (s5) {
          throw t3 = false, this._$EM(), s5;
        }
        t3 && this._$AE(s4);
      }
      willUpdate(t3) {
      }
      _$AE(t3) {
        this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
      }
      _$EM() {
        this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
      }
      get updateComplete() {
        return this.getUpdateComplete();
      }
      getUpdateComplete() {
        return this._$ES;
      }
      shouldUpdate(t3) {
        return true;
      }
      update(t3) {
        this._$Eq &&= this._$Eq.forEach((t4) => this._$ET(t4, this[t4])), this._$EM();
      }
      updated(t3) {
      }
      firstUpdated(t3) {
      }
    };
    y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");
  }
});

// node_modules/lit-html/lit-html.js
function V(t3, i5) {
  if (!u2(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
function M(t3, i5, s4 = t3, e4) {
  if (i5 === E) return i5;
  let h3 = void 0 !== e4 ? s4._$Co?.[e4] : s4._$Cl;
  const o5 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o5 && (h3?._$AO?.(false), void 0 === o5 ? h3 = void 0 : (h3 = new o5(t3), h3._$AT(t3, s4, e4)), void 0 !== e4 ? (s4._$Co ??= [])[e4] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t3, h3._$AS(t3, i5.values), h3, e4)), i5;
}
var t2, i3, s2, e3, h2, o3, n3, r3, l2, c3, a2, u2, d2, f2, v, _, m, p2, g, $, y2, x, b2, w, T, E, A, C, P, N, S2, R, k, H, I, L, z, Z, B, D;
var init_lit_html = __esm({
  "node_modules/lit-html/lit-html.js"() {
    t2 = globalThis;
    i3 = (t3) => t3;
    s2 = t2.trustedTypes;
    e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
    h2 = "$lit$";
    o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
    n3 = "?" + o3;
    r3 = `<${n3}>`;
    l2 = document;
    c3 = () => l2.createComment("");
    a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
    u2 = Array.isArray;
    d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
    f2 = "[ 	\n\f\r]";
    v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
    _ = /-->/g;
    m = />/g;
    p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
    g = /'/g;
    $ = /"/g;
    y2 = /^(?:script|style|textarea|title)$/i;
    x = (t3) => (i5, ...s4) => ({ _$litType$: t3, strings: i5, values: s4 });
    b2 = x(1);
    w = x(2);
    T = x(3);
    E = /* @__PURE__ */ Symbol.for("lit-noChange");
    A = /* @__PURE__ */ Symbol.for("lit-nothing");
    C = /* @__PURE__ */ new WeakMap();
    P = l2.createTreeWalker(l2, 129);
    N = (t3, i5) => {
      const s4 = t3.length - 1, e4 = [];
      let n4, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
      for (let i6 = 0; i6 < s4; i6++) {
        const s5 = t3[i6];
        let a3, u3, d3 = -1, f3 = 0;
        for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n4 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n4 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n4 = void 0);
        const x2 = c4 === p2 && t3[i6 + 1].startsWith("/>") ? " " : "";
        l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e4.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
      }
      return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e4];
    };
    S2 = class _S {
      constructor({ strings: t3, _$litType$: i5 }, e4) {
        let r4;
        this.parts = [];
        let l3 = 0, a3 = 0;
        const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i5);
        if (this.el = _S.createElement(f3, e4), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
          const t4 = this.el.content.firstChild;
          t4.replaceWith(...t4.childNodes);
        }
        for (; null !== (r4 = P.nextNode()) && d3.length < u3; ) {
          if (1 === r4.nodeType) {
            if (r4.hasAttributes()) for (const t4 of r4.getAttributeNames()) if (t4.endsWith(h2)) {
              const i6 = v2[a3++], s4 = r4.getAttribute(t4).split(o3), e5 = /([.?@])?(.*)/.exec(i6);
              d3.push({ type: 1, index: l3, name: e5[2], strings: s4, ctor: "." === e5[1] ? I : "?" === e5[1] ? L : "@" === e5[1] ? z : H }), r4.removeAttribute(t4);
            } else t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r4.removeAttribute(t4));
            if (y2.test(r4.tagName)) {
              const t4 = r4.textContent.split(o3), i6 = t4.length - 1;
              if (i6 > 0) {
                r4.textContent = s2 ? s2.emptyScript : "";
                for (let s4 = 0; s4 < i6; s4++) r4.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
                r4.append(t4[i6], c3());
              }
            }
          } else if (8 === r4.nodeType) if (r4.data === n3) d3.push({ type: 2, index: l3 });
          else {
            let t4 = -1;
            for (; -1 !== (t4 = r4.data.indexOf(o3, t4 + 1)); ) d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
          }
          l3++;
        }
      }
      static createElement(t3, i5) {
        const s4 = l2.createElement("template");
        return s4.innerHTML = t3, s4;
      }
    };
    R = class {
      constructor(t3, i5) {
        this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
      }
      get parentNode() {
        return this._$AM.parentNode;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      u(t3) {
        const { el: { content: i5 }, parts: s4 } = this._$AD, e4 = (t3?.creationScope ?? l2).importNode(i5, true);
        P.currentNode = e4;
        let h3 = P.nextNode(), o5 = 0, n4 = 0, r4 = s4[0];
        for (; void 0 !== r4; ) {
          if (o5 === r4.index) {
            let i6;
            2 === r4.type ? i6 = new k(h3, h3.nextSibling, this, t3) : 1 === r4.type ? i6 = new r4.ctor(h3, r4.name, r4.strings, this, t3) : 6 === r4.type && (i6 = new Z(h3, this, t3)), this._$AV.push(i6), r4 = s4[++n4];
          }
          o5 !== r4?.index && (h3 = P.nextNode(), o5++);
        }
        return P.currentNode = l2, e4;
      }
      p(t3) {
        let i5 = 0;
        for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t3[i5])), i5++;
      }
    };
    k = class _k {
      get _$AU() {
        return this._$AM?._$AU ?? this._$Cv;
      }
      constructor(t3, i5, s4, e4) {
        this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s4, this.options = e4, this._$Cv = e4?.isConnected ?? true;
      }
      get parentNode() {
        let t3 = this._$AA.parentNode;
        const i5 = this._$AM;
        return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
      }
      get startNode() {
        return this._$AA;
      }
      get endNode() {
        return this._$AB;
      }
      _$AI(t3, i5 = this) {
        t3 = M(this, t3, i5), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
      }
      O(t3) {
        return this._$AA.parentNode.insertBefore(t3, this._$AB);
      }
      T(t3) {
        this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
      }
      _(t3) {
        this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
      }
      $(t3) {
        const { values: i5, _$litType$: s4 } = t3, e4 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
        if (this._$AH?._$AD === e4) this._$AH.p(i5);
        else {
          const t4 = new R(e4, this), s5 = t4.u(this.options);
          t4.p(i5), this.T(s5), this._$AH = t4;
        }
      }
      _$AC(t3) {
        let i5 = C.get(t3.strings);
        return void 0 === i5 && C.set(t3.strings, i5 = new S2(t3)), i5;
      }
      k(t3) {
        u2(this._$AH) || (this._$AH = [], this._$AR());
        const i5 = this._$AH;
        let s4, e4 = 0;
        for (const h3 of t3) e4 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e4], s4._$AI(h3), e4++;
        e4 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e4), i5.length = e4);
      }
      _$AR(t3 = this._$AA.nextSibling, s4) {
        for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
          const s5 = i3(t3).nextSibling;
          i3(t3).remove(), t3 = s5;
        }
      }
      setConnected(t3) {
        void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
      }
    };
    H = class {
      get tagName() {
        return this.element.tagName;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      constructor(t3, i5, s4, e4, h3) {
        this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e4, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
      }
      _$AI(t3, i5 = this, s4, e4) {
        const h3 = this.strings;
        let o5 = false;
        if (void 0 === h3) t3 = M(this, t3, i5, 0), o5 = !a2(t3) || t3 !== this._$AH && t3 !== E, o5 && (this._$AH = t3);
        else {
          const e5 = t3;
          let n4, r4;
          for (t3 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = M(this, e5[s4 + n4], i5, n4), r4 === E && (r4 = this._$AH[n4]), o5 ||= !a2(r4) || r4 !== this._$AH[n4], r4 === A ? t3 = A : t3 !== A && (t3 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
        }
        o5 && !e4 && this.j(t3);
      }
      j(t3) {
        t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
      }
    };
    I = class extends H {
      constructor() {
        super(...arguments), this.type = 3;
      }
      j(t3) {
        this.element[this.name] = t3 === A ? void 0 : t3;
      }
    };
    L = class extends H {
      constructor() {
        super(...arguments), this.type = 4;
      }
      j(t3) {
        this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
      }
    };
    z = class extends H {
      constructor(t3, i5, s4, e4, h3) {
        super(t3, i5, s4, e4, h3), this.type = 5;
      }
      _$AI(t3, i5 = this) {
        if ((t3 = M(this, t3, i5, 0) ?? A) === E) return;
        const s4 = this._$AH, e4 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e4);
        e4 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
      }
      handleEvent(t3) {
        "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
      }
    };
    Z = class {
      constructor(t3, i5, s4) {
        this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
      }
      get _$AU() {
        return this._$AM._$AU;
      }
      _$AI(t3) {
        M(this, t3);
      }
    };
    B = t2.litHtmlPolyfillSupport;
    B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.2");
    D = (t3, i5, s4) => {
      const e4 = s4?.renderBefore ?? i5;
      let h3 = e4._$litPart$;
      if (void 0 === h3) {
        const t4 = s4?.renderBefore ?? null;
        e4._$litPart$ = h3 = new k(i5.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
      }
      return h3._$AI(t3), h3;
    };
  }
});

// node_modules/lit-element/lit-element.js
var s3, i4, o4;
var init_lit_element = __esm({
  "node_modules/lit-element/lit-element.js"() {
    init_reactive_element();
    init_reactive_element();
    init_lit_html();
    init_lit_html();
    s3 = globalThis;
    i4 = class extends y {
      constructor() {
        super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
      }
      createRenderRoot() {
        const t3 = super.createRenderRoot();
        return this.renderOptions.renderBefore ??= t3.firstChild, t3;
      }
      update(t3) {
        const r4 = this.render();
        this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r4, this.renderRoot, this.renderOptions);
      }
      connectedCallback() {
        super.connectedCallback(), this._$Do?.setConnected(true);
      }
      disconnectedCallback() {
        super.disconnectedCallback(), this._$Do?.setConnected(false);
      }
      render() {
        return E;
      }
    };
    i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
    o4 = s3.litElementPolyfillSupport;
    o4?.({ LitElement: i4 });
    (s3.litElementVersions ??= []).push("4.2.2");
  }
});

// node_modules/lit-html/is-server.js
var init_is_server = __esm({
  "node_modules/lit-html/is-server.js"() {
  }
});

// node_modules/lit/index.js
var init_lit = __esm({
  "node_modules/lit/index.js"() {
    init_reactive_element();
    init_lit_html();
    init_lit_element();
    init_is_server();
  }
});

// my-element.src.js
var require_my_element_src = __commonJS({
  "my-element.src.js"() {
    init_lit();
    var MyElement = class extends i4 {
      static properties = {
        hass: {},
        config: {},
        lovelace: {},
        _editingIndex: { state: true }
      };
      async setConfig(config) {
        this.config = structuredClone(config || {});
        if (!this.config.cards) this.config.cards = [];
        const helpers = await window.loadCardHelpers();
        this._cards = this.config.cards.map((c4) => helpers.createCardElement(c4));
        if (this._hass) this._cards.forEach((c4) => c4.hass = this._hass);
        this.requestUpdate();
      }
      set hass(hass) {
        this._hass = hass;
        if (this._cards) this._cards.forEach((c4) => c4.hass = hass);
      }
      get hass() {
        return this._hass;
      }
      static styles = i`
    .wrapper {
      display: flex;
      justify-content: flex-start;
      container-type: inline-size;
      width: 100%;
    }
    .container {
      column-width: 320px;
      column-gap: 8px;
      column-count: 3;
      width: 100%;
      max-width: calc(370px * 3 + 8px); 
      min-width:976px;
    }
    @container (max-width: 1000px) {
      .container {
        column-count: 2;
        width: 100%;
        max-width: calc(370px * 2 + 8px); 
        min-width:648px;
      }
    }
    @container (max-width: 670px) {
      .container {
        column-count: 1;
        width: 100%;
        max-width: 370px;
        min-width: 320px;
      }
    }
    .item {
      display: block;
      max-width:370px; min-width:320px;
      margin-bottom: 8px;
      break-inside: avoid;
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
      position: relative;
      border-radius: 24px;
      padding: 1px;
      box-sizing: border-box;
    }
  `;
      render() {
        if (!this._cards) return b2``;
        return b2`
      <div class="wrapper">
        <div class="container">
          ${this._cards.map((card) => b2`
            <div class="item">${card}</div>
          `)}
        </div>
      </div>
    `;
      }
      static async getConfigElement() {
        return document.createElement("my-element-editor");
      }
      static getStubConfig() {
        return { cards: [] };
      }
    };
    var ChildEditorHost = class extends i4 {
      static properties = {
        hass: {},
        cardConfig: {},
        _error: {}
      };
      static styles = i`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      pointer-events: auto;  /* Явно для вложенных */
    }
    .editor-shell {
      margin-top: 12px;
      padding: 16px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      background: var(--card-background-color, var(--ha-card-background));
      box-sizing: border-box;
      pointer-events: auto;
    }
    #mount {
      pointer-events: auto;
    }
    .error {
      color: var(--error-color);
      line-height: 1.5;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 14px;
      line-height: 1.4;
    }
  `;
      constructor() {
        super();
        this._error = "";
        this._editorEl = null;
        this._buildToken = 0;
        this._lastType = null;
        this._preservedCardMod = void 0;
        this._onConfigChanged = this._onConfigChanged.bind(this);
      }
      render() {
        return b2`
      <div class="editor-shell">
        <div id="mount"></div>
        ${this._error ? b2`<div class="error">${this._error}</div>` : ""}
      </div>
    `;
      }
      async updated(changedProps) {
        if (changedProps.has("cardConfig")) {
          await this._handleConfigChange();
        }
        if (changedProps.has("hass") && this._editorEl) {
          this._editorEl.hass = this.hass;
          if (this._editorEl.updateComplete) await this._editorEl.updateComplete;
        }
      }
      async _handleConfigChange() {
        const newType = this.cardConfig?.type;
        if (newType !== this._lastType || !this._editorEl) {
          this._lastType = newType;
          await this._buildEditor();
        } else if (this._editorEl) {
          const newConfig = structuredClone(this.cardConfig);
          if (typeof this._editorEl.setConfig === "function") {
            this._editorEl.setConfig(newConfig);
          } else {
            this._editorEl.config = newConfig;
          }
          await this._editorEl.updateComplete;
        }
      }
      async _buildEditor() {
        const mount = this.renderRoot?.querySelector("#mount");
        if (!mount) return;
        const token = ++this._buildToken;
        this._error = "";
        if (this._editorEl) {
          this._editorEl.removeEventListener("config-changed", this._onConfigChanged);
        }
        this._editorEl = null;
        mount.replaceChildren();
        if (!this.cardConfig?.type) {
          this._error = "\u0423 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 type";
          return;
        }
        try {
          const helpers = await window.loadCardHelpers();
          if (token !== this._buildToken) return;
          const cardType = this.cardConfig.type;
          let editor = null;
          if (cardType.startsWith("custom:")) {
            const cardEl = await helpers.createCardElement(structuredClone(this.cardConfig));
            if (token !== this._buildToken) return;
            const ctor = cardEl.constructor;
            if (typeof ctor?.getConfigElement === "function") {
              editor = await ctor.getConfigElement();
            }
          } else {
            const coreCardClassName = `hui-${cardType}-card`;
            const ctor = customElements.get(coreCardClassName);
            if (ctor && typeof ctor.getConfigElement === "function") {
              editor = await ctor.getConfigElement();
            }
          }
          if (!editor) {
            const hint = document.createElement("div");
            hint.className = "hint";
            hint.textContent = "\u0423 \u044D\u0442\u043E\u0439 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043D\u0435\u0442 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430";
            mount.replaceChildren(hint);
            return;
          }
          if (token !== this._buildToken) return;
          const editorConfig = structuredClone(this.cardConfig);
          const originalCardMod = editorConfig.card_mod;
          delete editorConfig.card_mod;
          editor.addEventListener("config-changed", this._onConfigChanged);
          mount.replaceChildren(editor);
          this._editorEl = editor;
          editor.hass = this.hass;
          if (typeof editor.setConfig === "function") {
            editor.setConfig(editorConfig);
          } else {
            editor.config = editorConfig;
          }
          await editor.updateComplete;
          this._originalCardMod = originalCardMod;
        } catch (err) {
          if (token !== this._buildToken) return;
          this._error = err?.message || String(err);
        }
      }
      _onConfigChanged(e4) {
        e4.stopPropagation();
        this.dispatchEvent(new CustomEvent("child-config-changed", {
          detail: { config: e4.detail.config },
          bubbles: true,
          composed: true
        }));
      }
      disconnectedCallback() {
        super.disconnectedCallback();
        this._buildToken++;
        if (this._editorEl) {
          this._editorEl.removeEventListener("config-changed", this._onConfigChanged);
        }
      }
    };
    customElements.define("child-editor-host", ChildEditorHost);
    var MyElementEditor = class extends i4 {
      static properties = {
        hass: {},
        config: {},
        _editingIndex: { state: true }
      };
      coverTileCardMod = {
        ".": `
      :host {
        border-radius: 24px !important;
        --ha-card-border-radius: 24px !important;
        border-color: transparent !important;
        --ha-card-border-color: transparent !important;
        --divider-color: transparent !important;
      }

      ha-card {
        background-color: #1C1B1F !important;
        height: 132px !important;
        box-sizing: border-box !important;
        --tile-color: transparent !important;
        padding: 16px !important;
      }

      ha-card::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        padding: 1px !important;
        border-radius: inherit !important;
        background: linear-gradient(
          165deg,
          rgba(101, 101, 101, 0) 0%,
          #656565 50%,
          rgba(101, 101, 101, 0) 100%
        ) !important;
        pointer-events: none !important;
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor !important;
        mask-composite: exclude !important;
      }

      ha-card hui-card-features {
        padding-right: 0 !important;
        padding-left: 0 !important;
      }

      ha-tile-icon {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }

      ha-tile-info {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        width: 100% !important;
        flex-wrap: nowrap !important;
      }

      ha-tile-info span:nth-child(2) {
        text-align: right !important;
        color: rgba(255, 255, 255, 0.50) !important;
        opacity: 1 !important;
        font-size: 15px !important;
        font-style: normal !important;
        font-weight: 400 !important;
        line-height: 20px !important;
      }

      ha-tile-info span:nth-child(1) {
        font-family: Roboto !important;
        font-size: 16px !important;
        font-style: normal !important;
        font-weight: 600 !important;
        line-height: 20px !important;
      }
    `,
        "ha-tile-container": {
          "$": `
        .content {
          padding-top: 0 !important;
          padding-right: 0 !important;
          padding-left: 0 !important;
          align-items: start !important;
          flex-grow: 0 !important;
          flex-shrink: 0 !important;
          flex-basis: 0% !important;
          flex: 0 0 0% !important;
          height: 50% !important;
        }

        .container {
          justify-content: space-between !important;
        }
      `,
          "ha-tile-info $": `
        .info {
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
      `,
          "hui-card-features $": {
            "hui-card-feature $": {
              "hui-cover-open-close-card-feature $": {
                "ha-control-button-group": {
                  "ha-control-button": {
                    "$": `
                  .button::before {
                    content: none !important;
                    background-color: transparent !important;
                    transition: none !important;
                    opacity: 0 !important;
                  }

                  .button ha-ripple {
                    --md-ripple-hover-color: transparent !important;
                    --md-ripple-pressed-color: transparent !important;
                  }
                `
                  },
                  ".": `
                ha-control-button {
                  background-color: #343239 !important;
                  position: relative !important;
                }

                ha-control-button:nth-child(2)::after, 
                ha-control-button:nth-child(3)::after{
                  content: "" !important;
                  position: absolute !important;
                  inset: 0 !important;
                  padding: 1px !important;
                  border-radius: inherit !important;
                  background: linear-gradient(
                    165deg,
                    rgba(101, 101, 101, 0) 0%,
                    #656565 50%,
                    rgba(101, 101, 101, 0) 100%
                  ) !important;
                  pointer-events: none !important;
                  -webkit-mask:
                    linear-gradient(#fff 0 0) content-box,
                    linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor !important;
                  mask-composite: exclude !important;
                }
                ha-control-button:nth-child(4)::after{
                  content: "" !important;
                  position: absolute !important;
                  inset: 0 !important;
                  padding: 1px !important;
                  border-radius: inherit !important;
                  background: linear-gradient(
                    15deg,
                    rgba(101, 101, 101, 0) 0%,
                    #656565 50%,
                    rgba(101, 101, 101, 0) 100%
                  ) !important;
                  pointer-events: none !important;
                  -webkit-mask:
                    linear-gradient(#fff 0 0) content-box,
                    linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor !important;
                  mask-composite: exclude !important;
                }

                ha-control-button[disabled] {
                  background-color: #4D4A54 !important;
                }

                ha-control-button:nth-child(2)::before {
                  content: "";
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  width: 6px !important;
                  height: 6px !important;
                  border-right: 2px solid white !important;
                  border-bottom: 2px solid white !important;
                  transform: translate(-50%, -50%) rotate(45deg) !important;
                }

                ha-control-button:nth-child(4)::before {
                  content: "";
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  width: 6px !important;
                  height: 6px !important;
                  border-right: 2px solid white !important;
                  border-bottom: 2px solid white !important;
                  transform: translate(-50%, 0%) rotate(-135deg) !important;
                }

                ha-control-button:nth-child(even) {
                  display: flex !important;
                  height: 56px !important;
                  padding: 20px !important;
                  justify-content: center !important;
                  align-items: center !important;
                  gap: 8px !important;
                  flex: 1 0 0 !important;
                  border-radius: 16px !important;
                  box-sizing: border-box !important;
                }

                ha-control-button:nth-child(3) {
                  display: flex !important;
                  width: 56px !important;
                  height: 56px !important;
                  padding: 20px !important;
                  justify-content: center !important;
                  align-items: center !important;
                  gap: 8px !important;
                  flex-grow: 0 !important;
                  flex-basis: 56px !important;
                  border-radius: 96px !important;
                  background: #343239 !important;
                  box-sizing: border-box !important;
                }

                ha-control-button:nth-child(3)::before {
                  content: "";
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  width: 12px !important;
                  height: 12px !important;
                  background: white !important;
                  border-radius: 1px !important;
                  transform: translate(-50%, -50%) !important;
                }

                ha-control-button ha-svg-icon {
                  display: none !important;
                  opacity: 0 !important;
                  visibility: hidden !important;
                }
              `
                }
              }
            }
          }
        }
      };
      static styles = i`
    :host { display: block; box-sizing: border-box; }

    .root {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      background: var(--secondary-background-color);
    }
    .row-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .type {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sub {
      color: var(--secondary-text-color);
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Компактные иконки вместо длинных кнопок */
    .actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .actions ha-icon-button {
      --mdc-icon-button-size: 36px;
      color: var(--secondary-text-color);
    }
    .actions ha-icon-button:hover {
      color: var(--primary-text-color);
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }
    .editor-title {
      font-weight: 600;
      font-size: 15px;
    }
    .back {
      align-self: flex-start;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }

    .toolbar ha-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;
      constructor() {
        super();
        this._editingIndex = null;
        this._originalCardMod = void 0;
      }
      setConfig(config) {
        this.config = {
          title: "",
          show_header: false,
          cards: [],
          ...config
        };
      }
      render() {
        if (!this.config) return b2``;
        const cards = this.config.cards || [];
        return b2`
      <div class="root">
        ${this._editingIndex === null ? b2`
          <div class="cards">
            ${cards.map((card, i5) => b2`
              <div class="row">
                <div class="row-info">
                  <div class="type" title="${card.type || "unknown"}">
                    ${card.type || "unknown"}
                  </div>
                  <div class="sub" title="${this._cardSummary(card)}">
                    ${this._cardSummary(card)}
                  </div>
                </div>

                <div class="actions">
                  <ha-icon-button 
                    @click=${() => this._moveUp(i5)}
                    ?disabled=${i5 === 0}
                    title="Вверх">
                    ↑
                  </ha-icon-button>
                  <ha-icon-button 
                    @click=${() => this._moveDown(i5)}
                    ?disabled=${i5 === cards.length - 1}
                    title="Вниз">
                    ↓
                  </ha-icon-button>
                  <ha-icon-button 
                    @click=${() => this._editCard(i5)}
                    title="Редактировать">
                    <ha-icon icon="mdi:pencil"></ha-icon>
                  </ha-icon-button>
                  <ha-icon-button 
                    @click=${() => this._removeCard(i5)}
                    title="Удалить">
                    <ha-icon icon="mdi:delete"></ha-icon>
                  </ha-icon-button>
                </div>
              </div>
            `)}
            <div class="toolbar">
              <div class="editor-title">Карточки</div>
              
              <ha-button raised @click=${this._addCard}>
                <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                Добавить карточку
              </ha-button>
            </div>
          </div>
        ` : b2`
          <ha-button class="back" @click=${this._closeEditor}>⬅ Назад</ha-button>
          <div class="editor-title">
            Редактирование: ${cards[this._editingIndex]?.type || "unknown"}
          </div>
          <child-editor-host
            .hass=${this.hass}
            .cardConfig=${cards[this._editingIndex]}
            @child-config-changed=${this._onChildConfigChanged}
          ></child-editor-host>
        `}
      </div>
    `;
      }
      _cardSummary(card) {
        if (!card) return "";
        if (card.entity) return `entity: ${card.entity}`;
        if (card.entities?.length) return `entities: ${card.entities.length}`;
        return "\u0411\u0435\u0437 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F";
      }
      _editCard(i5) {
        this._editingIndex = i5;
      }
      _closeEditor = () => {
        this._editingIndex = null;
      };
      _onChildConfigChanged = (e4) => {
        e4.stopPropagation();
        let newConfig = e4.detail.config || {};
        const currentCard = this.config.cards?.[this._editingIndex];
        if (currentCard?.card_mod) {
          newConfig = { ...newConfig, card_mod: structuredClone(currentCard.card_mod) };
        } else if (newConfig.card_mod) {
        }
        const cards = [...this.config.cards || []];
        cards[this._editingIndex] = newConfig;
        this.config = { ...this.config, cards };
        this._fire();
      };
      _removeCard(i5) {
        const cards = [...this.config.cards || []];
        cards.splice(i5, 1);
        this.config = { ...this.config, cards };
        this._editingIndex = null;
        this._fire();
      }
      _addCard = () => {
        const popularCards = [
          { label: "Emelya Media Columns", type: "custom:emelya-media-columns", config: { base_path: "/local" } },
          { label: "Emelya Coffee Card", type: "custom:emelya-coffee-card", config: { base_path: "/local" } },
          { label: "Emelya Kettle", type: "custom:emelya-kettle", config: { base_path: "/local" } },
          { label: "Emelya Humidifier", type: "custom:emelya-humidifier-card", config: { base_path: "/local" } },
          { label: "Emelya Oven", type: "custom:emelya-oven-card", config: { base_path: "/local" } },
          { label: "Emelya Light Panel", type: "custom:emelya-light-panel-hui", config: {} },
          { label: "Emelya Vacuum Cleaner", type: "custom:emelya-vacuum-cleaner", config: { base_path: "/local" } },
          { label: "Emelya Hood", type: "custom:emelya-hood-card", config: { base_path: "/local" } },
          { label: "Emelya Dishwasher", type: "custom:emelya-dishwasher", config: { base_path: "/local" } },
          { label: "Emelya Washer", type: "custom:emelya-washer-card", config: { base_path: "/local" } },
          { label: "Emelya Dryer", type: "custom:emelya-dryer-card", config: { base_path: "/local" } },
          { label: "Emelya Breezer", type: "custom:emelya-breezer-card", config: { base_path: "/local" } },
          { label: "Dual Thermostat", type: "custom:dual-thermostat-card", config: {} },
          {
            label: "Tile: \u0428\u0442\u043E\u0440\u044B (Cover Open-Close)",
            type: "tile",
            config: {
              type: "tile",
              entity: "cover.hall_window",
              name: "\u0428\u0442\u043E\u0440\u044B",
              features: [
                { type: "cover-open-close" }
              ],
              card_mod: {
                style: structuredClone(this.coverTileCardMod)
              }
            }
          },
          { label: "Tile Card (\u043F\u0443\u0441\u0442\u0430\u044F)", type: "tile", config: { entity: "" } },
          { label: "Entities Card", type: "entities", config: { entities: [] } },
          { label: "\u0414\u0440\u0443\u0433\u0430\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0432\u0440\u0443\u0447\u043D\u0443\u044E", type: "other", config: {} }
        ];
        const dialog = document.createElement("ha-dialog");
        dialog.heading = "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443";
        dialog.open = true;
        dialog.style.setProperty("--mdc-dialog-min-width", "420px");
        const content = document.createElement("div");
        content.style.cssText = "padding: 20px 28px 12px;";
        const select = document.createElement("select");
        select.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      border-radius: 8px;
      background: var(--card-background-color, #1e1e1e);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
    `;
        popularCards.forEach((item, i5) => {
          const option = document.createElement("option");
          option.value = i5.toString();
          option.textContent = item.label;
          select.appendChild(option);
        });
        content.appendChild(select);
        dialog.appendChild(content);
        const cancelBtn = document.createElement("ha-button");
        cancelBtn.slot = "secondaryAction";
        cancelBtn.textContent = "\u041E\u0442\u043C\u0435\u043D\u0430";
        const addBtn = document.createElement("ha-button");
        addBtn.slot = "primaryAction";
        addBtn.textContent = "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C";
        dialog.appendChild(cancelBtn);
        dialog.appendChild(addBtn);
        document.body.appendChild(dialog);
        addBtn.addEventListener("click", () => {
          const index = parseInt(select.value);
          if (isNaN(index)) return;
          const chosen = popularCards[index];
          let newCard = { type: chosen.type };
          if (chosen.config) {
            newCard = { ...chosen.config, type: chosen.type };
          }
          if (chosen.type === "other") {
            const manualType = prompt("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 type \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: custom:my-super-card):");
            if (!manualType) return;
            newCard = { type: manualType };
          }
          const cards = [...this.config.cards || []];
          cards.push(newCard);
          this.config = { ...this.config, cards };
          this._fire();
          dialog.close();
          dialog.remove();
        });
        cancelBtn.addEventListener("click", () => {
          dialog.close();
          dialog.remove();
        });
        dialog.addEventListener("closed", () => {
          dialog.remove();
        }, { once: true });
      };
      _moveUp(i5) {
        if (i5 <= 0) return;
        const cards = [...this.config.cards];
        [cards[i5 - 1], cards[i5]] = [cards[i5], cards[i5 - 1]];
        this.config = { ...this.config, cards };
        this._fire();
      }
      _moveDown(i5) {
        const cards = [...this.config.cards];
        if (i5 >= cards.length - 1) return;
        [cards[i5], cards[i5 + 1]] = [cards[i5 + 1], cards[i5]];
        this.config = { ...this.config, cards };
        this._fire();
      }
      _fire() {
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: this.config },
          bubbles: true,
          composed: true
        }));
      }
    };
    if (!customElements.get("my-element")) {
      customElements.define("my-element", MyElement);
    }
    customElements.define("my-element-editor", MyElementEditor);
    window.customCards = window.customCards || [];
    window.customCards.push({
      type: "custom:my-element",
      name: "My Element",
      description: "Container",
      preview: true
    });
  }
});
export default require_my_element_src();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
