//==== On ready ===============================================================

  $(document).ready(function() {
    chrome.storage.local.get("image", function(obj) {
      try {
        if (obj.image) {
          $('#create_link')[0].click();
            $(document.body).one("DOMNodeInserted", "#create-issue-dialog", function() {
              var URLObj = window.URL || window.webkitURL;
              var b64Data = obj.image.split(",")[1];
              var contentType = obj.image.split(",")[0].split(":")[1].split(";")[0];
              var blob = b64toBlob(b64Data, contentType);
              var source = URLObj.createObjectURL(blob);
              paste_image(blob, source); 
              chrome.storage.local.remove("image");
          }); 
        }
       
      } catch (error) {
        console.log(error);
      }
    });
  });

  chrome.runtime.onMessage.addListener(function(message) {
    if (message && message.action == 'copyToJira') {
      chrome.storage.local.get("image", function(obj) {
      try {
        if (obj.image) {
          var URLObj = window.URL || window.webkitURL;
          var b64Data = obj.image.split(",")[1];
          var contentType = obj.image.split(",")[0].split(":")[1].split(";")[0];
          var blob = b64toBlob(b64Data, contentType);
          var source = URLObj.createObjectURL(blob);
          paste_image(blob, source); 
          chrome.storage.local.remove("image"); 
        }
       
      } catch (error) {
        console.log(error);
      }});
    }
  });

//===== helpers ===============================================================

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

//=== Clipboard ================================================================

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;
  
  var byteCharacters = atob(b64Data);
  var byteArrays = [];
  
  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);
      
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
      }
      
      var byteArray = new Uint8Array(byteNumbers);
      
      byteArrays.push(byteArray);
  }
  
  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

//chrome
window.addEventListener("paste", pasteHandler);
function pasteHandler(e){
  var URLObj = window.URL || window.webkitURL;
  if(e.clipboardData) {

    chrome.storage.local.get("image", function(obj) {
      try {
        if (obj.image) {
          var b64Data = obj.image.split(",")[1];
          var contentType = obj.image.split(",")[0].split(":")[1].split(";")[0];
          var blob = b64toBlob(b64Data, contentType);
          var source = URLObj.createObjectURL(blob);
          paste_image(blob, source); 
          chrome.storage.local.remove("image");
          return; 
        }
       
      } catch (error) {
        console.log(error);
      }
    });

    var items = e.clipboardData.items;
    if (items){
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          var blob = items[i].getAsFile();        
          var source = URLObj.createObjectURL(blob);
          paste_image(blob, source); 
        }
      }
    }
  }
}


function paste_image(blob, source){
  var urlprefix = '/rest/internal/1.0/AttachTemporaryFile?';
  var attach_div = $("#attachment_div.field-group");
  var file_input_list = $("#attach-file-dialog .file-input-list");
  if (attach_div.is(':visible') || file_input_list.is(':visible')) {
    var container = attach_div.is(':visible') ? attach_div : file_input_list;
    var children_amount = attach_div.is(':visible') ? 3 : 2;

    attach_file_to_jira(blob, source, urlprefix, container, children_amount);
  }
}

function attach_file_to_jira(blob, source, urlprefix, elem_container, predefined_children_amount) {
  var atl_token = $("[name='atl_token']")[0].value;

  var filename = elem_container.children().length - predefined_children_amount + 1;
  var attachFileURL = urlprefix + "filename={file}.png&atl_token={token}&projectId=10501".supplant({
      file: filename,
      token: atl_token
  });

  $.ajax({
    url: attachFileURL,
    contentType: false,
    processData: false,
    type: 'POST',
    data: blob
  }).done(function(data) {
    var div = $("<div class='field-group'/>");
    var check = $("<input type='checkbox' class='checkbox' checked='checked' name='filetoconvert'</input>").
                    attr({id: 'filetoconvert-' + data.id,
                          value: data.id});
    var label = $("<label/>").attr({ 'for': 'filetoconvert-' + data.id}).text(filename + '.png');
    var img = $("<img>").attr({'src': source}).css({'max-height':150, 'max-width': 150});
    var br = $("<br>");

    div.append(check).append(label).append(br).append(img);
    elem_container.find('div:nth-last-child({num})'.supplant({ num: predefined_children_amount })).before(div);
  });
}
  
//=== /Clipboard ===============================================================
