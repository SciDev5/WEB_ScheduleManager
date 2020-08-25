const localStorage = window.localStorage;
if (localStorage == undefined)
	throw new Error("This device does not support localStorage!");

let scheduleData = {test: "data"};

function save() {
	localStorage.setItem("scheduleData",JSON.stringify(scheduleData));
}

function load() {
	scheduleData = JSON.parse(localStorage.getItem("scheduleData") || "null");
}