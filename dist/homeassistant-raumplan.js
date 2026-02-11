function t(t,e,i,n){var o,s=arguments.length,r=s<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,i):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,n);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(r=(s<3?o(r):s>3?o(e,i,r):o(e,i))||r);return s>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=window,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),o=new WeakMap;class s{constructor(t,e,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}}const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[n+1],t[0]);return new s(i,t,n)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new s("string"==typeof t?t:t+"",void 0,n))(e)})(t):t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var l;const d=window,c=d.trustedTypes,h=c?c.emptyScript:"",p=d.reactiveElementPolyfillSupport,u={toAttribute(t,e){switch(e){case Boolean:t=t?h:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>e!==t&&(e==e||t==t),g={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:v},m="finalized";class f extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const n=this._$Ep(i,e);void 0!==n&&(this._$Ev.set(n,i),t.push(n))}),t}static createProperty(t,e=g){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,n=this.getPropertyDescriptor(t,i,e);void 0!==n&&Object.defineProperty(this.prototype,t,n)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(n){const o=this[t];this[e]=n,this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||g}static finalize(){if(this.hasOwnProperty(m))return!1;this[m]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var t;const n=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{i?t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):n.forEach(i=>{const n=document.createElement("style"),o=e.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=i.cssText,t.appendChild(n)})})(n,this.constructor.elementStyles),n}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=g){var n;const o=this.constructor._$Ep(t,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==(null===(n=i.converter)||void 0===n?void 0:n.toAttribute)?i.converter:u).toAttribute(e,i.type);this._$El=t,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$El=null}}_$AK(t,e){var i;const n=this.constructor,o=n._$Ev.get(t);if(void 0!==o&&this._$El!==o){const t=n.getPropertyOptions(o),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:u;this._$El=o,this[o]=s.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let n=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||v)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):n=!1),!this.isUpdatePending&&n&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var y;f[m]=!0,f.elementProperties=new Map,f.elementStyles=[],f.shadowRootOptions={mode:"open"},null==p||p({ReactiveElement:f}),(null!==(l=d.reactiveElementVersions)&&void 0!==l?l:d.reactiveElementVersions=[]).push("1.6.3");const _=window,b=_.trustedTypes,$=b?b.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",A=`lit$${(Math.random()+"").slice(9)}$`,w="?"+A,E=`<${w}>`,C=document,S=()=>C.createComment(""),k=t=>null===t||"object"!=typeof t&&"function"!=typeof t,P=Array.isArray,O="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,U=/>/g,M=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,j=/"/g,H=/^(?:script|style|textarea|title)$/i,T=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),L=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),I=new WeakMap,D=C.createTreeWalker(C,129,null,!1);function q(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==$?$.createHTML(e):e}const V=(t,e)=>{const i=t.length-1,n=[];let o,s=2===e?"<svg>":"",r=N;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===N?"!--"===l[1]?r=R:void 0!==l[1]?r=U:void 0!==l[2]?(H.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=M):void 0!==l[3]&&(r=M):r===M?">"===l[0]?(r=null!=o?o:N,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?M:'"'===l[3]?j:z):r===j||r===z?r=M:r===R||r===U?r=N:(r=M,o=void 0);const h=r===M&&t[e+1].startsWith("/>")?" ":"";s+=r===N?i+E:d>=0?(n.push(a),i.slice(0,d)+x+i.slice(d)+A+h):i+A+(-2===d?(n.push(void 0),e):h)}return[q(t,s+(t[i]||"<?>")+(2===e?"</svg>":"")),n]};class K{constructor({strings:t,_$litType$:e},i){let n;this.parts=[];let o=0,s=0;const r=t.length-1,a=this.parts,[l,d]=V(t,e);if(this.el=K.createElement(l,i),D.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(n=D.nextNode())&&a.length<r;){if(1===n.nodeType){if(n.hasAttributes()){const t=[];for(const e of n.getAttributeNames())if(e.endsWith(x)||e.startsWith(A)){const i=d[s++];if(t.push(e),void 0!==i){const t=n.getAttribute(i.toLowerCase()+x).split(A),e=/([.?@])?(.*)/.exec(i);a.push({type:1,index:o,name:e[2],strings:t,ctor:"."===e[1]?G:"?"===e[1]?Z:"@"===e[1]?Q:F})}else a.push({type:6,index:o})}for(const e of t)n.removeAttribute(e)}if(H.test(n.tagName)){const t=n.textContent.split(A),e=t.length-1;if(e>0){n.textContent=b?b.emptyScript:"";for(let i=0;i<e;i++)n.append(t[i],S()),D.nextNode(),a.push({type:2,index:++o});n.append(t[e],S())}}}else if(8===n.nodeType)if(n.data===w)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=n.data.indexOf(A,t+1));)a.push({type:7,index:o}),t+=A.length-1}o++}}static createElement(t,e){const i=C.createElement("template");return i.innerHTML=t,i}}function W(t,e,i=t,n){var o,s,r,a;if(e===L)return e;let l=void 0!==n?null===(o=i._$Co)||void 0===o?void 0:o[n]:i._$Cl;const d=k(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==d&&(null===(s=null==l?void 0:l._$AO)||void 0===s||s.call(l,!1),void 0===d?l=void 0:(l=new d(t),l._$AT(t,i,n)),void 0!==n?(null!==(r=(a=i)._$Co)&&void 0!==r?r:a._$Co=[])[n]=l:i._$Cl=l),void 0!==l&&(e=W(t,l._$AS(t,e.values),l,n)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:i},parts:n}=this._$AD,o=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:C).importNode(i,!0);D.currentNode=o;let s=D.nextNode(),r=0,a=0,l=n[0];for(;void 0!==l;){if(r===l.index){let e;2===l.type?e=new Y(s,s.nextSibling,this,t):1===l.type?e=new l.ctor(s,l.name,l.strings,this,t):6===l.type&&(e=new tt(s,this,t)),this._$AV.push(e),l=n[++a]}r!==(null==l?void 0:l.index)&&(s=D.nextNode(),r++)}return D.currentNode=C,o}v(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Y{constructor(t,e,i,n){var o;this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=n,this._$Cp=null===(o=null==n?void 0:n.isConnected)||void 0===o||o}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=W(this,t,e),k(t)?t===B||null==t||""===t?(this._$AH!==B&&this._$AR(),this._$AH=B):t!==this._$AH&&t!==L&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):(t=>P(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]))(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==B&&k(this._$AH)?this._$AA.nextSibling.data=t:this.$(C.createTextNode(t)),this._$AH=t}g(t){var e;const{values:i,_$litType$:n}=t,o="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=K.createElement(q(n.h,n.h[0]),this.options)),n);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===o)this._$AH.v(i);else{const t=new X(o,this),e=t.u(this.options);t.v(i),this.$(e),this._$AH=t}}_$AC(t){let e=I.get(t.strings);return void 0===e&&I.set(t.strings,e=new K(t)),e}T(t){P(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,n=0;for(const o of t)n===e.length?e.push(i=new Y(this.k(S()),this.k(S()),this,this.options)):i=e[n],i._$AI(o),n++;n<e.length&&(this._$AR(i&&i._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class F{constructor(t,e,i,n,o){this.type=1,this._$AH=B,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=B}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,n){const o=this.strings;let s=!1;if(void 0===o)t=W(this,t,e,0),s=!k(t)||t!==this._$AH&&t!==L,s&&(this._$AH=t);else{const n=t;let r,a;for(t=o[0],r=0;r<o.length-1;r++)a=W(this,n[i+r],e,r),a===L&&(a=this._$AH[r]),s||(s=!k(a)||a!==this._$AH[r]),a===B?t=B:t!==B&&(t+=(null!=a?a:"")+o[r+1]),this._$AH[r]=a}s&&!n&&this.j(t)}j(t){t===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class G extends F{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===B?void 0:t}}const J=b?b.emptyScript:"";class Z extends F{constructor(){super(...arguments),this.type=4}j(t){t&&t!==B?this.element.setAttribute(this.name,J):this.element.removeAttribute(this.name)}}class Q extends F{constructor(t,e,i,n,o){super(t,e,i,n,o),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=W(this,t,e,0))&&void 0!==i?i:B)===L)return;const n=this._$AH,o=t===B&&n!==B||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,s=t!==B&&(n===B||o);o&&this.element.removeEventListener(this.name,this,n),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class tt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){W(this,t)}}const et=_.litHtmlPolyfillSupport;null==et||et(K,Y),(null!==(y=_.litHtmlVersions)&&void 0!==y?y:_.litHtmlVersions=[]).push("2.8.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var it,nt;class ot extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var n,o;const s=null!==(n=null==i?void 0:i.renderBefore)&&void 0!==n?n:e;let r=s._$litPart$;if(void 0===r){const t=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;s._$litPart$=r=new Y(e.insertBefore(S(),t),t,void 0,null!=i?i:{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return L}}ot.finalized=!0,ot._$litElement$=!0,null===(it=globalThis.litElementHydrateSupport)||void 0===it||it.call(globalThis,{LitElement:ot});const st=globalThis.litElementPolyfillSupport;null==st||st({LitElement:ot}),(null!==(nt=globalThis.litElementVersions)&&void 0!==nt?nt:globalThis.litElementVersions=[]).push("3.3.3");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const rt=t=>e=>"function"==typeof e?((t,e)=>(customElements.define(t,e),e))(t,e):((t,e)=>{const{kind:i,elements:n}=e;return{kind:i,elements:n,finisher(e){customElements.define(t,e)}}})(t,e),at=(t,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(i){i.createProperty(e.key,t)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this))},finisher(i){i.createProperty(e.key,t)}};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function lt(t){return(e,i)=>void 0!==i?((t,e,i)=>{e.constructor.createProperty(i,t)})(t,e,i):at(t,e)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function dt(t){return lt({...t,state:!0})}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var ct,ht,pt;null===(ct=window.HTMLSlotElement)||void 0===ct||ct.prototype.assignedElements,function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(ht||(ht={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(pt||(pt={}));var ut={version:"Version",invalid_configuration:"Ungültige Konfiguration",show_warning:"Warnung anzeigen",configure:"Bitte konfigurieren: Bild-URL und Entitäten mit Koordinaten."},vt={common:ut},gt={version:"Version",invalid_configuration:"Invalid configuration",show_warning:"Show warning",configure:"Please configure: image URL and entities with coordinates."},mt={common:gt};const ft={de:Object.freeze({__proto__:null,common:ut,default:vt}),en:Object.freeze({__proto__:null,common:gt,default:mt})};const yt="room-plan-card";window.customCards=window.customCards||[],window.customCards.push({type:"custom:"+yt,name:"Interaktiver Raumplan",description:"Raumplan als Bild mit Entitäten per Koordinaten (x,y). Kreise mit Icons.",preview:!1});let _t=class extends ot{constructor(){super(...arguments),this.config={type:"",image:"",entities:[]},this._imageLoaded=!1}static async getConfigElement(){return await Promise.resolve().then(function(){return $t}),document.createElement("room-plan-editor")}static getStubConfig(){return{image:"/local/raumplan.png",rotation:0,entities:[{entity:"light.example",x:25,y:30,scale:1,color:"#ffc107"},{entity:"sensor.example",x:75,y:40,scale:1}]}}setConfig(t){var e;const i=(null==t?void 0:t.image)&&"string"==typeof t.image?t.image:(null===(e=null==t?void 0:t.image)||void 0===e?void 0:e.location)||(null==t?void 0:t.image)||"";this.config={type:(null==t?void 0:t.type)||"custom:room-plan-card",image:i,entities:Array.isArray(null==t?void 0:t.entities)?t.entities:[],title:(null==t?void 0:t.title)||"",rotation:Number(null==t?void 0:t.rotation)||0}}getCardSize(){return 4}getGridOptions(){return{rows:4,columns:6,min_rows:3,min_columns:3}}shouldUpdate(t){return!!this.config&&function(t,e,i){if(e.has("config")||i)return!0;if(t.config.entity){var n=e.get("hass");return!n||n.states[t.config.entity]!==t.hass.states[t.config.entity]}return!1}(this,t,!1)}connectedCallback(){super.connectedCallback(),this.closest(".element-preview")&&(this.style.display="none")}firstUpdated(){this.closest(".element-preview")||(this._removeCardChrome(),requestAnimationFrame(()=>this._removeCardChrome()),[100,300,500].forEach(t=>setTimeout(()=>this._removeCardChrome(),t)))}updated(t){super.updated(t),this.closest(".element-preview")||this._removeCardChrome()}_removeCardChrome(){var t,e,i,n,o,s,r,a,l,d;const c=t=>{t.style.setProperty("background","none","important"),t.style.setProperty("background-color","transparent","important"),t.style.setProperty("--ha-card-background","transparent","important"),t.style.setProperty("--card-background-color","transparent","important"),t.style.setProperty("border","none","important"),t.style.setProperty("box-shadow","none","important"),t.style.setProperty("padding","0","important")},h=t=>{var e;const i=t.shadowRoot;if(!i)return;if(null===(e=i.querySelector)||void 0===e?void 0:e.call(i,"style[data-room-plan-bg]"))return;const n=document.createElement("style");n.setAttribute("data-room-plan-bg","1"),n.textContent=":host{background:none!important;background-color:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}",i.appendChild(n)};let p=null!==(t=this.parentElement)&&void 0!==t?t:null!==(n=null===(i=null===(e=this.getRootNode)||void 0===e?void 0:e.call(this))||void 0===i?void 0:i.host)&&void 0!==n?n:null;for(;p&&p!==document.body;){c(p),"HA-CARD"===p.tagName&&h(p);const t=p.shadowRoot;null===(r=null===(s=null===(o=null==t?void 0:t.querySelectorAll)||void 0===o?void 0:o.call(t,"ha-card"))||void 0===s?void 0:s.forEach)||void 0===r||r.call(s,t=>{c(t),h(t)}),p=p.parentElement||(null!==(d=null===(l=null===(a=p.getRootNode)||void 0===a?void 0:a.call(p))||void 0===l?void 0:l.host)&&void 0!==d?d:null)}}_handleEntityClick(t){this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}_renderEntity(t){var e,i,n,o,s,r;const a=Math.min(100,Math.max(0,null!==(e=Number(t.x))&&void 0!==e?e:50)),l=Math.min(100,Math.max(0,null!==(i=Number(t.y))&&void 0!==i?i:50)),d=Math.min(2,Math.max(.3,null!==(n=Number(t.scale))&&void 0!==n?n:1)),c="on"===(null===(r=null===(s=null===(o=this.hass)||void 0===o?void 0:o.states)||void 0===s?void 0:s[t.entity])||void 0===r?void 0:r.state),h=Math.round(48*d),p=Math.round(26*d),u=t.icon||function(t,e){var i,n;const o=null===(i=null==t?void 0:t.states)||void 0===i?void 0:i[e];if(!o)return"mdi:help-circle";const s=null===(n=o.attributes)||void 0===n?void 0:n.icon;if(s)return s;const r=e.split(".")[0],a=o.state;return"light"===r||"switch"===r?"on"===a?"mdi:lightbulb-on":"mdi:lightbulb-outline":"cover"===r?"mdi:blinds":"climate"===r?"mdi:thermostat":"sensor"===r?"mdi:gauge":"binary_sensor"===r?"mdi:motion-sensor":"mdi:circle"}(this.hass,t.entity),v=`${function(t,e){var i,n;const o=null===(i=null==t?void 0:t.states)||void 0===i?void 0:i[e];return(null===(n=null==o?void 0:o.attributes)||void 0===n?void 0:n.friendly_name)||e}(this.hass,t.entity)}: ${function(t,e){var i,n;const o=null===(i=null==t?void 0:t.states)||void 0===i?void 0:i[e];if(!o)return"—";const s=null===(n=o.attributes)||void 0===n?void 0:n.unit_of_measurement;return s?o.state+" "+s:o.state}(this.hass,t.entity)}`;return T`
      <div
        class="entity-badge ${c?"entity-on":""}"
        style="left:${a}%;top:${l}%;width:${h}px;height:${h}px;--icon-size:${p}px;${t.color?`--entity-color:${t.color}`:""}"
        title="${v}"
        @click=${()=>this._handleEntityClick(t.entity)}
      >
        <div class="entity-badge-inner">
          <ha-icon icon="${u}"></ha-icon>
          ${c?T`<span class="entity-pulse"></span>`:""}
        </div>
      </div>
    `}render(){if(this.closest(".element-preview"))return T``;const t=this.config.image,e=this.config.entities||[],i=this.config.title,n=Number(this.config.rotation)||0;return t?T`
      <div class="card-root">
        ${i?T`<div class="card-title">${i}</div>`:""}
        <div class="card-content">
          <div class="image-wrapper" style="transform: rotate(${n}deg); aspect-ratio: 16/9;">
            <img
              src="${t}"
              alt="Raumplan"
              class="plan-image"
              @load=${this._onImageLoad}
              ?hidden=${!this._imageLoaded}
            />
            ${this._imageLoaded?"":T`<div class="image-skeleton"></div>`}
            <div class="entities-overlay">
              ${e.map(t=>this._renderEntity(t))}
            </div>
          </div>
        </div>
      </div>
    `:T`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
          </div>
          <h3 class="empty-state-title">Interaktiver Raumplan</h3>
          <p class="empty-state-text">${function(t,e="",i=""){const n=(localStorage.getItem("selectedLanguage")||"de").replace(/['"]+/g,"").replace("-","_");let o;try{o=t.split(".").reduce((t,e)=>t[e],ft[n])}catch(e){o=t.split(".").reduce((t,e)=>t[e],ft.en)}return void 0===o&&(o=t.split(".").reduce((t,e)=>t[e],ft.en)),""!==e&&""!==i&&(o=o.replace(e,i)),o}("common.configure")}</p>
        </div>
      `}_onImageLoad(t){const e=t.target,i=e.naturalWidth,n=e.naturalHeight;i&&n&&e.parentElement&&(e.parentElement.style.aspectRatio=`${i}/${n}`),this._imageLoaded=!0}static get styles(){return r`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: none !important;
      }

      .card-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }

      .card-title {
        padding: 12px 20px;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--ha-card-header-color, var(--primary-text-color));
      }

      .card-content {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .image-wrapper {
        position: relative;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        overflow: hidden;
      }

      .plan-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
      }

      .image-skeleton {
        position: absolute;
        inset: 0;
        background: var(--ha-card-background, #1e1e1e);
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 0.4; }
      }

      .entities-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .entities-overlay > * {
        pointer-events: auto;
      }

      .entity-badge {
        position: absolute;
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 2;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .entity-badge:hover {
        transform: translate(-50%, -50%) scale(1.12);
      }

      .entity-badge-inner {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--entity-color, var(--card-background-color, #2d2d2d));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: box-shadow 0.2s;
      }

      .entity-badge:hover .entity-badge-inner {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.15);
      }

      .entity-badge ha-icon {
        --mdc-icon-size: var(--icon-size, 26px);
        position: relative;
        z-index: 1;
      }

      .entity-badge.entity-on .entity-badge-inner {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107));
      }

      .entity-pulse {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 2px solid var(--state-icon-on-color, #ffc107);
        opacity: 0.5;
        animation: entity-pulse 2s ease-out infinite;
      }

      @keyframes entity-pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        100% { transform: scale(1.2); opacity: 0; }
      }

      .empty-state {
        padding: 48px 24px;
        text-align: center;
      }

      .empty-state-icon {
        margin-bottom: 20px;
      }

      .empty-state-icon ha-icon {
        font-size: 64px;
        color: var(--secondary-text-color, #9e9e9e);
        opacity: 0.7;
      }

      .empty-state-title {
        margin: 0 0 12px;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .empty-state-text {
        margin: 0;
        font-size: 0.9rem;
        color: var(--secondary-text-color);
        line-height: 1.5;
      }
    `}};t([lt({attribute:!1})],_t.prototype,"hass",void 0),t([dt()],_t.prototype,"config",void 0),t([dt()],_t.prototype,"_imageLoaded",void 0),_t=t([rt(yt)],_t),console.info("%c RAUMPLAN %c v1.0.0 ","color: #fff; background: #03a9f4; padding: 2px 8px; border-radius: 4px; font-weight: bold","color: #fff; background: #555; padding: 2px 8px; border-radius: 4px");let bt=class extends ot{constructor(){super(...arguments),this._config={type:"",image:"",entities:[]}}setConfig(t){var e;const i=t?Object.assign(Object.assign({},t),{image:"string"==typeof t.image?t.image:(null===(e=t.image)||void 0===e?void 0:e.location)||"",entities:Array.isArray(t.entities)?[...t.entities]:[]}):{type:"",image:"",entities:[]};this._config=i}_fireConfigChanged(t){!function(t,e,i,n){n=n||{},i=null==i?{}:i;var o=new Event(e,{bubbles:void 0===n.bubbles||n.bubbles,cancelable:Boolean(n.cancelable),composed:void 0===n.composed||n.composed});o.detail=i,t.dispatchEvent(o)}(this,"config-changed",{config:t})}_imageChanged(t){const e=t.target;this._config=Object.assign(Object.assign({},this._config),{image:e.value.trim()}),this._fireConfigChanged(this._config)}_titleChanged(t){const e=t.target;this._config=Object.assign(Object.assign({},this._config),{title:e.value.trim()}),this._fireConfigChanged(this._config)}_rotationChanged(t){const e=t.target;this._config=Object.assign(Object.assign({},this._config),{rotation:Number(e.value)||0}),this._fireConfigChanged(this._config)}_syncEntities(){var t;const e=null===(t=this.shadowRoot)||void 0===t?void 0:t.querySelectorAll(".entity-row");if(!e)return;const i=[];e.forEach((t,e)=>{var n,o,s,r,a,l;const d=t.querySelector('input[data-field="entity"]'),c=t.querySelector('input[data-field="x"]'),h=t.querySelector('input[data-field="y"]'),p=t.querySelector('input[data-field="scale"]'),u=t.querySelector('input[data-field="color"]'),v=null!==(o=null===(n=this._config.entities)||void 0===n?void 0:n[e])&&void 0!==o?o:{entity:""},g=c?Math.min(100,Math.max(0,Number(c.value)||50)):null!==(s=v.x)&&void 0!==s?s:50,m=h?Math.min(100,Math.max(0,Number(h.value)||50)):null!==(r=v.y)&&void 0!==r?r:50,f=p?Math.min(2,Math.max(.3,Number(p.value)||1)):null!==(a=v.scale)&&void 0!==a?a:1,y=(null===(l=null==u?void 0:u.value)||void 0===l?void 0:l.trim())||"",_=!!v.color,b=y&&("#03a9f4"!==y||_)?y:void 0;i.push({entity:((null==d?void 0:d.value)||"").trim()||v.entity||"",x:Math.round(10*g)/10,y:Math.round(10*m)/10,icon:v.icon,scale:f,color:b})}),this._config=Object.assign(Object.assign({},this._config),{entities:i}),this._fireConfigChanged(this._config)}_removeEntity(t){const e=[...this._config.entities||[]];e.splice(t,1),this._config=Object.assign(Object.assign({},this._config),{entities:e}),this._fireConfigChanged(this._config)}_addEntity(){const t=[...this._config.entities||[],{entity:"",x:50,y:50}];this._config=Object.assign(Object.assign({},this._config),{entities:t}),this._fireConfigChanged(this._config)}render(){var t,e;const i="string"==typeof this._config.image?this._config.image:(null===(t=this._config.image)||void 0===t?void 0:t.location)||"",n=this._config.title||"",o=Number(this._config.rotation)||0,s=this._config.entities||[],r=(null===(e=this.hass)||void 0===e?void 0:e.states)?Object.keys(this.hass.states).sort():[];return T`
      <div class="editor">
        <header class="editor-header">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <h3>Raumplan konfigurieren</h3>
        </header>

        <section class="editor-section">
          <h4 class="section-title">
            <ha-icon icon="mdi:image"></ha-icon>
            Bild
          </h4>
          <div class="field">
            <label>Bild-URL</label>
            <input
              type="text"
              .value=${i}
              placeholder="/local/raumplan.png"
              @change=${this._imageChanged}
            />
            <span class="hint">Bild unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.</span>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Titel</label>
              <input type="text" .value=${n} placeholder="Optional" @change=${this._titleChanged} />
            </div>
            <div class="field">
              <label>Drehung</label>
              <select .value=${String(o)} @change=${this._rotationChanged}>
                <option value="0">0°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
                <option value="270">270°</option>
              </select>
            </div>
          </div>
        </section>

        <section class="editor-section">
          <h4 class="section-title">
            <ha-icon icon="mdi:map-marker"></ha-icon>
            Entitäten
          </h4>
          <p class="section-hint">X/Y = Position in Prozent (0–100), Skalierung = Größe des Kreises.</p>

          <div class="entity-list">
            ${s.map((t,e)=>T`
                <div class="entity-row" data-index="${e}">
                  <input
                    type="text"
                    data-field="entity"
                    list="rp-entities-${e}"
                    .value=${t.entity}
                    placeholder="light.wohnzimmer"
                    @change=${()=>this._syncEntities()}
                  />
                  <datalist id="rp-entities-${e}">
                    ${r.slice(0,200).map(t=>T`<option value="${t}">${function(t,e){var i,n;const o=null===(i=null==t?void 0:t.states)||void 0===i?void 0:i[e];return(null===(n=null==o?void 0:o.attributes)||void 0===n?void 0:n.friendly_name)||e}(this.hass,t)}</option>`)}
                  </datalist>
                  <div class="entity-coords">
                    <input type="number" data-field="x" min="0" max="100" step="0.1" .value=${String(Number(t.x)||50)} placeholder="X" title="X (%)" @change=${()=>this._syncEntities()} />
                    <input type="number" data-field="y" min="0" max="100" step="0.1" .value=${String(Number(t.y)||50)} placeholder="Y" title="Y (%)" @change=${()=>this._syncEntities()} />
                  </div>
                  <input type="number" data-field="scale" min="0.3" max="2" step="0.1" .value=${String(Math.min(2,Math.max(.3,Number(t.scale)||1)))} placeholder="1" title="Skalierung" @change=${()=>this._syncEntities()} />
                  <input type="color" data-field="color" .value=${t.color||"#03a9f4"} title="Farbe" @change=${()=>this._syncEntities()} />
                  <button type="button" class="btn-remove" @click=${()=>this._removeEntity(e)} title="Entfernen">
                    <ha-icon icon="mdi:delete-outline"></ha-icon>
                  </button>
                </div>
              `)}
          </div>

          <button type="button" class="btn-add" @click=${this._addEntity}>
            <ha-icon icon="mdi:plus"></ha-icon>
            Entität hinzufügen
          </button>
        </section>
      </div>
    `}static get styles(){return r`
      .editor {
        padding: 16px 20px;
        max-width: 560px;
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
      }

      .editor-header h3 {
        margin: 0;
        font-size: 1.1rem;
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
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .section-title ha-icon {
        color: var(--primary-color, #03a9f4);
      }

      .section-hint {
        margin: 0 0 12px;
        font-size: 0.85rem;
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
        font-size: 14px;
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
        line-height: 1.4;
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

      .entity-row input[data-field='entity'] {
        flex: 1;
        min-width: 140px;
      }

      .entity-coords {
        display: flex;
        gap: 6px;
      }

      .entity-coords input {
        width: 52px;
        padding: 8px 10px;
      }

      .entity-row input[data-field='scale'] {
        width: 60px;
        padding: 8px 10px;
      }

      .entity-row input[type='color'] {
        width: 36px;
        height: 36px;
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
        transition: background 0.2s;
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
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
      }

      .btn-add:hover {
        border-color: var(--primary-color, #03a9f4);
        background: rgba(3, 169, 244, 0.08);
      }
    `}};t([lt({attribute:!1})],bt.prototype,"hass",void 0),t([dt()],bt.prototype,"_config",void 0),bt=t([rt("room-plan-editor")],bt);var $t=Object.freeze({__proto__:null,get RoomPlanEditor(){return bt}});export{_t as RoomPlanCard};
