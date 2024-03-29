define([
	"skylark-langx/langx",
	"./entities",
	"./Entity"
],function(langx,entities,Entity){
  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error.call(options.context, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };


	var Collection  = langx.Evented.inherit({
		"_construct" : function(entities, options) {
			options || (options = {});
			if (options.entity) this.entity = options.entity;
			if (options.comparator !== void 0) this.comparator = options.comparator;
			this._reset();
			if (entities) this.reset(entities, langx.mixin({silent: true}, options));
		}
	}); 

	// Default options for `Collection#set`.
	var setOptions = {add: true, remove: true, merge: true};
	var addOptions = {add: true, remove: false};

	// Splices `insert` into `array` at index `at`.
	var splice = function(array, insert, at) {
		at = Math.min(Math.max(at, 0), array.length);
		var tail = Array(array.length - at);
		var length = insert.length;
		var i;
		for (i = 0; i < tail.length; i++) tail[i] = array[i + at];
		for (i = 0; i < length; i++) array[i + at] = insert[i];
		for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
	};

  // Define the Collection's inheritable methods.
	Collection.partial({

		// The default entity for a collection is just a **Entity**.
		// This should be overridden in most cases.
		entity: Entity,

		// Initialize is an empty function by default. Override it with your own
		// initialization logic.
		initialize: function(){},

		// The JSON representation of a Collection is an array of the
		// entities' attributes.
		toJSON: function(options) {
		  return this.map(function(entity) { return entity.toJSON(options); });
		},

		// Proxy `entities.sync` by default.
		sync: function() {
		  return entities.sync.apply(this, arguments);
		},

		// Add a entity, or list of entities to the set. `entities` may be Backbone
		// Entitys or raw JavaScript objects to be converted to Entitys, or any
		// combination of the two.
		add: function(entities, options) {
		  return this.set(entities, langx.mixin({merge: false}, options, addOptions));
		},

		// Remove a entity, or a list of entities from the set.
		remove: function(entities, options) {
		  options = langx.mixin({}, options);
		  var singular = !langx.isArray(entities);
		  entities = singular ? [entities] : entities.slice();
		  var removed = this._removeEntitys(entities, options);
		  if (!options.silent && removed.length) {
		    options.changes = {added: [], merged: [], removed: removed};
		    this.trigger('update', this, options);
		  }
		  return singular ? removed[0] : removed;
		},

		// Update a collection by `set`-ing a new list of entities, adding new ones,
		// removing entities that are no longer present, and merging entities that
		// already exist in the collection, as necessary. Similar to **Entity#set**,
		// the core operation for updating the data contained by the collection.
		set: function(entities, options) {
		  if (entities == null) return;

		  options = langx.mixin({}, setOptions, options);
		  if (options.parse && !this._isEntity(entities)) {
		    entities = this.parse(entities, options) || [];
		  }

		  var singular = !langx.isArray(entities);
		  entities = singular ? [entities] : entities.slice();

		  var at = options.at;
		  if (at != null) at = +at;
		  if (at > this.length) at = this.length;
		  if (at < 0) at += this.length + 1;

		  var set = [];
		  var toAdd = [];
		  var toMerge = [];
		  var toRemove = [];
		  var modelMap = {};

		  var add = options.add;
		  var merge = options.merge;
		  var remove = options.remove;

		  var sort = false;
		  var sortable = this.comparator && at == null && options.sort !== false;
		  var sortAttr = langx.isString(this.comparator) ? this.comparator : null;

		  // Turn bare objects into entity references, and prevent invalid entities
		  // from being added.
		  var entity, i;
		  for (i = 0; i < entities.length; i++) {
		    entity = entities[i];

		    // If a duplicate is found, prevent it from being added and
		    // optionally merge it into the existing entity.
		    var existing = this.get(entity);
		    if (existing) {
		      if (merge && entity !== existing) {
		        var attrs = this._isEntity(entity) ? entity.attributes : entity;
		        if (options.parse) attrs = existing.parse(attrs, options);
		        existing.set(attrs, options);
		        toMerge.push(existing);
		        if (sortable && !sort) sort = existing.hasChanged(sortAttr);
		      }
		      if (!modelMap[existing.cid]) {
		        modelMap[existing.cid] = true;
		        set.push(existing);
		      }
		      entities[i] = existing;

		    // If this is a new, valid entity, push it to the `toAdd` list.
		    } else if (add) {
		      entity = entities[i] = this._prepareEntity(entity, options);
		      if (entity) {
		        toAdd.push(entity);
		        this._addReference(entity, options);
		        modelMap[entity.cid] = true;
		        set.push(entity);
		      }
		    }
		  }

		  // Remove stale entities.
		  if (remove) {
		    for (i = 0; i < this.length; i++) {
		      entity = this.entities[i];
		      if (!modelMap[entity.cid]) toRemove.push(entity);
		    }
		    if (toRemove.length) this._removeEntitys(toRemove, options);
		  }

		  // See if sorting is needed, update `length` and splice in new entities.
		  var orderChanged = false;
		  var replace = !sortable && add && remove;
		  if (set.length && replace) {
		    orderChanged = this.length !== set.length || this.entities.some(function(m, index) {
		      return m !== set[index];
		    });
		    this.entities.length = 0;
		    splice(this.entities, set, 0);
		    this.length = this.entities.length;
		  } else if (toAdd.length) {
		    if (sortable) sort = true;
		    splice(this.entities, toAdd, at == null ? this.length : at);
		    this.length = this.entities.length;
		  }

		  // Silently sort the collection if appropriate.
		  if (sort) this.sort({silent: true});

		  // Unless silenced, it's time to fire all appropriate add/sort/update events.
		  if (!options.silent) {
		    for (i = 0; i < toAdd.length; i++) {
		      if (at != null) options.index = at + i;
		      entity = toAdd[i];
		      entity.trigger('add', entity, this, options);
		    }
		    if (sort || orderChanged) this.trigger('sort', this, options);
		    if (toAdd.length || toRemove.length || toMerge.length) {
		      options.changes = {
		        added: toAdd,
		        removed: toRemove,
		        merged: toMerge
		      };
		      this.trigger('update', this, options);
		    }
		  }

		  // Return the added (or merged) entity (or entities).
		  return singular ? entities[0] : entities;
		},

		// When you have more items than you want to add or remove individually,
		// you can reset the entire set with a new list of entities, without firing
		// any granular `add` or `remove` events. Fires `reset` when finished.
		// Useful for bulk operations and optimizations.
		reset: function(entities, options) {
		  options = options ? langx.clone(options) : {};
		  for (var i = 0; i < this.entities.length; i++) {
		    this._removeReference(this.entities[i], options);
		  }
		  options.previousEntitys = this.entities;
		  this._reset();
		  entities = this.add(entities, langx.mixin({silent: true}, options));
		  if (!options.silent) this.trigger('reset', this, options);
		  return entities;
		},

		// Add a entity to the end of the collection.
		push: function(entity, options) {
		  return this.add(entity, langx.mixin({at: this.length}, options));
		},

		// Remove a entity from the end of the collection.
		pop: function(options) {
		  var entity = this.at(this.length - 1);
		  return this.remove(entity, options);
		},

		// Add a entity to the beginning of the collection.
		unshift: function(entity, options) {
		  return this.add(entity, langx.mixin({at: 0}, options));
		},

		// Remove a entity from the beginning of the collection.
		shift: function(options) {
		  var entity = this.at(0);
		  return this.remove(entity, options);
		},

		// Slice out a sub-array of entities from the collection.
		slice: function() {
		  return slice.apply(this.entities, arguments);
		},

		// Get a entity from the set by id, cid, entity object with id or cid
		// properties, or an attributes object that is transformed through entityId.
		get: function(obj) {
		  if (obj == null) return void 0;
		  return this._byId[obj] ||
		    this._byId[this.entityId(obj.attributes || obj)] ||
		    obj.cid && this._byId[obj.cid];
		},

		// Returns `true` if the entity is in the collection.
		has: function(obj) {
		  return this.get(obj) != null;
		},

		// Get the entity at the given index.
		at: function(index) {
		  if (index < 0) index += this.length;
		  return this.entities[index];
		},

		// Return entities with matching attributes. Useful for simple cases of
		// `filter`.
		where: function(attrs, first) {
		  return this[first ? 'find' : 'filter'](attrs);
		},

		// Return the first entity with matching attributes. Useful for simple cases
		// of `find`.
		findWhere: function(attrs) {
		  return this.where(attrs, true);
		},

		// Force the collection to re-sort itself. You don't need to call this under
		// normal circumstances, as the set will maintain sort order as each item
		// is added.
		sort: function(options) {
		  var comparator = this.comparator;
		  if (!comparator) throw new Error('Cannot sort a set without a comparator');
		  options || (options = {});

		  var length = comparator.length;
		  if (langx.isFunction(comparator)) comparator = langx.proxy(comparator, this);

		  // Run sort based on type of `comparator`.
		  if (length === 1 || langx.isString(comparator)) {
		    this.entities = this.sortBy(comparator);
		  } else {
		    this.entities.sort(comparator);
		  }
		  if (!options.silent) this.trigger('sort', this, options);
		  return this;
		},

		// Pluck an attribute from each entity in the collection.
		pluck: function(attr) {
		  return this.map(attr + '');
		},

		// Fetch the default set of entities for this collection, resetting the
		// collection when they arrive. If `reset: true` is passed, the response
		// data will be passed through the `reset` method instead of `set`.
		fetch: function(options) {
		  options = langx.mixin({parse: true}, options);
		  var success = options.success;
		  var collection = this;
		  options.success = function(resp) {
		    var method = options.reset ? 'reset' : 'set';
		    collection[method](resp, options);
		    if (success) success.call(options.context, collection, resp, options);
		    collection.trigger('sync', collection, resp, options);
		  };
		  wrapError(this, options);
		  return this.sync('read', this, options);
		},

		// Create a new instance of a entity in this collection. Add the entity to the
		// collection immediately, unless `wait: true` is passed, in which case we
		// wait for the server to agree.
		create: function(entity, options) {
		  options = options ? langx.clone(options) : {};
		  var wait = options.wait;
		  entity = this._prepareEntity(entity, options);
		  if (!entity) return false;
		  if (!wait) this.add(entity, options);
		  var collection = this;
		  var success = options.success;
		  options.success = function(m, resp, callbackOpts) {
		    if (wait) collection.add(m, callbackOpts);
		    if (success) success.call(callbackOpts.context, m, resp, callbackOpts);
		  };
		  entity.save(null, options);
		  return entity;
		},

		// **parse** converts a response into a list of entities to be added to the
		// collection. The default implementation is just to pass it through.
		parse: function(resp, options) {
		  return resp;
		},

		// Create a new collection with an identical list of entities as this one.
		clone: function() {
		  return new this.constructor(this.entities, {
		    entity: this.entity,
		    comparator: this.comparator
		  });
		},

		// Define how to uniquely identify entities in the collection.
		entityId: function(attrs) {
		  return attrs[this.entity.prototype && this.entity.prototype.idAttribute || 'id'];
		},

		// Private method to reset all internal state. Called when the collection
		// is first initialized or reset.
		_reset: function() {
		  this.length = 0;
		  this.entities = [];
		  this._byId  = {};
		},

		// Prepare a hash of attributes (or other entity) to be added to this
		// collection.
		_prepareEntity: function(attrs, options) {
		  if (this._isEntity(attrs)) {
		    if (!attrs.collection) attrs.collection = this;
		    return attrs;
		  }
		  options = options ? langx.clone(options) : {};
		  options.collection = this;
		  var entity = new this.entity(attrs, options);
		  if (!entity.validationError) return entity;
		  this.trigger('invalid', this, entity.validationError, options);
		  return false;
		},

		// Internal method called by both remove and set.
		_removeEntitys: function(entities, options) {
		  var removed = [];
		  for (var i = 0; i < entities.length; i++) {
		    var entity = this.get(entities[i]);
		    if (!entity) continue;

		    var index = this.indexOf(entity);
		    this.entities.splice(index, 1);
		    this.length--;

		    // Remove references before triggering 'remove' event to prevent an
		    // infinite loop. #3693
		    delete this._byId[entity.cid];
		    var id = this.entityId(entity.attributes);
		    if (id != null) delete this._byId[id];

		    if (!options.silent) {
		      options.index = index;
		      entity.trigger('remove', entity, this, options);
		    }

		    removed.push(entity);
		    this._removeReference(entity, options);
		  }
		  return removed;
		},

		// Method for checking whether an object should be considered a entity for
		// the purposes of adding to the collection.
		_isEntity: function(entity) {
		  return entity instanceof Entity;
		},

		// Internal method to create a entity's ties to a collection.
		_addReference: function(entity, options) {
		  this._byId[entity.cid] = entity;
		  var id = this.entityId(entity.attributes);
		  if (id != null) this._byId[id] = entity;
		  entity.on('all', this._onEntityEvent, this);
		},

		// Internal method to sever a entity's ties to a collection.
		_removeReference: function(entity, options) {
		  delete this._byId[entity.cid];
		  var id = this.entityId(entity.attributes);
		  if (id != null) delete this._byId[id];
		  if (this === entity.collection) delete entity.collection;
		  entity.off('all', this._onEntityEvent, this);
		},

		// Internal method called every time a entity in the set fires an event.
		// Sets need to update their indexes when entities change ids. All other
		// events simply proxy through. "add" and "remove" events that originate
		// in other collections are ignored.
		_onEntityEvent: function(event, entity, collection, options) {
		  if (entity) {
		    if ((event === 'add' || event === 'remove') && collection !== this) return;
		    if (event === 'destroy') this.remove(entity, options);
		    if (event === 'change') {
		      var prevId = this.entityId(entity.previousAttributes());
		      var id = this.entityId(entity.attributes);
		      if (prevId !== id) {
		        if (prevId != null) delete this._byId[prevId];
		        if (id != null) this._byId[id] = entity;
		      }
		    }
		  }
		  this.trigger.apply(this, arguments);
		}

  	});

	return entities.Collection = Collection;
});