/**
 * skylark-data-entities - The skylark entityframework library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/langx","./entities","./backends/registry"],function(n,e,r){return e.sync=function(e,i,t){if(!t.backend)throw new Error("The backend is not specified");var a=r.get(t.backend);if(!a)throw new Error("The backend is not defined:"+t.backend);var d=a.sync;if(!d)throw new Error("The backend sync method is not defined:"+t.backend);var c=n.mixin({},a.options,t);return d.apply(this,[e,i,c])}});
//# sourceMappingURL=sourcemaps/sync.js.map
