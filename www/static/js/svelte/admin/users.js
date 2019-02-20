(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('svelte/admin/users', factory) :
	(global['admin/users'] = factory());
}(this, (function () { 'use strict';

function noop() {}

function assign(tar, src) {
	for (var k in src) { tar[k] = src[k]; }
	return tar;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function destroyEach(iterations) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) { iterations[i].d(); }
	}
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) { this._fragment.u(); }
	this._fragment.d();
	this._fragment = this._state = null;
}

function destroyDev(detach) {
	destroy.call(this, detach);
	this.destroy = function() {
		console.warn('Component was already destroyed');
	};
}

function _differs(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function _differsImmutable(a, b) {
	return a != a ? b == b : a !== b;
}

function fire(eventName, data) {
	var this$1 = this;

	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) { return; }

	for (var i = 0; i < handlers.length; i += 1) {
		var handler = handlers[i];

		if (!handler.__calling) {
			handler.__calling = true;
			handler.call(this$1, data);
			handler.__calling = false;
		}
	}
}

function getDev(key) {
	if (key) { console.warn("`let x = component.get('x')` is deprecated. Use `let { x } = component.get()` instead"); }
	return get.call(this, key);
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function init(component, options) {
	component._handlers = blankObject();
	component._bind = options._bind;

	component.options = options;
	component.root = options.root || component;
	component.store = component.root.store || options.store;
}

function observe(key, callback, options) {
	var fn = callback.bind(this);

	if (!options || options.init !== false) {
		fn(this.get()[key], undefined);
	}

	return this.on(options && options.defer ? 'update' : 'state', function(event) {
		if (event.changed[key]) { fn(event.current[key], event.previous && event.previous[key]); }
	});
}

function observeDev(key, callback, options) {
	console.warn("this.observe(key, (newValue, oldValue) => {...}) is deprecated. Use\n\n  // runs before DOM updates\n  this.on('state', ({ changed, current, previous }) => {...});\n\n  // runs after DOM updates\n  this.on('update', ...);\n\n...or add the observe method from the svelte-extras package");

	var c = (key = '' + key).search(/[.[]/);
	if (c > -1) {
		var message =
			'The first argument to component.observe(...) must be the name of a top-level property';
		if (c > 0)
			{ message += ", i.e. '" + key.slice(0, c) + "' rather than '" + key + "'"; }

		throw new Error(message);
	}

	return observe.call(this, key, callback, options);
}

function on(eventName, handler) {
	if (eventName === 'teardown') { return this.on('destroy', handler); }

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) { handlers.splice(index, 1); }
		}
	};
}

function onDev(eventName, handler) {
	if (eventName === 'teardown') {
		console.warn(
			"Use component.on('destroy', ...) instead of component.on('teardown', ...) which has been deprecated and will be unsupported in Svelte 2"
		);
		return this.on('destroy', handler);
	}

	return on.call(this, eventName, handler);
}

function set(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) { return; }
	this.root._lock = true;
	callAll(this.root._beforecreate);
	callAll(this.root._oncreate);
	callAll(this.root._aftercreate);
	this.root._lock = false;
}

function _set(newState) {
	var this$1 = this;

	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (this$1._differs(newState[key], oldState[key])) { changed[key] = dirty = true; }
	}
	if (!dirty) { return; }

	this._state = assign(assign({}, oldState), newState);
	this._recompute(changed, this._state);
	if (this._bind) { this._bind(changed, this._state); }

	if (this._fragment) {
		this.fire("state", { changed: changed, current: this._state, previous: oldState });
		this._fragment.p(changed, this._state);
		this.fire("update", { changed: changed, current: this._state, previous: oldState });
	}
}

function setDev(newState) {
	if (typeof newState !== 'object') {
		throw new Error(
			this._debugName + '.set was called without an object of data key-values to update.'
		);
	}

	this._checkReadOnly(newState);
	set.call(this, newState);
}

function callAll(fns) {
	while (fns && fns.length) { fns.shift()(); }
}

function _mount(target, anchor) {
	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
}

function _unmount() {
	if (this._fragment) { this._fragment.u(); }
}

var protoDev = {
	destroy: destroyDev,
	get: getDev,
	fire: fire,
	observe: observeDev,
	on: onDev,
	set: setDev,
	teardown: destroyDev,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount,
	_differs: _differs
};

/* globals dw */

function __(key, scope) {
	var arguments$1 = arguments;
	if ( scope === void 0 ) scope='core';

	key = key.trim();
	if (!dw.backend.__messages[scope]) { return 'MISSING:'+key; }
    var translation = dw.backend.__messages[scope][key] || dw.backend.__messages.core[key] || key;

    if (arguments.length > 2) {
        for (var i=2; i<arguments.length; i++) {
            var index = i-1;
            translation = translation.replace("$"+index, arguments$1[i]);
        }    
    }

    return translation;
}

// quick reference variables for speed access

// `_isArray` : an object's function

function fetchJSON(url, method, credentials, body, callback) {
    var opts = {
        method: method, body: body,
        mode: 'cors',
        credentials: credentials
    };

    window.fetch(url, opts)
    .then(function (res) {
        if (res.status !== 200) { return new Error(res.statusText); }
        return res.text();
    })
    .then(function (text) {
        try {
            return JSON.parse(text);
        } catch (Error) {
            // could not parse json, so just return text
            console.warn('malformed json input', text);
            return text;
        }
    })
    .then(callback)
    .catch(function (err) {
        console.error(err);
    });
}

function getJSON(url, credentials, callback) {
    if (arguments.length === 2) {
        callback = credentials;
        credentials = "include";
    }

    return fetchJSON(url, 'GET', credentials, null, callback);
}

/* admin/users/UserAdminRow.html generated by Svelte v1.64.0 */

function isCurrentStatus(ref) {
	var user = ref.user;

	return function (status) { return user.Role === status; };
}

function statusName(ref) {
	var user = ref.user;
	var statusOptions = ref.statusOptions;

	return statusOptions.find(function (ref) {
		var slug = ref.slug;

		return slug === user.Role;
	}).name;
}

function data() {
    return {
        user: {},
        edit: false,

        // TODO: status options should probably be dynamic – how to load them?
        statusOptions: [
            { slug: 'pending', name: 'Pending' },
            { slug: 'editor', name: 'Editor' },
            { slug: 'graphic-editor', name: 'Graphic Editor' },
            { slug: 'admin', name: 'Administrator' }
        ]
    };
}
var methods = {
    save: function save() {
        // TODO: save changes through API
        this.set({ edit: false });
    }
};

function create_main_fragment(component, state) {
	var tr, td, a, text_value = state.user.Id, text, a_href_value, text_1, tr_data_id_value;

	function select_block_type(state) {
		if (!state.edit) { return create_if_block; }
		return create_if_block_1;
	}

	var current_block_type = select_block_type(state);
	var if_block = current_block_type(component, state);

	return {
		c: function create() {
			tr = createElement("tr");
			td = createElement("td");
			a = createElement("a");
			text = createText(text_value);
			text_1 = createText("\n    ");
			if_block.c();
			this.h();
		},

		h: function hydrate() {
			a.href = a_href_value = "/admin/users/" + state.user.Id;
			td.className = "id out";
			tr.className = "user";
			tr.dataset.id = tr_data_id_value = state.user.Id;
		},

		m: function mount(target, anchor) {
			insertNode(tr, target, anchor);
			appendNode(td, tr);
			appendNode(a, td);
			appendNode(text, a);
			appendNode(text_1, tr);
			if_block.m(tr, null);
		},

		p: function update(changed, state) {
			if ((changed.user) && text_value !== (text_value = state.user.Id)) {
				text.data = text_value;
			}

			if ((changed.user) && a_href_value !== (a_href_value = "/admin/users/" + state.user.Id)) {
				a.href = a_href_value;
			}

			if (current_block_type === (current_block_type = select_block_type(state)) && if_block) {
				if_block.p(changed, state);
			} else {
				if_block.u();
				if_block.d();
				if_block = current_block_type(component, state);
				if_block.c();
				if_block.m(tr, null);
			}

			if ((changed.user) && tr_data_id_value !== (tr_data_id_value = state.user.Id)) {
				tr.dataset.id = tr_data_id_value;
			}
		},

		u: function unmount() {
			detachNode(tr);
			if_block.u();
		},

		d: function destroy$$1() {
			if_block.d();
		}
	};
}

// (34:12) {#each statusOptions as status}
function create_each_block(component, state) {
	var status = state.status, each_value = state.each_value, status_index = state.status_index;
	var option, text_value = __(status.name, 'admin-users'), text, option_value_value, option_selected_value;

	return {
		c: function create() {
			option = createElement("option");
			text = createText(text_value);
			this.h();
		},

		h: function hydrate() {
			option.__value = option_value_value = status.slug;
			option.value = option.__value;
			option.selected = option_selected_value = state.isCurrentStatus(status.slug);
		},

		m: function mount(target, anchor) {
			insertNode(option, target, anchor);
			appendNode(text, option);
		},

		p: function update(changed, state) {
			status = state.status;
			each_value = state.each_value;
			status_index = state.status_index;
			if ((changed.statusOptions) && text_value !== (text_value = __(status.name, 'admin-users'))) {
				text.data = text_value;
			}

			if ((changed.statusOptions) && option_value_value !== (option_value_value = status.slug)) {
				option.__value = option_value_value;
			}

			option.value = option.__value;
			if ((changed.isCurrentStatus || changed.statusOptions) && option_selected_value !== (option_selected_value = state.isCurrentStatus(status.slug))) {
				option.selected = option_selected_value;
			}
		},

		u: function unmount() {
			detachNode(option);
		},

		d: noop
	};
}

// (3:4) {#if !edit}
function create_if_block(component, state) {
	var td, text_value = state.user.Name || '', text, text_1, td_1, text_2_value = state.user.Email, text_2, text_3, td_2, i, text_4, text_5_value = __(state.statusName, 'admin-users'), text_5, text_7, td_3, text_8_value = state.user.CreatedAt, text_8, text_9, td_4, a, a_href_value, text_12, td_5, button, i_1, i_1_title_value, text_14, button_1, i_2, i_2_title_value, text_16, button_2, i_3, i_3_title_value;

	function click_handler(event) {
		component.set({ edit: true });
	}

	return {
		c: function create() {
			td = createElement("td");
			text = createText(text_value);
			text_1 = createText("\n    ");
			td_1 = createElement("td");
			text_2 = createText(text_2_value);
			text_3 = createText("\n    ");
			td_2 = createElement("td");
			i = createElement("i");
			text_4 = createText("\n        ");
			text_5 = createText(text_5_value);
			text_7 = createText("\n    ");
			td_3 = createElement("td");
			text_8 = createText(text_8_value);
			text_9 = createText("\n    ");
			td_4 = createElement("td");
			a = createElement("a");
			a.textContent = "X";
			text_12 = createText("\n    ");
			td_5 = createElement("td");
			button = createElement("button");
			i_1 = createElement("i");
			text_14 = createText("\n        ");
			button_1 = createElement("button");
			i_2 = createElement("i");
			text_16 = createText("\n        ");
			button_2 = createElement("button");
			i_3 = createElement("i");
			this.h();
		},

		h: function hydrate() {
			td.className = "name out";
			td_1.className = "email out";
			i.className = "icon-user";
			i.title = "Editor";
			td_3.className = "creation out";
			a.href = a_href_value = "/admin/chart/by/" + state.user.Id;
			td_4.className = "center";
			i_1.className = "icon-pencil";
			i_1.title = i_1_title_value = __('edit', 'admin-users');
			addListener(button, "click", click_handler);
			button.className = "action svelte-1q6ii24";
			i_2.className = "icon-envelope";
			i_2.title = i_2_title_value = __('reset the password and send a mail', 'admin-users');
			button_1.className = "action svelte-1q6ii24";
			i_3.className = "icon-trash";
			i_3.title = i_3_title_value = __('delete', 'admin-users');
			button_2.className = "action svelte-1q6ii24";
			td_5.className = "actions";
		},

		m: function mount(target, anchor) {
			insertNode(td, target, anchor);
			appendNode(text, td);
			insertNode(text_1, target, anchor);
			insertNode(td_1, target, anchor);
			appendNode(text_2, td_1);
			insertNode(text_3, target, anchor);
			insertNode(td_2, target, anchor);
			appendNode(i, td_2);
			appendNode(text_4, td_2);
			appendNode(text_5, td_2);
			insertNode(text_7, target, anchor);
			insertNode(td_3, target, anchor);
			appendNode(text_8, td_3);
			insertNode(text_9, target, anchor);
			insertNode(td_4, target, anchor);
			appendNode(a, td_4);
			insertNode(text_12, target, anchor);
			insertNode(td_5, target, anchor);
			appendNode(button, td_5);
			appendNode(i_1, button);
			appendNode(text_14, td_5);
			appendNode(button_1, td_5);
			appendNode(i_2, button_1);
			appendNode(text_16, td_5);
			appendNode(button_2, td_5);
			appendNode(i_3, button_2);
		},

		p: function update(changed, state) {
			if ((changed.user) && text_value !== (text_value = state.user.Name || '')) {
				text.data = text_value;
			}

			if ((changed.user) && text_2_value !== (text_2_value = state.user.Email)) {
				text_2.data = text_2_value;
			}

			if ((changed.statusName) && text_5_value !== (text_5_value = __(state.statusName, 'admin-users'))) {
				text_5.data = text_5_value;
			}

			if ((changed.user) && text_8_value !== (text_8_value = state.user.CreatedAt)) {
				text_8.data = text_8_value;
			}

			if ((changed.user) && a_href_value !== (a_href_value = "/admin/chart/by/" + state.user.Id)) {
				a.href = a_href_value;
			}
		},

		u: function unmount() {
			detachNode(td);
			detachNode(text_1);
			detachNode(td_1);
			detachNode(text_3);
			detachNode(td_2);
			detachNode(text_7);
			detachNode(td_3);
			detachNode(text_9);
			detachNode(td_4);
			detachNode(text_12);
			detachNode(td_5);
		},

		d: function destroy$$1() {
			removeListener(button, "click", click_handler);
		}
	};
}

// (28:4) {:else}
function create_if_block_1(component, state) {
	var td, input, input_value_value, text_1, td_1, select, text_3, td_2, text_5, td_3, text_7, td_4, text_9, td_5, button, i, i_title_value, text_11, button_1, i_1, i_1_title_value;

	var each_value = state.statusOptions;

	var each_blocks = [];

	for (var i_2 = 0; i_2 < each_value.length; i_2 += 1) {
		each_blocks[i_2] = create_each_block(component, assign(assign({}, state), {
			each_value: each_value,
			status: each_value[i_2],
			status_index: i_2
		}));
	}

	function click_handler(event) {
		component.save();
	}

	function click_handler_1(event) {
		component.set({ edit: false });
	}

	return {
		c: function create() {
			td = createElement("td");
			input = createElement("input");
			text_1 = createText("\n    ");
			td_1 = createElement("td");
			select = createElement("select");

			for (var i_2 = 0; i_2 < each_blocks.length; i_2 += 1) {
				each_blocks[i_2].c();
			}

			text_3 = createText("\n    ");
			td_2 = createElement("td");
			td_2.textContent = "2019-01-31 11:46:25";
			text_5 = createText("\n    ");
			td_3 = createElement("td");
			td_3.textContent = "--";
			text_7 = createText("\n    ");
			td_4 = createElement("td");
			td_4.textContent = "--";
			text_9 = createText("\n    ");
			td_5 = createElement("td");
			button = createElement("button");
			i = createElement("i");
			text_11 = createText("\n        ");
			button_1 = createElement("button");
			i_1 = createElement("i");
			this.h();
		},

		h: function hydrate() {
			setAttribute(input, "type", "text");
			input.value = input_value_value = state.user.Email;
			td.className = "email";
			select.name = "status";
			td_2.className = "creation out";
			td_3.className = "center";
			td_4.className = "center";
			i.className = "icon-ok";
			i.title = i_title_value = __('save', 'admin-users');
			addListener(button, "click", click_handler);
			button.className = "action svelte-1q6ii24";
			i_1.className = "icon-remove";
			i_1.title = i_1_title_value = __('cancel', 'admin-users');
			addListener(button_1, "click", click_handler_1);
			button_1.className = "action svelte-1q6ii24";
			td_5.className = "actions";
		},

		m: function mount(target, anchor) {
			insertNode(td, target, anchor);
			appendNode(input, td);
			insertNode(text_1, target, anchor);
			insertNode(td_1, target, anchor);
			appendNode(select, td_1);

			for (var i_2 = 0; i_2 < each_blocks.length; i_2 += 1) {
				each_blocks[i_2].m(select, null);
			}

			insertNode(text_3, target, anchor);
			insertNode(td_2, target, anchor);
			insertNode(text_5, target, anchor);
			insertNode(td_3, target, anchor);
			insertNode(text_7, target, anchor);
			insertNode(td_4, target, anchor);
			insertNode(text_9, target, anchor);
			insertNode(td_5, target, anchor);
			appendNode(button, td_5);
			appendNode(i, button);
			appendNode(text_11, td_5);
			appendNode(button_1, td_5);
			appendNode(i_1, button_1);
		},

		p: function update(changed, state) {
			if ((changed.user) && input_value_value !== (input_value_value = state.user.Email)) {
				input.value = input_value_value;
			}

			var each_value = state.statusOptions;

			if (changed.statusOptions || changed.isCurrentStatus) {
				for (var i_2 = 0; i_2 < each_value.length; i_2 += 1) {
					var each_context = assign(assign({}, state), {
						each_value: each_value,
						status: each_value[i_2],
						status_index: i_2
					});

					if (each_blocks[i_2]) {
						each_blocks[i_2].p(changed, each_context);
					} else {
						each_blocks[i_2] = create_each_block(component, each_context);
						each_blocks[i_2].c();
						each_blocks[i_2].m(select, null);
					}
				}

				for (; i_2 < each_blocks.length; i_2 += 1) {
					each_blocks[i_2].u();
					each_blocks[i_2].d();
				}
				each_blocks.length = each_value.length;
			}
		},

		u: function unmount() {
			detachNode(td);
			detachNode(text_1);
			detachNode(td_1);

			for (var i_2 = 0; i_2 < each_blocks.length; i_2 += 1) {
				each_blocks[i_2].u();
			}

			detachNode(text_3);
			detachNode(td_2);
			detachNode(text_5);
			detachNode(td_3);
			detachNode(text_7);
			detachNode(td_4);
			detachNode(text_9);
			detachNode(td_5);
		},

		d: function destroy$$1() {
			destroyEach(each_blocks);

			removeListener(button, "click", click_handler);
			removeListener(button_1, "click", click_handler_1);
		}
	};
}

function UserAdminRow(options) {
	this._debugName = '<UserAdminRow>';
	if (!options || (!options.target && !options.root)) { throw new Error("'target' is a required option"); }
	init(this, options);
	this._state = assign(data(), options.data);
	this._recompute({ user: 1, statusOptions: 1 }, this._state);
	if (!('user' in this._state)) { console.warn("<UserAdminRow> was created without expected data property 'user'"); }
	if (!('statusOptions' in this._state)) { console.warn("<UserAdminRow> was created without expected data property 'statusOptions'"); }
	if (!('edit' in this._state)) { console.warn("<UserAdminRow> was created without expected data property 'edit'"); }

	this._fragment = create_main_fragment(this, this._state);

	if (options.target) {
		if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
		this._fragment.c();
		this._mount(options.target, options.anchor);
	}
}

assign(UserAdminRow.prototype, protoDev);
assign(UserAdminRow.prototype, methods);

UserAdminRow.prototype._checkReadOnly = function _checkReadOnly(newState) {
	if ('isCurrentStatus' in newState && !this._updatingReadonlyProperty) { throw new Error("<UserAdminRow>: Cannot set read-only property 'isCurrentStatus'"); }
	if ('statusName' in newState && !this._updatingReadonlyProperty) { throw new Error("<UserAdminRow>: Cannot set read-only property 'statusName'"); }
};

UserAdminRow.prototype._recompute = function _recompute(changed, state) {
	if (changed.user) {
		if (this._differs(state.isCurrentStatus, (state.isCurrentStatus = isCurrentStatus(state)))) { changed.isCurrentStatus = true; }
	}

	if (changed.user || changed.statusOptions) {
		if (this._differs(state.statusName, (state.statusName = statusName(state)))) { changed.statusName = true; }
	}
};

/* admin/users/UserAdmin.html generated by Svelte v1.64.0 */

function data$1() {
    return {
        users: []
    };
}
function oncreate() {
    var this$1 = this;

    getJSON('/api/users', function (res) {
        if (res.status === 'ok') {
            this$1.set({ users: res.data });
        }
    });
}
function create_main_fragment$1(component, state) {
	var ul, table, thead, tr, th, text_1, th_1, a_1, text_2_value = __("Name", "admin-users"), text_2, text_3, th_2, a_2, text_4_value = __("Sign-In", "admin-users"), text_4, text_5, th_3, text_6_value = __("Status", "admin-users"), text_6, text_7, th_4, a_3, text_8_value = __("Created at", "admin-users"), text_8, text_9, th_5, text_10_value = __("Charts", "admin-users"), text_10, text_11, th_6, text_12_value = __("Actions", "admin-users"), text_12, text_15, tbody;

	var each_value = state.users;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(component, assign(assign({}, state), {
			each_value: each_value,
			user: each_value[i],
			user_index: i
		}));
	}

	return {
		c: function create() {
			ul = createElement("ul");
			table = createElement("table");
			thead = createElement("thead");
			tr = createElement("tr");
			th = createElement("th");
			th.innerHTML = "<a href=\"?sort=id\">#</a>";
			text_1 = createText("\n                ");
			th_1 = createElement("th");
			a_1 = createElement("a");
			text_2 = createText(text_2_value);
			text_3 = createText("\n                ");
			th_2 = createElement("th");
			a_2 = createElement("a");
			text_4 = createText(text_4_value);
			text_5 = createText("\n                ");
			th_3 = createElement("th");
			text_6 = createText(text_6_value);
			text_7 = createText("\n                ");
			th_4 = createElement("th");
			a_3 = createElement("a");
			text_8 = createText(text_8_value);
			text_9 = createText("\n                ");
			th_5 = createElement("th");
			text_10 = createText(text_10_value);
			text_11 = createText("\n                ");
			th_6 = createElement("th");
			text_12 = createText(text_12_value);
			text_15 = createText("\n        ");
			tbody = createElement("tbody");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			this.h();
		},

		h: function hydrate() {
			a_1.href = "?sort=name";
			a_2.href = "?sort=email";
			a_3.href = "?sort=created_at";
			th_5.className = "center";
			tbody.className = "users";
			table.className = "table users";
		},

		m: function mount(target, anchor) {
			insertNode(ul, target, anchor);
			appendNode(table, ul);
			appendNode(thead, table);
			appendNode(tr, thead);
			appendNode(th, tr);
			appendNode(text_1, tr);
			appendNode(th_1, tr);
			appendNode(a_1, th_1);
			appendNode(text_2, a_1);
			appendNode(text_3, tr);
			appendNode(th_2, tr);
			appendNode(a_2, th_2);
			appendNode(text_4, a_2);
			appendNode(text_5, tr);
			appendNode(th_3, tr);
			appendNode(text_6, th_3);
			appendNode(text_7, tr);
			appendNode(th_4, tr);
			appendNode(a_3, th_4);
			appendNode(text_8, a_3);
			appendNode(text_9, tr);
			appendNode(th_5, tr);
			appendNode(text_10, th_5);
			appendNode(text_11, tr);
			appendNode(th_6, tr);
			appendNode(text_12, th_6);
			appendNode(text_15, table);
			appendNode(tbody, table);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}
		},

		p: function update(changed, state) {
			var each_value = state.users;

			if (changed.users) {
				for (var i = 0; i < each_value.length; i += 1) {
					var each_context = assign(assign({}, state), {
						each_value: each_value,
						user: each_value[i],
						user_index: i
					});

					if (each_blocks[i]) {
						each_blocks[i].p(changed, each_context);
					} else {
						each_blocks[i] = create_each_block$1(component, each_context);
						each_blocks[i].c();
						each_blocks[i].m(tbody, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].u();
					each_blocks[i].d();
				}
				each_blocks.length = each_value.length;
			}
		},

		u: function unmount() {
			detachNode(ul);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].u();
			}
		},

		d: function destroy$$1() {
			destroyEach(each_blocks);
		}
	};
}

// (15:12) {#each users as user}
function create_each_block$1(component, state) {
	var user = state.user, each_value = state.each_value, user_index = state.user_index;

	var useradminrow_initial_data = { user: user };
	var useradminrow = new UserAdminRow({
		root: component.root,
		data: useradminrow_initial_data
	});

	return {
		c: function create() {
			useradminrow._fragment.c();
		},

		m: function mount(target, anchor) {
			useradminrow._mount(target, anchor);
		},

		p: function update(changed, state) {
			user = state.user;
			each_value = state.each_value;
			user_index = state.user_index;
			var useradminrow_changes = {};
			if (changed.users) { useradminrow_changes.user = user; }
			useradminrow._set(useradminrow_changes);
		},

		u: function unmount() {
			useradminrow._unmount();
		},

		d: function destroy$$1() {
			useradminrow.destroy(false);
		}
	};
}

function UserAdmin(options) {
	this._debugName = '<UserAdmin>';
	if (!options || (!options.target && !options.root)) { throw new Error("'target' is a required option"); }
	init(this, options);
	this._state = assign(data$1(), options.data);
	if (!('users' in this._state)) { console.warn("<UserAdmin> was created without expected data property 'users'"); }

	var self = this;
	var _oncreate = function() {
		var changed = { users: 1 };
		oncreate.call(self);
		self.fire("update", { changed: changed, current: self._state });
	};

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment$1(this, this._state);

	this.root._oncreate.push(_oncreate);

	if (options.target) {
		if (options.hydrate) { throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option"); }
		this._fragment.c();
		this._mount(options.target, options.anchor);

		this._lock = true;
		callAll(this._beforecreate);
		callAll(this._oncreate);
		callAll(this._aftercreate);
		this._lock = false;
	}
}

assign(UserAdmin.prototype, protoDev);

UserAdmin.prototype._checkReadOnly = function _checkReadOnly(newState) {
};

function Store(state, options) {
	this._observers = { pre: blankObject(), post: blankObject() };
	this._handlers = {};
	this._dependents = [];

	this._computed = blankObject();
	this._sortedComputedProperties = [];

	this._state = assign({}, state);
	this._differs = options && options.immutable ? _differsImmutable : _differs;
}

assign(Store.prototype, {
	_add: function(component, props) {
		this._dependents.push({
			component: component,
			props: props
		});
	},

	_init: function(props) {
		var this$1 = this;

		var state = {};
		for (var i = 0; i < props.length; i += 1) {
			var prop = props[i];
			state['$' + prop] = this$1._state[prop];
		}
		return state;
	},

	_remove: function(component) {
		var this$1 = this;

		var i = this._dependents.length;
		while (i--) {
			if (this$1._dependents[i].component === component) {
				this$1._dependents.splice(i, 1);
				return;
			}
		}
	},

	_sortComputedProperties: function() {
		var this$1 = this;

		var computed = this._computed;
		var sorted = this._sortedComputedProperties = [];
		var cycles;
		var visited = blankObject();

		function visit(key) {
			if (cycles[key]) {
				throw new Error('Cyclical dependency detected');
			}

			if (visited[key]) { return; }
			visited[key] = true;

			var c = computed[key];

			if (c) {
				cycles[key] = true;
				c.deps.forEach(visit);
				sorted.push(c);
			}
		}

		for (var key in this$1._computed) {
			cycles = blankObject();
			visit(key);
		}
	},

	compute: function(key, deps, fn) {
		var store = this;
		var value;

		var c = {
			deps: deps,
			update: function(state, changed, dirty) {
				var values = deps.map(function(dep) {
					if (dep in changed) { dirty = true; }
					return state[dep];
				});

				if (dirty) {
					var newValue = fn.apply(null, values);
					if (store._differs(newValue, value)) {
						value = newValue;
						changed[key] = true;
						state[key] = value;
					}
				}
			}
		};

		c.update(this._state, {}, true);

		this._computed[key] = c;
		this._sortComputedProperties();
	},

	fire: fire,

	get: get,

	// TODO remove this method
	observe: observe,

	on: on,

	onchange: function(callback) {
		// TODO remove this method
		console.warn("store.onchange is deprecated in favour of store.on('state', event => {...})");

		return this.on('state', function(event) {
			callback(event.current, event.changed);
		});
	},

	set: function(newState) {
		var this$1 = this;

		var oldState = this._state,
			changed = this._changed = {},
			dirty = false;

		for (var key in newState) {
			if (this$1._computed[key]) { throw new Error("'" + key + "' is a read-only property"); }
			if (this$1._differs(newState[key], oldState[key])) { changed[key] = dirty = true; }
		}
		if (!dirty) { return; }

		this._state = assign(assign({}, oldState), newState);

		for (var i = 0; i < this._sortedComputedProperties.length; i += 1) {
			this$1._sortedComputedProperties[i].update(this$1._state, changed);
		}

		this.fire('state', {
			changed: changed,
			current: this._state,
			previous: oldState
		});

		var dependents = this._dependents.slice(); // guard against mutations
		for (var i = 0; i < dependents.length; i += 1) {
			var dependent = dependents[i];
			var componentState = {};
			dirty = false;

			for (var j = 0; j < dependent.props.length; j += 1) {
				var prop = dependent.props[j];
				if (prop in changed) {
					componentState['$' + prop] = this$1._state[prop];
					dirty = true;
				}
			}

			if (dirty) { dependent.component.set(componentState); }
		}

		this.fire('update', {
			changed: changed,
			current: this._state,
			previous: oldState
		});
	}
});

var store = new Store({});

var main = { App: UserAdmin, store: store, data: {} };

return main;

})));
