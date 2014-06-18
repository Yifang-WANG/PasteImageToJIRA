var isContentScriptLoaded = true;
var doc, html,
    docW, docH,
    initScrollTop, initScrollLeft,
    clientH, clientW;
var scrollBar = {};
var counter = 1; //horizontal scroll counter
var menu = {
    visible: {
        enable: 'false',
        key: 'V'
    },
    selected: {
        enable: 'false',
        key: 'S'
    },
    entire: {
        enable: 'false',
        key: 'E'
    }
};
var fixedElements = [];

var wrapperHTML = 
                '<div id="awesome_screenshot_wrapper">'+ 
                  '<div id="awesome_screenshot_top"></div>'+
                  '<div id="awesome_screenshot_right"></div>'+
                  '<div id="awesome_screenshot_bottom"></div>'+
                  '<div id="awesome_screenshot_left"></div>'+
                  '<div id="awesome_screenshot_center" class="drsElement drsMoveHandle">'+
                    '<div id="awesome_screenshot_size" style="min-width:70px;"><span>0 X 0</span></div>'+
                    '<div id="awesome_screenshot_action">'+
                      '<a id="awesome_screenshot_cancel"><span id="awesome_screenshot_cancel_icon"></span>Cancel</a>'+
                      '<a id="awesome_screenshot_capture"><span id="awesome_screenshot_capture_icon"></span>Capture</a>'+
                    '</div>'+
                  '</div>'+
                '</div>';
var wrapper,
    dragresize; //dragresize object
var isSelected = false;
var hostname = document.location.hostname;


function hasClass(obj, cls) {
    return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

function addClass(obj, cls) {
    if (!hasClass(obj, cls)) obj.className += " " + cls;
}

function removeClass(obj, cls) {
    if (hasClass(obj, cls)) {
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        obj.className = obj.className.replace(reg, ' ');
    }
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.action) {
        case 'init_selected_capture':
            initSelectedCapture();
            break;
        case 'destroy_selected':
            removeSelected();
            break;
    }
});

/************** selected capture start **************/

function initSelectedCapture() {

    getDocumentNode();
    getDocumentDimension();
    if (!document.getElementById('awesome_screenshot_wrapper')) {
        var newNode = document.createElement("div");
        document.body.appendChild(newNode);
        newNode.innerHTML += wrapperHTML;
    }

    wrapper = document.getElementById('awesome_screenshot_wrapper');
    updateWrapper();
    window.addEventListener('resize', windowResize, false);
    document.body.addEventListener('keydown', selectedKeyDown, false);
    wrapper.addEventListener('mousedown', wrapperMouseDown, false);
}

function wrapperMouseDown(e) {
    if (e.button == 0) {
        var initX = e.pageX,
            initY = e.pageY,
            centerH,
            centerW;
        var asSize = document.getElementById('awesome_screenshot_size');
        var asAction = document.getElementById('awesome_screenshot_action');
        //console.log(asAction);
        wrapper.addEventListener('mousemove', wrapperMouseMove, false);
        wrapper.addEventListener('mouseup', wrapperMouseUp, false);


        function wrapperMouseMove(e) {
            setStyle(wrapper, 'background-color', 'rgba(0,0,0,0)');
            centerW = e.pageX - initX,
            centerH = e.pageY - initY;
            asSize.children[0].innerHTML = Math.abs(centerW) + ' X ' + Math.abs(centerH);

            updateCorners(initX, initY, centerW, centerH);
            updateCenter(initX, initY, centerW, centerH);
            autoScroll(e);
        }

        function wrapperMouseUp(e) {
            if ((e.pageX - initX == 0 || e.pageY - initY == 0) && $('#awesome_screenshot_center').width() == 0) {
                setStyle(wrapper, 'background-color', 'rgba(0,0,0,0)');
                asSize.children[0].innerHTML = Math.abs(200) + ' X ' + Math.abs(200);
                updateCorners(initX - 100, initY - 100, 200, 200);
                updateCenter(initX - 100, initY - 100, 200, 200);
            }

            wrapper.removeEventListener('mousedown', wrapperMouseDown, false);
            wrapper.removeEventListener('mousemove', wrapperMouseMove, false);
            wrapper.removeEventListener('mouseup', wrapperMouseUp, false);
            setStyle(document.getElementById('awesome_screenshot_action'), 'display', 'block');
            setStyle(asSize, 'display', 'block');

            bindCenter();
        }
    }
}

function selectedKeyDown(e) {
    if (e.keyCode == 27) removeSelected();
}

function windowResize(e) {
    updateWrapper();
    getDocumentDimension();

    var center = document.getElementById('awesome_screenshot_center');
    var centerW = getStyle(center, 'width'),
        centerH = getStyle(center, 'height');

    if (centerW * centerH) {
        var initX = getStyle(center, 'left'),
            initY = getStyle(center, 'top');
        updateCorners(initX, initY, centerW, centerH);
    }

    dragresize.maxLeft = docW;
    dragresize.maxTop = docH;
}

function bindCenter() {
    var initX, initY, centerW, centerH;
    var center = document.getElementById('awesome_screenshot_center');
    dragresize = new DragResize('dragresize', {
        maxLeft: docW,
        maxTop: docH
    }); // { minWidth: 50, minHeight: 50, minLeft: 20, minTop: 20, maxLeft: 600, maxTop: 600 });
    var asSize = document.getElementById('awesome_screenshot_size');
    var asAction = document.getElementById('awesome_screenshot_action');

    dragresize.isElement = function(elm) {
        if (elm.className && elm.className.indexOf('drsElement') > -1) return true;
    };
    dragresize.isHandle = function(elm) {
        if (elm.className && elm.className.indexOf('drsMoveHandle') > -1) return true;
    };

    dragresize.ondragmove = function(isResize, ev) {
        var x = dragresize.elmX,
            y = dragresize.elmY,
            w = dragresize.elmW,
            h = dragresize.elmH;
        asSize.children[0].innerHTML = Math.abs(w) + ' X ' + Math.abs(h);

        y < 30 ? setStyle(asSize, 'top', '5px') : setStyle(asSize, 'top', '-30px');
        var rightoffset = -(195 - w) / 2;
        if (w < 190) {
            setStyle(asAction, 'right', rightoffset + 'px');
        } else {
            setStyle(asAction, 'right', 0 + 'px');
        }
        updateCorners(x, y, w, h);
        updateCenter(x, y, w, h);
        autoScroll(ev);

    };

    dragresize.apply(wrapper);
    dragresize.select(center); //show resize handle

    //bind action button
    document.getElementById('awesome_screenshot_action').addEventListener('click', actionHandler, false);

    function actionHandler(e) {
        switch (e.target.id) {
            case 'awesome_screenshot_capture':
            case 'awesome_screenshot_capture_icon':
                captureSelected();
                break;
            case 'awesome_screenshot_cancel':
            case 'awesome_screenshot_cancel_icon':
                removeSelected();
                break;
        }
    }

    function captureSelected() {
        var asSize = document.getElementById('awesome_screenshot_size');
        setStyle(asSize, 'display', 'none');
        dragresize.deselect(center);
        setStyle(center, 'outline', 'none');
        enableFixedPosition(false);
        counter = 1;
        html = document.documentElement;
        initScrollTop = document.body.scrollTop;
        initScrollLeft = document.body.scrollLeft;
        clientH = html.clientHeight;
        clientW = html.clientWidth;
        isSelected = true;

        //prepare selected area
        var x = dragresize.elmX,
            y = dragresize.elmY,
            w = dragresize.elmW,
            h = dragresize.elmH;
        var offX = x - document.body.scrollLeft,
            offY = y - document.body.scrollTop;

        if (y < initScrollTop) {

            if (offX <= 0) document.body.scrollLeft = x;
            else {
                wrapper.style.paddingRight = offX + 'px';
                document.body.scrollLeft += offX;
            }
            if (offY <= 0) document.body.scrollTop = y;
            else {
                wrapper.style.paddingTop = offY + 'px';
                document.body.scrollTop += offY;
            }
        }
        getDocumentDimension();
        updateCorners(x, y, w, h);

        if (y < initScrollTop) {
            //scroll - x:no, y:no
            if (w <= clientW && h <= clientH) {
                setTimeout(sendRequest, 300, {
                    action: 'visible',
                    counter: counter,
                    ratio: (h % clientH) / clientH,
                    scrollBar: {
                        x: false,
                        y: false
                    },
                    centerW: w,
                    centerH: h,
                    menuType: 'selected'
                });
                return;
            }
            setTimeout(sendRequest, 300, {
                action: 'scroll_next_done'
            });
        } else {
            removeSelected();

            setTimeout(function() {
                sendRequest({
                    action: 'capture_selected_done',
                    data: {
                        x: offX,
                        y: offY,
                        w: w,
                        h: h
                    }
                });
            }, 100);
        }
    }
}

//bind action button: 
//  1. done -> new tab 
//  2. cancel -> 
// all : unbind window.resize, mouse down

function removeSelected() {
    window.removeEventListener('resize', windowResize);
    document.body.removeEventListener('keydown', selectedKeyDown, false);
    wrapper.parentNode.removeChild(wrapper);
    isSelected = false;
}

function autoScroll(e) {
    var clientY = e.clientY,
        clientX = e.clientX,
        restY = window.innerHeight - clientY,
        restX = window.innerWidth - clientX;
    if (clientY < 20) document.body.scrollTop -= 25;
    if (clientX < 40) document.body.scrollLeft -= 25;
    if (restY < 40) document.body.scrollTop += 60 - restY;
    if (restX < 40) document.body.scrollLeft += 60 - restX;
}

function updateCorners(x, y, w, h) { //x:initX, w:centerW
    var topW = (w >= 0) ? (x + w) : x;
    var topH = (h >= 0) ? y : (y + h);
    var rightW = (w >= 0) ? (docW - x - w) : (docW - x);
    var rightH = (h >= 0) ? (y + h) : y;
    var bottomW = (w >= 0) ? (docW - x) : (docW - x - w);
    var bottomH = docH - rightH;
    var leftW = docW - bottomW;
    var leftH = docH - topH;


    var top = document.getElementById('awesome_screenshot_top');
    var right = document.getElementById('awesome_screenshot_right');
    var bottom = document.getElementById('awesome_screenshot_bottom');
    var left = document.getElementById('awesome_screenshot_left');
    setStyle(top, 'width', topW + 'px');
    setStyle(top, 'height', topH + 'px');
    setStyle(right, 'width', rightW + 'px');
    setStyle(right, 'height', rightH + 'px');
    setStyle(bottom, 'width', bottomW + 'px');
    setStyle(bottom, 'height', bottomH + 'px');
    setStyle(left, 'width', leftW + 'px');
    setStyle(left, 'height', leftH + 'px');
}

function updateCenter(x, y, w, h) {
    var l = (w >= 0) ? x : (x + w);
    var t = (h >= 0) ? y : (y + h);

    var center = document.getElementById('awesome_screenshot_center');
    setStyle(center, 'width', Math.abs(w) + 'px');
    setStyle(center, 'height', Math.abs(h) + 'px');
    setStyle(center, 'top', t + 'px');
    setStyle(center, 'left', l + 'px');
}

function updateWrapper() {
    setStyle(wrapper, 'display', 'none');
    setStyle(wrapper, 'width', document.body.scrollWidth + 'px');
    setStyle(wrapper, 'height', document.body.scrollHeight + 'px');
    setStyle(wrapper, 'display', 'block');
}

function setStyle(ele, style, value) {
    ele.style.setProperty(style, value /* , 'important' */ );
}

function getStyle(ele, style) {
    return parseInt(ele.style.getPropertyValue(style));
}
/************** selected capture end **************/

function sendRequest(r) {
    chrome.runtime.sendMessage(r);
}

/**-- deal with fixed elements --**/
// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// http://code.google.com/p/chrome-screen-capture/

function enableFixedPosition(enableFlag) {
    if (enableFlag) {
        for (var i = 0, l = fixedElements.length; i < l; ++i) {
            fixedElements[i].style.position = "fixed";
        }
    } else {
        var nodeIterator = document.createNodeIterator(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );
        var currentNode;
        while (currentNode = nodeIterator.nextNode()) {
            var nodeComputedStyle = document.defaultView.getComputedStyle(currentNode, "");
            // Skip nodes which don't have computeStyle or are invisible.
            if (!nodeComputedStyle)
                return;
            var nodePosition = nodeComputedStyle.getPropertyValue("position");
            if (nodePosition == "fixed") {
                fixedElements.push(currentNode);
                currentNode.style.position = "absolute";
            }
        }
    }
}

function restoreFixedElements() {
    if (fixedElements) {
        for (var i = 0, len = fixedElements.length; i < len; i++) {
            fixedElements[i].style.position = 'fixed';
        }

        fixedElements = []; // empty
    }
}

/**-- utility --**/

function checkScrollBar() {
    scrollBar.x = window.innerHeight > getClientH() ?
        true : false;
    //scrollBar.y = window.innerWidth > html.clientWidth ?true : false;
    scrollBar.y = document.body.scrollHeight > window.innerHeight ? true : false;
}

function myReplace(k, s) {
    var p = k.replace(/[\.\$\^\{\[\(\|\)\*\+\?\\]/ig, "\\$1");
    var patt = new RegExp('(' + p + ')', 'ig');
    return s.replace(patt, '<span style="font-weight:bold">$1</span>');
}

function getDocumentNode() {
    doc = window.document;
    if (window.location.href.match(/https?:\/\/mail.google.com/i)) {
        doc = doc.getElementById('canvas_frame').contentDocument;
    }
}

function getDocumentDimension() {
    docH = document.body.scrollHeight;
    docW = document.body.scrollWidth;
}

function getClientH() {
    return document.compatMode === "CSS1Compat" ? html.clientHeight : document.body.clientHeight;
}