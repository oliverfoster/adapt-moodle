define([
	'coreJS/adapt'
],function(Adapt) {

	//quit if not in iframe
	var isInIframe = window.frameElement && window.frameElement.nodeName == "IFRAME";
	var iframeDocument;
	var iframeWindow;
	var dynamicStyleTag; //to keep adapt sizes in order
		
	if (isInIframe) {
		genericCaptureIFrameElements();
		genericSetupResponsiveIFrameScriptAndStyle();
		genericSetupResponsiveIFrameMessaging();	
	}

	function genericCaptureIFrameElements() {
		iframeDocument = top.window.document;
		iframeWindow = top.window;
	}

	function genericSetupResponsiveIFrameScriptAndStyle() {
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

	function genericSetupResponsiveIFrameMessaging() {
		//force iframe content html size to match iframe size

		window.addEventListener("message", receiveMessage, false);
		function receiveMessage(event) {
		  switch (event.data) {
		  case "resizeme":
		  	genericAdaptContentResize();
		  	break;
		  }
		}
	}

	var oldDimensions = { height: 0, width: 0 };
	function genericAdaptContentResize() {
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
	}


	var isIOS = (/iPad|iPhone|iPod/.test(navigator.platform)) || (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
	var $pseudoHtml;
	var $pseudoBody;

	if (isIOS && isInIframe) {
		iOSSetupFixes();
	}

	function iOSSetupFixes () {
		console.warn("FAKESCROLL: Is iOS in iFrame");

		//fix iframe attributes
		iOSSetupIFrameAttributes();

		//listen to orientation changes
		iOSSetupOrientationChangeListener();

		//reset scroll at interval
		iOSSetupResetScrollInterval();

		//add styling fixes
		$("html").addClass("pseudohtml");

		//wait for adapt to be ready
		Adapt.on("app:dataReady", iOSSetupScrollContainers);
		//wait for navigation to be rendered
		Adapt.once("adapt:initialize", iOSMoveNavigation);

		//hijack jquery window scroll handlers
		iOSApplyJQueryWindowScrollHacks();

	}

	function iOSSetupIFrameAttributes() {
		//force stop iframe scrolling
		var iframe = iframeDocument.getElementsByTagName("iframe")[0];
		iframe.setAttribute("scrolling", "no");
	}

	function iOSSetupOrientationChangeListener() {
		//make sure iframe resizes properly on ios orientation change
		$(iframeDocument.getElementsByTagName("body")[0]).attr({
			 "onorientationchange": "resizeMe();"
		});
	}

	function iOSSetupResetScrollInterval() {
		//potentially unnecessary but here from legacy code
		setInterval(function() {
			//force any error scrolls to reset
			iframeDocument.getElementsByTagName("body")[0].scrollTop = 0;
			iframeWindow.scrollTop = 0;
			window.document.getElementsByTagName("body")[0].scrollTop = 0;
			window.scrollTop = 0;

			//readjust height to force iframe to render properly
			$("body").css("height", "auto");
			_.defer(function(){
				$("body").css("height", "100%");
			});
			
		}, 500);
	}

	function iOSSetupScrollContainers() {
		//move #wrapper into new container
		$pseudoHtml = $('<div id="pseudo-html"><div id="pseudo-body"></div></div>');
		$pseudoBody = $pseudoHtml.find("#pseudo-body");
		$("body").append($pseudoHtml);
		$("#wrapper").appendTo($pseudoBody);			
	}

	function iOSMoveNavigation() {
		//ios navigation fixed inside scrollable jump fix
		//create container
		var $navigationContainer = $('<div class="navigation-container"></div>');
		$("body").prepend($navigationContainer);
		//move navigation to new continer
		$(".navigation").prependTo($navigationContainer);
	}

	function iOSApplyJQueryWindowScrollHacks() {
		//jquery scrolling fixes
		var originalScrollTo = $.fn.scrollTo;
		$.fn.scrollTo = function(target, duration, settings) {
			if (this[0] === window) {
				return originalScrollTo.apply($pseudoHtml, arguments);
			} else {
				return originalScrollTo.apply(this, arguments);
			}
		};
		var originalScrollTop = $.fn.scrollTop;
		$.fn.scrollTop = function() {
			if (this[0] === window) {
				return originalScrollTop.apply($pseudoHtml, arguments);
			} else {
				return originalScrollTop.apply(this, arguments);
			}
		};
		var jqueryOffset = $.fn.offset;
		$.fn.offset = function() {
			var offset = jqueryOffset.call(this);
			var scrolltop = parseInt($pseudoHtml.scrollTop());
			var scrollleft = parseInt($pseudoHtml.scrollLeft());
			offset.top += scrolltop;
			offset.left += scrollleft;
			return offset;
		};
		window.scrollTo = function(x,y) {
			$pseudoHtml[0].scrollTop = y || 0;
			$pseudoHtml[0].scrollLeft = x || 0;
		};
	}

})
