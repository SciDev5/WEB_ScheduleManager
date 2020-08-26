const localStorage = window.localStorage;
if (localStorage == undefined)
	throw new Error("This device does not support localStorage!");

let scheduleData = null;

function save() {
	localStorage.setItem("scheduleData",JSON.stringify(scheduleData));
}

function load() {
	scheduleData = JSON.parse(localStorage.getItem("scheduleData") || "null") || defaultScheduleData();
}

function defaultScheduleData() {
	return {
		startDay: [2020,7,25],
		weekDays: [false,true,true,true,true,true,false],
		holidays: [{start:1577854800000,length:3,name:"test lol"}],
		dayTypeOrder: [0,0,1,1],
		dayTypes: [
			{
				name: "A-day",
				blocks: [0,1,0],
				blockTimes: [7*60+30,8*60+0,9*60+30,10*60+0],
				color: "red"
			},
			{
				name: "B-day",
				blocks: [1,0,2],
				blockTimes: [9*60+30,10*60+0,10*60+30,11*60+0],
				color: "blue"
			}
		],
		blocks: [
			{ 
				name: "test class",
				info: "**TODO**",
				color: "orange"
			},
			{ 
				name: "class test",
				info: "**TODO**",
				color: "pink"
			},
			{ 
				name: "lunch lol",
				info: "**TODO**",
				color: "green"
			}
		]
	}
}
load();

function daysBetween(dateA,dateB) {
	return Math.round(Math.abs(dateA-dateB)/86400000);
}

function today() {
	var now = new Date();
	return new Date(now.getFullYear(),now.getMonth(),now.getDate());
}

function timeString(dayTime) {
	return Math.floor(dayTime/60).toString()+":"+("00"+(dayTime%60).toString()).substr(-2);
}

function createElement(parent,tagName,className,content) {
	var elt = document.createElement(tagName);
	if (content)
		elt.innerText = content;
	elt.className = className;
	if (parent)
		parent.appendChild(elt);
	return elt;
}
function createTextElement(parent,content) {
	var elt = document.createTextNode(content);
	if (parent)
		parent.appendChild(elt);
	return elt;
}

function getDataByDay(i) { // i is refrencing dayTypeOrder
	var dayType = scheduleData.dayTypes[scheduleData.dayTypeOrder[i%scheduleData.dayTypeOrder.length]];
	return dayType;
}


function createDaySchedule(dayData) {
	var {dayType,blocks} = dayData;
	
	var container = createElement(null,"div","schedule-day");
	var label = createElement(container,"div","label "+dayType.color,"Day ");
	createElement(label,"span","schedule-day-type",dayType.name);

	for (var i = 0; i < dayType.blocks.length; i++) {
		var blockI = dayType.blocks[i];
		var block = blocks[blockI];
		var blockElt = createElement(container,"div","block-summary "+block.color);
		createElement(blockElt,"span","summary-time",timeString(dayType.blockTimes[i]));
		createTextElement(blockElt," ");
		createElement(blockElt,"span","summary-name",block.name);
	}

	return container;
}
