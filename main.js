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
	var escaped = escapeHTML(markdown,false); window.test = escaped;
	var mdRegex = /^(.*?)($|\*\*|__|\*|_|~~|`([^\n\r`]+?)`|\[(.*?)\]\((.*?)\)| *(?:\n|\r\n)(?:\n| |\r\n)*)/;
	var multilineCodeRegex = /^```((?:.|\r?\n)+?)```/;

	var currentStyle = {bold:false,italic:false,strikethrough:false}; var isLastNewline = true;
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
		var mlcexec = multilineCodeRegex.exec(escaped);

		if (mlcexec != null && isLastNewline) {
			addMultilineCode(mlcexec[1]);
			isLastNewline = true;
			escaped = escaped.substr(mlcexec[0].length);
			continue;
		}
		
		isLastNewline = false;

		if (exec[1] && exec[1].length > 0) addText(exec[1]);

		if (exec[3]) { // inline-code
			addCode(exec[3]);
		} else if (exec[4] && exec[5]) { // link
			addLink(exec[4],exec[5]);
		} else if (exec[2]) { // operation
			if (/^ *\r?\n *$/.test(exec[2])) {
				addText(" ");
				currentStyle = {bold:false,italic:false,strikethrough:false};
				isLastNewline = true;
			} else if (/^ *(\r?\n *){2}/.test(exec[2])) {
				currentStyle = {bold:false,italic:false,strikethrough:false};
				addBlock();
				isLastNewline = true;
			} else {
				switch (exec[2]) {
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
		}

		escaped = escaped.substr(exec[0].length);
	}
	
	var htmlElt = parent || document.createElement("div");
	for (var block of elements) {
		switch (block.type) {
		case "multiline-code":
			createElement(htmlElt,"div","md-multiline-code",block.text.replace(/^(?: *\r?\n)*((?:.*\r?\n)*?.*?)(?: *\r?\n *)*$/,"$1"));
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
function createSelectElement(parent,className,options) {
	var elt = document.createElement("select");
	for (option of options)
		createElement(elt,"option","",option).value = option;
	elt.className = className;
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
	
	var container = createElement(null,"div","style-group");
	var label = createElement(container,"div","style-label "+dayType.color,"Day ");
	createElement(label,"span","style-info",dayType.name);

	for (var i = 0; i < dayType.blocks.length; i++) {
		var blockI = dayType.blocks[i];
		var block = blocks[blockI];
		var blockElt = createElement(container,"div","style-row "+block.color);
		createElement(blockElt,"span","style-info",timeString(dayType.blockTimes[i]));
		createTextElement(blockElt," ");
		createElement(blockElt,"span","",block.name);
	}

	return container;
}

function createWeekSchedule(weekData) {
	var {dayTypes,dateStart,dateRangeStr} = weekData;
	
	var container = createElement(null,"div","style-group");
	var label = createElement(container,"div","style-label","Week ");
	createElement(label,"span","style-info",dateRangeStr);

	for (var i = 0; i < dayTypes.length; i++) {
		var day = dayTypes[i];
		var dayElt = createElement(container,"div","style-row "+day.color);
		createElement(dayElt,"span","style-info",(["Su","M","Tu","W","Th","F","Sa"])[(i+today(dateStart).getDay())%7]);
		createTextElement(dayElt," ");
		createElement(dayElt,"span","",day.name);
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

	var container = createElement(null,"div","style-group");
	var label = createElement(container,"div","style-label","Scheduled Soon");

	var currentBlock = createElement(container,"div","style-row-solid style-large "+now.color);
	var title = createElement(currentBlock,"div","style-title");
	createElement(title,"span","style-info","Now");
	createTextElement(title," "+now.name);
	if (now.info && now.info.length > 0)
		parseMD(now.info, createElement(currentBlock,"div","style-subsection"));

	if (next) {
		var nextBlock = createElement(container,"div","style-row-solid "+next.color);
		var title = createElement(nextBlock,"div","style-title");
		createElement(title,"span","style-info","Next");
		createTextElement(title," "+next.name);
		if (isFinite(nextTime) && nextTime >= 0 && nowDate) {
			var minutesLeft = nextTime-Math.floor((nowDate-today(nowDate))/60000);
			createElement(nextBlock,"div","style-info",timeString(nextTime) + " (in "+(minutesLeft < 1 ? "< 1" : minutesLeft)+" minute"+(minutesLeft < 2 ? "" : "s")+")");
		}
		if (next.info && next.info.length > 0)
			parseMD(next.info, createElement(nextBlock,"div","style-subsection"));
	}

	return container;
}

function createEditBlock(id, presets, changeListener, cancelListener) {
	var values = presets || {name:"",color:"red",info:"Block info / links. (Supports [markdown](https://en.wikipedia.org/wiki/Markdown#Example))"}

	var container = createElement(null,"div","style-group "+values.color);
	var label = createElement(container,"div","style-label","Edit Block ");
	createElement(label,"span","style-info","id #"+id);

	var basicSettings = createElement(container,"div","style-row");
	var nameIn = createElement(basicSettings,"input","style-input"); nameIn.placeholder = "Block Name"; nameIn.value = values.name;
	var selectIn = createSelectElement(basicSettings,"style-input",["red","orange","yellow","green","cyan","blue","purple","pink","brown","grey"]);
	var saveButton = createElement(basicSettings,"button","style-input style-button-disabled","save");
	var cancelButton = createElement(basicSettings,"button","style-input","cancel");

	var infoIn = createElement(container,"textarea","style-row",values.info);
	var infoMDContainer = createElement(container,"div","style-row");
	parseMD(infoIn.value, infoMDContainer);
	
	infoIn.addEventListener("keydown",() => setTimeout(()=>{
		infoMDContainer.innerHTML = "";
		parseMD(infoIn.value, infoMDContainer);
		values.info = infoIn.value;
	}));
	selectIn.addEventListener("change",() => {
		container.className = "style-group "+selectIn.value;
		values.color = selectIn.value;
	});
	nameIn.addEventListener("keydown",() => setTimeout(()=>{
		saveButton.classList.remove("style-button-disabled");
		if (nameIn.value.length == 0)
			saveButton.classList.add("style-button-disabled");
		values.name = nameIn.value;
	}));
	
	saveButton.addEventListener("click",() => {
		values.color = selectIn.value;
		values.info = infoIn.value;
		values.name = nameIn.value;
		if (values.name.length > 0)
			changeListener(id, values);
	});
	cancelButton.addEventListener("click",() => {
		cancelListener(id);
	});

	return container;
}

function createEditDay(id, presets, changeListener, cancelListener) {
	var values = presets || {name:"",color:"red",blocks:[0,1],blockTimes:[600,660]}

	var container = createElement(null,"div","style-group "+values.color);
	var label = createElement(container,"div","style-label","Edit Day ");
	createElement(label,"span","style-info","id #"+id);

	var basicSettings = createElement(container,"div","style-row");
	var nameIn = createElement(basicSettings,"input","style-input"); nameIn.placeholder = "Block Name"; nameIn.value = values.name;
	var selectIn = createSelectElement(basicSettings,"style-input",["red","orange","yellow","green","cyan","blue","purple","pink","brown","grey"]);
	var saveButton = createElement(basicSettings,"button","style-input style-button-disabled","save");
	var cancelButton = createElement(basicSettings,"button","style-input","cancel");
	var saveButtonError = createElement(basicSettings,"div","style-inline-textblock red","Error: ");
	var saveButtonErrorText = createElement(saveButtonError,"span","","Day name required!");
	
	var blocksContainer = createElement(container,"div","style-row");
	createElement(blocksContainer,"div","style-label","Blocks");
	var addBlockButton = createElement(blocksContainer,"button","style-row style-input","Add Block");

	var invalidityReason = "";
	var valid = () => {
		var invalidate = reason => {
			invalidityReason = reason;
		}
		
		if (nameIn.value.length == 0) {
			invalidate("Day name required!");
			return false;
		}

		var time = -1;
		for (var data of blockDatas) {
			if (!scheduleData.blocks[parseInt(data.id)]) { invalidate("A block's id is invalid!"); return false; }
			var hour = parseInt(data.timeHour), minute = parseInt(data.timeMinute), half = ["AM","PM"].indexOf(data.timeHalf);
			if (isNaN(hour) || hour < 1 || hour > 12) { invalidate("A blocks time is invalid!"); return false; }
			if (isNaN(minute) || minute < 0 || minute >= 60) invalidate("A blocks time is invalid!");
			if (half == -1) { invalidate("A blocks time is invalid!"); return false; }
			var currentTime = 60*(parseInt(data.timeHour)%12+(data.timeHalf=="PM"?12:0))+parseInt(data.timeMinute)||0;
			if (currentTime <= time) { invalidate("Blocks must come after each other!"); return false; }
			console.log(time, currentTime);
			time = currentTime;
		}

		return true;
	}
	var updateSaveButton = () => {
		saveButton.classList.remove("style-button-disabled");
		if (!valid()) {
			saveButtonError.style.display = "inline-block";
			saveButtonErrorText.innerText = invalidityReason;
			saveButton.classList.add("style-button-disabled");
		} else {
			saveButtonError.style.display = "none";
		}
	}
	var blockDatas = [];
	var addBlock = (blockValues) => {
		var row = createElement(null,"div","style-row");
		var timeHourIn = createElement(row,"input","style-input style-info style-smallwidth"); timeHourIn.type = "number"; timeHourIn.value = Math.floor(blockValues.time/60+11)%12+1;
		var timeMinuteIn = createElement(row,"input","style-input style-info style-smallwidth"); timeMinuteIn.type = "number"; timeMinuteIn.value = blockValues.time%60;
		var timeHalfIn = createSelectElement(row,"style-input style-info",["AM","PM"]); timeHalfIn.value = blockValues.time>=60*12?"PM":"AM";
		var idIn = createElement(row,"input","style-input"); idIn.type = "number"; idIn.min = 0; idIn.value = blockValues.id;

		var removeBlockButton = createElement(row,"button","style-input","Remove");

		var blockData = scheduleData.blocks[blockValues.id];
		var nameOut = createElement(row,"span","style-inline-textblock "+blockData.color); nameOut.innerText = blockData.name;

		blocksContainer.insertBefore(row,addBlockButton);
		
		var data = {timeHour: timeHourIn.value, timeMinute: timeMinuteIn.value, timeHalf: timeHalfIn.value, id: idIn.value};
		blockDatas.push(data);

		idIn.addEventListener("keydown",() => setTimeout(()=>{
			var id = parseInt(idIn.value);
			if (isNaN(id) || !scheduleData.blocks[id]) {
				nameOut.className = "style-inline-textblock red";
				nameOut.innerText = "invalid";
			} else {
				var blockData = scheduleData.blocks[id];
				nameOut.className = "style-inline-textblock "+blockData.color;
				nameOut.innerText = blockData.name;
			}
		}));
		idIn.addEventListener("change",() => {
			var id = parseInt(idIn.value);
			if (isNaN(id) || !scheduleData.blocks[id]) {
				idIn.value = data.id;
				var blockData = scheduleData.blocks[parseInt(data.id)];
				if (blockData) {
					nameOut.className = "style-inline-textblock "+blockData.color;
					nameOut.innerText = blockData.name;
				} else {
					nameOut.className = "style-inline-textblock red";
					nameOut.innerText = "invalid";
				}
			} else {
				var blockData = scheduleData.blocks[id];
				nameOut.className = "style-inline-textblock "+blockData.color;
				nameOut.innerText = blockData.name;
				data.id = idIn.value;
				updateSaveButton();
			}
		});
		timeHourIn.addEventListener("change",() => {
			var hour = parseInt(timeHourIn.value);
			if (isNaN(hour) || hour <= 0 || hour > 12) {
				timeHourIn.value = data.timeHour;
			} else {
				data.timeHour = timeHourIn.value;
				updateSaveButton();
			}
		});
		timeMinuteIn.addEventListener("change",() => {
			var minute = parseInt(timeMinuteIn.value);
			if (isNaN(minute) || minute < 0 || minute >= 60) {
				timeMinuteIn.value = data.timeMinute;
			} else {
				data.timeMinute = timeMinuteIn.value;
				updateSaveButton();
			}
		});
		timeHalfIn.addEventListener("change",() => {
			if (!["AM","PM"].includes(timeHalfIn.value)) {
				timeHalfIn.value = data.timeHalf;
			} else {
				data.timeHalf = timeHalfIn.value;
				updateSaveButton();
			}
		});

		removeBlockButton.addEventListener("click",() => {
			blockDatas.splice(blockDatas.indexOf(data),1);
			row.remove();
			updateSaveButton();
		});
		
	}

	for (var i = 0; i < values.blocks.length; i++) {
		addBlock({id:values.blocks[i],time:values.blockTimes[i]});
	}

	addBlockButton.addEventListener("click",() => {
		addBlock({id:0,time:blockDatas[blockDatas.length-1].time + 1});
		updateSaveButton();
	});
	selectIn.addEventListener("change",() => {
		container.className = "style-group "+selectIn.value;
		values.color = selectIn.value;
		updateSaveButton();
	});
	nameIn.addEventListener("keydown",() => setTimeout(()=>{
		values.name = nameIn.value;
		updateSaveButton();
	}));
	
	saveButton.addEventListener("click",() => {
		values.color = selectIn.value;
		values.name = nameIn.value;
		values.blocks = [];
		values.blockTimes = [];
		for (var data of blockDatas) {
			values.blocks.push(parseInt(data.id));
			values.blockTimes.push(60*(parseInt(data.timeHour)%12+(data.timeHalf=="PM"?12:0))+parseInt(data.timeMinute)||0);
		}

		if (valid())
			changeListener(id, values);
	});
	cancelButton.addEventListener("click",() => {
		cancelListener(id);
	});

	return container;
}


document.body.appendChild(createSoon({now:scheduleData.blocks[0],next:scheduleData.blocks[1],nextTime:1000,nowDate:new Date()}));
document.body.appendChild(createWeekSchedule({dayTypes:[scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1]],dateStart:new Date(),dateRangeStr:"Yeet-yeet2"}))
document.body.appendChild(createDaySchedule({dayType:getDataByDay(3),blocks:scheduleData.blocks}));

document.body.appendChild(createEditBlock(2,null,console.log,console.warn));
document.body.appendChild(createEditDay(2,null,console.log,console.warn));