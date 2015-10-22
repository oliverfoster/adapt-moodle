define(['coreJS/adapt'],function(Adapt) {

	//quit if not in iframe
	if ($("html", top.window.document).is("#adapt")) return;

	//inject corrective styling and script to fix iframe sizing for everything and ios
	var meta = top.window.document.createElement("meta");
	var style = top.window.document.createElement("style");
	var script = top.window.document.createElement("script");
	$(style).html("html, body, iframe {padding:0px;margin:0px;border:0px;height:100%;width:100%;} iframe {box-sizing: content-box;height:100%;width:100%;}");
	$(script).html('setTimeout(resizeMe,1000);window.addEventListener("resize", resizeMe);function resizeMe() {var iframe = document.getElementsByTagName("iframe")[0]; iframe.style.width = window.innerWidth;iframe.style.height = window.innerHeight;console.log("resizeme", window.innerHeight, window.innerWidth);}');
	$(meta).attr({
		"name": "viewport",
		"content": "width=device-width, initial-scale=1.0, maximum-scale=1.0"
	});
	top.window.document.getElementsByTagName("head")[0].appendChild(meta);
	top.window.document.getElementsByTagName("head")[0].appendChild(style);
	top.window.document.getElementsByTagName("head")[0].appendChild(script);

	//wait for adapt to be ready
	Adapt.on("app:dataReady", function() {

		//quit if not on ios, ios fixes only from here
		if (!$("html").is(".iPhone, .iOS, .iPad")) return;

		//append dynamic styling to iframe content
		var dynamicstyle = window.document.createElement("style");
		window.document.getElementsByTagName("head")[0].appendChild(dynamicstyle);

		//make sure iframe resizes properly on ios orientation change
		$(top.window.document.getElementsByTagName("body")[0]).attr({
			 "onorientationchange": "resizeMe();"
		});

		//force iframe content html size to match iframe size
		var oldDimensions = {
			height: 0,
			width: 0
		};
		setInterval(function() {
			var newDimensions = {
				height: top.window.innerHeight,
				width: top.window.innerWidth
			};

			//force any error scrolls to reset
			top.window.document.getElementsByTagName("body")[0].scrollTop = 0;
			window.document.getElementsByTagName("body")[0].scrollTop = 0;

			if (oldDimensions.height == newDimensions.height && oldDimensions.width == newDimensions.width) return;

			var dynamicStyle = "html { height:" + newDimensions.height + "px; width:" + newDimensions.width +"px; max-height:" + newDimensions.height + "px; max-width:" + newDimensions.width +"px; }";

			$(dynamicstyle).html(dynamicStyle);

			oldDimensions = newDimensions;
			window.innerHeight = newDimensions.height;
			window.innerWidth = newDimensions.width;
			window.outerHeight = newDimensions.height;
			window.outerWidth = newDimensions.width;
		}, 500);


		//force stop iframe scrolling
		var iframe = top.window.document.getElementsByTagName("iframe")[0];
		iframe.setAttribute("scrolling", "no");


		//fake scroll using tranformations
		var scrollTop = 0;
		var scrollOffset = 0;
		var startY = 0;
        var b = document.body;
        b.addEventListener('touchstart', function (event) {
		    startY = event.targetTouches[0].pageY;
		});
        b.addEventListener('touchmove', function (event) {
        	var posy = event.targetTouches[0].pageY;
        	if (Math.abs(startY-posy) <= 5) return;
        	event.preventDefault();
            scrollOffset = (scrollTop*-1) - (startY-posy);
            console.log(scrollTop, scrollOffset);
            if (scrollOffset > 0 ) scrollOffset = 0;
            if (Math.abs(scrollOffset) > $("body").height() - $(window).height()) scrollOffset = ($("body").height() - $(window).height())*-1;
        	$(".menu, .page").css({
        		"transform": "translate3d(0,"+scrollOffset+"px,0)"
        	});
        	$(window).scroll();
        });
        b.addEventListener('touchend', function (event) {
            if (scrollOffset > 0 ) scrollOffset = 0;
            if (Math.abs(scrollOffset) > $("body").height() - $(window).height()) scrollOffset = ($("body").height() - $(window).height())*-1;
            scrollTop = scrollOffset*-1;
        });



        //hack jquery scrollTop to return the fake scroll offset
		var jqueryScrollTop = $.fn.scrollTop;
		$.fn.scrollTop = function() {
			if (this[0] === window) {
				return (scrollOffset*-1);
			} else {
				return jqueryScrollTop.apply(this, arguments);
			}
		};


        //make sure scroll goes back to 0 on navigation
        Adapt.on("router:location", function() {
        	top.window.document.getElementsByTagName("body")[0].scrollTop = 0;
			window.document.getElementsByTagName("body")[0].scrollTop = 0;
	    	scrollOffset = 0;
	    	scrollTop = 0;
        	$(".menu, .page").css({
        		"transform": "translate3d(0,"+scrollOffset+"px,0)"
        	});
        	$(window).scroll();
	    });

	    /* TODO
	    * need to make jquery.scrollTo use fake scroll.
	    * need to make sure overflow notify and drawer scroll
	    * need to correct trickle as tranformation + z-index cause the button to disappear
	    */

	    /*WHAT WORKS
	    * don't use PLP as scrollTo doesn't work (or huge plp as scrolling won't work)
	    * don't use huge notify feedback
	    * don't use trickle
	    * otherwise all good - works perfectly on a desktop fullscreen iframe, all glitches are ios iframe hacks
	    */
	});
	
})
