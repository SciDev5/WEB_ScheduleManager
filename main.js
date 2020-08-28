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
		startDay: [2020,8,1],
		weekDays: [false,true,true,true,true,true,false],
		weekTypes: [0],
		holidays: [{start:[2020,11,17],length:16,name:"Winter Break"}],
		dayTypeOrder: [[0]],
		dayTypes: [
			{
				name: "Example Day",
				blocks: [0],
				blockTimes: [12*60+0,2*60+30],
				color: "red"
			}
		],
		blocks: [
			{ 
				name: "Example Class",
				info: "A test class: **using markdown**",
				color: "orange"
			}
		]
	}
}
load();

// Custom prompt

var prompted = false, promptData = {elt:null,submit:()=>{},cancel:()=>{}};

async function promptInputElt(question, elt) {
	if (prompted) return null;

	document.getElementById("customprompt-question").innerText = question;
	document.getElementById("customprompt-visibility").style.display = "";
	var inputContainer = document.getElementById("customprompt-input-container")
	inputContainer.innerHTML = ""; inputContainer.appendChild(elt);
	prompted = true;

	promptData.elt = elt;

	var type = await Promise.any([
		new Promise(res => {
			promptData.submit = () => res("submit");
		}),
		new Promise(res => {
			promptData.cancel = () => res("cancel");
		})
	]);

	if (type == "cancel") {
		clearPrompt();
		return null;
	} else if (type == "submit") {
		clearPrompt();
		return getPromptData();
	}
}

async function promptSelect(question,options) {
	var selectElt = createSelectElement(null,"select-input",options);
	return await promptInputElt(question,selectElt); 
}
async function promptInput(question,placeholder) {
	var inputElt = createElement(null,"select-input",options);
	inputElt.placeholder = placeholder;
	return await promptInputElt(question,inputElt); 
}

function clearPrompt() {
	prompted = false;
	if (promptData.elt) promptData.elt.remove();
	document.getElementById("customprompt-visibility").style.display = "none";
}

function getPromptData() {
	if (promptData.elt) 
		return promptData.elt.value;
	else
		throw new Error("no prompt input element found!");
}

// Setup prompt;

document.getElementById("customprompt-submit").addEventListener("click",()=>promptData.submit());
document.getElementById("customprompt-cancel").addEventListener("click",()=>promptData.cancel());

// utils

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

function dateStrFromArray(arr) {
	return [arr[0],("00"+(arr[1]+1).toString()).substr(-2),("00"+arr[2].toString()).substr(-2)].join("-");
}
function dateStrToArray(dstr) {
	var arr = dstr.split("-");
	return [parseInt(arr[0]),parseInt(arr[1])-1,parseInt(arr[2])];
}

function daysBetween(dateA,dateB) {
	return Math.round(Math.abs(dateA-dateB)/86400000);
}

function signedDaysBetween(dateA,dateB) {
	return Math.round((dateB-dateA)/86400000);
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
		if (typeof option == "object" && option && option.text != undefined && option.value != undefined)
			createElement(elt,"option","",option.text).value = option.value;
		else if (option)
			createElement(elt,"option","",option).value = option;
	elt.className = className;
	if (parent)
		parent.appendChild(elt);
	return elt;
}

function dateFromArray(arr) {
	return new Date(arr[0],arr[1],arr[2]);
}

function getWeek(i) {
	return Math.floor((i+dateFromArray(scheduleData.startDay).getDay())/7);
}

function getDataByDay(i_) { // i_ is days since start
	if (i_ < 0) return getHolidayDayType({name:"Summer Vacation", color: "grey"});

	var j_ = getWeek(i_);
	var j = j_ %scheduleData.weekTypes.length; // week num
	var ks = dateFromArray(scheduleData.startDay).getDay();
	var k = (i_+dateFromArray(scheduleData.startDay).getDay())%7; // weekday
	var i = 0;
	
	for (var l = ks+1; l < 7; l++) 
		if (scheduleData.weekDays[l]) i++;
	var perWeek = 0; for (var day of scheduleData.weekDays) if (day) perWeek++;
	i += perWeek * (j_-1);
	for (var l = 0; l <= k; l++)
		if (scheduleData.weekDays[l]) i++;
	
	var holidayDays = []; 
	for (var holiday of scheduleData.holidays) {
		var days = Math.round((dateFromArray(holiday.start) - dateFromArray(scheduleData.startDay))/(24*60*60*1000) - i_);
		for (var d = 0; d <= -days && d < holiday.length; d++) {
			var day = today(new Date(dateFromArray(holiday.start).getTime() + d*(24*60*60*1000) + 12*60*60*1000));
			if (day < dateFromArray(scheduleData.startDay)) continue;
			if (scheduleData.weekDays[day.getDay()] && !holidayDays.includes(day.getTime()))
				holidayDays.push(day.getTime());
		}
		if (days <= 0 && -days < holiday.length)
			return getHolidayDayType(holiday);
	}

	i -= holidayDays.length;


	if (scheduleData.weekDays[k])
		return scheduleData.dayTypes[scheduleData.dayTypeOrder[scheduleData.weekTypes[j]][i%scheduleData.dayTypeOrder[scheduleData.weekTypes[j]].length]];
	else 
		return getWeekendDayType();
}
function getSoonInfo() {
	var now = new Date(), nowDate = today(now), nowDayTime = now.getMinutes()+now.getHours()*60;

	var dayType = getDataByDay(daysBetween(nowDate,dateFromArray(scheduleData.startDay)));
	

	for (var i = 0; i < dayType.blocks.length; i++)
		if (nowDayTime >= dayType.blockTimes[i] && nowDayTime < dayType.blockTimes[i+1]) break;

	var nowBlock = scheduleData.blocks[dayType.blocks[i]];
	var nextBlock = scheduleData.blocks[dayType.blocks[i+1]];
	var nextBlockTime = dayType.blockTimes[i+1];

	return {now:nowBlock,next:nextBlock,nextTime:nextBlockTime,nowDate:now,dayName:dayType.name};
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
	var label = createElement(container,"div","style-label","Upcoming Days ");
	createElement(label,"span","style-info",dateRangeStr);

	for (var i = 0; i < dayTypes.length; i++) {
		var day = dayTypes[i] || {name:"!!invalid day!!",color:"grey"};
		var dayElt = createElement(container,"div","style-row "+day.color);
		var j = i + offset;
		createElement(dayElt,"span","style-info",j==0?"Today":Math.abs(j)>=7?today(new Date(24*60*60*1000*(j+0.5)+today(dateStart).getTime())).toLocaleDateString():(j<0?"Last ":"")+(["Su","M","Tu","W","Th","F","Sa"])[(7+i+today(dateStart).getDay())%7]);
		createTextElement(dayElt," ");
		createElement(dayElt,"span","",day.name);
	}

	return container;
}

function createSoon(soonData) {
	var {now,next,nowDate,nextTime,dayName} = soonData;

	if (!next && now) {
		next = {name: "Nothing Scheduled", color: "grey", info: "Free time awaits!"};
	}
	now = now || {name: "Nothing Scheduled", color: "grey", info: "Enjoy your free time!"}

	var container = createElement(null,"div","style-group");
	var label = createElement(container,"div","style-label","Scheduled Soon ");dayName
	createElement(label,"span","style-info",dayName);

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
	var selectIn = createSelectElement(basicSettings,"style-input",["red","orange","yellow","green","cyan","blue","purple","pink","brown","grey"]); selectIn.value = values.color;
	var saveButton = createElement(basicSettings,"button","style-input"+(values.name.length > 0?"":" style-button-disabled"),"save");
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
	var selectIn = createSelectElement(basicSettings,"style-input",["red","orange","yellow","green","cyan","blue","purple","pink","brown","grey"]); selectIn.value = values.color;
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

	updateSaveButton();

	return container;
}


function createEditSchedule(leaveEvent) {
	var container = createElement(null,"div","style-group");
	var label = createElement(container,"div","style-label","Edit Schedule");

	var basicSettings = createElement(container,"div","style-row");
	createTextElement(basicSettings,"Start Day: ");
	var startDayIn = createElement(basicSettings,"input","style-input"); startDayIn.type = "date"; startDayIn.value = dateStrFromArray(scheduleData.startDay);
	
	createElement(basicSettings, "br");
	createElement(basicSettings, "br");
	createTextElement(basicSettings,"Week types: ");
	var weekTypesIn = createElement(basicSettings,"input","style-input"); weekTypesIn.value = "["+scheduleData.weekTypes.join(",")+"]";

	createElement(basicSettings, "br");
	createElement(basicSettings, "br");
	createTextElement(basicSettings,"Day type order: ");
	var dayTypesIn = createElement(basicSettings,"input","style-input"); dayTypesIn.value = "[["+scheduleData.dayTypeOrder.map(v=>v.join(",")).join("],[")+"]]";
	
	createElement(basicSettings, "br");
	createElement(basicSettings, "br");
	var saveButton = createElement(basicSettings,"button","style-input style-button-disabled","save");
	var cancelButton = createElement(basicSettings,"button","style-input","cancel");
	var saveButtonError = createElement(basicSettings,"div","style-inline-textblock red","Error: ");
	var saveButtonErrorText = createElement(saveButtonError,"span","","");

	var blocksContainer = createElement(container,"div","style-row");
	createElement(blocksContainer,"div","style-label","Holidays");
	var addBlockButton = createElement(blocksContainer,"button","style-row style-input","Add Holiday");

	var invalidityReason = "";
	var valid = () => {
		var invalidate = reason => {
			invalidityReason = reason;
		}
		
		if (startDayIn.value.length == 0) { invalidate("Start date invalid!"); return false; }

		try {
			var value = JSON.parse(weekTypesIn.value);
		} catch (e) { invalidate("Week types is invalid!"); return false; }
		if (!(value instanceof Array) || !value.every(v=>typeof v == "number"))
			{ invalidate("Week types is invalid!"); return false; }

		try {
			var value = JSON.parse(dayTypesIn.value);
		} catch (e) { invalidate("Day types is invalid!"); return false; }
		if (!(value instanceof Array) || !value.every(v=>(v instanceof Array) && v.every(v=>typeof v == "number")))
			{ invalidate("Day types is invalid!"); return false; }

		var time = -1;
		for (var data of blockDatas) {
			if (data.name.length == 0) { invalidate("A holiday's name is empty!"); return false; }
			if (data.start.length == 0) { invalidate("A holiday's start date is not set!"); return false; }
			if (isNaN(parseInt(data.length)) || parseInt(data.length) <= 0) { invalidate("The length of a holiday is not valid!"); return false; }
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

		var nameIn = createElement(row,"input","style-input"); nameIn.value = blockValues.name;
		var startIn = createElement(row,"input","style-input"); startIn.type = "date"; startIn.value = dateStrFromArray(blockValues.start);
		var lengthIn = createElement(row,"input","style-input"); lengthIn.type = "number"; lengthIn.min = 1; lengthIn.value = blockValues.length;

		var removeBlockButton = createElement(row,"button","style-input","Remove");

		blocksContainer.insertBefore(row,addBlockButton);
		
		var data = {name: nameIn.value, start: startIn.value, length: lengthIn.value};
		blockDatas.push(data);

		nameIn.addEventListener("keydown",() => setTimeout(()=>{
			data.name = nameIn.value;
		}));
		nameIn.addEventListener("change",() => {
			data.name = nameIn.value;
			updateSaveButton();
		});
		startIn.addEventListener("change",() => {
			if (startIn.value.length == 0) {
				startIn.value = data.start;
			} else {
				data.start = startIn.value;
				updateSaveButton();
			}
		});
		lengthIn.addEventListener("change",() => {
			var length = parseInt(lengthIn.value);
			if (isNaN(length) || length <= 0) {
				lengthIn.value = data.length;
			} else {
				data.length = lengthIn.value;
				updateSaveButton();
			}
		});

		removeBlockButton.addEventListener("click",() => {
			blockDatas.splice(blockDatas.indexOf(data),1);
			row.remove();
			updateSaveButton();
		});
		
	}

	for (var i = 0; i < scheduleData.holidays.length; i++) {
		addBlock(scheduleData.holidays[i]);
	}

	addBlockButton.addEventListener("click",() => {
		addBlock({name:"holiday",start:[2020,0,1],length:2});
		updateSaveButton();
	});
	startDayIn.addEventListener("change",() => {
		if (startDayIn.value.length > 0)
			scheduleData.startDay = dateStrToArray(startDayIn.value);
		else
			startDayIn.value = dateStrFromArray(scheduleData.startDay);	
		updateSaveButton();
	});
	weekTypesIn.addEventListener("change",() => {
		try {
			var value = JSON.parse(weekTypesIn.value);
		} catch (e) {
			weekTypesIn.value = JSON.stringify(scheduleData.weekTypes);
		}
		if ((value instanceof Array) && value.every(v=>typeof v == "number"))
			scheduleData.weekTypes = value;
		else
			weekTypesIn.value = JSON.stringify(scheduleData.weekTypes);	
		updateSaveButton();
	});
	dayTypesIn.addEventListener("change",() => {
		try {
			var value = JSON.parse(dayTypesIn.value);
		} catch (e) {
			dayTypesIn.value = JSON.stringify(scheduleData.dayTypeOrder);
		}
		if ((value instanceof Array) && value.every(v=>(v instanceof Array) && v.every(v=>typeof v == "number")))
			scheduleData.dayTypeOrder = value;
		else
			dayTypesIn.value = JSON.stringify(scheduleData.dayTypeOrder);	
		updateSaveButton();
	});
	
	saveButton.addEventListener("click",() => {
		if (valid()) {
			scheduleData.holidays = [];
			for (var data of blockDatas)
				scheduleData.holidays.push({name:data.name,start:dateStrToArray(data.start),length:parseInt(data.length)});
			save();
			leaveEvent();
		}
	});
	cancelButton.addEventListener("click",() => {
		load();
		leaveEvent();
	});

	updateSaveButton();

	return container;
}

// Setup HTML page

var showScheduleButton = document.getElementById("button-show");
var editScheduleButton = document.getElementById("button-edit");
var thingContainer = document.getElementById("gui-container");
var screen = -1;

var daysLen = 10, offset = -1;

showScheduleButton.addEventListener("click", () => {
	screen = 0;

	load();

	var nowDate = today(new Date());

	thingContainer.innerHTML = "";
	thingContainer.appendChild(createSoon(getSoonInfo()));
	thingContainer.appendChild(createDaySchedule({dayType:getDataByDay(signedDaysBetween(dateFromArray(scheduleData.startDay),nowDate)),blocks:scheduleData.blocks}));
	
	var weekDays = [], dateStart = new Date(today(new Date()).getTime() + offset*24*60*60*1000), dateEnd = new Date(dateStart.getTime() + daysLen*24*60*60*1000);
	for (var i = offset; i < daysLen+offset; i++) 
		weekDays.push(getDataByDay(i+signedDaysBetween(dateFromArray(scheduleData.startDay),nowDate)));
	thingContainer.appendChild(createWeekSchedule({dayTypes:weekDays,dateStart,dateRangeStr:(new Date(dateStart.getTime() + 12*60*60*1000).toLocaleDateString())+" - "+(new Date(dateEnd.getTime() + 12*60*60*1000).toLocaleDateString())}));
	createElement(thingContainer,"button","style-input style-row","Show more days").addEventListener("click",()=>{daysLen += 10; rebuild()});
	createElement(thingContainer,"button","style-input style-row","Show past days").addEventListener("click",()=>{offset -= 10; rebuild()});
});

editScheduleButton.addEventListener("click", async () => {
	if (screen == 1) return;

	load();

	var editType = await promptSelect("What would you like to change?",[{text:"Holidays + Day order",value:"schedule"},{text:"Day Info / Schedule",value:"day"},{text:"Block Info",value:"block"}])
	if (editType == null) return;

	var leave = () => { screen = -1; load(); rebuild(); }

	var gui = null;
	switch (editType) {
	case "schedule":
		gui = createEditSchedule(leave);
		break;
	case "day":
		var arr = [{text:"Create new",value:scheduleData.dayTypes.length}];
		for (var i = 0; i < scheduleData.dayTypes.length; i++) arr.push({text:scheduleData.dayTypes[i].name+" (id #"+i+")",value:i});
		var dayN = await promptSelect("Which day would you like to edit?",arr);
		if (dayN == null || isNaN(parseInt(dayN)) || parseInt(dayN) < 0 || parseInt(dayN) > scheduleData.dayTypes.length) return;
		dayN = parseInt(dayN);

		gui = createEditDay(dayN,scheduleData.dayTypes[dayN],(id, values) => {
			scheduleData.dayTypes[id] = values;
			save();
			leave();
		}, leave);
		break;
	case "block":
		var arr = [{text:"Create new",value:scheduleData.blocks.length}];
		for (var i = 0; i < scheduleData.blocks.length; i++) arr.push({text:scheduleData.blocks[i].name+" (id #"+i+")",value:i});
		var dayN = await promptSelect("Which block would you like to edit?",arr);
		if (dayN == null || isNaN(parseInt(dayN)) || parseInt(dayN) < 0 || parseInt(dayN) > scheduleData.blocks.length) return;
		dayN = parseInt(dayN);

		gui = createEditBlock(dayN,scheduleData.blocks[dayN],(id, values) => {
			scheduleData.blocks[id] = values;
			save();
			leave();
		}, leave);
		break;
	default: return;
	}

	screen = 1;

	thingContainer.innerHTML = "";
	thingContainer.appendChild(gui);
});


var rebuildTimeout = -1;
var rebuild = () => {
	clearTimeout(rebuildTimeout); // prevent two rebuild loops happening at the same time.

	switch (screen) {
	case -1:
		thingContainer.innerHTML = "";
		thingContainer.appendChild(createSoon(getSoonInfo()));
		break;

	case 0:	
		var nowDate = today(new Date());
		thingContainer.innerHTML = "";
		thingContainer.appendChild(createSoon(getSoonInfo()));
		thingContainer.appendChild(createDaySchedule({dayType:getDataByDay(signedDaysBetween(dateFromArray(scheduleData.startDay),nowDate)),blocks:scheduleData.blocks}));

		var weekDays = [], dateStart = new Date(today(new Date()).getTime() + offset*24*60*60*1000), dateEnd = new Date(dateStart.getTime() + daysLen*24*60*60*1000);
		for (var i = offset; i < daysLen+offset; i++) 
			weekDays.push(getDataByDay(i+signedDaysBetween(dateFromArray(scheduleData.startDay),nowDate)));
		thingContainer.appendChild(createWeekSchedule({dayTypes:weekDays,dateStart,dateRangeStr:(new Date(dateStart.getTime() + 12*60*60*1000).toLocaleDateString())+" - "+(new Date(dateEnd.getTime() + 12*60*60*1000).toLocaleDateString())}));
		createElement(thingContainer,"button","style-input style-row","Show more days").addEventListener("click",()=>{daysLen += 10; rebuild()});
		createElement(thingContainer,"button","style-input style-row","Show past days").addEventListener("click",()=>{offset -= 10; rebuild()});
		break;
	}

	var now = new Date();
	var next = new Date(now.getFullYear(),now.getMonth(),now.getDate(),now.getHours(),now.getMinutes()+1);
	rebuildTimeout = setTimeout(rebuild, next-now+500);
} 
rebuild();

/*
document.body.appendChild(createSoon({now:scheduleData.blocks[0],next:scheduleData.blocks[1],nextTime:1000,nowDate:new Date()}));
document.body.appendChild(createWeekSchedule({dayTypes:[scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1],scheduleData.dayTypes[0],scheduleData.dayTypes[1]],dateStart:new Date(),dateRangeStr:"Yeet-yeet2"}));
document.body.appendChild(createDaySchedule({dayType:getDataByDay(3,0),blocks:scheduleData.blocks}));

document.body.appendChild(createEditBlock(2,null,console.log,console.warn));
document.body.appendChild(createEditDay(2,null,console.log,console.warn));

document.body.appendChild(createEditSchedule(()=>console.log("leave")));
*/