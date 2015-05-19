define(function (require, exports) {
	var kity = require('./kity');
	var uuidMap = {};

	exports.extend = kity.Utils.extend.bind(kity.Utils);

	exports.listen = function (element, type, handler) {
		var types = exports.isArray(type) ? type : exports.trim(type).split(/\s+/),
		k = types.length;
		if (k)
			while (k--) {
				type = types[k];
				if (element.addEventListener) {
					element.addEventListener(type, handler, false);
				} else {
					if (!handler._d) {
						handler._d = {
							els : []
						};
					}
					var key = type + handler.toString(),
					index = exports.indexOf(handler._d.els, element);
					if (!handler._d[key] || index == -1) {
						if (index == -1) {
							handler._d.els.push(element);
						}
						if (!handler._d[key]) {
							handler._d[key] = function (evt) {
								return handler.call(evt.srcElement, evt || window.event);
							};
						}
						element.attachEvent('on' + type, handler._d[key]);
					}
				}
			}
		element = null;
	};
	exports.uuid = function (group) {
		uuidMap[group] = uuidMap[group] ? uuidMap[group] + 1 : 1;
		return group + uuidMap[group];
	};
	exports.guid = function () {
		return (+new Date() * 1e6 + Math.floor(Math.random() * 1e6)).toString(36);
	};
	exports.trim = function (str) {
		return str.replace(/(^[ \t\n\r]+)|([ \t\n\r]+$)/g, '');
	};
	exports.each = function (obj, iterator, context) {
		if (obj == null)
			return;
		if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, i, obj[i], obj) === false)
					return false;
			}
		} else {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (iterator.call(context, key, obj[key], obj) === false)
						return false;
				}
			}
		}
	};
	exports.addCssRule = function (key, style, doc) {
		var head,
		node;
		if (style === undefined || style && style.nodeType && style.nodeType == 9) {
			//获取样式
			doc = style && style.nodeType && style.nodeType == 9 ? style : (doc || document);
			node = doc.getElementById(key);
			return node ? node.innerHTML : undefined;
		}
		doc = doc || document;
		node = doc.getElementById(key);

		//清除样式
		if (style === '') {
			if (node) {
				node.parentNode.removeChild(node);
				return true
			}
			return false;
		}

		//添加样式
		if (node) {
			node.innerHTML = style;
		} else {
			node = doc.createElement('style');
			node.id = key;
			node.innerHTML = style;
			doc.getElementsByTagName('head')[0].appendChild(node);
		}
	};
	exports.keys = function (plain) {
		var keys = [];
		for (var key in plain) {
			if (plain.hasOwnProperty(key)) {
				keys.push(key);
			}
		}
		return keys;
	};
	exports.proxy = function (fn, context) {
		return function () {
			return fn.apply(context, arguments);
		};
	};
	exports.indexOf = function (array, item, start) {
		var index = -1;
		start = this.isNumber(start) ? start : 0;
		this.each(array, function (v, i) {
			if (i >= start && v === item) {
				index = i;
				return false;
			}
		});
		return index;
	};
	exports.argsToArray = function (args, index) {
		return Array.prototype.slice.call(args, index || 0);
	};
	exports.clonePlainObject = function (source, target) {
		var tmp;
		target = target || {};
		for (var i in source) {
			if (source.hasOwnProperty(i)) {
				tmp = source[i];
				if (exports.isObject(tmp) || exports.isArray(tmp)) {
					target[i] = exports.isArray(tmp) ? [] : {};
					exports.clonePlainObject(source[i], target[i])
				} else {
					target[i] = tmp;
				}
			}
		}
		return target;
	};
	exports.compareObject = function (source, target) {
		var tmp;
		if (this.isEmptyObject(source) !== this.isEmptyObject(target)) {
			return false
		}
		if (this.getObjectLength(source) != this.getObjectLength(target)) {
			return false;
		}
		for (var p in source) {
			if (source.hasOwnProperty(p)) {
				tmp = source[p];
				if (target[p] === undefined) {
					return false;
				}
				if (this.isObject(tmp) || this.isArray(tmp)) {
					if (this.isObject(target[p]) !== this.isObject(tmp)) {
						return false;
					}
					if (this.isArray(tmp) !== this.isArray(target[p])) {
						return false;
					}
					if (this.compareObject(tmp, target[p]) === false) {
						return false
					}
				} else {
					if (tmp != target[p]) {
						return false
					}
				}
			}
		}
		return true;
	};
	exports.getObjectLength = function (obj) {
		if (this.isArray(obj) || this.isString(obj))
			return obj.length;
		var count = 0;
		for (var key in obj)
			if (obj.hasOwnProperty(key))
				count++;
		return count;
	};
	exports.isEmptyObject = function (obj) {
		if (obj == null)
			return true;
		if (this.isArray(obj) || this.isString(obj))
			return obj.length === 0;
		for (var key in obj)
			if (obj.hasOwnProperty(key))
				return false;
		return true;
	};
	exports.loadFile = function () {
		var tmpList = [];

		function getItem(doc, obj) {
			try {
				for (var i = 0, ci; ci = tmpList[i++]; ) {
					if (ci.doc === doc && ci.url == (obj.src || obj.href)) {
						return ci;
					}
				}
			} catch (e) {
				return null;
			}

		}

		return function (doc, obj, fn) {
			var item = getItem(doc, obj);
			if (item) {
				if (item.ready) {
					fn && fn();
				} else {
					item.funs.push(fn)
				}
				return;
			}
			tmpList.push({
				doc : doc,
				url : obj.src || obj.href,
				funs : [fn]
			});
			if (!doc.body) {
				var html = [];
				for (var p in obj) {
					if (p == 'tag')
						continue;
					html.push(p + '="' + obj[p] + '"')
				}
				doc.write('<' + obj.tag + ' ' + html.join(' ') + ' ></' + obj.tag + '>');
				return;
			}
			if (obj.id && doc.getElementById(obj.id)) {
				return;
			}
			var element = doc.createElement(obj.tag);
			delete obj.tag;
			for (var p in obj) {
				element.setAttribute(p, obj[p]);
			}
			element.onload = element.onreadystatechange = function () {
				if (!this.readyState || /loaded|complete/.test(this.readyState)) {
					item = getItem(doc, obj);
					if (item.funs.length > 0) {
						item.ready = 1;
						for (var fi; fi = item.funs.pop(); ) {
							fi();
						}
					}
					element.onload = element.onreadystatechange = null;
				}
			};
			//            element.onerror = function () {
			//                throw Error('The load ' + (obj.href || obj.src) + ' fails,check the url settings of file ')
			//            };
			doc.getElementsByTagName("head")[0].appendChild(element);
		}
	}();
	exports.clone = function (source) {
		return JSON.parse(JSON.stringify(source));
	};
	exports.comparePlainObject = function (a, b) {
		return JSON.stringify(a) == JSON.stringify(b);
	};
	exports.encodeHtml = function (str, reg) {
		return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g, function (a, b) {
			if (b) {
				return a;
			} else {
				return {
					'<' : '&lt;',
					'&' : '&amp;',
					'"' : '&quot;',
					'>' : '&gt;',
					'\'' : '&#39;'
				}
				[a];
			}
		}) : '';
	};
	exports.unhtml = function(str, reg) {
        return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g, function(a, b) {
            if (b) {
                return a;
            } else {
                return {
                    '<': '&lt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    '>': '&gt;',
                    "'": '&#39;'
                }[a]
            }
        }) : '';
    };
    exports.cloneArr = function(arr){
        return [].concat(arr);
    };
    exports.clearWhiteSpace = function(str){
        return str.replace(/[\u200b\t\r\n]/g, '');
    };
    exports.getValueByIndex = function(data,index){

        var initIndex = 0,result = 0;

        exports.each(data,function(i,arr){
            if(initIndex + arr.length >= index){

                if(index - initIndex == arr.length){
                    if(arr.length == 1 && arr[0].width === 0){
                        initIndex++;
                        return;
                    }
                    result = {
                        x: arr[arr.length - 1].x + arr[arr.length - 1].width,
                        y: arr[arr.length - 1].y
                    };
                }else{
                    result = arr[index - initIndex];
                }

                return false;
            }else{
                initIndex += arr.length + (arr.length == 1 && arr[0].width === 0 ? 0 : 1);
            }
        });
        return result;
    };
    exports.getNodeIndex = function (node, ignoreTextNode) {
        var preNode = node,
            i = 0;
        while (preNode = preNode.previousSibling) {
            if (ignoreTextNode && preNode.nodeType == 3) {
                if(preNode.nodeType != preNode.nextSibling.nodeType ){
                    i++;
                }
                continue;
            }
            i++;
        }
        return i;
    };

	exports.each(['String', 'Function', 'Array', 'Number', 'RegExp', 'Object'], function (i, v) {
		exports['is' + v] = function (obj) {
			return Object.prototype.toString.apply(obj) == '[object ' + v + ']';
		};
	});
});
