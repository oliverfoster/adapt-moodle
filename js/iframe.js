define([
	'coreJS/adapt'
],function(Adapt) {

	//quit if not in iframe
	var isInIframe = window.frameElement && window.frameElement.nodeName == "IFRAME";
	var iframeDocument;
	var iframeWindow;
	var dynamicStyleTag;
		
	if (isInIframe) {
		iframeDocument = top.window.document;
		iframeWindow = top.window;
		setupResponsiveIFrame();
	}

	function setupResponsiveIFrame() {
		setupResponsiveIFrameScriptAndStyle();
		setupResponsiveIFrameMessaging();	
	}

	function setupResponsiveIFrameScriptAndStyle() {
		//inject corrective styling and script to iframe window to fix iframe sizing for everything and ios
		var meta = iframeDocument.createElement("meta");
		var style = iframeDocument.createElement("style");
		var script = iframeDocument.createElement("script");
		$(style).html("html, body { overflow-x:hidden; overflow-y: hidden; } html, body, iframe {padding:0px;margin:0px;border:0px;height:100%;width:100%;} iframe { box-sizing: content-box;height:100%;width:100%;}");
		$(script).html('setTimeout(resizeMe,1000);window.addEventListener("resize", resizeMe);function resizeMe() {var iframe = document.getElementsByTagName("iframe")[0]; iframe.style.width = window.innerWidth;iframe.style.height = window.innerHeight;console.log("resizeme sending message", window.innerHeight, window.innerWidth); iframe.contentWindow.postMessage("resizeme","*");}');
		$(meta).attr({
			"name": "viewport",
			"content": "width=device-width, initial-scale=1.0, maximum-scale=1.0"
		});
		iframeDocument.getElementsByTagName("head")[0].appendChild(meta);
		iframeDocument.getElementsByTagName("head")[0].appendChild(style);
		iframeDocument.getElementsByTagName("head")[0].appendChild(script);

		//append dynamic styling to iframe content
		dynamicStyleTag = window.document.createElement("style");
		window.document.getElementsByTagName("head")[0].appendChild(dynamicStyleTag);

	}

	function setupResponsiveIFrameMessaging() {
		//force iframe content html size to match iframe size
		var oldDimensions = {
			height: 0,
			width: 0
		};

		window.addEventListener("message", receiveMessage, false);
		function receiveMessage(event) {
		  switch (event.data) {
		  case "resizeme":
		  	console.log("resizeme message received");
			var newDimensions = {
				height: iframeWindow.innerHeight,
				width: iframeWindow.innerWidth
			};

		  	if (oldDimensions.height == newDimensions.height && oldDimensions.width == newDimensions.width) return;

			var dynamicStyle = "html { height:" + newDimensions.height + "px; width:" + newDimensions.width +"px; max-height:" + newDimensions.height + "px; max-width:" + newDimensions.width +"px; }";

			$(dynamicStyleTag).html(dynamicStyle);

			oldDimensions = newDimensions;
			window.innerHeight = newDimensions.height;
			window.innerWidth = newDimensions.width;
			window.outerHeight = newDimensions.height;
			window.outerWidth = newDimensions.width;

			_.defer(function() {
		  		$(window).resize();
		  	});

		  	break;
		  }
		}
	}


	var isIOS = (/iPad|iPhone|iPod/.test(navigator.platform)) || (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
	if (isIOS && isInIframe) {
		setupResponsiveIFrameIOS();
	}

	function setupResponsiveIFrameIOS() {
		console.warn("FAKESCROLL: Is iOS in iFrame");
		setupResponsiveIFrameIOSListeners();
		setupResponsiveIFrameIOSCorrections();
	}

	function setupResponsiveIFrameIOSListeners () {
		Adapt.on("pageView:postRender menuView:postRender", function(view) {
			if (view && view.model && view.model.get("_id") !== Adapt.location._currentId) return;
		});

		//wait for adapt to be ready
		Adapt.on("app:dataReady", function() {

	        //make sure scroll goes back to 0 on navigation
	        Adapt.on("router:location", function() {
	        	if (isInIframe) iframeDocument.getElementsByTagName("body")[0].scrollTop = 0;
		    });

		    $("html").addClass("lightbox-hack");
        	var $scrollingContainer = $('<div class="scrolling-container"><div class="scrolling-inner body"></div></div>');
            var $scrollingInner = $scrollingContainer.find(".scrolling-inner");
        	$("body").append($scrollingContainer);
        	$("#wrapper").appendTo($scrollingInner);

        	var originalScrollTo = $.fn.scrollTo;
        	$.fn.scrollTo = function(target, duration, settings) {
        		if (this[0] === window) {
        			return originalScrollTo.apply($(".scrolling-container"), arguments);
        		} else {
        			return originalScrollTo.apply(this, arguments);
        		}
        	};
        	var originalScrollTop = $.fn.scrollTop;
        	$.fn.scrollTop = function() {
        		if (this[0] === window) {
        			return originalScrollTop.apply($(".scrolling-container"), arguments);
        		} else {
        			return originalScrollTop.apply(this, arguments);
        		}
        	};
            var jqueryOffset = $.fn.offset;
            $.fn.offset = function() {
                var offset = jqueryOffset.call(this);
                //console.log("fetching offset", offset.top, offset.left);
                var $stack = this.parents().add(this);
                var $scrollParents = $stack.filter(".scrolling-container");
                $scrollParents.each(function(index, item) {
                    var $item = $(item);
                    var scrolltop = parseInt($item.scrollTop());
                    var scrollleft = parseInt($item.scrollLeft());
                    offset.top += scrolltop;
                    offset.left += scrollleft;
                });
                return offset;
            };
            window.scrollTo = function(x,y) {
                //console.log("window scrollTo", x || 0, y || 0);
                $(".scrolling-container")[0].scrollTop = y || 0;
                $(".scrolling-container")[0].scrollLeft = x || 0;
            };

            //ios navigation fixed inside scrollable jump fix
            var $navigationContainer = $('<div class="navigation-container"></div>');
            $("body").prepend($navigationContainer);

            Adapt.once("adapt:initialize", function() {
                $(".navigation").prependTo($navigationContainer);
            });
		});
	}

	function setupResponsiveIFrameIOSCorrections() {
		//make sure iframe resizes properly on ios orientation change
		$(iframeDocument.getElementsByTagName("body")[0]).attr({
			 "onorientationchange": "resizeMe();"
		});

		setInterval(function() {
			//force any error scrolls to reset
			iframeDocument.getElementsByTagName("body")[0].scrollTop = 0;
			iframeWindow.scrollTop = 0;
			window.document.getElementsByTagName("body")[0].scrollTop = 0;
			window.scrollTop = 0;
			$("body").css("height", "auto");
			_.defer(function(){
				$("body").css("height", "100%");
			});
			
		}, 500);

		//force stop iframe scrolling
		var iframe = iframeDocument.getElementsByTagName("iframe")[0];
		iframe.setAttribute("scrolling", "no");
	}

})
