var t,e,i={},n={};function o(t){var e=n[t];if(void 0!==e)return e.exports;var r=n[t]={exports:{}};return i[t](r,r.exports,o),r.exports}e=Object.getPrototypeOf?t=>Object.getPrototypeOf(t):t=>t.__proto__,o.t=function(i,n){if(1&n&&(i=this(i)),8&n)return i;if("object"==typeof i&&i){if(4&n&&i.__esModule)return i;if(16&n&&"function"==typeof i.then)return i}var r=Object.create(null);o.r(r);var a={};t=t||[null,e({}),e([]),e(e)];for(var s=2&n&&i;("object"==typeof s||"function"==typeof s)&&!~t.indexOf(s);s=e(s))Object.getOwnPropertyNames(s).forEach(t=>a[t]=()=>i[t]);return a.default=()=>i,o.d(r,a),r},o.d=(t,e)=>{for(var i in e)o.o(e,i)&&!o.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},o.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),o.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const r=window,a=r.ShadowRoot&&(void 0===r.ShadyCSS||r.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),l=new WeakMap;class c{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(a&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=l.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&l.set(e,t))}return t}toString(){return this.cssText}}const d=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new c(i,t,s)},u=(t,e)=>{a?t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):e.forEach(e=>{const i=document.createElement("style"),n=r.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=e.cssText,t.appendChild(i)})},_=a?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new c("string"==typeof t?t:t+"",void 0,s))(e)})(t):t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var h;const p=window,f=p.trustedTypes,m=f?f.emptyScript:"",g=p.reactiveElementPolyfillSupport,v={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>e!==t&&(e==e||t==t),b={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:y},x="finalized";class $ extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const n=this._$Ep(i,e);void 0!==n&&(this._$Ev.set(n,i),t.push(n))}),t}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,n=this.getPropertyDescriptor(t,i,e);void 0!==n&&Object.defineProperty(this.prototype,t,n)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(n){const o=this[t];this[e]=n,this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||b}static finalize(){if(this.hasOwnProperty(x))return!1;this[x]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(_(t))}else void 0!==t&&e.push(_(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;const e=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return u(e,this.constructor.elementStyles),e}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=b){var n;const o=this.constructor._$Ep(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==(null===(n=i.converter)||void 0===n?void 0:n.toAttribute)?i.converter:v).toAttribute(e,i.type);this._$El=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$El=null}}_$AK(t,e){var i;const n=this.constructor,o=n._$Ev.get(t);if(void 0!==o&&this._$El!==o){const t=n.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:v;this._$El=o,this[o]=r.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let n=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||y)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):n=!1),!this.isUpdatePending&&n&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var w;$[x]=!0,$.elementProperties=new Map,$.elementStyles=[],$.shadowRootOptions={mode:"open"},null==g||g({ReactiveElement:$}),(null!==(h=p.reactiveElementVersions)&&void 0!==h?h:p.reactiveElementVersions=[]).push("1.6.3");const k=window,A=k.trustedTypes,E=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${(Math.random()+"").slice(9)}$`,M="?"+C,P=`<${M}>`,z=document,N=()=>z.createComment(""),H=t=>null===t||"object"!=typeof t&&"function"!=typeof t,R=Array.isArray,T=t=>R(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),O="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,L=/>/g,B=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,I=/"/g,F=/^(?:script|style|textarea|title)$/i,W=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),Z=W(1),V=(W(2),Symbol.for("lit-noChange")),q=Symbol.for("lit-nothing"),K=new WeakMap,J=z.createTreeWalker(z,129,null,!1);function G(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const X=(t,e)=>{const i=t.length-1,n=[];let o,r=2===e?"<svg>":"",a=U;for(let e=0;e<i;e++){const i=t[e];let s,l,c=-1,d=0;for(;d<i.length&&(a.lastIndex=d,l=a.exec(i),null!==l);)d=a.lastIndex,a===U?"!--"===l[1]?a=D:void 0!==l[1]?a=L:void 0!==l[2]?(F.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=B):void 0!==l[3]&&(a=B):a===B?">"===l[0]?(a=null!=o?o:U,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,s=l[1],a=void 0===l[3]?B:'"'===l[3]?I:j):a===I||a===j?a=B:a===D||a===L?a=U:(a=B,o=void 0);const u=a===B&&t[e+1].startsWith("/>")?" ":"";r+=a===U?i+P:c>=0?(n.push(s),i.slice(0,c)+S+i.slice(c)+C+u):i+C+(-2===c?(n.push(void 0),e):u)}return[G(t,r+(t[i]||"<?>")+(2===e?"</svg>":"")),n]};class Y{constructor({strings:t,_$litType$:e},i){let n;this.parts=[];let o=0,r=0;const a=t.length-1,s=this.parts,[l,c]=X(t,e);if(this.el=Y.createElement(l,i),J.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(n=J.nextNode())&&s.length<a;){if(1===n.nodeType){if(n.hasAttributes()){const t=[];for(const e of n.getAttributeNames())if(e.endsWith(S)||e.startsWith(C)){const i=c[r++];if(t.push(e),void 0!==i){const t=n.getAttribute(i.toLowerCase()+S).split(C),e=/([.?@])?(.*)/.exec(i);s.push({type:1,index:o,name:e[2],strings:t,ctor:"."===e[1]?nt:"?"===e[1]?rt:"@"===e[1]?at:it})}else s.push({type:6,index:o})}for(const e of t)n.removeAttribute(e)}if(F.test(n.tagName)){const t=n.textContent.split(C),e=t.length-1;if(e>0){n.textContent=A?A.emptyScript:"";for(let i=0;i<e;i++)n.append(t[i],N()),J.nextNode(),s.push({type:2,index:++o});n.append(t[e],N())}}}else if(8===n.nodeType)if(n.data===M)s.push({type:2,index:o});else{let t=-1;for(;-1!==(t=n.data.indexOf(C,t+1));)s.push({type:7,index:o}),t+=C.length-1}o++}}static createElement(t,e){const i=z.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,n){var o,r,a,s;if(e===V)return e;let l=void 0!==n?null===(o=i._$Co)||void 0===o?void 0:o[n]:i._$Cl;const c=H(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(r=null==l?void 0:l._$AO)||void 0===r||r.call(l,!1),void 0===c?l=void 0:(l=new c(t),l._$AT(t,i,n)),void 0!==n?(null!==(a=(s=i)._$Co)&&void 0!==a?a:s._$Co=[])[n]=l:i._$Cl=l),void 0!==l&&(e=Q(t,l._$AS(t,e.values),l,n)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:i},parts:n}=this._$AD,o=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:z).importNode(i,!0);J.currentNode=o;let r=J.nextNode(),a=0,s=0,l=n[0];for(;void 0!==l;){if(a===l.index){let e;2===l.type?e=new et(r,r.nextSibling,this,t):1===l.type?e=new l.ctor(r,l.name,l.strings,this,t):6===l.type&&(e=new st(r,this,t)),this._$AV.push(e),l=n[++s]}a!==(null==l?void 0:l.index)&&(r=J.nextNode(),a++)}return J.currentNode=z,o}v(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{constructor(t,e,i,n){var o;this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=n,this._$Cp=null===(o=null==n?void 0:n.isConnected)||void 0===o||o}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),H(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):T(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==q&&H(this._$AH)?this._$AA.nextSibling.data=t:this.$(z.createTextNode(t)),this._$AH=t}g(t){var e;const{values:i,_$litType$:n}=t,o="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=Y.createElement(G(n.h,n.h[0]),this.options)),n);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===o)this._$AH.v(i);else{const t=new tt(o,this),e=t.u(this.options);t.v(i),this.$(e),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new Y(t)),e}T(t){R(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,n=0;for(const o of t)n===e.length?e.push(i=new et(this.k(N()),this.k(N()),this,this.options)):i=e[n],i._$AI(o),n++;n<e.length&&(this._$AR(i&&i._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class it{constructor(t,e,i,n,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,n){const o=this.strings;let r=!1;if(void 0===o)t=Q(this,t,e,0),r=!H(t)||t!==this._$AH&&t!==V,r&&(this._$AH=t);else{const n=t;let a,s;for(t=o[0],a=0;a<o.length-1;a++)s=Q(this,n[i+a],e,a),s===V&&(s=this._$AH[a]),r||(r=!H(s)||s!==this._$AH[a]),s===q?t=q:t!==q&&(t+=(null!=s?s:"")+o[a+1]),this._$AH[a]=s}r&&!n&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class nt extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}const ot=A?A.emptyScript:"";class rt extends it{constructor(){super(...arguments),this.type=4}j(t){t&&t!==q?this.element.setAttribute(this.name,ot):this.element.removeAttribute(this.name)}}class at extends it{constructor(t,e,i,n,o){super(t,e,i,n,o),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=Q(this,t,e,0))&&void 0!==i?i:q)===V)return;const n=this._$AH,o=t===q&&n!==q||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,r=t!==q&&(n===q||o);o&&this.element.removeEventListener(this.name,this,n),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const lt=k.litHtmlPolyfillSupport;null==lt||lt(Y,et),(null!==(w=k.litHtmlVersions)&&void 0!==w?w:k.litHtmlVersions=[]).push("2.8.0");var ct,dt;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ut extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var n,o;const r=null!==(n=null==i?void 0:i.renderBefore)&&void 0!==n?n:e;let a=r._$litPart$;if(void 0===a){const t=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;r._$litPart$=a=new et(e.insertBefore(N(),t),t,void 0,null!=i?i:{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return V}}ut.finalized=!0,ut._$litElement$=!0,null===(ct=globalThis.litElementHydrateSupport)||void 0===ct||ct.call(globalThis,{LitElement:ut});const _t=globalThis.litElementPolyfillSupport;null==_t||_t({LitElement:ut});(null!==(dt=globalThis.litElementVersions)&&void 0!==dt?dt:globalThis.litElementVersions=[]).push("3.3.3");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ht=t=>e=>"function"==typeof e?((t,e)=>(customElements.define(t,e),e))(t,e):((t,e)=>{const{kind:i,elements:n}=e;return{kind:i,elements:n,finisher(e){customElements.define(t,e)}}})(t,e),pt=(t,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(i){i.createProperty(e.key,t)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this))},finisher(i){i.createProperty(e.key,t)}};function ft(t){return(e,i)=>void 0!==i?((t,e,i)=>{e.constructor.createProperty(i,t)})(t,e,i):pt(t,e)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function mt(t){return ft({...t,state:!0})}var gt;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */null===(gt=window.HTMLSlotElement)||void 0===gt||gt.prototype.assignedElements;var vt,yt;!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(vt||(vt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(yt||(yt={}));function bt(t){return t.substr(0,t.indexOf("."))}var xt=["closed","locked","off"],$t=(new Set(["fan","input_boolean","light","switch","group","automation"]),function(t,e,i,n){n=n||{},i=null==i?{}:i;var o=new Event(e,{bubbles:void 0===n.bubbles||n.bubbles,cancelable:Boolean(n.cancelable),composed:void 0===n.composed||n.composed});return o.detail=i,t.dispatchEvent(o),o});new Set(["call-service","divider","section","weblink","cast","select"]);var wt=function(t){$t(window,"haptic",t)},kt=function(t,e,i){void 0===i&&(i=!1),i?history.replaceState(null,"",e):history.pushState(null,"",e),$t(window,"location-changed",{replace:i})},At=function(t,e){return function(t,e,i){void 0===i&&(i=!0);var n,o=bt(e),r="group"===o?"homeassistant":o;switch(o){case"lock":n=i?"unlock":"lock";break;case"cover":n=i?"open_cover":"close_cover";break;default:n=i?"turn_on":"turn_off"}return t.callService(r,n,{entity_id:e})}(t,e,xt.includes(t.states[e].state))},Et=function(t,e,i,n){var o;"double_tap"===n&&i.double_tap_action?o=i.double_tap_action:"hold"===n&&i.hold_action?o=i.hold_action:"tap"===n&&i.tap_action&&(o=i.tap_action),function(t,e,i,n){if(n||(n={action:"more-info"}),!n.confirmation||n.confirmation.exemptions&&n.confirmation.exemptions.some(function(t){return t.user===e.user.id})||(wt("warning"),confirm(n.confirmation.text||"Are you sure you want to "+n.action+"?")))switch(n.action){case"more-info":(i.entity||i.camera_image)&&$t(t,"hass-more-info",{entityId:i.entity?i.entity:i.camera_image});break;case"navigate":n.navigation_path&&kt(0,n.navigation_path);break;case"url":n.url_path&&window.open(n.url_path);break;case"toggle":i.entity&&(At(e,i.entity),wt("success"));break;case"call-service":if(!n.service)return void wt("failure");var o=n.service.split(".",2);e.callService(o[0],o[1],n.service_data,n.target),wt("success");break;case"fire-dom-event":$t(t,"ll-custom",n)}}(t,e,i,o)};function St(t){return void 0!==t&&"none"!==t.action}const Ct=JSON.parse('{"common":{"version":"Version","invalid_configuration":"Ungültige Konfiguration","show_warning":"Warnung anzeigen","configure":"Bitte konfigurieren: Bild-URL und Entitäten mit Koordinaten."}}');var Mt=o.t(Ct,2);const Pt=JSON.parse('{"common":{"version":"Version","invalid_configuration":"Invalid configuration","show_warning":"Show warning","configure":"Please configure: image URL and entities with coordinates."}}');const zt={de:Mt,en:o.t(Pt,2)};function Nt(t,e){return t?.states?.[e]?.attributes?.friendly_name||e}class Ht{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}const Rt="ontouchstart"in window||navigator.maxTouchPoints>0;class Tt extends HTMLElement{constructor(){super(...arguments),this.holdTime=500,this.held=!1}connectedCallback(){Object.assign(this.style,{position:"absolute",width:Rt?"100px":"50px",height:Rt?"100px":"50px",transform:"translate(-50%, -50%)",pointerEvents:"none",zIndex:"999"})}bind(t,e){if(t._roomPlanActionHandler)return;t._roomPlanActionHandler=!0,t.addEventListener("contextmenu",t=>(t.preventDefault(),t.stopPropagation(),!1));const i=()=>{this.held=!1,this.timer=window.setTimeout(()=>{this.held=!0},this.holdTime)},n=i=>{if(!["touchend","touchcancel"].includes(i.type)||void 0!==this.timer)if(i.preventDefault(),clearTimeout(this.timer),this.timer=void 0,this.held)$t(t,"action",{action:"hold"});else if(e.hasDoubleClick){const e=i;"click"===i.type&&e.detail<2||!this.dblClickTimeout?this.dblClickTimeout=window.setTimeout(()=>{this.dblClickTimeout=void 0,$t(t,"action",{action:"tap"})},250):(clearTimeout(this.dblClickTimeout),this.dblClickTimeout=void 0,$t(t,"action",{action:"double_tap"}))}else $t(t,"action",{action:"tap"})},o=()=>{clearTimeout(this.timer),this.timer=void 0};["touchcancel","mouseout","mouseup","touchmove","mouseleave"].forEach(e=>{t.addEventListener(e,o,{passive:!0})}),t.addEventListener("touchstart",i,{passive:!0}),t.addEventListener("touchend",n),t.addEventListener("touchcancel",n),t.addEventListener("mousedown",i,{passive:!0}),t.addEventListener("click",n),t.addEventListener("keyup",t=>{"Enter"!==t.key&&13!==t.keyCode||n(t)})}}customElements.define("action-handler-room-plan",Tt);const Ot=(t,e)=>{(()=>{let t=document.body.querySelector("action-handler-room-plan");return t||(t=document.createElement("action-handler-room-plan"),document.body.appendChild(t)),t})().bind(t,e??{})},Ut=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends Ht{update(t,[e]){return Ot(t.element,e),V}render(t){return V}});var Dt=function(t,e,i,n){var o,r=arguments.length,a=r<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,n);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(a=(r<3?o(a):r>3?o(e,i,a):o(e,i))||a);return r>3&&a&&Object.defineProperty(e,i,a),a};let Lt=class extends ut{constructor(){super(...arguments),this._config={type:"",image:"",entities:[]}}setConfig(t){const e=t??{type:"",image:"",entities:[]},i="string"==typeof e.image?e.image:e.image?.location??"";this._config={...e,image:i,entities:Array.isArray(e.entities)?[...e.entities]:[],entity_filter:Array.isArray(e.entity_filter)?e.entity_filter:void 0,temperature_zones:Array.isArray(e.temperature_zones)?[...e.temperature_zones]:void 0,alert_entities:Array.isArray(e.alert_entities)?e.alert_entities:void 0,alert_badge_action:e.alert_badge_action,image_dark:e.image_dark,dark_mode_filter:e.dark_mode_filter,dark_mode:e.dark_mode}}_emitConfig(){$t(this,"config-changed",{config:this._config})}_updateConfig(t){this._config={...this._config,...t},this._emitConfig()}_updateEntity(t,e){const i=[...this._config.entities??[]];i[t]={...i[t],...e},this._updateConfig({entities:i})}_removeEntity(t){const e=[...this._config.entities??[]];e.splice(t,1),this._updateConfig({entities:e})}_addEntity(){const t=[...this._config.entities??[],{entity:"",x:50,y:50}];this._updateConfig({entities:t})}_updateHeatmapZone(t,e){const i=[...this._config.temperature_zones??[]];i[t]={...i[t],...e},this._updateConfig({temperature_zones:i})}_removeHeatmapZone(t){const e=[...this._config.temperature_zones??[]];e.splice(t,1),this._updateConfig({temperature_zones:e.length?e:void 0})}_addHeatmapZone(){const t=[...this._config.temperature_zones??[],{entity:"",x1:10,y1:10,x2:40,y2:40}];this._updateConfig({temperature_zones:t})}_updateAlertEntity(t,e){const i=[...this._config.alert_entities??[]];i[t]=e.trim(),this._updateConfig({alert_entities:i})}_removeAlertEntity(t){const e=[...this._config.alert_entities??[]];e.splice(t,1),this._updateConfig({alert_entities:e.length?e:void 0})}_addAlertEntity(){const t=[...this._config.alert_entities??[],""];this._updateConfig({alert_entities:t})}render(){const t="string"==typeof this._config.image?this._config.image:"",e=this._config.title??"",i=Number(this._config.rotation)??0,n=this._config.entities??[],o=this.hass?.states?Object.keys(this.hass.states).sort():[];return Z`
      <div class="editor">
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:image"></ha-icon> Bild</h4>
          <div class="field">
            <label>Bild-URL</label>
            <input type="text" .value=${t} placeholder="/local/raumplan.png"
              @change=${t=>this._updateConfig({image:t.target.value.trim()})} />
            <span class="hint">Bild unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.</span>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Titel</label>
              <input type="text" .value=${e} placeholder="Optional" @change=${t=>this._updateConfig({title:t.target.value.trim()})} />
            </div>
            <div class="field">
              <label>Drehung</label>
              <select .value=${String(i)} @change=${t=>this._updateConfig({rotation:Number(t.target.value)})}>
                <option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>Dark Mode</label>
            <select .value=${!0===this._config.dark_mode?"dark":!1===this._config.dark_mode?"light":"auto"}
              @change=${t=>{const e=t.target.value;this._updateConfig({dark_mode:"auto"===e?void 0:"dark"===e})}}>
              <option value="auto">Auto (System/Theme)</option>
              <option value="light">Immer Hell</option>
              <option value="dark">Immer Dunkel</option>
            </select>
            <span class="hint">Auto nutzt die Systemeinstellung (prefers-color-scheme).</span>
          </div>
          <div class="field">
            <label>Bild-URL (Dark Mode, optional)</label>
            <input type="text" .value=${this._config.image_dark??""} placeholder="z. B. /local/raumplan_dark.svg"
              @change=${t=>this._updateConfig({image_dark:t.target.value.trim()||void 0})} />
            <span class="hint">Anderes Bild bei Dark Mode (z. B. invertierte SVG).</span>
          </div>
          <div class="field">
            <label>CSS-Filter (Dark Mode, optional)</label>
            <input type="text" .value=${this._config.dark_mode_filter??""} placeholder="z. B. brightness(0.88) contrast(1.05)"
              @change=${t=>this._updateConfig({dark_mode_filter:t.target.value.trim()||void 0})} />
            <span class="hint">Standard bei Auto: leichte Abdunklung. Für Inversion: <code>invert(1)</code>.</span>
          </div>
        </section>
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:map-marker"></ha-icon> Entitäten</h4>
          <p class="section-hint">X/Y = Position (0–100), Skalierung, Icon optional (z.B. mdi:lightbulb).</p>
          <div class="entity-list">
            ${n.map((t,e)=>Z`
              <div class="entity-row">
                <input type="text" list="rp-entities-${e}" .value=${t.entity} placeholder="light.wohnzimmer"
                  @change=${t=>this._updateEntity(e,{entity:t.target.value.trim()})} />
                <datalist id="rp-entities-${e}">
                  ${o.slice(0,200).map(t=>Z`<option value="${t}">${Nt(this.hass,t)}</option>`)}
                </datalist>
                <input type="text" class="entity-icon" .value=${t.icon??""} placeholder="Icon (mdi:...)"
                  title="Icon (optional)"
                  @change=${t=>{const i=t.target.value.trim();this._updateEntity(e,{icon:i||void 0})}} />
                <select class="entity-preset" title="Preset"
                  .value=${t.preset??"default"}
                  @change=${t=>this._updateEntity(e,{preset:t.target.value})}>
                  <option value="default">Standard</option>
                  <option value="temperature">Temperatur</option>
                </select>
                <div class="entity-coords">
                  <input type="number" min="0" max="100" step="0.1" .value=${String(Number(t.x)||50)} title="X (%)"
                    @change=${t=>this._updateEntity(e,{x:Math.min(100,Math.max(0,Number(t.target.value)||50))})} />
                  <input type="number" min="0" max="100" step="0.1" .value=${String(Number(t.y)||50)} title="Y (%)"
                    @change=${t=>this._updateEntity(e,{y:Math.min(100,Math.max(0,Number(t.target.value)||50))})} />
                </div>
                <input type="number" class="entity-scale" min="0.3" max="2" step="0.1" .value=${String(Math.min(2,Math.max(.3,Number(t.scale)||1)))} title="Skalierung"
                  @change=${t=>this._updateEntity(e,{scale:Math.min(2,Math.max(.3,Number(t.target.value)||1))})} />
                <input type="color" .value=${t.color||"#03a9f4"} title="Farbe"
                  @change=${i=>{const n=i.target.value;this._updateEntity(e,{color:"#03a9f4"!==n||t.color?n:void 0})}} />
                <input type="number" class="entity-opacity" min="0" max="1" step="0.1" .value=${String(Math.min(1,Math.max(0,Number(t.background_opacity)??1)))} title="Deckkraft"
                  @change=${t=>this._updateEntity(e,{background_opacity:Math.min(1,Math.max(0,Number(t.target.value)||1))})} />
                <label class="entity-check">
                  <input type="checkbox" .checked=${!!t.show_value} title="Wert anzeigen"
                    @change=${t=>this._updateEntity(e,{show_value:t.target.checked})} />
                  Wert
                </label>
                <button type="button" class="btn-remove" @click=${()=>this._removeEntity(e)} title="Entfernen">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addEntity}>
            <ha-icon icon="mdi:plus"></ha-icon> Entität hinzufügen
          </button>
        </section>
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:thermometer"></ha-icon> Temperatur-Heatmap</h4>
          <p class="section-hint">Fläche durch 2 Punkte (x1,y1) und (x2,y2) in %. Eine Temperatur-Entität färbt die Zone (blau &lt;18°C, orange, rot ≥24°C).</p>
          <div class="entity-list">
            ${(this._config.temperature_zones??[]).map((t,e)=>Z`
              <div class="entity-row heatmap-row">
                <input type="text" list="rp-heatmap-${e}" .value=${t.entity} placeholder="sensor.temperatur_raum"
                  @change=${t=>this._updateHeatmapZone(e,{entity:t.target.value.trim()})} />
                <datalist id="rp-heatmap-${e}">
                  ${o.slice(0,200).map(t=>Z`<option value="${t}">${Nt(this.hass,t)}</option>`)}
                </datalist>
                <div class="entity-coords" title="Punkt 1 (x,y)">
                  <input type="number" min="0" max="100" step="1" .value=${String(Number(t.x1)??0)} placeholder="x1"
                    @change=${t=>this._updateHeatmapZone(e,{x1:Math.min(100,Math.max(0,Number(t.target.value)||0))})} />
                  <input type="number" min="0" max="100" step="1" .value=${String(Number(t.y1)??0)} placeholder="y1"
                    @change=${t=>this._updateHeatmapZone(e,{y1:Math.min(100,Math.max(0,Number(t.target.value)||0))})} />
                </div>
                <div class="entity-coords" title="Punkt 2 (x,y)">
                  <input type="number" min="0" max="100" step="1" .value=${String(Number(t.x2)??100)} placeholder="x2"
                    @change=${t=>this._updateHeatmapZone(e,{x2:Math.min(100,Math.max(0,Number(t.target.value)||100))})} />
                  <input type="number" min="0" max="100" step="1" .value=${String(Number(t.y2)??100)} placeholder="y2"
                    @change=${t=>this._updateHeatmapZone(e,{y2:Math.min(100,Math.max(0,Number(t.target.value)||100))})} />
                </div>
                <input type="number" class="entity-opacity" min="0" max="1" step="0.1" .value=${String(Math.min(1,Math.max(0,Number(t.opacity)??.4)))} title="Deckkraft"
                  @change=${t=>this._updateHeatmapZone(e,{opacity:Math.min(1,Math.max(0,Number(t.target.value)||.4))})} />
                <button type="button" class="btn-remove" @click=${()=>this._removeHeatmapZone(e)} title="Zone entfernen">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addHeatmapZone}>
            <ha-icon icon="mdi:plus"></ha-icon> Heatmap-Zone hinzufügen
          </button>
        </section>
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:bell-badge-outline"></ha-icon> Meldungen (Badge)</h4>
          <p class="section-hint">Entitäten für das Meldungs-Badge (z. B. Rauchmelder). Badge erscheint rechts in der Tab-Leiste, zeigt die Anzahl aktiver Meldungen (state on/triggered).</p>
          <div class="entity-list">
            ${(this._config.alert_entities??[]).map((t,e)=>Z`
              <div class="entity-row">
                <input type="text" list="rp-alert-${e}" .value=${t} placeholder="binary_sensor.smoke_wohnzimmer"
                  @change=${t=>this._updateAlertEntity(e,t.target.value)} />
                <datalist id="rp-alert-${e}">
                  ${o.slice(0,200).map(t=>Z`<option value="${t}">${Nt(this.hass,t)}</option>`)}
                </datalist>
                <button type="button" class="btn-remove" @click=${()=>this._removeAlertEntity(e)} title="Entfernen">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addAlertEntity}>
            <ha-icon icon="mdi:plus"></ha-icon> Meldungs-Entität hinzufügen
          </button>
        </section>
      </div>
    `}static get styles(){return d`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }
      .editor {
        padding: clamp(12px, 3vw, 20px);
        max-width: 560px;
        width: 100%;
        box-sizing: border-box;
      }
      .editor * {
        box-sizing: border-box;
      }
      .editor-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }
      .editor-header ha-icon {
        color: var(--primary-color, #03a9f4);
        flex-shrink: 0;
      }
      .editor-header h3 {
        margin: 0;
        font-size: clamp(1rem, 2.5vw, 1.1rem);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .editor-section {
        margin-bottom: 28px;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 12px;
        font-size: clamp(0.9rem, 2.2vw, 0.95rem);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .section-title ha-icon {
        color: var(--primary-color, #03a9f4);
        flex-shrink: 0;
      }
      .section-hint {
        margin: 0 0 12px;
        font-size: clamp(0.8rem, 2vw, 0.85rem);
        color: var(--secondary-text-color);
        line-height: 1.4;
      }
      .field {
        margin-bottom: 16px;
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
      }
      @media (max-width: 480px) {
        .field-row {
          grid-template-columns: 1fr;
        }
      }
      .field label {
        display: block;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 6px;
      }
      .field input,
      .field select {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--primary-text-color);
        font-size: clamp(14px, 3.5vw, 16px);
      }
      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
      }
      .hint {
        display: block;
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-top: 6px;
      }
      .hint code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
      }
      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .entity-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: var(--ha-card-background, #1e1e1e);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
      }
      .entity-row input,
      .entity-row select,
      .entity-row button {
        padding: 8px 10px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--primary-text-color, #e1e1e1);
        font-size: 14px;
        font-family: inherit;
      }
      .entity-row input:focus,
      .entity-row select:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
      }
      .entity-row input[list],
      .entity-row input[type='text'] {
        flex: 1 1 140px;
        min-width: 0;
      }
      .entity-row input.entity-icon {
        width: clamp(90px, 22vw, 120px);
      }
      .entity-row select.entity-preset {
        width: auto;
        min-width: 100px;
      }
      .entity-coords {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .entity-coords input {
        width: clamp(44px, 12vw, 52px);
      }
      .entity-row input.entity-scale {
        width: clamp(50px, 14vw, 60px);
      }
      .entity-row input.entity-opacity {
        width: 56px;
      }
      .entity-row .entity-check {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
        cursor: pointer;
        white-space: nowrap;
      }
      .entity-row .entity-check input[type='checkbox'] {
        width: auto;
        padding: 0;
      }
      .entity-row input[type='color'] {
        width: 36px;
        height: 36px;
        min-width: 36px;
        padding: 2px;
        cursor: pointer;
      }
      .btn-remove {
        padding: 8px 10px;
        border: none;
        border-radius: 8px;
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
        cursor: pointer;
        flex-shrink: 0;
      }
      .btn-remove:hover {
        background: rgba(244, 67, 54, 0.3);
      }
      .btn-add {
        padding: 12px 18px;
        width: 100%;
        margin-top: 12px;
        border: 2px dashed var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
        background: transparent;
        color: var(--primary-color, #03a9f4);
        font-size: clamp(13px, 3.2vw, 14px);
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-add:hover {
        border-color: var(--primary-color, #03a9f4);
        background: rgba(3, 169, 244, 0.08);
      }
    `}};Dt([ft({attribute:!1})],Lt.prototype,"hass",void 0),Dt([mt()],Lt.prototype,"_config",void 0),Lt=Dt([ht("room-plan-editor")],Lt);var Bt=function(t,e,i,n){var o,r=arguments.length,a=r<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,n);else for(var s=t.length-1;s>=0;s--)(o=t[s])&&(a=(r<3?o(a):r>3?o(e,i,a):o(e,i))||a);return r>3&&a&&Object.defineProperty(e,i,a),a};const jt="room-plan-card",It="__heatmap__";window.customCards=window.customCards||[],window.customCards.push({type:"custom:"+jt,name:"Interaktiver Raumplan",description:"Raumplan als Bild mit Entitäten per Koordinaten (x,y). Kreise mit Icons.",preview:!1});let Ft=class extends ut{constructor(){super(...arguments),this.config={type:"",image:"",entities:[]},this._imageLoaded=!1,this._imageError=!1,this._imageAspect=16/9,this._activeFilter=null,this._darkMode=!1,this._darkModeMedia=null,this._onDarkModeChange=t=>{this._darkMode=t.matches}}static async getConfigElement(){return document.createElement("room-plan-editor")}static getStubConfig(){return{image:"/local/raumplan.png",rotation:0,entities:[{entity:"light.example",x:25,y:30,scale:1,color:"#ffc107"},{entity:"sensor.example",x:75,y:40,scale:1}]}}setConfig(t){const e=t?.image&&"string"==typeof t.image?t.image:t?.image?.location??"";this.config={type:t?.type??"custom:room-plan-card",image:e,entities:Array.isArray(t?.entities)?t.entities:[],title:t?.title??"",rotation:Number(t?.rotation)??0,full_height:t?.full_height??!1,tap_action:t?.tap_action,hold_action:t?.hold_action,double_tap_action:t?.double_tap_action,entity_filter:Array.isArray(t?.entity_filter)?t.entity_filter:void 0,temperature_zones:Array.isArray(t?.temperature_zones)?t.temperature_zones:void 0,alert_entities:Array.isArray(t?.alert_entities)?t.alert_entities:void 0,alert_badge_action:t?.alert_badge_action,image_dark:t?.image_dark,dark_mode_filter:t?.dark_mode_filter,dark_mode:t?.dark_mode};const i=t?.entity_filter;this._activeFilter=Array.isArray(i)&&1===i.length?i[0]:null,this._imageLoaded=!1,this._imageError=!1,this._imageAspect=16/9}_getEntityDomain(t){const e=t.indexOf(".");return e>0?t.slice(0,e):""}_filteredEntities(){const t=this.config?.entities??[];return this._activeFilter===It?[]:null===this._activeFilter||""===this._activeFilter?t:t.filter(t=>this._getEntityDomain(t.entity)===this._activeFilter)}_availableDomains(){const t=this.config?.entities??[],e=new Set;return t.forEach(t=>{const i=this._getEntityDomain(t.entity);i&&e.add(i)}),Array.from(e).sort()}_filterTabIds(){const t=this._availableDomains(),e=[null];return(this.config?.temperature_zones??[]).length>0&&e.push(It),e.push(...t),e}_showFilterBar(){return this._availableDomains().length>0||(this.config?.temperature_zones??[]).length>0||(this.config?.alert_entities??[]).length>0}_alertCount(){const t=this.config?.alert_entities??[];return this.hass?.states&&0!==t.length?t.filter(t=>{const e=this.hass.states[t]?.state;return"on"===e||"triggered"===e||"active"===e}).length:0}_handleAlertBadgeAction(t){const e=this.config?.alert_badge_action??{action:"more-info"},i=(this.config?.alert_entities??[])[0]??"";this.hass&&t.detail?.action&&(Et(this,this.hass,{entity:i,tap_action:e},t.detail.action),wt("light"))}_selectFilter(t){this._activeFilter=t}getCardSize(){return this.config?.full_height?1:4}getGridOptions(){return this.config?.full_height?{rows:1,columns:1,min_rows:1,min_columns:1}:{rows:4,columns:6,min_rows:3,min_columns:3}}shouldUpdate(t){return!!this.config&&(!!(t.has("_activeFilter")||t.has("_imageLoaded")||t.has("_imageError")||t.has("_imageAspect")||t.has("_darkMode"))||function(t,e,i){if(e.has("config")||i)return!0;if(t.config.entity){var n=e.get("hass");return!n||n.states[t.config.entity]!==t.hass.states[t.config.entity]}return!1}(this,t,!1))}connectedCallback(){super.connectedCallback(),this.closest(".element-preview")?this.style.display="none":(this._darkModeMedia=window.matchMedia("(prefers-color-scheme: dark)"),this._darkMode=this._darkModeMedia.matches,this._darkModeMedia.addEventListener("change",this._onDarkModeChange))}disconnectedCallback(){super.disconnectedCallback?.(),this._darkModeMedia&&(this._darkModeMedia.removeEventListener("change",this._onDarkModeChange),this._darkModeMedia=null)}_getEntityActionConfig(t){const e=this.config?.tap_action??{action:"more-info"};return{entity:t.entity,tap_action:t.tap_action??this.config?.tap_action??e,hold_action:t.hold_action??this.config?.hold_action,double_tap_action:t.double_tap_action??this.config?.double_tap_action}}_handleEntityAction(t,e){const i=this._getEntityActionConfig(e);this.hass&&t.detail?.action&&(Et(this,this.hass,i,t.detail.action),wt("light"))}_hexToRgba(t,e){const i=t.replace(/^#/,"").match(/(.{2})/g);if(!i||3!==i.length)return`rgba(45, 45, 45, ${e})`;const[n,o,r]=i.map(t=>parseInt(t,16));return`rgba(${n},${o},${r},${e})`}_temperatureColor(t){return t<18?"#2196f3":t<24?"#ff9800":"#f44336"}_renderEntity(t){const e=Math.min(100,Math.max(0,Number(t.x)??50)),i=Math.min(100,Math.max(0,Number(t.y)??50)),n=Math.min(2,Math.max(.3,Number(t.scale)??1)),o="on"===this.hass?.states?.[t.entity]?.state,r=t.icon||function(t,e){const i=t?.states?.[e];if(!i)return"mdi:help-circle";if(i.attributes?.icon)return i.attributes.icon;const n=e.split(".")[0],o=i.state;return"light"===n||"switch"===n?"on"===o?"mdi:lightbulb-on":"mdi:lightbulb-outline":"cover"===n?"mdi:blinds":"climate"===n?"mdi:thermostat":"sensor"===n?"mdi:gauge":"binary_sensor"===n?"mdi:motion-sensor":"mdi:circle"}(this.hass,t.entity),a=function(t,e){const i=t?.states?.[e];if(!i)return"—";const n=i.attributes?.unit_of_measurement;return n?`${i.state} ${n}`:i.state}(this.hass,t.entity),s=`${Nt(this.hass,t.entity)}: ${a}`,l=Math.min(1,Math.max(0,Number(t.background_opacity)??1)),c=t.preset??"default";let d,u=!!t.show_value;if("temperature"===c){u=!0;const e=this.hass?.states?.[t.entity]?.state,i="string"==typeof e?parseFloat(e.replace(",",".")):Number(e),n=Number.isFinite(i)?i:20,o=this._temperatureColor(n);d=this._hexToRgba(o,l)}else d=t.color?this._hexToRgba(t.color,l):`rgba(45, 45, 45, ${l})`;const _=this._getEntityActionConfig(t),h=St(_.hold_action),p=St(_.double_tap_action);return Z`
      <div
        class="entity-badge ${o?"entity-on":""} ${u?"entity-show-value":""}"
        style="left:${e}%;top:${i}%;--entity-scale:${n};--entity-bg:${d}"
        title="${s}"
        tabindex="0"
        role="button"
        .actionHandler=${Ut({hasHold:h,hasDoubleClick:p})}
        @action=${e=>this._handleEntityAction(e,t)}
      >
        <div class="entity-badge-inner">
          ${u?Z`<span class="entity-value">${a}</span>`:Z`<ha-icon icon="${r}"></ha-icon>`}
        </div>
      </div>
    `}_renderHeatmapZone(t){const e=Math.min(100,Math.max(0,Number(t.x1)??0)),i=Math.min(100,Math.max(0,Number(t.y1)??0)),n=Math.min(100,Math.max(0,Number(t.x2)??100)),o=Math.min(100,Math.max(0,Number(t.y2)??100)),r=Math.min(e,n),a=Math.min(i,o),s=Math.abs(n-e)||1,l=Math.abs(o-i)||1,c=Math.min(1,Math.max(0,Number(t.opacity)??.4)),d=this.hass?.states?.[t.entity]?.state,u="string"==typeof d?parseFloat(d.replace(",",".")):Number(d),_=Number.isFinite(u)?u:20,h=this._temperatureColor(_),p=this._hexToRgba(h,c);return Z`
      <div
        class="heatmap-zone"
        style="left:${r}%;top:${a}%;width:${s}%;height:${l}%;background:${p}"
        title="${t.entity}: ${d??"?"}"
      ></div>
    `}_onImageLoad(t){const e=t.target;e.naturalWidth&&e.naturalHeight&&(this._imageAspect=e.naturalWidth/e.naturalHeight),this._imageLoaded=!0,this._imageError=!1}_onImageError(){this._imageError=!0,this._imageLoaded=!1}render(){if(this.closest(".element-preview"))return Z``;const{image:t,entities:e,title:i,rotation:n}=this.config;if(!t)return Z`
        <ha-card>
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>${function(t,e="",i=""){const n=(localStorage.getItem("selectedLanguage")||"de").replace(/['"]+/g,"").replace("-","_");let o;try{o=t.split(".").reduce((t,e)=>t[e],zt[n])}catch{o=t.split(".").reduce((t,e)=>t[e],zt.en)}return void 0===o&&(o=t.split(".").reduce((t,e)=>t[e],zt.en)),""!==e&&""!==i&&(o=o.replace(e,i)),o}("common.configure")}</p>
          </div>
        </ha-card>
      `;const o=this._filterTabIds(),r=this._showFilterBar(),a=null!==this._activeFilter&&o.includes(this._activeFilter)?this._activeFilter:null;return Z`
      <ha-card class=${this.config?.full_height?"full-height":""}>
        <div class="card-content">
          ${r?Z`
                <div class="filter-tabs">
                  <div class="filter-tabs-left">
                    ${o.map(t=>Z`
                        <button
                          type="button"
                          class="filter-tab ${a===t?"active":""}"
                          @click=${()=>this._selectFilter(t)}
                        >
                          ${null===t?"Alle":t===It?"Heatmap":t}
                        </button>
                      `)}
                  </div>
                  ${(this.config?.alert_entities??[]).length>0?Z`
                        <button
                          type="button"
                          class="alert-badge ${this._alertCount()>0?"alert-badge-active":""}"
                          title="Meldungen"
                          .actionHandler=${Ut({hasHold:!1,hasDoubleClick:!1})}
                          @action=${t=>this._handleAlertBadgeAction(t)}
                        >
                          <ha-icon icon="mdi:bell-badge-outline"></ha-icon>
                          <span class="alert-badge-count">${this._alertCount()}</span>
                        </button>
                      `:""}
                </div>
              `:""}
          ${(()=>{const e=void 0!==this.config?.dark_mode?!!this.config.dark_mode:this._darkMode,i=e?this.config?.dark_mode_filter??"brightness(0.88) contrast(1.05)":"none",o=e&&this.config?.image_dark?this.config.image_dark:t;return Z`
          <div class="image-wrapper" style="transform: rotate(${n}deg);">
            <div class="image-and-overlay ${e?"dark":""}" style="--image-aspect: ${this._imageAspect}; --plan-dark-filter: ${i};">
              ${(this.config?.temperature_zones??[]).length?Z`
                    <div class="heatmap-layer heatmap-layer-behind">
                      ${(this.config.temperature_zones??[]).map(t=>this._renderHeatmapZone(t))}
                    </div>
                  `:""}
              <img
                src="${o}"
                alt="Raumplan"
                class="plan-image"
                style="filter: var(--plan-dark-filter, none);"
                @load=${this._onImageLoad}
                @error=${this._onImageError}
              />
              ${this._imageLoaded||this._imageError?"":Z`<div class="image-skeleton" aria-hidden="true"></div>`}
              ${this._imageError?Z`<div class="image-error">Bild konnte nicht geladen werden</div>`:""}
              <div class="entities-overlay">
                ${this._filteredEntities().map(t=>this._renderEntity(t))}
              </div>
            </div>
          </div>
            `})()}
        </div>
      </ha-card>
    `}static get styles(){return d`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        height: 100%;
        min-height: 0;
        box-sizing: border-box;
      }
      ha-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        width: 100%;
        height: 100%;
        min-height: 0;
        box-sizing: border-box;
      }
      ha-card.full-height {
        flex: 1;
        min-height: 0;
      }
      .card-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        box-sizing: border-box;
      }
      .filter-tabs {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 16px 12px;
        background: var(--ha-card-background, var(--card-background-color, #1e1e1e));
        border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }
      .filter-tabs-left {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .alert-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: none;
        border-radius: 16px;
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.05));
        color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      .alert-badge:hover {
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.08));
        color: var(--primary-text-color, rgba(255, 255, 255, 0.9));
      }
      .alert-badge.alert-badge-active {
        background: var(--error-color, #db4437);
        color: #fff;
      }
      .alert-badge.alert-badge-active:hover {
        opacity: 0.9;
      }
      .alert-badge ha-icon {
        width: 20px;
        height: 20px;
      }
      .alert-badge-count {
        min-width: 1.2em;
        text-align: center;
        font-weight: 600;
      }
      .filter-tab {
        padding: 6px 14px;
        border: none;
        border-radius: 16px;
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.05));
        color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      .filter-tab:hover {
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.08));
        color: var(--primary-text-color, rgba(255, 255, 255, 0.9));
      }
      .filter-tab.active {
        background: var(--primary-color, #03a9f4);
        color: #fff;
      }
      .image-error {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--secondary-text-color);
        font-size: 0.9rem;
      }
      .image-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-height: 120px;
        min-width: 0;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }
      /* Ein gemeinsamer Block für Bild + Overlay, Größe nur aus Breite + Aspect-Ratio (padding-Trick), damit Overlay 1:1 am Bild bleibt */
      .image-and-overlay {
        position: relative;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        flex-shrink: 0;
        overflow: hidden;
        /* Höhe aus Aspect-Ratio (padding % = Prozent der eigenen width); Bild + Overlay teilen dieselbe absolute Box */
        height: 0;
        padding-bottom: calc(100% / var(--image-aspect, 1.778));
      }
      .image-and-overlay .heatmap-layer,
      .image-and-overlay .plan-image,
      .image-and-overlay .image-skeleton,
      .image-and-overlay .image-error,
      .image-and-overlay .entities-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        box-sizing: border-box;
      }
      .heatmap-layer-behind {
        z-index: 0;
      }
      .image-and-overlay .plan-image {
        z-index: 1;
      }
      .image-and-overlay .image-skeleton,
      .image-and-overlay .image-error {
        z-index: 1;
      }
      .image-and-overlay .entities-overlay {
        z-index: 2;
      }
      .plan-image {
        object-fit: fill;
        object-position: center;
        display: block;
      }
      .image-skeleton {
        background: var(--ha-card-background, #1e1e1e);
      }
      .entities-overlay {
        pointer-events: none;
      }
      .entities-overlay > * {
        pointer-events: auto;
      }
      .heatmap-layer {
        pointer-events: none;
        position: absolute;
        inset: 0;
      }
      .heatmap-zone {
        position: absolute;
        pointer-events: none;
        border-radius: 0;
        z-index: 0;
      }
      .entity-badge {
        --size: clamp(28px, 8vw, 48px);
        --icon-size: calc(clamp(16px, 4.5vw, 26px) * var(--entity-scale, 1));
        position: absolute;
        transform: translate(-50%, -50%);
        width: calc(var(--size) * var(--entity-scale, 1));
        height: calc(var(--size) * var(--entity-scale, 1));
        min-width: 20px;
        min-height: 20px;
        cursor: pointer;
        z-index: 2;
        transition: transform 0.2s ease;
      }
      .entity-badge:hover {
        transform: translate(-50%, -50%) scale(1.08);
      }
      .entity-badge-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--entity-bg, rgba(45, 45, 45, 0.9));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .entity-badge-inner ha-icon {
        --mdc-icon-size: var(--icon-size);
        width: var(--icon-size);
        height: var(--icon-size);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .entity-badge-inner .entity-value {
        font-size: calc(var(--icon-size) * 0.5);
        line-height: 1.1;
        font-weight: 500;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 2px;
      }
      .entity-badge.entity-show-value .entity-badge-inner .entity-value {
        white-space: normal;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        line-clamp: 3;
      }
      .entity-badge.entity-on .entity-badge-inner {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107));
      }
      .entity-badge,
      .entity-badge *,
      .entity-badge-inner,
      .entity-badge ha-icon {
        animation: none !important;
      }
      .empty-state {
        padding: clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px);
        text-align: center;
      }
      .empty-state ha-icon {
        font-size: clamp(48px, 12vw, 64px);
        color: var(--secondary-text-color);
        display: block;
        margin-bottom: 16px;
      }
      .empty-state p {
        margin: 0;
        color: var(--secondary-text-color);
        font-size: clamp(0.9rem, 2.5vw, 1rem);
      }
      @media (max-width: 480px) {
        .entity-badge {
          --size: clamp(24px, 10vw, 40px);
          --icon-size: clamp(14px, 5vw, 22px);
        }
      }
    `}};Bt([ft({attribute:!1})],Ft.prototype,"hass",void 0),Bt([mt()],Ft.prototype,"config",void 0),Bt([mt()],Ft.prototype,"_imageLoaded",void 0),Bt([mt()],Ft.prototype,"_imageError",void 0),Bt([mt()],Ft.prototype,"_imageAspect",void 0),Bt([mt()],Ft.prototype,"_activeFilter",void 0),Bt([mt()],Ft.prototype,"_darkMode",void 0),Ft=Bt([ht(jt)],Ft),console.info("%c RAUMPLAN v1.0.0","color: #03a9f4; font-weight: bold");var Wt,Zt,Vt,qt,Kt,Jt,Gt,Xt,Yt,Qt,te,ee={},ie=[],ne=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,oe=Array.isArray;function re(t,e){for(var i in e)t[i]=e[i];return t}function ae(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function se(t,e,i){var n,o,r,a={};for(r in e)"key"==r?n=e[r]:"ref"==r?o=e[r]:a[r]=e[r];if(arguments.length>2&&(a.children=arguments.length>3?Wt.call(arguments,2):i),"function"==typeof t&&null!=t.defaultProps)for(r in t.defaultProps)void 0===a[r]&&(a[r]=t.defaultProps[r]);return le(t,a,n,o,null)}function le(t,e,i,n,o){var r={type:t,props:e,key:i,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:null==o?++Vt:o,__i:-1,__u:0};return null==o&&null!=Zt.vnode&&Zt.vnode(r),r}function ce(t){return t.children}function de(t,e){this.props=t,this.context=e}function ue(t,e){if(null==e)return t.__?ue(t.__,t.__i+1):null;for(var i;e<t.__k.length;e++)if(null!=(i=t.__k[e])&&null!=i.__e)return i.__e;return"function"==typeof t.type?ue(t):null}function _e(t){var e,i;if(null!=(t=t.__)&&null!=t.__c){for(t.__e=t.__c.base=null,e=0;e<t.__k.length;e++)if(null!=(i=t.__k[e])&&null!=i.__e){t.__e=t.__c.base=i.__e;break}return _e(t)}}function he(t){(!t.__d&&(t.__d=!0)&&qt.push(t)&&!pe.__r++||Kt!=Zt.debounceRendering)&&((Kt=Zt.debounceRendering)||Jt)(pe)}function pe(){for(var t,e,i,n,o,r,a,s=1;qt.length;)qt.length>s&&qt.sort(Gt),t=qt.shift(),s=qt.length,t.__d&&(i=void 0,n=void 0,o=(n=(e=t).__v).__e,r=[],a=[],e.__P&&((i=re({},n)).__v=n.__v+1,Zt.vnode&&Zt.vnode(i),$e(e.__P,i,n,e.__n,e.__P.namespaceURI,32&n.__u?[o]:null,r,null==o?ue(n):o,!!(32&n.__u),a),i.__v=n.__v,i.__.__k[i.__i]=i,ke(r,i,a),n.__e=n.__=null,i.__e!=o&&_e(i)));pe.__r=0}function fe(t,e,i,n,o,r,a,s,l,c,d){var u,_,h,p,f,m,g,v=n&&n.__k||ie,y=e.length;for(l=function(t,e,i,n,o){var r,a,s,l,c,d=i.length,u=d,_=0;for(t.__k=new Array(o),r=0;r<o;r++)null!=(a=e[r])&&"boolean"!=typeof a&&"function"!=typeof a?("string"==typeof a||"number"==typeof a||"bigint"==typeof a||a.constructor==String?a=t.__k[r]=le(null,a,null,null,null):oe(a)?a=t.__k[r]=le(ce,{children:a},null,null,null):void 0===a.constructor&&a.__b>0?a=t.__k[r]=le(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):t.__k[r]=a,l=r+_,a.__=t,a.__b=t.__b+1,s=null,-1!=(c=a.__i=ve(a,i,l,u))&&(u--,(s=i[c])&&(s.__u|=2)),null==s||null==s.__v?(-1==c&&(o>d?_--:o<d&&_++),"function"!=typeof a.type&&(a.__u|=4)):c!=l&&(c==l-1?_--:c==l+1?_++:(c>l?_--:_++,a.__u|=4))):t.__k[r]=null;if(u)for(r=0;r<d;r++)null!=(s=i[r])&&!(2&s.__u)&&(s.__e==n&&(n=ue(s)),Se(s,s));return n}(i,e,v,l,y),u=0;u<y;u++)null!=(h=i.__k[u])&&(_=-1==h.__i?ee:v[h.__i]||ee,h.__i=u,m=$e(t,h,_,o,r,a,s,l,c,d),p=h.__e,h.ref&&_.ref!=h.ref&&(_.ref&&Ee(_.ref,null,h),d.push(h.ref,h.__c||p,h)),null==f&&null!=p&&(f=p),(g=!!(4&h.__u))||_.__k===h.__k?l=me(h,l,t,g):"function"==typeof h.type&&void 0!==m?l=m:p&&(l=p.nextSibling),h.__u&=-7);return i.__e=f,l}function me(t,e,i,n){var o,r;if("function"==typeof t.type){for(o=t.__k,r=0;o&&r<o.length;r++)o[r]&&(o[r].__=t,e=me(o[r],e,i,n));return e}t.__e!=e&&(n&&(e&&t.type&&!e.parentNode&&(e=ue(t)),i.insertBefore(t.__e,e||null)),e=t.__e);do{e=e&&e.nextSibling}while(null!=e&&8==e.nodeType);return e}function ge(t,e){return e=e||[],null==t||"boolean"==typeof t||(oe(t)?t.some(function(t){ge(t,e)}):e.push(t)),e}function ve(t,e,i,n){var o,r,a,s=t.key,l=t.type,c=e[i],d=null!=c&&!(2&c.__u);if(null===c&&null==s||d&&s==c.key&&l==c.type)return i;if(n>(d?1:0))for(o=i-1,r=i+1;o>=0||r<e.length;)if(null!=(c=e[a=o>=0?o--:r++])&&!(2&c.__u)&&s==c.key&&l==c.type)return a;return-1}function ye(t,e,i){"-"==e[0]?t.setProperty(e,null==i?"":i):t[e]=null==i?"":"number"!=typeof i||ne.test(e)?i:i+"px"}function be(t,e,i,n,o){var r,a;t:if("style"==e)if("string"==typeof i)t.style.cssText=i;else{if("string"==typeof n&&(t.style.cssText=n=""),n)for(e in n)i&&e in i||ye(t.style,e,"");if(i)for(e in i)n&&i[e]==n[e]||ye(t.style,e,i[e])}else if("o"==e[0]&&"n"==e[1])r=e!=(e=e.replace(Xt,"$1")),a=e.toLowerCase(),e=a in t||"onFocusOut"==e||"onFocusIn"==e?a.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+r]=i,i?n?i.u=n.u:(i.u=Yt,t.addEventListener(e,r?te:Qt,r)):t.removeEventListener(e,r?te:Qt,r);else{if("http://www.w3.org/2000/svg"==o)e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if("width"!=e&&"height"!=e&&"href"!=e&&"list"!=e&&"form"!=e&&"tabIndex"!=e&&"download"!=e&&"rowSpan"!=e&&"colSpan"!=e&&"role"!=e&&"popover"!=e&&e in t)try{t[e]=null==i?"":i;break t}catch(t){}"function"==typeof i||(null==i||!1===i&&"-"!=e[4]?t.removeAttribute(e):t.setAttribute(e,"popover"==e&&1==i?"":i))}}function xe(t){return function(e){if(this.l){var i=this.l[e.type+t];if(null==e.t)e.t=Yt++;else if(e.t<i.u)return;return i(Zt.event?Zt.event(e):e)}}}function $e(t,e,i,n,o,r,a,s,l,c){var d,u,_,h,p,f,m,g,v,y,b,x,$,w,k,A,E,S=e.type;if(void 0!==e.constructor)return null;128&i.__u&&(l=!!(32&i.__u),r=[s=e.__e=i.__e]),(d=Zt.__b)&&d(e);t:if("function"==typeof S)try{if(g=e.props,v="prototype"in S&&S.prototype.render,y=(d=S.contextType)&&n[d.__c],b=d?y?y.props.value:d.__:n,i.__c?m=(u=e.__c=i.__c).__=u.__E:(v?e.__c=u=new S(g,b):(e.__c=u=new de(g,b),u.constructor=S,u.render=Ce),y&&y.sub(u),u.state||(u.state={}),u.__n=n,_=u.__d=!0,u.__h=[],u._sb=[]),v&&null==u.__s&&(u.__s=u.state),v&&null!=S.getDerivedStateFromProps&&(u.__s==u.state&&(u.__s=re({},u.__s)),re(u.__s,S.getDerivedStateFromProps(g,u.__s))),h=u.props,p=u.state,u.__v=e,_)v&&null==S.getDerivedStateFromProps&&null!=u.componentWillMount&&u.componentWillMount(),v&&null!=u.componentDidMount&&u.__h.push(u.componentDidMount);else{if(v&&null==S.getDerivedStateFromProps&&g!==h&&null!=u.componentWillReceiveProps&&u.componentWillReceiveProps(g,b),e.__v==i.__v||!u.__e&&null!=u.shouldComponentUpdate&&!1===u.shouldComponentUpdate(g,u.__s,b)){for(e.__v!=i.__v&&(u.props=g,u.state=u.__s,u.__d=!1),e.__e=i.__e,e.__k=i.__k,e.__k.some(function(t){t&&(t.__=e)}),x=0;x<u._sb.length;x++)u.__h.push(u._sb[x]);u._sb=[],u.__h.length&&a.push(u);break t}null!=u.componentWillUpdate&&u.componentWillUpdate(g,u.__s,b),v&&null!=u.componentDidUpdate&&u.__h.push(function(){u.componentDidUpdate(h,p,f)})}if(u.context=b,u.props=g,u.__P=t,u.__e=!1,$=Zt.__r,w=0,v){for(u.state=u.__s,u.__d=!1,$&&$(e),d=u.render(u.props,u.state,u.context),k=0;k<u._sb.length;k++)u.__h.push(u._sb[k]);u._sb=[]}else do{u.__d=!1,$&&$(e),d=u.render(u.props,u.state,u.context),u.state=u.__s}while(u.__d&&++w<25);u.state=u.__s,null!=u.getChildContext&&(n=re(re({},n),u.getChildContext())),v&&!_&&null!=u.getSnapshotBeforeUpdate&&(f=u.getSnapshotBeforeUpdate(h,p)),A=d,null!=d&&d.type===ce&&null==d.key&&(A=Ae(d.props.children)),s=fe(t,oe(A)?A:[A],e,i,n,o,r,a,s,l,c),u.base=e.__e,e.__u&=-161,u.__h.length&&a.push(u),m&&(u.__E=u.__=null)}catch(t){if(e.__v=null,l||null!=r)if(t.then){for(e.__u|=l?160:128;s&&8==s.nodeType&&s.nextSibling;)s=s.nextSibling;r[r.indexOf(s)]=null,e.__e=s}else{for(E=r.length;E--;)ae(r[E]);we(e)}else e.__e=i.__e,e.__k=i.__k,t.then||we(e);Zt.__e(t,e,i)}else null==r&&e.__v==i.__v?(e.__k=i.__k,e.__e=i.__e):s=e.__e=function(t,e,i,n,o,r,a,s,l){var c,d,u,_,h,p,f,m=i.props||ee,g=e.props,v=e.type;if("svg"==v?o="http://www.w3.org/2000/svg":"math"==v?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),null!=r)for(c=0;c<r.length;c++)if((h=r[c])&&"setAttribute"in h==!!v&&(v?h.localName==v:3==h.nodeType)){t=h,r[c]=null;break}if(null==t){if(null==v)return document.createTextNode(g);t=document.createElementNS(o,v,g.is&&g),s&&(Zt.__m&&Zt.__m(e,r),s=!1),r=null}if(null==v)m===g||s&&t.data==g||(t.data=g);else{if(r=r&&Wt.call(t.childNodes),!s&&null!=r)for(m={},c=0;c<t.attributes.length;c++)m[(h=t.attributes[c]).name]=h.value;for(c in m)if(h=m[c],"children"==c);else if("dangerouslySetInnerHTML"==c)u=h;else if(!(c in g)){if("value"==c&&"defaultValue"in g||"checked"==c&&"defaultChecked"in g)continue;be(t,c,null,h,o)}for(c in g)h=g[c],"children"==c?_=h:"dangerouslySetInnerHTML"==c?d=h:"value"==c?p=h:"checked"==c?f=h:s&&"function"!=typeof h||m[c]===h||be(t,c,h,m[c],o);if(d)s||u&&(d.__html==u.__html||d.__html==t.innerHTML)||(t.innerHTML=d.__html),e.__k=[];else if(u&&(t.innerHTML=""),fe("template"==e.type?t.content:t,oe(_)?_:[_],e,i,n,"foreignObject"==v?"http://www.w3.org/1999/xhtml":o,r,a,r?r[0]:i.__k&&ue(i,0),s,l),null!=r)for(c=r.length;c--;)ae(r[c]);s||(c="value","progress"==v&&null==p?t.removeAttribute("value"):null!=p&&(p!==t[c]||"progress"==v&&!p||"option"==v&&p!=m[c])&&be(t,c,p,m[c],o),c="checked",null!=f&&f!=t[c]&&be(t,c,f,m[c],o))}return t}(i.__e,e,i,n,o,r,a,l,c);return(d=Zt.diffed)&&d(e),128&e.__u?void 0:s}function we(t){t&&t.__c&&(t.__c.__e=!0),t&&t.__k&&t.__k.forEach(we)}function ke(t,e,i){for(var n=0;n<i.length;n++)Ee(i[n],i[++n],i[++n]);Zt.__c&&Zt.__c(e,t),t.some(function(e){try{t=e.__h,e.__h=[],t.some(function(t){t.call(e)})}catch(t){Zt.__e(t,e.__v)}})}function Ae(t){return"object"!=typeof t||null==t||t.__b&&t.__b>0?t:oe(t)?t.map(Ae):re({},t)}function Ee(t,e,i){try{if("function"==typeof t){var n="function"==typeof t.__u;n&&t.__u(),n&&null==e||(t.__u=t(e))}else t.current=e}catch(t){Zt.__e(t,i)}}function Se(t,e,i){var n,o;if(Zt.unmount&&Zt.unmount(t),(n=t.ref)&&(n.current&&n.current!=t.__e||Ee(n,null,e)),null!=(n=t.__c)){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(t){Zt.__e(t,e)}n.base=n.__P=null}if(n=t.__k)for(o=0;o<n.length;o++)n[o]&&Se(n[o],e,i||"function"!=typeof t.type);i||ae(t.__e),t.__c=t.__=t.__e=void 0}function Ce(t,e,i){return this.constructor(t,i)}function Me(t,e,i){var n,o,r,a;e==document&&(e=document.documentElement),Zt.__&&Zt.__(t,e),o=(n="function"==typeof i)?null:i&&i.__k||e.__k,r=[],a=[],$e(e,t=(!n&&i||e).__k=se(ce,null,[t]),o||ee,ee,e.namespaceURI,!n&&i?[i]:o?null:e.firstChild?Wt.call(e.childNodes):null,r,!n&&i?i:o?o.__e:e.firstChild,n,a),ke(r,t,a)}Wt=ie.slice,Zt={__e:function(t,e,i,n){for(var o,r,a;e=e.__;)if((o=e.__c)&&!o.__)try{if((r=o.constructor)&&null!=r.getDerivedStateFromError&&(o.setState(r.getDerivedStateFromError(t)),a=o.__d),null!=o.componentDidCatch&&(o.componentDidCatch(t,n||{}),a=o.__d),a)return o.__E=o}catch(e){t=e}throw t}},Vt=0,de.prototype.setState=function(t,e){var i;i=null!=this.__s&&this.__s!=this.state?this.__s:this.__s=re({},this.state),"function"==typeof t&&(t=t(re({},i),this.props)),t&&re(i,t),null!=t&&this.__v&&(e&&this._sb.push(e),he(this))},de.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),he(this))},de.prototype.render=ce,qt=[],Jt="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Gt=function(t,e){return t.__v.__b-e.__v.__b},pe.__r=0,Xt=/(PointerCapture)$|Capture$/i,Yt=0,Qt=xe(!1),te=xe(!0);var Pe=0;Array.isArray;function ze(t,e,i,n,o,r){e||(e={});var a,s,l=e;if("ref"in l)for(s in l={},e)"ref"==s?a=e[s]:l[s]=e[s];var c={type:t,props:l,key:i,ref:a,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Pe,__i:-1,__u:0,__source:o,__self:r};if("function"==typeof t&&(a=t.defaultProps))for(s in a)void 0===l[s]&&(l[s]=a[s]);return Zt.vnode&&Zt.vnode(c),c}var Ne,He,Re,Te=[],Oe=Zt,Ue=Oe.__b,De=Oe.__r,Le=Oe.diffed,Be=Oe.__c,je=Oe.unmount,Ie=Oe.__;function Fe(){for(var t;t=Te.shift();)if(t.__P&&t.__H)try{t.__H.__h.forEach(Ve),t.__H.__h.forEach(qe),t.__H.__h=[]}catch(e){t.__H.__h=[],Oe.__e(e,t.__v)}}Oe.__b=function(t){Ne=null,Ue&&Ue(t)},Oe.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Ie&&Ie(t,e)},Oe.__r=function(t){De&&De(t);var e=(Ne=t.__c).__H;e&&(He===Ne?(e.__h=[],Ne.__h=[],e.__.forEach(function(t){t.__N&&(t.__=t.__N),t.u=t.__N=void 0})):(e.__h.forEach(Ve),e.__h.forEach(qe),e.__h=[],0)),He=Ne},Oe.diffed=function(t){Le&&Le(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(1!==Te.push(e)&&Re===Oe.requestAnimationFrame||((Re=Oe.requestAnimationFrame)||Ze)(Fe)),e.__H.__.forEach(function(t){t.u&&(t.__H=t.u),t.u=void 0})),He=Ne=null},Oe.__c=function(t,e){e.some(function(t){try{t.__h.forEach(Ve),t.__h=t.__h.filter(function(t){return!t.__||qe(t)})}catch(i){e.some(function(t){t.__h&&(t.__h=[])}),e=[],Oe.__e(i,t.__v)}}),Be&&Be(t,e)},Oe.unmount=function(t){je&&je(t);var e,i=t.__c;i&&i.__H&&(i.__H.__.forEach(function(t){try{Ve(t)}catch(t){e=t}}),i.__H=void 0,e&&Oe.__e(e,i.__v))};var We="function"==typeof requestAnimationFrame;function Ze(t){var e,i=function(){clearTimeout(n),We&&cancelAnimationFrame(e),setTimeout(t)},n=setTimeout(i,35);We&&(e=requestAnimationFrame(i))}function Ve(t){var e=Ne,i=t.__c;"function"==typeof i&&(t.__c=void 0,i()),Ne=e}function qe(t){var e=Ne;t.__c=t.__(),Ne=e}function Ke(t,e){for(var i in e)t[i]=e[i];return t}function Je(t,e){for(var i in t)if("__source"!==i&&!(i in e))return!0;for(var n in e)if("__source"!==n&&t[n]!==e[n])return!0;return!1}function Ge(t,e){this.props=t,this.context=e}(Ge.prototype=new de).isPureReactComponent=!0,Ge.prototype.shouldComponentUpdate=function(t,e){return Je(this.props,t)||Je(this.state,e)};var Xe=Zt.__b;Zt.__b=function(t){t.type&&t.type.__f&&t.ref&&(t.props.ref=t.ref,t.ref=null),Xe&&Xe(t)};"undefined"!=typeof Symbol&&Symbol.for&&Symbol.for("react.forward_ref");var Ye=Zt.__e;Zt.__e=function(t,e,i,n){if(t.then)for(var o,r=e;r=r.__;)if((o=r.__c)&&o.__c)return null==e.__e&&(e.__e=i.__e,e.__k=i.__k),o.__c(t,e);Ye(t,e,i,n)};var Qe=Zt.unmount;function ti(t,e,i){return t&&(t.__c&&t.__c.__H&&(t.__c.__H.__.forEach(function(t){"function"==typeof t.__c&&t.__c()}),t.__c.__H=null),null!=(t=Ke({},t)).__c&&(t.__c.__P===i&&(t.__c.__P=e),t.__c.__e=!0,t.__c=null),t.__k=t.__k&&t.__k.map(function(t){return ti(t,e,i)})),t}function ei(t,e,i){return t&&i&&(t.__v=null,t.__k=t.__k&&t.__k.map(function(t){return ei(t,e,i)}),t.__c&&t.__c.__P===e&&(t.__e&&i.appendChild(t.__e),t.__c.__e=!0,t.__c.__P=i)),t}function ii(){this.__u=0,this.o=null,this.__b=null}function ni(t){if(!t.__)return null;var e=t.__.__c;return e&&e.__a&&e.__a(t)}function oi(){this.i=null,this.l=null}Zt.unmount=function(t){var e=t.__c;e&&(e.__z=!0),e&&e.__R&&e.__R(),e&&32&t.__u&&(t.type=null),Qe&&Qe(t)},(ii.prototype=new de).__c=function(t,e){var i=e.__c,n=this;null==n.o&&(n.o=[]),n.o.push(i);var o=ni(n.__v),r=!1,a=function(){r||n.__z||(r=!0,i.__R=null,o?o(l):l())};i.__R=a;var s=i.__P;i.__P=null;var l=function(){if(! --n.__u){if(n.state.__a){var t=n.state.__a;n.__v.__k[0]=ei(t,t.__c.__P,t.__c.__O)}var e;for(n.setState({__a:n.__b=null});e=n.o.pop();)e.__P=s,e.forceUpdate()}};n.__u++||32&e.__u||n.setState({__a:n.__b=n.__v.__k[0]}),t.then(a,a)},ii.prototype.componentWillUnmount=function(){this.o=[]},ii.prototype.render=function(t,e){if(this.__b){if(this.__v.__k){var i=document.createElement("div"),n=this.__v.__k[0].__c;this.__v.__k[0]=ti(this.__b,i,n.__O=n.__P)}this.__b=null}var o=e.__a&&se(ce,null,t.fallback);return o&&(o.__u&=-33),[se(ce,null,e.__a?null:t.children),o]};var ri=function(t,e,i){if(++i[1]===i[0]&&t.l.delete(e),t.props.revealOrder&&("t"!==t.props.revealOrder[0]||!t.l.size))for(i=t.i;i;){for(;i.length>3;)i.pop()();if(i[1]<i[0])break;t.i=i=i[2]}};(oi.prototype=new de).__a=function(t){var e=this,i=ni(e.__v),n=e.l.get(t);return n[0]++,function(o){var r=function(){e.props.revealOrder?(n.push(o),ri(e,t,n)):o()};i?i(r):r()}},oi.prototype.render=function(t){this.i=null,this.l=new Map;var e=ge(t.children);t.revealOrder&&"b"===t.revealOrder[0]&&e.reverse();for(var i=e.length;i--;)this.l.set(e[i],this.i=[1,0,this.i]);return t.children},oi.prototype.componentDidUpdate=oi.prototype.componentDidMount=function(){var t=this;this.l.forEach(function(e,i){ri(t,i,e)})};var ai="undefined"!=typeof Symbol&&Symbol.for&&Symbol.for("react.element")||60103,si=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,li=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,ci=/[A-Z0-9]/g,di="undefined"!=typeof document,ui=function(t){return("undefined"!=typeof Symbol&&"symbol"==typeof Symbol()?/fil|che|rad/:/fil|che|ra/).test(t)};function _i(t,e,i){return null==e.__k&&(e.textContent=""),Me(t,e),"function"==typeof i&&i(),t?t.__c:null}de.prototype.isReactComponent={},["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(t){Object.defineProperty(de.prototype,t,{configurable:!0,get:function(){return this["UNSAFE_"+t]},set:function(e){Object.defineProperty(this,t,{configurable:!0,writable:!0,value:e})}})});var hi=Zt.event;function pi(){}function fi(){return this.cancelBubble}function mi(){return this.defaultPrevented}Zt.event=function(t){return hi&&(t=hi(t)),t.persist=pi,t.isPropagationStopped=fi,t.isDefaultPrevented=mi,t.nativeEvent=t};var gi={enumerable:!1,configurable:!0,get:function(){return this.class}},vi=Zt.vnode;Zt.vnode=function(t){"string"==typeof t.type&&function(t){var e=t.props,i=t.type,n={},o=-1===i.indexOf("-");for(var r in e){var a=e[r];if(!("value"===r&&"defaultValue"in e&&null==a||di&&"children"===r&&"noscript"===i||"class"===r||"className"===r)){var s=r.toLowerCase();"defaultValue"===r&&"value"in e&&null==e.value?r="value":"download"===r&&!0===a?a="":"translate"===s&&"no"===a?a=!1:"o"===s[0]&&"n"===s[1]?"ondoubleclick"===s?r="ondblclick":"onchange"!==s||"input"!==i&&"textarea"!==i||ui(e.type)?"onfocus"===s?r="onfocusin":"onblur"===s?r="onfocusout":li.test(r)&&(r=s):s=r="oninput":o&&si.test(r)?r=r.replace(ci,"-$&").toLowerCase():null===a&&(a=void 0),"oninput"===s&&n[r=s]&&(r="oninputCapture"),n[r]=a}}"select"==i&&n.multiple&&Array.isArray(n.value)&&(n.value=ge(e.children).forEach(function(t){t.props.selected=-1!=n.value.indexOf(t.props.value)})),"select"==i&&null!=n.defaultValue&&(n.value=ge(e.children).forEach(function(t){t.props.selected=n.multiple?-1!=n.defaultValue.indexOf(t.props.value):n.defaultValue==t.props.value})),e.class&&!e.className?(n.class=e.class,Object.defineProperty(n,"className",gi)):(e.className&&!e.class||e.class&&e.className)&&(n.class=n.className=e.className),t.props=n}(t),t.$$typeof=ai,vi&&vi(t)};var yi=Zt.__r;Zt.__r=function(t){yi&&yi(t),t.__c};var bi=Zt.diffed;Zt.diffed=function(t){bi&&bi(t);var e=t.props,i=t.__e;null!=i&&"textarea"===t.type&&"value"in e&&e.value!==i.value&&(i.value=null==e.value?"":e.value)};function xi({hass:t,config:e}){const i=e.entity??"",n=i?t?.states?.[i]:null,o=n?.state??"–",r=n?.attributes?.friendly_name??(i||"Keine Entität");return ze("div",{style:$i.card,children:[ze("h2",{style:$i.title,children:e.title??"React Demo"}),ze("p",{style:$i.entity,children:[ze("strong",{children:r}),": ",o]}),ze("p",{style:$i.hint,children:"Preact in Web Component (Shadow DOM)"})]})}const $i={card:{padding:16,fontFamily:"var(--mdc-typography-font-family, Roboto, sans-serif)"},title:{margin:"0 0 12px",fontSize:"1.1rem",color:"var(--primary-text-color, #e1e1e1)"},entity:{margin:"0 0 8px",fontSize:"0.9rem",color:"var(--secondary-text-color, #b0b0b0)"},hint:{margin:0,fontSize:"0.75rem",opacity:.8}},wi="react-demo-card";window.customCards=window.customCards??[],window.customCards.push({type:"custom:"+wi,name:"React Demo Card",description:"Beispiel-Card mit React/Preact in einer Web Component"});class ki extends HTMLElement{constructor(){super(...arguments),this._config={type:""},this._hass=null,this._lastRenderedEntityState=null,this._lastRenderedEntityId=""}static getConfigElement(){return document.createElement("div")}static getStubConfig(){return{type:"custom:"+wi,title:"React Demo",entity:"sensor.date"}}setConfig(t){this._config=t??{type:""},this._lastRenderedEntityId="",this._lastRenderedEntityState=null,this._hass&&this._maybeRender()}set hass(t){this._hass=t,this._maybeRender()}_maybeRender(){const t=this._hass,e=this._config.entity??"",i=e&&t?.states?.[e]?t.states[e].state??null:null;(!this.shadowRoot||this._lastRenderedEntityId!==e||this._lastRenderedEntityState!==i)&&(this._lastRenderedEntityId=e,this._lastRenderedEntityState=i,this._render())}_render(){if(!this._hass)return;this.shadowRoot||this.attachShadow({mode:"open"});const t=this.shadowRoot;_i(ze(xi,{hass:this._hass,config:this._config}),t)}getCardSize(){return 2}}customElements.define(wi,ki);export{Ft as RoomPlanCard};