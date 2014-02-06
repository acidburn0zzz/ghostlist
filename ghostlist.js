// Boo.

var ghostlist = {
	
	blank_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NkAAIAAAoAAggA9GkAAAAASUVORK5CYII=",
	
	with_class: "",
	last_location: 0,
	items: [],
	window_height: window.innerHeight,
	window_height_multiplier: 2,
	
	debug: true,
	
	debug_times: [],
	
	attach: function(with_class) {
		
		// Call once.
		
		ghostlist.last_location = document.body.scrollTop;
		ghostlist.with_class = with_class;
		ghostlist.items = [];
		
		ghostlist.added();
		
		document.addEventListener('touchmove', function() { ghostlist.scroll(); }, false);
		document.addEventListener('scroll', function() { ghostlist.scroll(); }, false);
		
		if (ghostlist.debug) { $("body").append("<div id=\"ghostlist-debug\">&nbsp;</div>"); }
	
	},
	
	added: function() {
	
		// Call each time new items are loaded.
		var preload_count = 0;
		
		$(ghostlist.with_class).not(".ghostlist-added").each(function() {
			
			var m_top = $(this).offset().top;
			var m_height = $(this).height();
			var m_id = $(this).attr('id');
			
			if (typeof m_id === "undefined") { 
				m_id = "gl-item-" + ghostlist.items.length; 
				$(this).attr('id', m_id);
			} 
			
			$(this).addClass("ghostlist-added");
			
			$(this).find("img").each(function() {
			
				if (typeof $(this).attr('height') === "undefined") {
					// Fix this problem before it makes the page jump up and down.
					$(this).attr('height', $(this).height()).attr('width', $(this).width());
				}
			
			});
			
			ghostlist.items.push({ top: m_top, id: m_id, height: m_height, hidden: false });
			
			if (m_top >= ghostlist.last_location + ghostlist.window_height * ghostlist.window_height_multiplier) {
				// Let's just hide this already.
				preload_count++;
				var m_obj = $(this);
				var m_obj_obj = ghostlist.items[ghostlist.items.length - 1];
				setTimeout(function() {
					ghostlist.clear($(m_obj), m_obj_obj);
				}, 10 + (preload_count * 15));
				
			}
			
			
		});
		
	},
	
	scroll: function() {
	
		var start = +new Date();
	
		var current_top = document.body.scrollTop;
		var difference = ghostlist.last_location - current_top;
		if (difference === 0) { return; }
		
		var start_position = ghostlist.get_start_position(current_top);
		
		// Now lets get items, screen height * [window_height_multiplier], from both top and down.
		var limit = ghostlist.window_height * ghostlist.window_height_multiplier;
		var items = [];
		var item_indexes = [];
		
		// From bottom:
		var limit_count = 0;
		for (var i=start_position;i<ghostlist.items.length;i++) {
			if (limit_count >= limit) { 
				break;
			} else {
				items.push(ghostlist.items[i]);
				item_indexes.push(i);
				limit_count += ghostlist.items[i].height;
			}
		}
		
		// From top:
		limit_count = 0;
		for (var i=start_position;i>0;i=i-1) {
			if (limit_count >= limit) { 
				break;
			} else {
				if (item_indexes.indexOf(i) === -1) {
					items.push(ghostlist.items[i]);
					item_indexes.push(i);
					limit_count += ghostlist.items[i].height;
				}
			}
		}
		
		// The "items" will be shown. Lets now determine what will be hidden.
		var hide = [];
		for (var i=0;i<ghostlist.items.length;i++) {
			if (item_indexes.indexOf(i) === -1) {
				hide.push(ghostlist.items[i]);
			}
		}
		
		// Now let's do the actual clearing/restoring.
		for (var i=0;i<items.length;i++) {
			if (items[i].hidden === true) {
				ghostlist.restore($("#" + items[i].id), items[i]); 
			}
		}
		
		for (var i=0;i<hide.length;i++) {
			if (hide[i].hidden !== true) {
				ghostlist.clear($("#" + hide[i].id), hide[i]); 
			}
		}
		
		// Debug stuff.
		if (ghostlist.debug) {
		
			var end =  +new Date();  // log end timestamp
			var diff = end - start;
			ghostlist.debug_times.push(diff);
			var average = 0;
			var biggest = 0;
			for (var i=0;i<ghostlist.debug_times.length;i++) {
				if (ghostlist.debug_times[i] > biggest) { biggest = ghostlist.debug_times[i]; }
				average += ghostlist.debug_times[i];
			}
			average = Math.floor(average / ghostlist.debug_times.length);
		
			$("#ghostlist-debug").html("start = " + start_position + "<br/>" + 
										"total = " + $(ghostlist.with_class).length + "<br/>" + 
										"hide = " + hide.length + "<br/>" + 
										"show = " + items.length + "<br/>" +
										"time = " + diff + "ms" + "<br/>" +
										"longest = " + biggest + "ms" + "<br/>" +
										"avg = " + average + "ms");
									
		}
	
	},
	
	clear: function(obj, globj) {
		
		if (globj.hidden == true) { return; }
		globj.hidden = true;
		
		if (ghostlist.debug) {
			$(obj).addClass("ghostlist-hidden");
		}
		
		if ($(obj).find("img").length === 0) { return; }
		
		$(obj).find("img").each(function() {
		
			if ($(this).width() <= 50 && $(this).height() <= 50) { return; }
			
			if (typeof $(this).attr('height') === "undefined") {
				// Fix this problem before it makes the page jump up and down.
				//talk.log("Fixing, height is " + $(this).height() + ", width is " + $(this).width());
				$(this).attr('height', $(this).height()).attr('width', $(this).width());
				ghostlist.fixed_size++;
			}
			
			$(this).addClass("ghostlist-hidden");
				
			if (typeof $(this).attr('data-old-src') === "undefined") {
				
				$(this).attr('data-old-src', $(this).attr('src'));
				$(this).attr('src', ghostlist.blank_image);
				
			}
			
		});
	
	},
	
	fg: function(id) { return document.getElementById(id); },
	
	restore: function(obj, globj) {
	
		if (globj.hidden !== true) { return; }
		
		if (ghostlist.debug) {
			$(obj).removeClass("ghostlist-hidden");
		}
		
		if ($(obj).find("img").length === 0) { return; }
		
		$(obj).find("img").each(function() {
			
			var old_src = $(this).attr('data-old-src');
			
			if (typeof old_src !== "undefined") {
			
				$(this).removeClass("ghostlist-hidden");
			
				$(this).attr('src', old_src);
				$(this).removeAttr('data-old-src');
				
			}
		
		});
		
		globj.hidden = false;
		
	},
	
	get_start_position: function(y) {
	
		for (var i=0;i<ghostlist.items.length;i++) {
		
			if (ghostlist.items[i].top >= y - ghostlist.window_height)
				return i;
		
		}
		
		return 0;
	
	},
	
	
	
};
