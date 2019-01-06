/**
 * skylark-fw-model - The skylark model layer framework library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/langx","./models","./backends/registry"],function(n,e,r){return e.sync=function(e,i,d){if(!d.backend)throw new Error("The backend is not specified");var a=r.get(d.backend);if(!a)throw new Error("The backend is not defined:"+d.backend);var o=a.sync;if(!o)throw new Error("The backend sync method is not defined:"+d.backend);var t=n.mixin({},a.options,d);return o.apply(this,[e,i,t])}});
//# sourceMappingURL=sourcemaps/sync.js.map
