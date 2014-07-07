  var showCanvas; //var for cga.js
  var isPngCompressed = false;
  var isSavePageInit = false;

  var offsetX, offsetY; //edit-area coordinates to document
  var editW, editH; //edit-area dimension
  var scrollbarWidth = 17; //scrollbar width
  var $editArea;
  var actions = [];
  var initFlag = 1; //edit page init state, use to indicate the start state in 'undo' function
  var requestFlag = 1; //init only once
  var textFlag = 1; //use for text input
  var uploadFlag = false; //use for uploading state

  var showCanvas, showCtx, drawCanvas, drawCtx;
  var drawColor = 'red';
  var taburl, tabtitle;
  var compressRatio = 80,
    resizeFactor = 100;
  var shift = false;

  var dragresize;

  window.addEventListener('resize', function() {
    getEditOffset();
  });

  function prepareEditArea(request) {
    console.log(request);

    var menuType = request.menuType;
    var type = request.type;
    var data = request.data;
    taburl = request.taburl;
    tabtitle = request.tabtitle;
    var sx = request.centerOffX,
      sy = request.centerOffY;
    getEditOffset();

    // for fix in retina display
    window.con = 1;
    window.con2 = 1;

    scrollbarWidth = getScrollbarWidth();

    var w = request.w,
        h = request.h;
    switch (type) {
      case 'visible':
        $('#save-image').attr({
          src: data[0]
        }).load(function() {
          if (menuType == 'selected') {
            editW = request.centerW * window.devicePixelRatio;
            editH = request.centerH * window.devicePixelRatio;
            updateEditArea();
            updateShowCanvas();
            getEditOffset();
            addMargin();
            getEditOffset();
          } else if (menuType == 'upload') {
            editW = w;
            editH = h;
            sx = 0;
            sy = 0;
            updateEditArea();
            updateShowCanvas();
            getEditOffset();
          } else if (menuType == 'desktop') {
            editW = w;
            editH = h;
            sx = 0;
            sy = 0;
            updateEditArea();
            updateShowCanvas();
            getEditOffset();
          } else {
            console.log(w, h);
            editW = (w - scrollbarWidth) /*/window.devicePixelRatio*/ ;
            editH = (h - scrollbarWidth) /*/window.devicePixelRatio*/ ;
            sx = 0;
            sy = 0;
            updateEditArea();
            updateShowCanvas();
            getEditOffset();
          }
          w = editW;
          h = editH;


          showCtx.drawImage(this, sx * window.devicePixelRatio, sy * window.devicePixelRatio, w, h, 0, 0, w, h);
          $(this).unbind('load');
        });
        break;
      case 'entire':
        var counter = request.counter,
          ratio = request.ratio,
          scrollBar = request.scrollBar;

        var i = j = n = 0,
          len = data.length,
          hlen = counter,
          vlen = Math.round(len / hlen);


        //If we put prepareCanvasV, prepareCanvasH and prepareNextCol at this case's bottom,
        //we will get undefined error when we call these functions in compressed 
        //code which is compiled by Google Closure Compiler.

        //vertical 

        function prepareCanvasV(d, sx, sy, sw, sh, dx, dy, dw, dh) {
          console.log(d);
          dy = i * h;
          if (i == vlen - 1) {
            sy = h - lastH;
            sh = dh = lastH;
          }
          console.log(i, vlen - 1, sy, sh, dy);

          $('#save-image').attr({
            src: d
          }).load(function() {
            $(this).unbind('load');
            console.log(this, sx, sy, sw, sh, dx, dy, dw, dh);
            showCtx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);

            if (++i > vlen - 1)
              prepareNextCol();
            else
              prepareCanvasV(data[++n], sx, sy, sw, sh, dx, dy, dw, dh);
          });
        }

        //horizontal

        function prepareCanvasH(d, sx, sy, sw, sh, dx, dy, dw, dh, func) {
          dx = j * w;
          if (j == hlen - 1) {
            sx = w - lastW;
            sw = dw = lastW;
          }

          $('#save-image').attr({
            src: d
          }).load(function() {
            $(this).unbind('load');
            showCtx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);

            if (j < hlen - 1)
              prepareCanvasH(data[++j], sx, sy, sw, sh, dx, dy, dw, dh);
          });
        }

        //start a new col

        function prepareNextCol() {
          if (++j > hlen - 1) return;
          if (j == hlen - 1) sx = w - lastW, sw = dw = editW - j * w, dx = j * w;
          else sx = 0, sw = dw = w, dx = j * w;
          sy = 0, sh = dh = h, dy = 0;

          i = 0;
          n = i + j * vlen;
          prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
        }


        //*scroll - x:no, y:yes
        if (!scrollBar.x && scrollBar.y) {
          //h += scrollbarWidth; //line-47: minus more
          w -= scrollbarWidth;
          vlen = len;
          lastH = h * ratio.y;

          if (menuType == 'selected') {
            if (scrollBar.realX) h -= scrollbarWidth;
            editW = request.centerW * window.devicePixelRatio;
          } else editW = w;
          if (lastH) editH = (h * (vlen - 1) + lastH);
          else editH = (h * vlen);
          updateEditArea();
          updateShowCanvas();
          getEditOffset();
          addMargin();
          getEditOffset();

          var sx = 0,
            sw = dw = w,
            dx = 0,
            sy = 0,
            sh = dh = h,
            dy = 0;
          prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
        }

        //*scroll - x:yes, y:no
        if (scrollBar.x && !scrollBar.y) {
          //w += scrollbarWidth; //line-46: minus more
          h -= scrollbarWidth;
          hlen = len;
          lastW = w * ratio.x;

          if (menuType == 'selected') {
            if (scrollBar.realY) w -= scrollbarWidth;
            editH = request.centerH * window.devicePixelRatio;
          } else editH = h;
          if (lastW) editW = (w * (hlen - 1) + lastW);
          else editW = (w * hlen);
          updateEditArea();
          updateShowCanvas();
          $editArea.addClass('add-margin');
          getEditOffset();

          var sx = 0,
            sw = dw = w,
            dx = 0,
            sy = 0,
            sh = dh = h,
            dy = 0;
          prepareCanvasH(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
        }

        //*scroll - x:yes, y:yes
        if (scrollBar.x && scrollBar.y) {
          lastW = w * ratio.x, lastH = h * ratio.y;
          w -= scrollbarWidth;
          h -= scrollbarWidth;
          if (menuType == 'selected') {
            editW = request.centerW * window.devicePixelRatio;
            editH = request.centerH * window.devicePixelRatio;
            //console.log(editW+'+'+editH);
          } else {
            if (lastW) editW = (w * (hlen - 1) + lastW);
            else editW = (w * hlen);
            if (lastH) editH = (h * (vlen - 1) + lastH);
            else editH = (h * vlen);
          }
          updateEditArea();
          updateShowCanvas();

          var sx = 0,
            sw = dw = w,
            dx = 0,
            sy = 0,
            sh = dh = h,
            dy = 0;
          prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
        }

        break;
    }
  }

  function prepareTools() { //change
    //console.log('ready');
    $('#exit').click(function() {
      chrome.runtime.sendMessage({
        action: 'exit'
      });
    })
    $('#tool-panel>div').click(function(e) {
      var target = getTarget(e.target);
      console.log(target);
      if (target.nodeName == 'DIV')
        return;
      tool(target.id);

      function getTarget(t) {
        var node = t.nodeName;
        if (node != 'A' && node != 'DIV') {
          t = t.parentNode;
          getTarget(t);
        }
        return t;
      }
    });

  }

  function bindShortcuts() {
    //*****bind annotate shortcut
    var ctrl = false;
    $('body').keydown(function(e) {
      var id = '';
      switch (e.which) {
        case 83: //Save
          id = 'save';
          break;
        case 67: //Crop
          id = 'crop';
          break;
        case 82: //Rectangle
          id = 'rectangle';
          break;
        case 69: //Ellipse
          id = 'ellipse';
          break;
        case 65: //Arrow
          id = 'arrow';
          break;
        case 76: //Line
          id = 'line';
          break;
        case 70: //Free Line
          id = 'free-line';
          break;
        case 66: //Blur
          id = 'blur';
          break;
        case 84: //Text
          //$(this).unbind('keydown');
          id = 'text';
          break;
        case 17: //Ctrl
          ctrl = true;
          break;
        case 90: //Undo/Z
          if (ctrl) {
            id = 'undo';
          }
          break;
        case 16: //Draw shape/Shift
          shift = true;
          break;
        case 13: //Done/Enter
          id = 'done';
          break;
        case 27: //Cancel/Esc
          id = 'cancel';
          break;
      }

      if (id) {
        if (!$('body').hasClass('selected')) {
          tool(id);
        } else {
          if (id == 'done' || 'cancel')
            tool(id);
        }
        if (id != 'undo')
          ctrl = false;
      }
    }).keyup(function(e) {
      switch (e.which) {
        case 16: //Shift
          shift = false;
          break;
      }
    });
  }

  function tool(id) {
    //save draw action
    if (drawCanvas.width * drawCanvas.height != 0 && id != 'color' && id != 'done' && id != 'cancel') {
      if (id == 'undo') {
        if ($('body').hasClass('draw_free_line'))
          undo();
        else
          $(drawCanvas).attr({
            width: 0,
            height: 0
          }).unbind().css({
            'left': 0,
            'top': 0
          });

        if (actions.length == 0)
          disableUndo();
        return;
      }

      if (!$('body').hasClass('draw_free_line')) {
        saveAction({
          type: 'draw'
        });
        showCtx.drawImage(drawCanvas, parseInt($(drawCanvas).css('left')), parseInt($(drawCanvas).css('top')));
      }
      $(drawCanvas).attr({
        width: 0,
        height: 0
      });
    }

    if (id != 'color') {
      saveText();
      if (id != 'undo' && id != 'resize') {
        $('#temp-canvas').remove();
        $('body').removeClass('justCropped draw draw-text draw-blur');
      }
    }
    updateBtnBg(id);

    switch (id) {
      case 'save':
        save();
        break;
      case 'crop':
        crop();
        break;
      case 'color':
        color();
        break;
      case 'done':
        done();
        break;
      case 'cancel':
        cancel();
        break;
      case 'resize':
        $('#resize select').unbind().change(function(e) {
          resize(this.value);
        });
        break;
      case 'undo':
        undo();
        break;
      default:
        draw(id);
        break;
    }

    $('.cd-input').off().on('input', function() {
      var w = $('#cd-width').val(),
        h = $('#cd-height').val();
      console.log("sdf");

      changeDimension(w, h);
    })
      .on('focus', function() {
        try {
          dragresize.deselect(true);
        } catch (err) {
          console.log(err);
        }

      });

    $('#cropdiv').on('mousedown', function() {
      $('.cd-input').trigger('blur');
    });

  }

  function changeDimension(w, h) {

    var cropDiv = $('#cropdiv'),
      cropdiv_top = parseInt(cropDiv.css('top')),
      cropdiv_left = parseInt(cropDiv.css('left'));

    cropDiv.css({
      width: w,
      height: h
    });
    drawCtx.fillStyle = 'rgba(80,80,80,0.4)';
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCtx.clearRect(cropdiv_left, cropdiv_top, w, h);
  }

  function save() { //change
    $('.content>.as, .content>.as').removeAttr('style');
    //$('#privacy').attr('checked', 'checked');
    $('#saveOnline .content .diigo input[name=title]').val(tabtitle);

    document.body.scrollTop = 0;
    $('#save-tip').hide();
    $('#image_loader').css({
      display: 'inline-block'
    });
    $('#save-image, #re-edit').css({
      visibility: 'hidden'
    });
    $('body').removeClass('crop draw-text').addClass('save');
    $('#save').removeClass('active');

    $('#show-canvas').hide();
    $('#draw-canvas').attr({
      width: 0,
      height: 0
    });

    $($editArea).enableSelection();

    //canvas to base64
    var imageData = '';

    setTimeout(prepareImage, 100);

    function prepareImage() {
      function prepareOptions() {
        $('#image_loader').hide();
        $('#save-image, #re-edit').css({
          visibility: 'visible'
        });
        $('#save-tip').show();
      }

      function buildImage(image) {
        if ($('#save-image')[0].src != image)
          $('#save-image').attr({
            src: image
          }).load(function() {
            $(this).css({
              width: 'auto'
            });
            if (this.width >= parseInt($('#save_image_wrapper').css('width')))
              $(this).css({
                width: '100%'
              });

            prepareOptions();
            $(this).unbind();
          });
        else
          prepareOptions();
      }

      imageData = showCanvas.toDataURL();


      buildImage(imageData);
    }
  }
  var cflag = 0;

  function crop() {
    //disableEraser();
    $('body').addClass('selected');
    cflag = 1;
    $('body').removeClass('draw').addClass('crop');
    $('#crop-dimension').hide();
    $('.cd-input').val('');
    //$('#center').css({'outline':'none'});
    getEditOffset();
    $(showCanvas).unbind('mousedown click');
    $('#draw-canvas').css({
      'left': '0px',
      'top': '0px',
      'cursor': 'crosshair'
    }).unbind();
    drawCanvas.height = showCanvas.height;
    drawCanvas.width = showCanvas.width;
    if (cflag = 1) {
      drawCtx.fillStyle = 'rgba(80,80,80,0.4)';
      drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
    cflag = 0;
    //console.log("dddd");
    var sx, sy, //start coordinates
      mx, my, //move coordinates
      cw, ch, //center dimension
      dflag = mflag = 0; //mousedown and mousemove flag
    var $cropTip = $('#crop-tip'),
      $cropSize = $('#crop_size').hide();
    var winH;

    $('#draw-canvas')
      .hover(function() {
        //console.log('aa');
        //$(this).css({cursor:'crosshair'});
        $cropTip.text(chrome.i18n.getMessage('cropTip')).show();
      }, function(e) {
        $cropTip.hide();
      })
      .mousedown(function(e) {
        //if (e.button != 0) return;
        //console.log('dd');
        $cropTip.hide();
        //$cropSize.fadeIn('slow');
        $('#crop-dimension').show();
        //$('#center').css({'outline':'1px dashed #777'});
        sx = e.pageX - offsetX;
        sy = e.pageY - offsetY;
        placeCropSize();
        winH = window.innerHeight;
        dflag = 1;
        $('#cropdiv').css({
          'outline': '1px dashed #777'
        });
      })
      .mousemove(function(e) {
        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.clearRect(sx, sy, mx - sx, my - sy);
        autoScroll(e);

        if (dflag) {
          cw = mx - sx;
          ch = my - sy;
          mflag = 1;
          //updateHelper();
          updateCropSize(cw, ch);
          return;
        }
        $cropTip.css({
          top: (my + 5) + 'px',
          left: (mx + 5) + 'px'
        });
      })
      .mouseup(function(e) {
        if (mflag) {
          $('body').addClass('selected');

          ex = e.pageX - offsetX;
          ey = e.pageY - offsetY;
          $(this).unbind();
          dflag = mflag = 0;
          var ssx = sx < ex ? sx : ex;
          var ssy = sy < ey ? sy : ey;
          var cropwidth = Math.abs(ex - sx);
          var cropheight = Math.abs(ey - sy);
          //cw = Math.abs(cw);
          //ch = Math.abs(ch);
          $('#cropdiv').css({
            'left': ssx,
            'top': ssy,
            'width': cropwidth,
            'height': cropheight,
            'display': 'block'
          });
          bindCenter();
          //$('#draw-canvas').unbind();

        }
      });

    function bindCenter() {

      var edit_area = document.getElementById('edit-area');


      dragresize = new DragResize('dragresize', {
        maxLeft: editW,
        maxTop: editH
      });
      //console.log('here');    
      dragresize.isElement = function(elm) {
        if (elm.className && elm.className.indexOf('drsElement') > -1) return true;
      };
      dragresize.isHandle = function(elm) {
        if (elm.className && elm.className.indexOf('drsMoveHandle') > -1) return true;
      };

      dragresize.apply(edit_area);
      //$('#cropdiv').css({ 'left': ssx, 'top': ssy, 'width': cropwidth, 'height': cropheight,'display':'block' });
      dragresize.select(cropdiv);


      var cropdiv_top, cropdiv_left, cropdiv_width, cropdiv_height;
      drawCtx.fillStyle = 'rgba(80,80,80,0.4)';
      dragresize.ondragmove = function(isResize, ev) {
        $cropTip.hide();
        cropdiv_top = parseInt($('#cropdiv').css('top'));
        cropdiv_left = parseInt($('#cropdiv').css('left'));
        cropdiv_width = parseInt($('#cropdiv').css('width'));
        cropdiv_height = parseInt($('#cropdiv').css('height'));
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.clearRect(cropdiv_left, cropdiv_top, cropdiv_width, cropdiv_height);

        placeCropSize(cropdiv_top);
        updateCropSize(cropdiv_width, cropdiv_height)
        //updateHelper();
        autoScroll(ev);




      };
    }

    function updateHelper() {
      $('#top').width((cw >= 0) ? (sx + cw) : sx).height((ch >= 0) ? sy : (sy + ch));
      $('#right').width((cw >= 0) ? (editW - sx - cw) : (editW - sx)).height((ch >= 0) ? (sy + ch) : sy);
      $('#bottom').width((cw >= 0) ? (editW - sx) : (editW - sx - cw)).height((ch >= 0) ? (editH - sy - ch) : (editH - sy));
      $('#left').width((cw >= 0) ? sx : (sx + cw)).height((ch >= 0) ? (editH - sy) : (editH - sy - ch));
      $('#center').width(Math.abs(cw)).height(Math.abs(ch)).css({
        'left': ((cw >= 0) ? sx : (sx + cw)) + 'px',
        'top': ((ch >= 0) ? sy : (sy + ch)) + 'px'
      });
    }

    function placeCropSize(top) {
      top < 30 ? $cropSize.css({
        top: '5px'
      }) : $cropSize.css({
        top: '-25px'
      });
    }

    function updateCropSize(w, h) {
      $cropSize.html(Math.abs(w) + ' X ' + Math.abs(h));
      $('#cd-width').val(Math.abs(w));
      $('#cd-height').val(Math.abs(h));
    }

    function autoScroll(e) {
      var clientY = e.clientY;
      var restY = winH - clientY;
      if (clientY < 80) document.body.scrollTop -= 25;
      if (restY < 40) document.body.scrollTop += 60 - restY;
    }
  }

  function color() {

    $('#color').find('ul').fadeIn()
      .hover(function(e) {
        $(this).show();
        e.stopPropagation();
      }, function(e) {
        $(this).fadeOut(300);
      })
      .click(function(e) {
        var bgColor = $(e.target).css('background-color');
        $(this).prev('span').css({
          'background-color': bgColor
        });
        drawColor = bgColor;
        if ($('#text').hasClass('active')) {
          $('div[contenteditable]').css({
            'color': drawColor
          });
        }

        e.stopPropagation();
      });
  }

  function resize(value) {
    var relFactor = parseInt(value), //absolute, relative factor
      absFactor = relFactor / 100;
    var imageData = showCtx.getImageData(0, 0, editW, editH);

    $('body').removeClass('draw draw-text draw-blur');
    saveAction({
      type: 'resize',
      data: imageData,
      relFactor: relFactor /*, absFactor:absFactor*/
    });

    var len = actions.length;
    if (len > 1) {
      for (var i = len - 1; i >= 0; i--) {
        var action = actions[i];
        var type = action.type;

        if (type == 'resize' && (i == 0 || actions[i - 1].type != 'resize')) {
          imageData = action.data;
          editW = action.w;
          editH = action.h;
          break;
        }
      }
    }

    $(drawCanvas).attr({
      width: editW,
      height: editH
    }).hide();
    drawCtx.putImageData(imageData, 0, 0);
    editW = editW * absFactor;
    editH = editH * absFactor;
    updateEditArea();
    updateShowCanvas();
    showCtx.drawImage(drawCanvas, 0, 0, editW, editH);
    $(drawCanvas).attr({
      width: 0,
      height: 0
    }).show();

    getEditOffset();
    addMargin();
    getEditOffset();
    $('body').addClass('resized');
    $('#undo span').css({
      'background-position-y': '0'
    });
    imageData = null;
  }

  function done() {
    $(drawCanvas).attr({
      width: 0,
      height: 0
    }).unbind();
    $('#cropdiv').hide();
    $('#crop-tip').hide();
    $('#crop-dimension').hide();
    cropdiv_top = parseInt($('#cropdiv').css('top'));
    cropdiv_left = parseInt($('#cropdiv').css('left'));
    cropdiv_width = parseInt($('#cropdiv').css('width'));
    cropdiv_height = parseInt($('#cropdiv').css('height'));
    saveAction({
      type: 'crop'
    });
    var cropdiv_top, cropdiv_left, cropdiv_width, cropdiv_height;


    var data = showCtx.getImageData(cropdiv_left, cropdiv_top, cropdiv_width, cropdiv_height);
    $(showCanvas).attr({
      width: cropdiv_width,
      height: cropdiv_height
    });
    showCtx.putImageData(data, 0, 0);

    $('body').removeClass().addClass('cropped justCropped'); // must put these 2 lines here
    $('#crop').removeClass('active');
    //$('#helper').removeClass('changed');
    enableUndo();
    editW = cropdiv_width;
    editH = cropdiv_height;
    updateEditArea();
    $('#cropdiv').css({
      width: 0,
      height: 0,
      outline: 'none'
    });
    getEditOffset();
    //$center = null;     
  }

  function cancel() {
    $('#crop_size').hide();
    $('#crop-dimension').hide();
    $(drawCanvas).attr({
      width: 0,
      height: 0
    });
    $('body').removeClass('crop selected');
    $('#crop').removeClass('active');
    $('#cropdiv').hide();
    $('#cropdiv').css({
      'width': 0,
      'height': 0,
      'outline': 'none'
    });
    $('#draw-canvas').unbind();


  }

  function undo() {
    var len = actions.length;
    var action = actions.pop();
    if (len == 0) return;
    if (len == 1) disableUndo();
    if (action.f) {
      $('body').removeClass('cropped');
      initFlag = 1;
    }

    switch (action.type) {
      case 'draw':
        console.log("undo");
        showCtx.putImageData(action.data, 0, 0);
        break;
      case 'crop':
        restoreAction();
        break;
      case 'resize':
        resizeFactor = action.factor;
        $('#resize select option').each(function(index) {
          if ($(this).text() == resizeFactor + '%')
            $(this).siblings().removeAttr('selected').end()
              .attr({
                selected: 'selected'
              });
        });

        restoreAction();
        break;
    }

    function restoreAction() {
      editW = action.w;
      editH = action.h;
      updateEditArea();
      getEditOffset();
      addMargin();
      getEditOffset();
      updateShowCanvas();

      showCtx.putImageData(action.data, 0, 0);
      action = null;
    }
  }

  function enableUndo() {
    $('#undo').css({
      visibility: 'visible'
    }).removeClass('disable')
      .find('span').css({
        'background-position': '-200px 0'
      });
  }

  function disableUndo() {
    $('#undo').addClass('disable')
      .find('span').css({
        'background-position': '-200px -20px'
      });
  }

  function draw(id) {

    $('body').removeClass('crop draw_free_line').addClass('draw');
    textFlag = 1;
    if (id == 'free-line') { //free-line, use drawCanvas as a cover
      $('body').addClass('draw_free_line');
      $(showCanvas).unbind();
      if (!$('#temp-canvas').length) createTempCanvas();
      freeLine();
      return;
    }
    $(drawCanvas).unbind('mousedown');
    if (id == 'blur') { //blur
      $('body').addClass('draw-blur');
      blur();
      return;
    }
    if (id == 'text') {
      $('body').addClass('draw-text');
    }
    $(showCanvas).unbind()
      .click(function(e) { //text
        if (id == 'text') {
          var mousePos = {
            'x': e.pageX,
            'y': e.pageY
          };
          text(mousePos);
        }
      })
      .mousedown(function(e) { //shape
        //if (e.button != 0) return;
        if (drawCanvas.width * drawCanvas.height != 0) {
          saveAction({
            type: 'draw'
          });
          showCtx.drawImage(drawCanvas, parseInt($(drawCanvas).css('left')), parseInt($(drawCanvas).css('top'))); //save drawCanvas to showCanvas
        }

        $(drawCanvas).attr({
          width: 0,
          height: 0
        });
        var mousePos = {
          'x': e.pageX,
          'y': e.pageY
        };
        switch (id) {
          case 'text':
            break;
          default:
            shape(id, mousePos);
            break;
        }
      });
  }

  function shape(id, mousePos) {
    var sx = mousePos.x - offsetX, //mouse start x
      sy = mousePos.y - offsetY;

    $(this)
      .mousemove(function(e) {
        mouseMove(e.pageX, e.pageY);
      })
      .mouseup(function(e) {
        $(this).unbind('mousemove mouseup');
        $(drawCanvas).unbind('mousedown');
        enableUndo();
        //disableEraser();
        $.Draggable(drawCanvas);
      });

    function mouseMove(px, py) {
      var lw = 4, //lineWidth
        mx = px - offsetX, //mouse move x
        my = py - offsetY;

      var x = Math.min(mx, sx) - lw, //canvas left
        y = Math.min(my, sy) - lw,
        w = Math.abs(mx - sx) + 2 * lw,
        h = Math.abs(my - sy) + 2 * lw;

      $(drawCanvas).attr({
        width: w,
        height: h
      }).css({
        left: x + 'px',
        top: y + 'px',
        cursor: 'crosshair'
      }).disableSelection();
      drawCtx.strokeStyle = drawColor;
      drawCtx.fillStyle = drawColor;
      drawCtx.lineWidth = lw;

      switch (id) {
        case 'rectangle':
          rectangle();
          break;
        case 'ellipse':
          ellipse();
          break;
        case 'arrow':
          arrow();
          break;
        case 'line':
          line();
          break;
          // case 'highlight':highlight(); break;
      }

      function rorectangle() {
        drawCtx.clearRect(0, 0, w, h);
        roundRect(drawCtx, lw, lw, w - 2 * lw, h - 2 * lw);

      }

      function rectangle() {
        drawCtx.clearRect(0, 0, w, h);
        drawCtx.strokeRect(lw, lw, w - 2 * lw, h - 2 * lw);
      }

      function ellipse() {
        drawCtx.clearRect(0, 0, w, h);
        drawCtx.beginPath();
        ellipse(lw, lw, w - 2 * lw, h - 2 * lw);
        drawCtx.stroke();

        function ellipse(aX, aY, aWidth, aHeight) {
          var hB = (aWidth / 2) * .5522848,
            vB = (aHeight / 2) * .5522848,
            eX = aX + aWidth,
            eY = aY + aHeight,
            mX = aX + aWidth / 2,
            mY = aY + aHeight / 2;
          drawCtx.moveTo(aX, mY);
          drawCtx.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
          drawCtx.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
          drawCtx.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
          drawCtx.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
          drawCtx.closePath();
        }
      }

      function arrow() {
        drawCtx.clearRect(0, 0, w, h);
        drawCtx.beginPath();
        var sx1 = sx < mx ? lw : w - lw,
          sy1 = sy < my ? lw : h - lw,
          mx1 = w - sx1;
        my1 = h - sy1;
        drawCtx.moveTo(sx1, sy1);
        drawCtx.lineTo(mx1, my1);
        drawCtx.stroke();
        var arrow = [
          [4, 0],
          [-10, -5.5],
          [-10, 5.5]
        ];
        var ang = Math.atan2(my1 - sy1, mx1 - sx1);
        drawFilledPolygon(translateShape(rotateShape(arrow, ang), mx1, my1)); //e.pageX-offsetX,e.pageY-offsetY

        function drawFilledPolygon(shape) {
          drawCtx.beginPath();
          drawCtx.moveTo(shape[0][0], shape[0][1]);

          for (p in shape)
            if (p > 0) drawCtx.lineTo(shape[p][0], shape[p][1]);

          drawCtx.lineTo(shape[0][0], shape[0][1]);
          drawCtx.fill();
        }

        function translateShape(shape, x, y) {
          var rv = [];
          for (p in shape)
            rv.push([shape[p][0] + x, shape[p][1] + y]);
          return rv;
        }

        function rotateShape(shape, ang) {
          var rv = [];
          for (p in shape)
            rv.push(rotatePoint(ang, shape[p][0], shape[p][1]));
          return rv;
        }

        function rotatePoint(ang, x, y) {
          return [
            (x * Math.cos(ang)) - (y * Math.sin(ang)), (x * Math.sin(ang)) + (y * Math.cos(ang))
          ];
        }
      }

      function line() {

        drawCtx.clearRect(0, 0, w, h);
        drawCtx.beginPath();
        var sx1 = sx < mx ? lw : w - lw,
          sy1 = sy < my ? lw : h - lw,
          mx1 = w - sx1;
        my1 = h - sy1;
        drawCtx.moveTo(sx1, sy1);
        drawCtx.lineTo(mx1, my1);
        drawCtx.stroke();
        drawCtx.closePath();
      }
    }
  }

  function freeLine() {
    $(drawCanvas).attr({
      width: editW,
      height: editH
    }).css({
      'left': 0,
      'top': 0,
      'cursor': 'url(../images/pen.png),auto !important'
    }).disableSelection()
      .mousedown(function(e) {
        //if (e.button != 0) return;
        saveAction({
          type: 'draw'
        });
        var canvas = document.getElementById('temp-canvas');
        var ctx = canvas.getContext('2d');

        ctx.moveTo(e.pageX - offsetX, e.pageY - offsetY);
        $(this).mousemove(function(e) {
          ctx.lineTo(e.pageX - offsetX, e.pageY - offsetY);
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = 3; //narrower than shape's lw
          ctx.stroke();
        }).mouseup(function(e) {
          $(this).unbind('mousemove mouseup');
          enableUndo();
          //enableEraser();

          showCtx.drawImage(canvas, 0, 0);
          $(canvas).remove();
          canvas = null;
          createTempCanvas();
        });
      });


  }

  function createTempCanvas() {
    $(document.createElement('canvas')).attr({
      'width': editW,
      'height': editH,
      id: 'temp-canvas'
    }).insertBefore($(drawCanvas));
  }

  function blur() {
    $(showCanvas). /*css({cursor: 'url(images/cursor-blur.png),default'}) .*/ unbind()
      .mousedown(function(e) {
        //$(drawCanvas).css({cursor: 'url(images/cursor-blur.png,default)'});
        saveAction({
          type: 'draw'
        });
        $(this).mousemove(function(e) {
          var x = e.pageX - offsetX,
            y = e.pageY - offsetY;
          var img = showCtx.getImageData(x, y, 20, 20);
          img = blurData(img, 1);
          showCtx.putImageData(img, x, y);
          //FIXME - 2010-09-19 23:57:30 - this is a temperary fix for 'bluring bug':
          //if we blur some area and don't change webpage dimention the blur effect
          // don't show up. So each time we bluring, we add or remove a class to 
          //change dimension. We just change 1 px, it's small for human eyes!
          if ($('body').hasClass('blurBugFix')) $('body').removeClass('blurBugFix');
          else $('body').addClass('blurBugFix');
        });
      })
      .mouseup(function(e) {
        $(this).unbind('mousemove');
        enableUndo();
      });

    function blurData(img, passes) {
      // 'img' is imagedata return by getImageData or createImageData; Increase 'passes' for blurrier image
      var i, j, k, n, w = img.width,
        h = img.height,
        im = img.data,
        rounds = passes || 0,
        pos = step = jump = inner = outer = arr = 0;

      for (n = 0; n < rounds; n++) {
        for (var m = 0; m < 2; m++) { // First blur rows, then columns
          if (m) {
            // Values for column blurring
            outer = w;
            inner = h;
            step = w * 4;
          } else {
            // Row blurring
            outer = h;
            inner = w;
            step = 4;
          }
          for (i = 0; i < outer; i++) {
            jump = m === 0 ? i * w * 4 : 4 * i;
            for (k = 0; k < 3; k++) { // Calculate for every color: red, green and blue
              pos = jump + k;
              arr = 0;
              // First pixel in line
              arr = im[pos] + im[pos + step] + im[pos + step * 2];
              im[pos] = Math.floor(arr / 3);
              // Second
              arr += im[pos + step * 3];
              im[pos + step] = Math.floor(arr / 4);
              // Third and last. Kernel complete and other pixels in line can work from there.
              arr += im[pos + step * 4];
              im[pos + step * 2] = Math.floor(arr / 5);
              for (j = 3; j < inner - 2; j++) {
                arr = Math.max(0, arr - im[pos + (j - 2) * step] + im[pos + (j + 2) * step]);
                im[pos + j * step] = Math.floor(arr / 5);
              }
              // j is now inner - 2 (1 bigger)
              // End of line needs special handling like start of it
              arr -= im[pos + (j - 2) * step];
              im[pos + j * step] = Math.floor(arr / 4);
              arr -= im[pos + (j - 1) * step];
              im[pos + (j + 1) * step] = Math.floor(arr / 3);
            }
          }
        }
      }
      return img;
    }
  }

  function text(mousePos) {
    saveText();
    $('body').addClass('draw-text');
    var t = startT = mousePos.y - offsetY - 10, //10 for when click, put the text edit area a little up
      l = mousePos.x - offsetX;
    l > editW - minW ? l = editW - minW : '';
    var minW = 20,
      maxW = editW - l,
      maxH = editH - t;

    if (textFlag == 1) {
      newLine();
    }
    if (textFlag == 2) {
      textFlag = 1;
    }

    function newLine() {
      $('<input class="textinput"></input>').appendTo($editArea)
        .css({
          top: t + 'px',
          left: l + 'px',
          width: minW + 'px',
          color: drawColor
        }).focus()
        .autoGrowInput({ //plugin: jquery-autogrowinput.js
          comfortZone: 20,
          minWidth: 20,
          maxWidth: maxW
        }).keydown(function(e) {
          if (($(this).width() + 10 > maxW && e.keyCode >= 48) || (parseInt($(this).css('top')) - startT + 38 > maxH && e.keyCode == 13)) return false;
          var input = e.target;
          var key = e.keyCode;
          if (key == 13) {
            t += 18;
            newLine();
          }
          if (key == 8) {
            if (!input.value) {
              $(input).prev().prev().focus().end().end().next().remove().end().remove(); //plugin 
              t -= 18;
            }
          }
          if (key == 38) {
            $(input).prev().prev().focus();
          }
          if (key == 40) {
            $(input).next().next().focus();
          }
          e.stopPropagation();
        });
    }
  }

  function saveText() {
    console.log("1");
    //var $input = $($editArea).find('input:not(#share-link input)'); // ':not' solve the bug: 're eidt and save agian, share link input been removed'
    //var $input = $($editArea).find('input[type!="checkbox"]:not(#share-link input)');
    var $input = $($editArea).find('input[class="textinput"]');
    console.log($input);
    if ($input.length) {
      var texts = '';
      $input.each(function() {
        texts += this.value;
      });
      if (!texts) return;

      enableUndo();
      saveAction({
        type: 'draw'
      });
      textFlag = 2;
      $input.each(function() {
        console.log(this);
        var i = this;
        var text = i.value;
        if (text) {
          var l = parseInt($(i).css('left'));
          var t = parseInt($(i).css('top'));
          showCtx.font = 'bold 14px/18px Arial,Helvetica,sans-serif';
          showCtx.fillStyle = $(i).css('color');
          showCtx.fillText(text, l, t + 14);
        }
        console.log("2")
        $(i).next().remove().end().remove();
      });
    }
  }

  function saveAction(action) {
    switch (action.type) {
      case 'draw':
        actions.push({
          type: 'draw',
          data: showCtx.getImageData(0, 0, editW, editH)
        });
        break;
      case 'crop':
        actions.push({
          type: 'crop',
          data: showCtx.getImageData(0, 0, editW, editH),
          w: editW,
          h: editH,
          f: initFlag
        });
        initFlag = 0;
        break;
      case 'resize':
        actions.push({
          type: 'resize',
          data: action.data,
          w: editW,
          h: editH,
          absFactor: action.absFactor
        });
        break;
    }
  }

  function updateEditArea() {
    $editArea.css({
      width: editW + 'px',
      height: editH + 'px'
    });
  }

  function updateShowCanvas() {
    $(showCanvas).attr({
      width: editW,
      height: editH
    });
  }

  function updateBtnBg(id) {
    if (id != 'undo' && id != 'color' && id != 'cancel' && id != 'done')
      $($('#' + id)).siblings().removeClass('active').end().addClass('active');
  }

  function getInitDim() {
    editW = $(window).width(); //exclude scrollbar
    editH = $(window).height();
  }

  function getEditOffset() {
    var o = $editArea.offset();
    offsetX = o.left;
    offsetY = o.top;

  }

  function getScrollbarWidth() {
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 == w2) w2 = outer.clientWidth;

    document.body.removeChild(outer);

    return (w1 - w2);
  }

  function getLocVersion() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './manifest.json', false);
    xhr.send(null);
    return JSON.parse(xhr.responseText).version;
  }

  function addMargin() {
    (offsetX || (offsetY != 48 && offsetY != 88)) ? $editArea.addClass('add-margin') : $editArea.removeClass('add-margin');
  }

  $(document).ready(function() {
    $editArea = $('#edit-area');
    showCanvas = document.getElementById('show-canvas');
    showCtx = showCanvas.getContext('2d');
    drawCanvas = document.getElementById('draw-canvas');
    drawCtx = drawCanvas.getContext('2d');

    chrome.runtime.sendMessage({action: 'ready'});

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      prepareEditArea(message);
      prepareTools();
    });

    $(window).unbind('resize').resize(function() {
      getEditOffset();
      addMargin();
    });

  });

  //////////////////////////////
  var SavePage = {};

  SavePage.getImageSrc = function() {
    return $('#save-image').attr('src')
      .replace(/^data:image\/(png|jpeg);base64,/, "");
  };

  SavePage.saveLocal = function() {
    try {
      $('#pluginobj')[0].SaveScreenshot(
        $('#save-image')[0].src,
        tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' '), //filename
        localStorage['savePath'], //save directory

        function(result, path) {
          console.log(result, path)
        },
        'Save Image To' //prompt window title
      );
    } catch (error) {
      var src = document.getElementById('save-image').src;
      var b64Data = src.split(",")[1];
      var contentType = src.split(",")[0].split(":")[1].split(";")[0];

      function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 1024;

        function charCodeFromCharacter(c) {
          return c.charCodeAt(0);
        }

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          var slice = byteCharacters.slice(offset, offset + sliceSize);
          var byteNumbers = Array.prototype.map.call(slice, charCodeFromCharacter);
          var byteArray = new Uint8Array(byteNumbers);

          byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {
          type: contentType
        });
        return blob;
      }

      var blob = b64toBlob(b64Data, contentType);

      var blobUrl = (window.webkitURL || window.URL).createObjectURL(blob);

      var a = document.createElement('a');

      var e = document.createEvent("MouseEvents");
      e.initMouseEvent("click", !0, !0, window, 1, 0, 0, 0, 0, !1, !1, !1, !1, 0, null);
      a.setAttribute("href", blobUrl);
      a.setAttribute("download", tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' ') + "." + contentType.split('/')[1]);
      a.dispatchEvent(e);


    }

  };

  SavePage.initSaveOption = function() {
    $('#saveLocal').click(function(e) {
      var target = e.target;
      if ($(target).hasClass('button')) {
        if ($(target).hasParent('.save_button')) {
          SavePage.saveLocal();
        } else if ($(target).hasParent('.copy_button')) {
          SavePage.copy();
        }

      }
    });
  };

  SavePage.copy = function() {
      try {
        var src = document.getElementById('save-image').src;
        chrome.storage.local.set({"image": src});
        $('.copy_success').show(0).delay(3000).fadeOut("slow");

      } catch (error) {
        console.log(error);
      }

  };

  SavePage.init = function() {
    SavePage.initSaveOption();

    $('#open-path').click(function() {
      SavePage.openSavePath();
    });
  };