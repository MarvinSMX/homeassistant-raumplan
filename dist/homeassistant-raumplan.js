var t,e,i={},n={};function o(t){var e=n[t];if(void 0!==e)return e.exports;var s=n[t]={exports:{}};return i[t](s,s.exports,o),s.exports}e=Object.getPrototypeOf?t=>Object.getPrototypeOf(t):t=>t.__proto__,o.t=function(i,n){if(1&n&&(i=this(i)),8&n)return i;if("object"==typeof i&&i){if(4&n&&i.__esModule)return i;if(16&n&&"function"==typeof i.then)return i}var s=Object.create(null);o.r(s);var r={};t=t||[null,e({}),e([]),e(e)];for(var a=2&n&&i;("object"==typeof a||"function"==typeof a)&&!~t.indexOf(a);a=e(a))Object.getOwnPropertyNames(a).forEach(t=>r[t]=()=>i[t]);return r.default=()=>i,o.d(s,r),s},o.d=(t,e)=>{for(var i in e)o.o(e,i)&&!o.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},o.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),o.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const s=window,r=s.ShadowRoot&&(void 0===s.ShadyCSS||s.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),l=new WeakMap;class c{constructor(t,e,i){if(this._$cssResult$=!0,i!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(r&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=l.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&l.set(e,t))}return t}toString(){return this.cssText}}const d=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new c(i,t,a)},h=(t,e)=>{r?t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):e.forEach(e=>{const i=document.createElement("style"),n=s.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=e.cssText,t.appendChild(i)})},p=r?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new c("string"==typeof t?t:t+"",void 0,a))(e)})(t):t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var u;const m=window,v=m.trustedTypes,g=v?v.emptyScript:"",f=m.reactiveElementPolyfillSupport,y={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},_=(t,e)=>e!==t&&(e==e||t==t),$={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:_},b="finalized";class x extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const n=this._$Ep(i,e);void 0!==n&&(this._$Ev.set(n,i),t.push(n))}),t}static createProperty(t,e=$){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,n=this.getPropertyDescriptor(t,i,e);void 0!==n&&Object.defineProperty(this.prototype,t,n)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(n){const o=this[t];this[e]=n,this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||$}static finalize(){if(this.hasOwnProperty(b))return!1;this[b]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(p(t))}else void 0!==t&&e.push(p(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;const e=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return h(e,this.constructor.elementStyles),e}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=$){var n;const o=this.constructor._$Ep(t,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==(null===(n=i.converter)||void 0===n?void 0:n.toAttribute)?i.converter:y).toAttribute(e,i.type);this._$El=t,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$El=null}}_$AK(t,e){var i;const n=this.constructor,o=n._$Ev.get(t);if(void 0!==o&&this._$El!==o){const t=n.getPropertyOptions(o),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:y;this._$El=o,this[o]=s.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let n=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||_)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):n=!1),!this.isUpdatePending&&n&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var w;x[b]=!0,x.elementProperties=new Map,x.elementStyles=[],x.shadowRootOptions={mode:"open"},null==f||f({ReactiveElement:x}),(null!==(u=m.reactiveElementVersions)&&void 0!==u?u:m.reactiveElementVersions=[]).push("1.6.3");const A=window,E=A.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",k=`lit$${(Math.random()+"").slice(9)}$`,P="?"+k,O=`<${P}>`,N=document,U=()=>N.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,R=t=>M(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),H="[ \t\n\f\r]",j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,L=/>/g,B=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,D=/"/g,V=/^(?:script|style|textarea|title)$/i,K=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),W=K(1),J=(K(2),Symbol.for("lit-noChange")),q=Symbol.for("lit-nothing"),G=new WeakMap,X=N.createTreeWalker(N,129,null,!1);function Y(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,n=[];let o,s=2===e?"<svg>":"",r=j;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===j?"!--"===l[1]?r=T:void 0!==l[1]?r=L:void 0!==l[2]?(V.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=B):void 0!==l[3]&&(r=B):r===B?">"===l[0]?(r=null!=o?o:j,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?B:'"'===l[3]?D:I):r===D||r===I?r=B:r===T||r===L?r=j:(r=B,o=void 0);const h=r===B&&t[e+1].startsWith("/>")?" ":"";s+=r===j?i+O:c>=0?(n.push(a),i.slice(0,c)+C+i.slice(c)+k+h):i+k+(-2===c?(n.push(void 0),e):h)}return[Y(t,s+(t[i]||"<?>")+(2===e?"</svg>":"")),n]};class F{constructor({strings:t,_$litType$:e},i){let n;this.parts=[];let o=0,s=0;const r=t.length-1,a=this.parts,[l,c]=Z(t,e);if(this.el=F.createElement(l,i),X.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(n=X.nextNode())&&a.length<r;){if(1===n.nodeType){if(n.hasAttributes()){const t=[];for(const e of n.getAttributeNames())if(e.endsWith(C)||e.startsWith(k)){const i=c[s++];if(t.push(e),void 0!==i){const t=n.getAttribute(i.toLowerCase()+C).split(k),e=/([.?@])?(.*)/.exec(i);a.push({type:1,index:o,name:e[2],strings:t,ctor:"."===e[1]?nt:"?"===e[1]?st:"@"===e[1]?rt:it})}else a.push({type:6,index:o})}for(const e of t)n.removeAttribute(e)}if(V.test(n.tagName)){const t=n.textContent.split(k),e=t.length-1;if(e>0){n.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)n.append(t[i],U()),X.nextNode(),a.push({type:2,index:++o});n.append(t[e],U())}}}else if(8===n.nodeType)if(n.data===P)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=n.data.indexOf(k,t+1));)a.push({type:7,index:o}),t+=k.length-1}o++}}static createElement(t,e){const i=N.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,n){var o,s,r,a;if(e===J)return e;let l=void 0!==n?null===(o=i._$Co)||void 0===o?void 0:o[n]:i._$Cl;const c=z(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(s=null==l?void 0:l._$AO)||void 0===s||s.call(l,!1),void 0===c?l=void 0:(l=new c(t),l._$AT(t,i,n)),void 0!==n?(null!==(r=(a=i)._$Co)&&void 0!==r?r:a._$Co=[])[n]=l:i._$Cl=l),void 0!==l&&(e=Q(t,l._$AS(t,e.values),l,n)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:i},parts:n}=this._$AD,o=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:N).importNode(i,!0);X.currentNode=o;let s=X.nextNode(),r=0,a=0,l=n[0];for(;void 0!==l;){if(r===l.index){let e;2===l.type?e=new et(s,s.nextSibling,this,t):1===l.type?e=new l.ctor(s,l.name,l.strings,this,t):6===l.type&&(e=new at(s,this,t)),this._$AV.push(e),l=n[++a]}r!==(null==l?void 0:l.index)&&(s=X.nextNode(),r++)}return X.currentNode=N,o}v(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{constructor(t,e,i,n){var o;this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=n,this._$Cp=null===(o=null==n?void 0:n.isConnected)||void 0===o||o}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),z(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==J&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):R(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==q&&z(this._$AH)?this._$AA.nextSibling.data=t:this.$(N.createTextNode(t)),this._$AH=t}g(t){var e;const{values:i,_$litType$:n}=t,o="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=F.createElement(Y(n.h,n.h[0]),this.options)),n);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===o)this._$AH.v(i);else{const t=new tt(o,this),e=t.u(this.options);t.v(i),this.$(e),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new F(t)),e}T(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,n=0;for(const o of t)n===e.length?e.push(i=new et(this.k(U()),this.k(U()),this,this.options)):i=e[n],i._$AI(o),n++;n<e.length&&(this._$AR(i&&i._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class it{constructor(t,e,i,n,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,n){const o=this.strings;let s=!1;if(void 0===o)t=Q(this,t,e,0),s=!z(t)||t!==this._$AH&&t!==J,s&&(this._$AH=t);else{const n=t;let r,a;for(t=o[0],r=0;r<o.length-1;r++)a=Q(this,n[i+r],e,r),a===J&&(a=this._$AH[r]),s||(s=!z(a)||a!==this._$AH[r]),a===q?t=q:t!==q&&(t+=(null!=a?a:"")+o[r+1]),this._$AH[r]=a}s&&!n&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class nt extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}const ot=E?E.emptyScript:"";class st extends it{constructor(){super(...arguments),this.type=4}j(t){t&&t!==q?this.element.setAttribute(this.name,ot):this.element.removeAttribute(this.name)}}class rt extends it{constructor(t,e,i,n,o){super(t,e,i,n,o),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=Q(this,t,e,0))&&void 0!==i?i:q)===J)return;const n=this._$AH,o=t===q&&n!==q||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,s=t!==q&&(n===q||o);o&&this.element.removeEventListener(this.name,this,n),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const lt=A.litHtmlPolyfillSupport;null==lt||lt(F,et),(null!==(w=A.litHtmlVersions)&&void 0!==w?w:A.litHtmlVersions=[]).push("2.8.0");var ct,dt;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ht extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var n,o;const s=null!==(n=null==i?void 0:i.renderBefore)&&void 0!==n?n:e;let r=s._$litPart$;if(void 0===r){const t=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;s._$litPart$=r=new et(e.insertBefore(U(),t),t,void 0,null!=i?i:{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return J}}ht.finalized=!0,ht._$litElement$=!0,null===(ct=globalThis.litElementHydrateSupport)||void 0===ct||ct.call(globalThis,{LitElement:ht});const pt=globalThis.litElementPolyfillSupport;null==pt||pt({LitElement:ht});(null!==(dt=globalThis.litElementVersions)&&void 0!==dt?dt:globalThis.litElementVersions=[]).push("3.3.3");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ut=t=>e=>"function"==typeof e?((t,e)=>(customElements.define(t,e),e))(t,e):((t,e)=>{const{kind:i,elements:n}=e;return{kind:i,elements:n,finisher(e){customElements.define(t,e)}}})(t,e),mt=(t,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(i){i.createProperty(e.key,t)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this))},finisher(i){i.createProperty(e.key,t)}};function vt(t){return(e,i)=>void 0!==i?((t,e,i)=>{e.constructor.createProperty(i,t)})(t,e,i):mt(t,e)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function gt(t){return vt({...t,state:!0})}var ft;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */null===(ft=window.HTMLSlotElement)||void 0===ft||ft.prototype.assignedElements;var yt,_t;!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(yt||(yt={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(_t||(_t={}));new Set(["fan","input_boolean","light","switch","group","automation"]);var $t=function(t,e,i,n){n=n||{},i=null==i?{}:i;var o=new Event(e,{bubbles:void 0===n.bubbles||n.bubbles,cancelable:Boolean(n.cancelable),composed:void 0===n.composed||n.composed});return o.detail=i,t.dispatchEvent(o),o};new Set(["call-service","divider","section","weblink","cast","select"]);const bt=JSON.parse('{"common":{"version":"Version","invalid_configuration":"Ungültige Konfiguration","show_warning":"Warnung anzeigen","configure":"Bitte konfigurieren: Bild-URL und Entitäten mit Koordinaten."}}');var xt=o.t(bt,2);const wt=JSON.parse('{"common":{"version":"Version","invalid_configuration":"Invalid configuration","show_warning":"Show warning","configure":"Please configure: image URL and entities with coordinates."}}');const At={de:xt,en:o.t(wt,2)};function Et(t,e){return t?.states?.[e]?.attributes?.friendly_name||e}var St=function(t,e,i,n){var o,s=arguments.length,r=s<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,n);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(r=(s<3?o(r):s>3?o(e,i,r):o(e,i))||r);return s>3&&r&&Object.defineProperty(e,i,r),r};let Ct=class extends ht{constructor(){super(...arguments),this._config={type:"",image:"",entities:[]}}setConfig(t){const e=t??{type:"",image:"",entities:[]},i="string"==typeof e.image?e.image:e.image?.location??"";this._config={...e,image:i,entities:Array.isArray(e.entities)?[...e.entities]:[]}}_emitConfig(){$t(this,"config-changed",{config:this._config})}_updateConfig(t){this._config={...this._config,...t},this._emitConfig()}_updateEntity(t,e){const i=[...this._config.entities??[]];i[t]={...i[t],...e},this._updateConfig({entities:i})}_removeEntity(t){const e=[...this._config.entities??[]];e.splice(t,1),this._updateConfig({entities:e})}_addEntity(){const t=[...this._config.entities??[],{entity:"",x:50,y:50}];this._updateConfig({entities:t})}render(){const t="string"==typeof this._config.image?this._config.image:"",e=this._config.title??"",i=Number(this._config.rotation)??0,n=this._config.entities??[],o=this.hass?.states?Object.keys(this.hass.states).sort():[];return W`
      <div class="editor">
        <header class="editor-header">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <h3>Raumplan konfigurieren</h3>
        </header>
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
          <p class="section-hint">X/Y = Position in Prozent (0–100), Skalierung = Größe des Kreises.</p>
          <div class="entity-list">
            ${n.map((t,e)=>W`
              <div class="entity-row">
                <input type="text" list="rp-entities-${e}" .value=${t.entity} placeholder="light.wohnzimmer"
                  @change=${t=>this._updateEntity(e,{entity:t.target.value.trim()})} />
                <datalist id="rp-entities-${e}">
                  ${o.slice(0,200).map(t=>W`<option value="${t}">${Et(this.hass,t)}</option>`)}
                </datalist>
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
      .entity-row input[list] {
        flex: 1 1 140px;
        min-width: 0;
      }
      .entity-coords {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .entity-coords input {
        width: clamp(44px, 12vw, 52px);
        padding: 8px 10px;
        font-size: clamp(12px, 3vw, 14px);
      }
      .entity-row input.entity-scale {
        width: clamp(50px, 14vw, 60px);
        padding: 8px 10px;
      }
      .entity-row input[type='color'] {
        width: 36px;
        height: 36px;
        min-width: 36px;
        padding: 2px;
        cursor: pointer;
        border-radius: 6px;
      }
      .entity-row input:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
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
    `}};St([vt({attribute:!1})],Ct.prototype,"hass",void 0),St([gt()],Ct.prototype,"_config",void 0),Ct=St([ut("room-plan-editor")],Ct);var kt=function(t,e,i,n){var o,s=arguments.length,r=s<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,n);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(r=(s<3?o(r):s>3?o(e,i,r):o(e,i))||r);return s>3&&r&&Object.defineProperty(e,i,r),r};const Pt="room-plan-card";window.customCards=window.customCards||[],window.customCards.push({type:"custom:"+Pt,name:"Interaktiver Raumplan",description:"Raumplan als Bild mit Entitäten per Koordinaten (x,y). Kreise mit Icons.",preview:!1});let Ot=class extends ht{constructor(){super(...arguments),this.config={type:"",image:"",entities:[]},this._imageLoaded=!1}static async getConfigElement(){return document.createElement("room-plan-editor")}static getStubConfig(){return{image:"/local/raumplan.png",rotation:0,entities:[{entity:"light.example",x:25,y:30,scale:1,color:"#ffc107"},{entity:"sensor.example",x:75,y:40,scale:1}]}}setConfig(t){const e=t?.image&&"string"==typeof t.image?t.image:t?.image?.location??"";this.config={type:t?.type??"custom:room-plan-card",image:e,entities:Array.isArray(t?.entities)?t.entities:[],title:t?.title??"",rotation:Number(t?.rotation)??0}}getCardSize(){return 4}getGridOptions(){return{rows:4,columns:6,min_rows:3,min_columns:3}}shouldUpdate(t){return!!this.config&&function(t,e,i){if(e.has("config")||i)return!0;if(t.config.entity){var n=e.get("hass");return!n||n.states[t.config.entity]!==t.hass.states[t.config.entity]}return!1}(this,t,!1)}connectedCallback(){super.connectedCallback(),this.closest(".element-preview")&&(this.style.display="none")}_handleEntityClick(t){this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}_renderEntity(t){const e=Math.min(100,Math.max(0,Number(t.x)??50)),i=Math.min(100,Math.max(0,Number(t.y)??50)),n=Math.min(2,Math.max(.3,Number(t.scale)??1)),o="on"===this.hass?.states?.[t.entity]?.state,s=t.icon||function(t,e){const i=t?.states?.[e];if(!i)return"mdi:help-circle";if(i.attributes?.icon)return i.attributes.icon;const n=e.split(".")[0],o=i.state;return"light"===n||"switch"===n?"on"===o?"mdi:lightbulb-on":"mdi:lightbulb-outline":"cover"===n?"mdi:blinds":"climate"===n?"mdi:thermostat":"sensor"===n?"mdi:gauge":"binary_sensor"===n?"mdi:motion-sensor":"mdi:circle"}(this.hass,t.entity),r=`${Et(this.hass,t.entity)}: ${function(t,e){const i=t?.states?.[e];if(!i)return"—";const n=i.attributes?.unit_of_measurement;return n?`${i.state} ${n}`:i.state}(this.hass,t.entity)}`;return W`
      <div
        class="entity-badge ${o?"entity-on":""}"
        style="left:${e}%;top:${i}%;--entity-scale:${n};${t.color?`--entity-color:${t.color}`:""}"
        title="${r}"
        @click=${()=>this._handleEntityClick(t.entity)}
      >
        <div class="entity-badge-inner">
          <ha-icon icon="${s}"></ha-icon>
        </div>
      </div>
    `}_onImageLoad(t){const e=t.target,i=e.naturalWidth,n=e.naturalHeight;i&&n&&e.parentElement&&(e.parentElement.style.aspectRatio=`${i}/${n}`),this._imageLoaded=!0}render(){if(this.closest(".element-preview"))return W``;const{image:t,entities:e,title:i,rotation:n}=this.config;return t?W`
      <ha-card .header=${i||void 0}>
        <div class="card-content">
          <div class="image-wrapper" style="transform: rotate(${n}deg); aspect-ratio: 16/9;">
            <img
              src="${t}"
              alt="Raumplan"
              class="plan-image"
              @load=${this._onImageLoad}
              ?hidden=${!this._imageLoaded}
            />
            ${this._imageLoaded?"":W`<div class="image-skeleton" aria-hidden="true"></div>`}
            <div class="entities-overlay">
              ${(e??[]).map(t=>this._renderEntity(t))}
            </div>
          </div>
        </div>
      </ha-card>
    `:W`
        <ha-card header="${i||"Interaktiver Raumplan"}">
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>${function(t,e="",i=""){const n=(localStorage.getItem("selectedLanguage")||"de").replace(/['"]+/g,"").replace("-","_");let o;try{o=t.split(".").reduce((t,e)=>t[e],At[n])}catch{o=t.split(".").reduce((t,e)=>t[e],At.en)}return void 0===o&&(o=t.split(".").reduce((t,e)=>t[e],At.en)),""!==e&&""!==i&&(o=o.replace(e,i)),o}("common.configure")}</p>
          </div>
        </ha-card>
      `}static get styles(){return d`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }
      ha-card {
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
      .card-content {
        padding: 0;
        overflow: hidden;
        width: 100%;
      }
      .image-wrapper {
        position: relative;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        min-height: 120px;
      }
      .plan-image {
        width: 100%;
        height: 100%;
        max-width: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
        vertical-align: middle;
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
        background: var(--entity-color, var(--card-background-color, #2d2d2d));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .entity-badge ha-icon {
        --mdc-icon-size: var(--icon-size);
        width: var(--icon-size);
        height: var(--icon-size);
      }
      .entity-badge.entity-on .entity-badge-inner {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107));
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
    `}};kt([vt({attribute:!1})],Ot.prototype,"hass",void 0),kt([gt()],Ot.prototype,"config",void 0),kt([gt()],Ot.prototype,"_imageLoaded",void 0),Ot=kt([ut(Pt)],Ot),console.info("%c RAUMPLAN v1.0.0","color: #03a9f4; font-weight: bold");export{Ot as RoomPlanCard};