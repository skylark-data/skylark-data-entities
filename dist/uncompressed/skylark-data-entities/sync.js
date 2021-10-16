define([
	"skylark-langx/langx",
	"./entities",
  	"./backends/registry"
],function(langx,entities,registry){

	// Override 'Backbone.sync' to default to localSync,
	// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
	function sync(method, model, options) {
		if (!options.backend) {
			throw new Error("The backend is not specified")
		}
		var setting = registry.get(options.backend);
		if (!setting) {
			throw new Error("The backend is not defined:" + options.backend);
		}
		var syncMethod = setting.sync;
		if (!syncMethod) {
			throw new Error("The backend sync method is not defined:" + options.backend);
		}

		var options2 = langx.mixin({},setting.options,options);
	  	return syncMethod.apply(this, [method, model, options2]);
	};

  
   return entities.sync = sync;

});