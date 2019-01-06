define([
    "skylark-langx/langx"
], function(langx) {
    function models() {
        return models;
    }

    langx.mixin(models, {
        // set a `X-Http-Method-Override` header.
        emulateHTTP : false,

        // Turn on `emulateJSON` to support legacy servers that can't deal with direct
        // `application/json` requests ... this will encode the body as
        // `application/x-www-form-urlencoded` instead and will send the model in a
        // form param named `model`.
        emulateJSON : false,

        backends : {
            
        }
    });


    return models;
});
