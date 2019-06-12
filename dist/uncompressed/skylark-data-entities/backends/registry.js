define([
	
],function(){
	var providers = {

	};

	function add(name,setting) {
		providers[name] = setting;
	}

	function remove(name) {
		delete provides[name];
	}

	function get(name) {
		return providers[name];
	}

	return {
		add : add,
		remove: remove,
		get : get
	}
});