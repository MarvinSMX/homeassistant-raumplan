var t,e,i={},n={};function o(t){var e=n[t];if(void 0!==e)return e.exports;var r=n[t]={exports:{}};return i[t](r,r.exports,o),r.exports}e=Object.getPrototypeOf?t=>Object.getPrototypeOf(t):t=>t.__proto__,o.t=function(i,n){if(1&n&&(i=this(i)),8&n)return i;if("object"==typeof i&&i){if(4&n&&i.__esModule)return i;if(16&n&&"function"==typeof i.then)return i}var r=Object.create(null);o.r(r);var s={};t=t||[null,e({}),e([]),e(e)];for(var a=2&n&&i;("object"==typeof a||"function"==typeof a)&&!~t.indexOf(a);a=e(a))Object.getOwnPropertyNames(a).forEach(t=>s[t]=()=>i[t]);return s.default=()=>i,o.d(r,s),r},o.d=(t,e)=>{for(var i in e)o.o(e,i)&&!o.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},o.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),o.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const r=window,s=r.ShadowRoot&&(void 0===r.ShadyCSS||r.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),l=new WeakMap;class c{constructor(t,e,i){if(this._$cssResult$=!0,i!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=l.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&l.set(e,t))}return t}toString(){return this.cssText}}const d=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new c(i,t,a)},h=(t,e)=>{s?t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):e.forEach(e=>{const i=document.createElement("style"),n=r.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=e.cssText,t.appendChild(i)})},p=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new c("string"==typeof t?t:t+"",void 0,a))(e)})(t):t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var u;const m=window,g=m.trustedTypes,v=g?g.emptyScript:"",f=m.reactiveElementPolyfillSupport,y={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},_=(t,e)=>e!==t&&(e==e||t==t),b={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:_},$="finalized";class x extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const n=this._$Ep(i,e);void 0!==n&&(this._$Ev.set(n,i),t.push(n))}),t}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,n=this.getPropertyDescriptor(t,i,e);void 0!==n&&Object.defineProperty(this.prototype,t,n)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(n){const o=this[t];this[e]=n,this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||b}static finalize(){if(this.hasOwnProperty($))return!1;this[$]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(p(t))}else void 0!==t&&e.push(p(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;const e=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return h(e,this.constructor.elementStyles),e}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=b){var n;const o=this.constructor._$Ep(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==(null===(n=i.converter)||void 0===n?void 0:n.toAttribute)?i.converter:y).toAttribute(e,i.type);this._$El=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$El=null}}_$AK(t,e){var i;const n=this.constructor,o=n._$Ev.get(t);if(void 0!==o&&this._$El!==o){const t=n.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:y;this._$El=o,this[o]=r.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let n=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||_)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):n=!1),!this.isUpdatePending&&n&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var w;x[$]=!0,x.elementProperties=new Map,x.elementStyles=[],x.shadowRootOptions={mode:"open"},null==f||f({ReactiveElement:x}),(null!==(u=m.reactiveElementVersions)&&void 0!==u?u:m.reactiveElementVersions=[]).push("1.6.3");const A=window,E=A.trustedTypes,k=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${(Math.random()+"").slice(9)}$`,P="?"+C,O=`<${P}>`,z=document,M=()=>z.createComment(""),N=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,U=t=>T(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),H="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,L=/>/g,D=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,B=/"/g,F=/^(?:script|style|textarea|title)$/i,V=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),W=V(1),K=(V(2),Symbol.for("lit-noChange")),q=Symbol.for("lit-nothing"),J=new WeakMap,X=z.createTreeWalker(z,129,null,!1);function Y(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,n=[];let o,r=2===e?"<svg>":"",s=R;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,d=0;for(;d<i.length&&(s.lastIndex=d,l=s.exec(i),null!==l);)d=s.lastIndex,s===R?"!--"===l[1]?s=j:void 0!==l[1]?s=L:void 0!==l[2]?(F.test(l[2])&&(o=RegExp("</"+l[2],"g")),s=D):void 0!==l[3]&&(s=D):s===D?">"===l[0]?(s=null!=o?o:R,c=-1):void 0===l[1]?c=-2:(c=s.lastIndex-l[2].length,a=l[1],s=void 0===l[3]?D:'"'===l[3]?B:I):s===B||s===I?s=D:s===j||s===L?s=R:(s=D,o=void 0);const h=s===D&&t[e+1].startsWith("/>")?" ":"";r+=s===R?i+O:c>=0?(n.push(a),i.slice(0,c)+S+i.slice(c)+C+h):i+C+(-2===c?(n.push(void 0),e):h)}return[Y(t,r+(t[i]||"<?>")+(2===e?"</svg>":"")),n]};class G{constructor({strings:t,_$litType$:e},i){let n;this.parts=[];let o=0,r=0;const s=t.length-1,a=this.parts,[l,c]=Z(t,e);if(this.el=G.createElement(l,i),X.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(n=X.nextNode())&&a.length<s;){if(1===n.nodeType){if(n.hasAttributes()){const t=[];for(const e of n.getAttributeNames())if(e.endsWith(S)||e.startsWith(C)){const i=c[r++];if(t.push(e),void 0!==i){const t=n.getAttribute(i.toLowerCase()+S).split(C),e=/([.?@])?(.*)/.exec(i);a.push({type:1,index:o,name:e[2],strings:t,ctor:"."===e[1]?nt:"?"===e[1]?rt:"@"===e[1]?st:it})}else a.push({type:6,index:o})}for(const e of t)n.removeAttribute(e)}if(F.test(n.tagName)){const t=n.textContent.split(C),e=t.length-1;if(e>0){n.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)n.append(t[i],M()),X.nextNode(),a.push({type:2,index:++o});n.append(t[e],M())}}}else if(8===n.nodeType)if(n.data===P)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=n.data.indexOf(C,t+1));)a.push({type:7,index:o}),t+=C.length-1}o++}}static createElement(t,e){const i=z.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,n){var o,r,s,a;if(e===K)return e;let l=void 0!==n?null===(o=i._$Co)||void 0===o?void 0:o[n]:i._$Cl;const c=N(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(r=null==l?void 0:l._$AO)||void 0===r||r.call(l,!1),void 0===c?l=void 0:(l=new c(t),l._$AT(t,i,n)),void 0!==n?(null!==(s=(a=i)._$Co)&&void 0!==s?s:a._$Co=[])[n]=l:i._$Cl=l),void 0!==l&&(e=Q(t,l._$AS(t,e.values),l,n)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:i},parts:n}=this._$AD,o=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:z).importNode(i,!0);X.currentNode=o;let r=X.nextNode(),s=0,a=0,l=n[0];for(;void 0!==l;){if(s===l.index){let e;2===l.type?e=new et(r,r.nextSibling,this,t):1===l.type?e=new l.ctor(r,l.name,l.strings,this,t):6===l.type&&(e=new at(r,this,t)),this._$AV.push(e),l=n[++a]}s!==(null==l?void 0:l.index)&&(r=X.nextNode(),s++)}return X.currentNode=z,o}v(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{constructor(t,e,i,n){var o;this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=n,this._$Cp=null===(o=null==n?void 0:n.isConnected)||void 0===o||o}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),N(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==K&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):U(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==q&&N(this._$AH)?this._$AA.nextSibling.data=t:this.$(z.createTextNode(t)),this._$AH=t}g(t){var e;const{values:i,_$litType$:n}=t,o="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=G.createElement(Y(n.h,n.h[0]),this.options)),n);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===o)this._$AH.v(i);else{const t=new tt(o,this),e=t.u(this.options);t.v(i),this.$(e),this._$AH=t}}_$AC(t){let e=J.get(t.strings);return void 0===e&&J.set(t.strings,e=new G(t)),e}T(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,n=0;for(const o of t)n===e.length?e.push(i=new et(this.k(M()),this.k(M()),this,this.options)):i=e[n],i._$AI(o),n++;n<e.length&&(this._$AR(i&&i._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class it{constructor(t,e,i,n,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,n){const o=this.strings;let r=!1;if(void 0===o)t=Q(this,t,e,0),r=!N(t)||t!==this._$AH&&t!==K,r&&(this._$AH=t);else{const n=t;let s,a;for(t=o[0],s=0;s<o.length-1;s++)a=Q(this,n[i+s],e,s),a===K&&(a=this._$AH[s]),r||(r=!N(a)||a!==this._$AH[s]),a===q?t=q:t!==q&&(t+=(null!=a?a:"")+o[s+1]),this._$AH[s]=a}r&&!n&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class nt extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}const ot=E?E.emptyScript:"";class rt extends it{constructor(){super(...arguments),this.type=4}j(t){t&&t!==q?this.element.setAttribute(this.name,ot):this.element.removeAttribute(this.name)}}class st extends it{constructor(t,e,i,n,o){super(t,e,i,n,o),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=Q(this,t,e,0))&&void 0!==i?i:q)===K)return;const n=this._$AH,o=t===q&&n!==q||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,r=t!==q&&(n===q||o);o&&this.element.removeEventListener(this.name,this,n),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const lt=A.litHtmlPolyfillSupport;null==lt||lt(G,et),(null!==(w=A.litHtmlVersions)&&void 0!==w?w:A.litHtmlVersions=[]).push("2.8.0");var ct,dt;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ht extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var n,o;const r=null!==(n=null==i?void 0:i.renderBefore)&&void 0!==n?n:e;let s=r._$litPart$;if(void 0===s){const t=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;r._$litPart$=s=new et(e.insertBefore(M(),t),t,void 0,null!=i?i:{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return K}}ht.finalized=!0,ht._$litElement$=!0,null===(ct=globalThis.litElementHydrateSupport)||void 0===ct||ct.call(globalThis,{LitElement:ht});const pt=globalThis.litElementPolyfillSupport;null==pt||pt({LitElement:ht});(null!==(dt=globalThis.litElementVersions)&&void 0!==dt?dt:globalThis.litElementVersions=[]).push("3.3.3");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ut=t=>e=>"function"==typeof e?((t,e)=>(customElements.define(t,e),e))(t,e):((t,e)=>{const{kind:i,elements:n}=e;return{kind:i,elements:n,finisher(e){customElements.define(t,e)}}})(t,e),mt=(t,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(i){i.createProperty(e.key,t)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this))},finisher(i){i.createProperty(e.key,t)}};function gt(t){return(e,i)=>void 0!==i?((t,e,i)=>{e.constructor.createProperty(i,t)})(t,e,i):mt(t,e)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function vt(t){return gt({...t,state:!0})}var ft;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */null===(ft=window.HTMLSlotElement)||void 0===ft||ft.prototype.assignedElements;var yt,_t;!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(yt||(yt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(_t||(_t={}));function bt(t){return t.substr(0,t.indexOf("."))}var $t=["closed","locked","off"],xt=(new Set(["fan","input_boolean","light","switch","group","automation"]),function(t,e,i,n){n=n||{},i=null==i?{}:i;var o=new Event(e,{bubbles:void 0===n.bubbles||n.bubbles,cancelable:Boolean(n.cancelable),composed:void 0===n.composed||n.composed});return o.detail=i,t.dispatchEvent(o),o});new Set(["call-service","divider","section","weblink","cast","select"]);var wt=function(t){xt(window,"haptic",t)},At=function(t,e,i){void 0===i&&(i=!1),i?history.replaceState(null,"",e):history.pushState(null,"",e),xt(window,"location-changed",{replace:i})},Et=function(t,e){return function(t,e,i){void 0===i&&(i=!0);var n,o=bt(e),r="group"===o?"homeassistant":o;switch(o){case"lock":n=i?"unlock":"lock";break;case"cover":n=i?"open_cover":"close_cover";break;default:n=i?"turn_on":"turn_off"}return t.callService(r,n,{entity_id:e})}(t,e,$t.includes(t.states[e].state))},kt=function(t,e,i,n){var o;"double_tap"===n&&i.double_tap_action?o=i.double_tap_action:"hold"===n&&i.hold_action?o=i.hold_action:"tap"===n&&i.tap_action&&(o=i.tap_action),function(t,e,i,n){if(n||(n={action:"more-info"}),!n.confirmation||n.confirmation.exemptions&&n.confirmation.exemptions.some(function(t){return t.user===e.user.id})||(wt("warning"),confirm(n.confirmation.text||"Are you sure you want to "+n.action+"?")))switch(n.action){case"more-info":(i.entity||i.camera_image)&&xt(t,"hass-more-info",{entityId:i.entity?i.entity:i.camera_image});break;case"navigate":n.navigation_path&&At(0,n.navigation_path);break;case"url":n.url_path&&window.open(n.url_path);break;case"toggle":i.entity&&(Et(e,i.entity),wt("success"));break;case"call-service":if(!n.service)return void wt("failure");var o=n.service.split(".",2);e.callService(o[0],o[1],n.service_data,n.target),wt("success");break;case"fire-dom-event":xt(t,"ll-custom",n)}}(t,e,i,o)};function St(t){return void 0!==t&&"none"!==t.action}const Ct=JSON.parse('{"common":{"version":"Version","invalid_configuration":"Ungültige Konfiguration","show_warning":"Warnung anzeigen","configure":"Bitte konfigurieren: Bild-URL und Entitäten mit Koordinaten."}}');var Pt=o.t(Ct,2);const Ot=JSON.parse('{"common":{"version":"Version","invalid_configuration":"Invalid configuration","show_warning":"Show warning","configure":"Please configure: image URL and entities with coordinates."}}');const zt={de:Pt,en:o.t(Ot,2)};function Mt(t,e){return t?.states?.[e]?.attributes?.friendly_name||e}class Nt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}const Tt="ontouchstart"in window||navigator.maxTouchPoints>0;class Ut extends HTMLElement{constructor(){super(...arguments),this.holdTime=500,this.held=!1}connectedCallback(){Object.assign(this.style,{position:"absolute",width:Tt?"100px":"50px",height:Tt?"100px":"50px",transform:"translate(-50%, -50%)",pointerEvents:"none",zIndex:"999"})}bind(t,e){if(t._roomPlanActionHandler)return;t._roomPlanActionHandler=!0,t.addEventListener("contextmenu",t=>(t.preventDefault(),t.stopPropagation(),!1));const i=()=>{this.held=!1,this.timer=window.setTimeout(()=>{this.held=!0},this.holdTime)},n=i=>{if(!["touchend","touchcancel"].includes(i.type)||void 0!==this.timer)if(i.preventDefault(),clearTimeout(this.timer),this.timer=void 0,this.held)xt(t,"action",{action:"hold"});else if(e.hasDoubleClick){const e=i;"click"===i.type&&e.detail<2||!this.dblClickTimeout?this.dblClickTimeout=window.setTimeout(()=>{this.dblClickTimeout=void 0,xt(t,"action",{action:"tap"})},250):(clearTimeout(this.dblClickTimeout),this.dblClickTimeout=void 0,xt(t,"action",{action:"double_tap"}))}else xt(t,"action",{action:"tap"})},o=()=>{clearTimeout(this.timer),this.timer=void 0};["touchcancel","mouseout","mouseup","touchmove","mouseleave"].forEach(e=>{t.addEventListener(e,o,{passive:!0})}),t.addEventListener("touchstart",i,{passive:!0}),t.addEventListener("touchend",n),t.addEventListener("touchcancel",n),t.addEventListener("mousedown",i,{passive:!0}),t.addEventListener("click",n),t.addEventListener("keyup",t=>{"Enter"!==t.key&&13!==t.keyCode||n(t)})}}customElements.define("action-handler-room-plan",Ut);const Ht=(t,e)=>{(()=>{let t=document.body.querySelector("action-handler-room-plan");return t||(t=document.createElement("action-handler-room-plan"),document.body.appendChild(t)),t})().bind(t,e??{})},Rt=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends Nt{update(t,[e]){return Ht(t.element,e),K}render(t){return K}});var jt=function(t,e,i,n){var o,r=arguments.length,s=r<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(t,e,i,n);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(s=(r<3?o(s):r>3?o(e,i,s):o(e,i))||s);return r>3&&s&&Object.defineProperty(e,i,s),s};let Lt=class extends ht{constructor(){super(...arguments),this._config={type:"",image:"",entities:[]}}setConfig(t){const e=t??{type:"",image:"",entities:[]},i="string"==typeof e.image?e.image:e.image?.location??"";this._config={...e,image:i,entities:Array.isArray(e.entities)?[...e.entities]:[],entity_filter:Array.isArray(e.entity_filter)?e.entity_filter:void 0}}_emitConfig(){xt(this,"config-changed",{config:this._config})}_updateConfig(t){this._config={...this._config,...t},this._emitConfig()}_updateEntity(t,e){const i=[...this._config.entities??[]];i[t]={...i[t],...e},this._updateConfig({entities:i})}_removeEntity(t){const e=[...this._config.entities??[]];e.splice(t,1),this._updateConfig({entities:e})}_addEntity(){const t=[...this._config.entities??[],{entity:"",x:50,y:50}];this._updateConfig({entities:t})}render(){const t="string"==typeof this._config.image?this._config.image:"",e=this._config.title??"",i=Number(this._config.rotation)??0,n=this._config.entities??[],o=this.hass?.states?Object.keys(this.hass.states).sort():[];return W`
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
        </section>
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:map-marker"></ha-icon> Entitäten</h4>
          <p class="section-hint">X/Y = Position (0–100), Skalierung, Icon optional (z.B. mdi:lightbulb).</p>
          <div class="entity-list">
            ${n.map((t,e)=>W`
              <div class="entity-row">
                <input type="text" list="rp-entities-${e}" .value=${t.entity} placeholder="light.wohnzimmer"
                  @change=${t=>this._updateEntity(e,{entity:t.target.value.trim()})} />
                <datalist id="rp-entities-${e}">
                  ${o.slice(0,200).map(t=>W`<option value="${t}">${Mt(this.hass,t)}</option>`)}
                </datalist>
                <input type="text" class="entity-icon" .value=${t.icon??""} placeholder="Icon (mdi:...)"
                  title="Icon (optional)"
                  @change=${t=>{const i=t.target.value.trim();this._updateEntity(e,{icon:i||void 0})}} />
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
    `}};jt([gt({attribute:!1})],Lt.prototype,"hass",void 0),jt([vt()],Lt.prototype,"_config",void 0),Lt=jt([ut("room-plan-editor")],Lt);var Dt=function(t,e,i,n){var o,r=arguments.length,s=r<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(t,e,i,n);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(s=(r<3?o(s):r>3?o(e,i,s):o(e,i))||s);return r>3&&s&&Object.defineProperty(e,i,s),s};const It="room-plan-card";window.customCards=window.customCards||[],window.customCards.push({type:"custom:"+It,name:"Interaktiver Raumplan",description:"Raumplan als Bild mit Entitäten per Koordinaten (x,y). Kreise mit Icons.",preview:!1});let Bt=class extends ht{constructor(){super(...arguments),this.config={type:"",image:"",entities:[]},this._imageLoaded=!1,this._imageError=!1,this._imageAspect=16/9,this._activeFilter=[]}static async getConfigElement(){return document.createElement("room-plan-editor")}static getStubConfig(){return{image:"/local/raumplan.png",rotation:0,entities:[{entity:"light.example",x:25,y:30,scale:1,color:"#ffc107"},{entity:"sensor.example",x:75,y:40,scale:1}]}}setConfig(t){const e=t?.image&&"string"==typeof t.image?t.image:t?.image?.location??"";this.config={type:t?.type??"custom:room-plan-card",image:e,entities:Array.isArray(t?.entities)?t.entities:[],title:t?.title??"",rotation:Number(t?.rotation)??0,full_height:t?.full_height??!1,tap_action:t?.tap_action,hold_action:t?.hold_action,double_tap_action:t?.double_tap_action,entity_filter:Array.isArray(t?.entity_filter)?t.entity_filter:void 0},this._activeFilter=Array.isArray(t?.entity_filter)?[...t.entity_filter]:[],this._imageLoaded=!1,this._imageError=!1,this._imageAspect=16/9}_getEntityDomain(t){const e=t.indexOf(".");return e>0?t.slice(0,e):""}_filteredEntities(){const t=this.config?.entities??[],e=this._activeFilter.length>0?this._activeFilter:this.config?.entity_filter??[];return e&&0!==e.length?t.filter(t=>e.includes(this._getEntityDomain(t.entity))):t}_availableDomains(){const t=this.config?.entities??[],e=new Set;return t.forEach(t=>{const i=this._getEntityDomain(t.entity);i&&e.add(i)}),Array.from(e).sort()}_toggleFilter(t){const e=this._activeFilter.includes(t)?this._activeFilter.filter(e=>e!==t):[...this._activeFilter,t].sort();this._activeFilter=[...e]}getCardSize(){return this.config?.full_height?1:4}getGridOptions(){return this.config?.full_height?{rows:1,columns:1,min_rows:1,min_columns:1}:{rows:4,columns:6,min_rows:3,min_columns:3}}shouldUpdate(t){return!!this.config&&(!!(t.has("_activeFilter")||t.has("_imageLoaded")||t.has("_imageError")||t.has("_imageAspect"))||function(t,e,i){if(e.has("config")||i)return!0;if(t.config.entity){var n=e.get("hass");return!n||n.states[t.config.entity]!==t.hass.states[t.config.entity]}return!1}(this,t,!1))}connectedCallback(){super.connectedCallback(),this.closest(".element-preview")&&(this.style.display="none")}_getEntityActionConfig(t){const e=this.config?.tap_action??{action:"more-info"};return{entity:t.entity,tap_action:t.tap_action??this.config?.tap_action??e,hold_action:t.hold_action??this.config?.hold_action,double_tap_action:t.double_tap_action??this.config?.double_tap_action}}_handleEntityAction(t,e){const i=this._getEntityActionConfig(e);this.hass&&t.detail?.action&&(kt(this,this.hass,i,t.detail.action),wt("light"))}_hexToRgba(t,e){const i=t.replace(/^#/,"").match(/(.{2})/g);if(!i||3!==i.length)return`rgba(45, 45, 45, ${e})`;const[n,o,r]=i.map(t=>parseInt(t,16));return`rgba(${n},${o},${r},${e})`}_renderEntity(t){const e=Math.min(100,Math.max(0,Number(t.x)??50)),i=Math.min(100,Math.max(0,Number(t.y)??50)),n=Math.min(2,Math.max(.3,Number(t.scale)??1)),o="on"===this.hass?.states?.[t.entity]?.state,r=t.icon||function(t,e){const i=t?.states?.[e];if(!i)return"mdi:help-circle";if(i.attributes?.icon)return i.attributes.icon;const n=e.split(".")[0],o=i.state;return"light"===n||"switch"===n?"on"===o?"mdi:lightbulb-on":"mdi:lightbulb-outline":"cover"===n?"mdi:blinds":"climate"===n?"mdi:thermostat":"sensor"===n?"mdi:gauge":"binary_sensor"===n?"mdi:motion-sensor":"mdi:circle"}(this.hass,t.entity),s=function(t,e){const i=t?.states?.[e];if(!i)return"—";const n=i.attributes?.unit_of_measurement;return n?`${i.state} ${n}`:i.state}(this.hass,t.entity),a=`${Mt(this.hass,t.entity)}: ${s}`,l=Math.min(1,Math.max(0,Number(t.background_opacity)??1)),c=t.color?this._hexToRgba(t.color,l):`rgba(45, 45, 45, ${l})`,d=!!t.show_value,h=this._getEntityActionConfig(t),p=St(h.hold_action),u=St(h.double_tap_action);return W`
      <div
        class="entity-badge ${o?"entity-on":""} ${d?"entity-show-value":""}"
        style="left:${e}%;top:${i}%;--entity-scale:${n};--entity-bg:${c}"
        title="${a}"
        tabindex="0"
        role="button"
        .actionHandler=${Rt({hasHold:p,hasDoubleClick:u})}
        @action=${e=>this._handleEntityAction(e,t)}
      >
        <div class="entity-badge-inner">
          ${d?W`<span class="entity-value">${s}</span>`:W`<ha-icon icon="${r}"></ha-icon>`}
        </div>
      </div>
    `}_onImageLoad(t){const e=t.target;e.naturalWidth&&e.naturalHeight&&(this._imageAspect=e.naturalWidth/e.naturalHeight),this._imageLoaded=!0,this._imageError=!1}_onImageError(){this._imageError=!0,this._imageLoaded=!1}render(){if(this.closest(".element-preview"))return W``;const{image:t,entities:e,title:i,rotation:n}=this.config;if(!t)return W`
        <ha-card>
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>${function(t,e="",i=""){const n=(localStorage.getItem("selectedLanguage")||"de").replace(/['"]+/g,"").replace("-","_");let o;try{o=t.split(".").reduce((t,e)=>t[e],zt[n])}catch{o=t.split(".").reduce((t,e)=>t[e],zt.en)}return void 0===o&&(o=t.split(".").reduce((t,e)=>t[e],zt.en)),""!==e&&""!==i&&(o=o.replace(e,i)),o}("common.configure")}</p>
          </div>
        </ha-card>
      `;const o=this._availableDomains(),r=o.length>0;return W`
      <ha-card class=${this.config?.full_height?"full-height":""}>
        <div class="card-content">
          ${r?W`
                <div class="filter-bar">
                  ${o.map(t=>W`
                      <button
                        type="button"
                        class="filter-chip ${this._activeFilter.includes(t)?"active":""}"
                        @click=${()=>this._toggleFilter(t)}
                      >
                        ${t}
                      </button>
                    `)}
                </div>
              `:""}
          <div class="image-wrapper" style="transform: rotate(${n}deg);">
            <div class="image-and-overlay" style="--image-aspect: ${this._imageAspect};">
              <img
                src="${t}"
                alt="Raumplan"
                class="plan-image"
                @load=${this._onImageLoad}
                @error=${this._onImageError}
              />
              ${this._imageLoaded||this._imageError?"":W`<div class="image-skeleton" aria-hidden="true"></div>`}
              ${this._imageError?W`<div class="image-error">Bild konnte nicht geladen werden</div>`:""}
              <div class="entities-overlay">
                ${this._filteredEntities().map(t=>this._renderEntity(t))}
              </div>
            </div>
          </div>
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
      .filter-bar {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px;
        background: var(--ha-card-background, #1e1e1e);
        border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.12));
      }
      .filter-chip {
        padding: 4px 12px;
        border-radius: 16px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
        background: var(--card-background-color, #2d2d2d);
        color: var(--primary-text-color, #e1e1e1);
        font-size: 0.8rem;
        cursor: pointer;
      }
      .filter-chip:hover {
        border-color: var(--primary-color, #03a9f4);
      }
      .filter-chip.active {
        background: var(--primary-color, #03a9f4);
        border-color: var(--primary-color, #03a9f4);
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
      .image-and-overlay {
        position: relative;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        aspect-ratio: var(--image-aspect, 16 / 9);
        flex-shrink: 0;
        overflow: hidden;
      }
      .plan-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: fill;
        object-position: center;
        display: block;
      }
      .image-skeleton {
        position: absolute;
        inset: 0;
        background: var(--ha-card-background, #1e1e1e);
      }
      .entities-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }
      .entities-overlay > * {
        pointer-events: auto;
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
    `}};Dt([gt({attribute:!1})],Bt.prototype,"hass",void 0),Dt([vt()],Bt.prototype,"config",void 0),Dt([vt()],Bt.prototype,"_imageLoaded",void 0),Dt([vt()],Bt.prototype,"_imageError",void 0),Dt([vt()],Bt.prototype,"_imageAspect",void 0),Dt([vt()],Bt.prototype,"_activeFilter",void 0),Bt=Dt([ut(It)],Bt),console.info("%c RAUMPLAN v1.0.0","color: #03a9f4; font-weight: bold");export{Bt as RoomPlanCard};