define([
	"skylark-langx/langx",
	"../models"
],function(langx,models){
	var providers = {};

	function add(name,setting) {
		providers[name] = setting;
	}

	function remove(name) {
		delete provides[name];
	}

	function get(name) {
		return providers[name];
	}

	return models.backends.registry = {
		add : add,
		remove: remove,
		get : get
	};
});