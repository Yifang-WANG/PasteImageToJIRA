var isContentScriptLoaded; 
if(typeof isContentScriptLoaded == "undefined") {
	chrome.runtime.sendMessage({action:"insert_script"});
} else {
	chrome.runtime.sendMessage({action:"script_running"});
}