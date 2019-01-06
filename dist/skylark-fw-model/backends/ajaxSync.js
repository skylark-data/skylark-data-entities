/**
 * skylark-fw-model - The skylark model layer framework library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/langx","../models"],function(e,t){var a={create:"POST",update:"PUT",patch:"PATCH",delete:"DELETE",read:"GET"};return t.backends.ajaxSync=function(r,n,u){var l=a[r];e.defaults(u||(u={}),{emulateHTTP:t.emulateHTTP,emulateJSON:t.emulateJSON});var o={type:l,dataType:"json"};if(u.url||(o.url=e.result(n,"url")||urlError()),null!=u.data||!n||"create"!==r&&"update"!==r&&"patch"!==r||(o.contentType="application/json",o.data=JSON.stringify(u.attrs||n.toJSON(u))),u.emulateJSON&&(o.contentType="application/x-www-form-urlencoded",o.data=o.data?{entity:o.data}:{}),u.emulateHTTP&&("PUT"===l||"DELETE"===l||"PATCH"===l)){o.type="POST",u.emulateJSON&&(o.data._method=l);var d=u.beforeSend;u.beforeSend=function(e){if(e.setRequestHeader("X-HTTP-Method-Override",l),d)return d.apply(this,arguments)}}"GET"===o.type||u.emulateJSON||(o.processData=!1);var T=u.error;u.error=function(e,t,a){u.textStatus=t,u.errorThrown=a,T&&T.call(u.context,e,t,a)};var i=u.xhr=e.Xhr.request(e.mixin(o,u));return n.trigger("request",n,i,u),i}});
//# sourceMappingURL=../sourcemaps/backends/ajaxSync.js.map
