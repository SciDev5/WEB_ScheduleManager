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
				info: "A test class: **yeet**\n\n~~code!~~_`yeet2 lol`_\n\n[yeet](/)",
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

function getWeekendDayType() {
	return {
		name: "Weekend",
		blocks: [],
		blockTimes: [],
		color: "grey"
	}
}
function getHolidayDayType(holiday) {
	return {
		name: "Holiday ("+holiday.name+")",
		blocks: [],
		blockTimes: [],
		color: "grey"
	}
}

function daysBetween(dateA,dateB) {
	return Math.round(Math.abs(dateA-dateB)/86400000);
}

function today(date) {
	var now = date || new Date();
	return new Date(now.getFullYear(),now.getMonth(),now.getDate());
}

function timeString(dayTime) {
	return Math.floor(dayTime/60).toString()+":"+("00"+(dayTime%60).toString()).substr(-2);
}

function escapeHTML(text, replaceLineBreaks) {
	var str = text.replace(/&/g,"&amp").replace(/</g,"&lt").replace(/>/g,"&gt");
	if (replaceLineBreaks == undefined || replaceLineBreaks) str = str.replace(/\r?\n/g,"<br>");
	return str;
}
function parseMD(markdown,parent) {
	var escaped = escapeHTML(markdown,false);
	var mdRegex = /^(?:\n|\r\n)(?:\n| |\r\n)*```((?:.|\r?\n)*?)```|^(.*?)($|\*\*|__|\*|_|~~|`(.*?)`|\[(.*?)\]\((.*?)\)| *(?:\n|\r\n)(?:\n| |\r\n)*)/;
	
	var currentStyle = {bold:false,italic:false,strikethrough:false};
	var elements = [{type:"paragraph",arr:[]}];
	
	var addText = text => elements[elements.length-1].arr.push({type:"text",text,style:{bold:currentStyle.bold,italic:currentStyle.italic,strikethrough:currentStyle.strikethrough}});
	var addCode = text => elements[elements.length-1].arr.push({type:"code",text,style:{bold:currentStyle.bold,italic:currentStyle.italic,strikethrough:currentStyle.strikethrough}});
	var addLink = (text,link) => elements[elements.length-1].arr.push({type:"link",text,link,style:{bold:currentStyle.bold,italic:currentStyle.italic,strikethrough:currentStyle.strikethrough}});
	var addMultilineCode = text => {elements.push({type:"multiline-code",text});addBlock()};
	var addBlock = () => elements.push({type:"paragraph",arr:[]});

	var getStyleClasses = style => {var arr = []; if (style.bold) arr.push("md-bold"); if (style.italic) arr.push("md-italic"); if (style.strikethrough) arr.push("md-strikethrough"); return arr.join(" ")};

	// [all,multiline-code,textbefore,operation,inline-code,link-text,link-target];

	while (escaped.length > 0) {
		var exec = mdRegex.exec(escaped);

		if (exec[2] && exec[2].length > 0) addText(exec[2]);

		if (exec[1]) { // multiline-code
			addMultilineCode(exec[1]);
		} else if (exec[4]) { // inline-code
			addCode(exec[4]);
		} else if (exec[5] && exec[6]) { // link
			addLink(exec[5],exec[6]);
		} else if (exec[3]) { // operation
			if (/^ *\r?\n *$/.test(exec[3])) {
				addText(" ");
				currentStyle = {bold:false,italic:false,strikethrough:false};
			} else if (/^ *(\r?\n *){2}/.test(exec[3])) {
				currentStyle = {bold:false,italic:false,strikethrough:false};
				addBlock();
			} else {
				switch (exec[3]) {
				case "*":
				case "_":
					currentStyle.italic = !currentStyle.italic;
					break;
				case "**":
				case "__":
					currentStyle.bold = !currentStyle.bold;
					break;
				case "~~":
					currentStyle.strikethrough = !currentStyle.strikethrough;
					break;
				}
			}
		} else { // text end
			// already handled.
		}

		escaped = escaped.substr(exec[0].length);
	}
	
	var htmlElt = parent || document.createElement("div");
	for (var block of elements) {
		switch (block.type) {
		case "multiline-code":
			createElement(htmlElt,"div","md-multiline-code",block.text.replace(/\r?\n/g,"<br>"));
			break;
		case "paragraph":
			var paragraph = createElement(htmlElt,"div","md-paragraph");
			for (var elt of block.arr) {
				switch (elt.type) {
				case "text":
					createElement(paragraph,"span","md-text " + getStyleClasses(elt.style), elt.text);
					break;
				case "link":
					createElement(paragraph,"a","md-link " + getStyleClasses(elt.style), elt.text).href = elt.link;
					break;
				case "code":
					createElement(paragraph,"span","md-code "+getStyleClasses(elt.style), elt.text);
					break;
				}
			}
			break;
		}
	}

	return htmlElt;
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

function createWeekSchedule(weekData) {
	var {dayTypes,dateStart,dateRangeStr} = weekData;
	
	var container = createElement(null,"div","week");
	var label = createElement(container,"div","label","Week ");
	createElement(label,"span","schedule-week-time",dateRangeStr);

	for (var i = 0; i < dayTypes.length; i++) {
		var day = dayTypes[i];
		var dayElt = createElement(container,"div","day-type "+day.color);
		createElement(dayElt,"span","weekday",(["Su","M","Tu","W","Th","F","Sa"])[(i+today(dateStart).getDay())%7]);
		createTextElement(dayElt," ");
		createElement(dayElt,"span","day-name",day.name);
	}

	return container;
}

function createSoon(soonData) {
	var {now,next,nowDate,nextTime} = soonData;

	if (!next && now) {
		next = {name: "Nothing Scheduled", color: "grey", info: "Free time awaits!"};
		nextTime = -1;
	}
	now = now || {name: "Nothing Scheduled", color: "grey", info: "Enjoy your free time!"}

	var container = createElement(null,"div","soon");
	var label = createElement(container,"div","label","Scheduled Soon");

	var currentBlock = createElement(container,"div","current-block "+now.color);
	createElement(currentBlock,"div","type","Now");
	createTextElement(currentBlock," ");
	createElement(currentBlock,"div","block-name",now.name);
	if (now.info && now.info.length > 0)
		parseMD(now.info, createElement(currentBlock,"div","block-info"));

	if (next) {
		var nextBlock = createElement(container,"div","next-block "+next.color);
		createElement(nextBlock,"div","type","Next");
		createTextElement(nextBlock," ");
		createElement(nextBlock,"div","block-name",next.name);
		if (next.info && next.info.length > 0)
			parseMD(next.info, createElement(nextBlock,"div","block-info"));
		if (isFinite(nextTime) && nextTime >= 0 && nowDate) {
			var minutesLeft = nextTime-Math.floor((nowDate-today(nowDate))/60000);
			createElement(nextBlock,"div","block-time",timeString(nextTime) + " (in "+(minutesLeft < 1 ? "< 1" : minutesLeft)+" minute"+(minutesLeft < 2 ? "" : "s")+")");
		}
	}

	return container;
}

document.body.appendChild(createSoon({now:scheduleData.blocks[0],nowDate:new Date()}));
document.body.appendChild(createWeekSchedule({dayTypes:[scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1]],dateStart:new Date(),dateRangeStr:"Yeet-yeet2"}))
document.body.appendChild(createDaySchedule({dayType:getDataByDay(3),blocks:scheduleData.blocks}));