// ==UserScript==
// @name        Medsol Plus
// @namespace   Violentmonkey Scripts
// @match       https://emedsol1.sote.hu:9444/sote/*
// @match       https://emedsol2.sote.hu:9444/sote/*
// @match       https://emedsol3.sote.hu:9444/sote/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM.xmlHttpRequest
// @version     1.05
// @downloadURL https://raw.githubusercontent.com/matega/medsolplus/master/medsolplus.js
// @author      Dr. Galambos Máté | galambos.mate@semmelweis.hu
// @description e-MedSolution extra funkciók a sürgősségi osztályon (KSBA)
// @require     https://cdn.jsdelivr.net/npm/jdenticon@3.2.0/dist/jdenticon.min.js
// ==/UserScript==

settingsSkeleton = {
  "colorOwnPatients": true,
  "fixHighlights": false,
  "autoExpandQuickButtons": true,
  "patientListIdenticons": true,
  "uFrameIdenticons": true,
  "autoAge": true,
  "autoTEK": true,
  "autoTEKSpecList": [
    "0100:1:a",
    "0200:2:a",
    "0900:1:a",
    "1800:1:a",
    "1900:2:a",
    "1002:1:a"
  ],
  "loadList": true,
  "triageButtonTame": true,
  "hideKBA": true,
  "triageName": "",
  "patientAccounting": true
}

function getUserPref(prefName) {
  var userPrefs = GM_getValue("userPrefs", {});
  if(!(currentUser in userPrefs)) return false;
  return userPrefs[currentUser][prefName];
}

function setUserPref(prefName, value) {
  var userPrefs = GM_getValue("userPrefs", {});
  if(!(currentUser in userPrefs)) userPrefs[currentUser] = {};
  userPrefs[currentUser][prefName] = value;
  GM_setValue("userPrefs", userPrefs);
}

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

function getCurrentUser() {
  if(document.location.pathname == "/sote/0.do") {
    userspan = document.querySelector("td.user > span");
    currentUser = userspan.innerText;
    if(!userspan || currentUser.length !=5 ) return;
    currentUsers = GM_getValue("currentUsers", {});
    currentUsers[document.location.host] = currentUser;
    GM_setValue("currentUsers", currentUsers);
  } else {
    currentUser = GM_getValue("currentUsers", {})[document.location.host];
  }
  return currentUser;
}

var currentUser = getCurrentUser();

function autoExpandQuickButtons() {
  if(!(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname))) return;
  var expand = document.querySelectorAll("#A1_4_body td > div > div:nth-child(8)");
  var retract = document.querySelectorAll("#A1_4_body td > div > div:nth-child(9)");
  for(var i=0; i<expand.length; i++) expand[i].click();
  for(var i=0; i<retract.length; i++) retract[i].setAttribute("style","display: none");
}

if(getUserPref("autoExpandQuickButtons")) autoExpandQuickButtons();

function colorOwnPatients() {
  if(!(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname))) return;
  var userTriageName = getUserPref("triageName");
  if(!userTriageName) return;
  var firstre = new RegExp("^(?:COVID\\W+)?" + userTriageName + "(?:\\W|$)");
  var otherre = new RegExp("\\W" + userTriageName + "(?:\\W|$)");
  var donere = /(?:>>|\W-{2,}>>?)/;
  var attnre = /!!/;

  var triagelabel = -1;
  var headers = document.querySelectorAll("table.clabel th");
  for(var i = 0; i<headers.length; i++) {
    if(headers[i].innerHTML == "Triage megjegyzés") {
      triagelabel = i;
      break;
    }
  }

  if(triagelabel != -1) {
    var notes = document.querySelectorAll("#A1_4_body > tr> td:nth-child("+ (triagelabel+1) +")");
    for(var i=0; i<notes.length; i++) {
      var notelabel = htmlDecode(notes[i].innerHTML);
      if(notelabel.search(firstre) > -1) { notes[i].parentNode.classList.add("mategascript_mine"); }
      if(notelabel.search(otherre) > -1) { notes[i].parentNode.classList.add("mategascript_old"); }
      if(notelabel.search(donere) > -1) { notes[i].parentNode.classList.add("mategascript_done"); }
      if(notelabel.search(attnre) > -1) { notes[i].parentNode.classList.add("mategascript_attn"); }
    }
  }

  addGlobalStyle(`
  tr.mategascript_mine > td {
    background-color: lightyellow;
  }
  tr.mategascript_old:not(.mategascript_mine)  > td {
    background-color: lightblue;
  }
  tr.mategascript_done.mategascript_mine  > td {
    background-color: lightgreen;
  }
  tr.mategascript_attn.mategascript_mine  > td {
    background-color: salmon;
  }
  tr.mategascript_mine.mategascript_mine:hover {
    //background-color: lightgrey;
  }
  tr.mategascript_old:hover {
    //background-color: lightblue;
  }
  tr.mategascript_done.mategascript_mine:hover {
    //background-color: lightgrey;
  }
  #A1_4_body > tr:hover > td {
    background-color: lightgrey !important;
  }
  `);

}

if(getUserPref("colorOwnPatients")) colorOwnPatients();

function fixHighlights() {
  if(!(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname))) return;
  var rows = document.querySelectorAll("#A1_4_body > tr");
  for(var i=0; i<rows.length; i++) {
    rows[i].removeAttribute("onmouseover");
    rows[i].removeAttribute("onmouseout");
    unsafeWindow.highLightHandler.doPassivateRow(rows[i]);
    rows[i].removeAttribute("style");
    mo = new MutationObserver(function(e) {
      for(i=0; i<e.length; i++) {
        e[i].target.removeAttribute("style")
      }
    });
    mo.observe(rows[i], {attributes: true, attributeFilter: ["style"]});
  }
}

if(getUserPref("fixHighlights")) fixHighlights();

function patientListIdenticons() {
  if(!["/sote/101307.do", "/sote/101315.do"].includes(document.location.pathname)) return;
  triagelabel = -1;
  patnamelabel = -1;

  var headers = document.querySelectorAll("table.clabel th");
  for(var i = 0; i<headers.length; i++) {
    if(headers[i].innerHTML == "Beteg neve") {
      patnamelabel = i;
      break;
    }
  }

  if(patnamelabel != -1) {
    jdenticon.configure({backColor: "#ffffffff"});
    var names = document.querySelectorAll("#A1_4_body > tr> td:nth-child("+ (patnamelabel+1) +")");
    for(var i=0; i<names.length; i++) {
      var patname = htmlDecode(names[i].innerHTML);
      var identicon = document.createElement("canvas");
      identicon.setAttribute("class", "mategascript-identicon");
      identicon.setAttribute("width", "60px");
      identicon.setAttribute("height", "60px");
      identicon.setAttribute("data-jdenticon-value", patname.trim());
      names[i].insertBefore(identicon, names[i].firstChild);
      //names[i].removeChild(names[i].lastChild);
      names[i].classList.add("mategascript-patientname");
    }
  }

  addGlobalStyle(`
  .mategascript-identicon {
      width: 60px;
      height: 60px;
      /*border: 1px solid black; */
      padding: 0px;
      margin: 0px;
      display: block;
  }
  div.browser table.datal td.mategascript-patientname {
      font-size: 1.5em;
      /*font-weight: bold; */
      padding: 0px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 1em;
  }
  `);
}

function uFrameIdenticons() {
  if(document.location.pathname != "/sote/UpdateFrame.fl") return;
  var nameDiv = document.querySelector("#report_table > tbody > tr:nth-child(3) > td div");
  var patname = nameDiv.innerHTML.trim();
  var identicon = document.createElement("canvas");
  identicon.setAttribute("class", "mategascript-identicon");
  identicon.setAttribute("width", "60px");
  identicon.setAttribute("height", "60px");
  identicon.setAttribute("data-jdenticon-value", patname.trim());
  nameDiv.insertBefore(identicon, nameDiv.firstChild);
  //names[i].removeChild(names[i].lastChild);
  nameDiv.classList.add("mategascript-patientname");
  addGlobalStyle(`
  .mategascript-identicon {
      width: 60px;
      height: 60px;
      /*border: 1px solid grey;*/
      padding: 0px;
      margin: 0px;
      display: block;
  }
  .mategascript-patientname {
      /*font-size: 1.5em;*/
      /*font-weight: bold;*/
      /*padding: 0px;*/
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
  }
  `);
}

function windowHeaderIdenticon() {
  if(!["/sote/UpdateWindowHeader.fl", "/sote/WindowHeader.fl"].includes(document.location.pathname)) return;
  new MutationObserver(headerIdenticonCallback).observe(document.querySelector("#title"), {characterData: true, subtree: true});
}

function headerIdenticonCallback(e,f) {
  f.disconnect();
  var titleElem = document.querySelector("#title");
  titleElem.innerHTML = titleElem.innerHTML + " TESZT";
}

if(getUserPref("patientListIdenticons")) patientListIdenticons();

if(getUserPref("uFrameIdenticons")) uFrameIdenticons();

if(getUserPref("windowHeaderIdenticons")) windowHeaderIdenticons();

function autoTEK(label) {
  cimre = /^(\d)(\d{2})\d\W+?([\wöÖüÜóÓőŐúÚűŰéÉáÁíÍ]+)\W/;
  romai = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII'];
  extendNode = null;
  if("/sote/UpdateFrame.fl" != document.location.pathname) return;
  var nodes = document.querySelectorAll("#report_table>tbody>tr>td:first-child");
  for(var i=0; i<nodes.length; i++) {
    if(label == nodes[i].innerText) {
      var parent = nodes[i].parentNode;
      var tdnum = 3;
      if(nodes[i].innerText == "Ideiglenes lakcím:") tdnum = 2;
      var cim = parent.querySelector("td:nth-child("+(tdnum)+") div");
      if(!cim) continue;
      cim.classList.add("mategascript-address");
      var cimtext = cim.innerText;
      var cmatch = cimtext.match(cimre);
      //console.log(cimtext);
      if(!cmatch) continue;
      //console.log(cmatch);
      var varos = cmatch[1] == "1"?("Budapest " + romai[parseInt(cmatch[2])-1] + ". kerület"):(cmatch[3]);
      GM.xmlHttpRequest(
        {
          "url": "http://84.206.43.26:7080/ellatas/xtek/",
          "method": "GET",
          "context": {"stage": 0, "cim": cim, "varos": varos, "data": "id12_hf_0=&ac="+encodeURIComponent(varos)+"&tekszakmak%3Aszakmakform%3Atekszakmak=0&tekszakmak%3Aszakmakform%3Aord_szakma=on&elerhment.x=5&elerhment.y=5"},
          "onload": xtekcb,
          "onerror": autoTEKSequential,
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "http://84.206.43.26:7080",
            "Referer": "http://84.206.43.26:7080/ellatas/xtek/"
          }
        }
      );
      return;
    }
  }
  autoTEKSequential();
}

function xtekcb(e) {
  if(e.context.stage == 0) {
    var url = new URL(new DOMParser().parseFromString(e.responseText, "text/html").querySelectorAll("form")[0].getAttribute("action"), "http://84.206.43.26:7080/ellatas/xtek/").href;
    GM.xmlHttpRequest(
        {
          "url": url,
          "method": "POST",
          "data": e.context.data,
          "context": {"stage": 1, "cim": e.context.cim, "varos": e.context.varos},
          "onload": xtekcb,
          "onerror": autoTEKSequential,
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "http://84.206.43.26:7080",
            "Referer": "http://84.206.43.26:7080/ellatas/xtek/"
          }
        }
    );
  } else {
    var specnumre = /^(\d{4}) (.+)$/;
    var prognumre = /^(?:(\d)\.?|(I+)\.?)([abc]?)\.?\((aktív|krónikus)\)/;
    var responseDocument = new DOMParser().parseFromString(e.responseText, "text/html");
    var responseRows = responseDocument.querySelectorAll("table tr");
    var hosps = {};
    for(var i=0; i<responseRows.length; i++) {
      try {
        var tds = responseRows[i].querySelectorAll("td");
        var tdtexts = [];
        for(var j=0; j<tds.length; j++) tdtexts[j] = tds[j].innerText;
        var hosp = tdtexts[0];
        var specnummatch = tdtexts[1].match(specnumre);
        var specnum = specnummatch[1];
        var spectext = specnummatch[2];
        var prognummatch = tdtexts[2].match(prognumre);
        var prognum = specnum + ":" + (prognummatch[1] || prognummatch[2].length) + prognummatch[3] + ":" + prognummatch[4].substring(0,1);
        hosps[prognum] = {hosp: hosp, spec: spectext};
      } catch(e) {
        console.log(e, tdtexts);
      }
    }
    //console.log(hosps);
    var filteredHosps = [];
    var specfilter = getUserPref("autoTEKSpecList");
    for(i=0; i<specfilter.length; i++) {
      filteredHosps.push(hosps[specfilter[i]]);
    }
    //console.log(filteredHosps);
    var tekDropdown = document.createElement("table");
    tekDropdown.classList.add("mategascript-tekdropdown");
    var headRow = document.createElement("td");
    headRow.setAttribute("colspan", "2");
    headRow.classList.add("mategascript-address-row");
    headRow.innerText = e.context.varos;
    tekDropdown.appendChild(headRow);
    for(i=0; i<filteredHosps.length; i++) {
      try {
        var hospRow = document.createElement("tr");
        var hospCell = document.createElement("td");
        hospCell.innerText = filteredHosps[i]["spec"];
        hospRow.appendChild(hospCell);
        hospCell = document.createElement("td");
        hospCell.innerText = filteredHosps[i]["hosp"];
        hospRow.appendChild(hospCell);
        tekDropdown.appendChild(hospRow);
      } catch (e) {
        console.log(e);
      }
    }
    //console.log(tekDropdown);
    e.context.cim.appendChild(tekDropdown);
    e.context.cim.classList.add("mategascript-position-relative");
    addGlobalStyle(`
table.mategascript-tekdropdown {
  position: absolute;
  visibility: hidden;
  border: 1px solid black;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  z-index: 1;
}
table.mategascript-tekdropdown td {
  border: 1px solid black;
  padding: revert;
}
table.mategascript-tekdropdown td.mategascript-address-row {
  font-weight: bold;
  text-align: center;
}
.mategascript-address:hover table.mategascript-tekdropdown {
  visibility: visible;
}
.mategascript-position-relative {
  position: relative;
}
    `);
    autoTEKSequential();
  }
}

autoTEKLabels = ["Lakcím", "Ideiglenes lakcím:"];
autoTEKStage = 0;

function autoTEKSequential() {
  if(autoTEKStage < autoTEKLabels.length) autoTEK(autoTEKLabels[autoTEKStage++]);
}

if(getUserPref("autoTEK")) autoTEKSequential();

function autoAge() {
  if("/sote/UpdateFrame.fl" != document.location.pathname) return;
  new MutationObserver(autoAgeCallback).observe(document, {subtree: true, childList: true});
}

function autoAgeCallback(e) {
  for(i=0; i<e.length; i++) {
    for(j=0; j<e[i].addedNodes.length; j++) {
      if("widget_FH0_birthdate" == e[i].addedNodes[j].id){
        neededNode = e[i].addedNodes[j];
        new MutationObserver(autoAgeCallback2).observe(neededNode.querySelector("input[type=\"hidden\"]"), {attributes: true, attributeFilter: ["value"]});
      }
    }
  }
}

function autoAgeCallback2(e) {
  for(i=0; i<e.length; i++) {
    var birthdate = new Date(e[i].target.value);
    var birthyear = birthdate.getFullYear();
    var curryear = new Date().getFullYear();
    birthdate.setFullYear(curryear);
    var yearDiff = curryear - birthyear;
    if(birthdate > new Date()) yearDiff--;
    var birthdatenode = e[i].target.parentNode.querySelector("input#FH0_birthdate");
    birthdatenode.value = birthdatenode.value + " (" + yearDiff + ")";
  }
}

if(getUserPref("autoAge")) autoAge();

function loadList() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    var userre = new RegExp("^(?:COVID\\W+)?((?!COVID)[A-ZÁÉÍÓÖŐÚÜŰ\\.\\-]{2,}|VaPe)(?:\\W|$)");
    var donere = /(?:>>|\W-{2,}>>?)/;
    var attnre = /!!/;

    addGlobalStyle(`
div.mategascript-altered {
  background-color: pink;
}
    `);
    var unfiltered = checkUnfiltered();
    triagelabel = -1;
    var headers = document.querySelectorAll("table.clabel th");
    for(var i = 0; i<headers.length; i++) {
      if(headers[i].innerHTML == "Triage megjegyzés") {
        triagelabel = i;
        break;
      }
    }

    if(triagelabel == -1) return;
    var notes = document.querySelectorAll("#A1_4_body > tr> td:nth-child("+ (triagelabel+1) +")");
    var doctors = {};
    for(var i=0; i<notes.length; i++) {
      var notelabel = htmlDecode(notes[i].innerHTML);
      var result = userre.exec(notelabel);
      if(result) {
        var doctor = user_map(result[1]);
        if(!(doctor in doctors)) doctors[doctor] = {count: 0, critical: 0, done: 0};
        doctors[doctor]["count"]++;
        if(attnre.exec(notelabel)) doctors[doctor]["critical"]++;
        if(donere.exec(notelabel)) doctors[doctor]["done"]++;
      }
    }
    if(unfiltered) GM_setValue(document.location.pathname == "/sote/101315.do"?"pendingCounts":"triageCounts", doctors);


    var dropdowns = document.querySelectorAll("div.dropdown");
    var dropdown = dropdowns[dropdowns.length-1];
    var newitem = document.createElement("div");
    newitem.classList.add("dropdown");
    var newbtn = document.createElement("button");
    newitem.appendChild(newbtn);
    newbtn.classList.add("dropbtn");
    newbtn.setAttribute("type", "button");
    newbtn.innerHTML = "Ellátott betegek";
    dropdown.after(" ", newitem);
    var dropdiv = document.createElement("div");
    dropdiv.setAttribute("id", "MATEGASCRIPT_DOCTOR_LOAD");
    dropdiv.addEventListener("mouseenter", function(e) {mainFuncLib.dropDownMenuEnter(e);});
    dropdiv.addEventListener("mouseleave", function(e) {mainFuncLib.dropDownMenuLeave(document, e);});
    newbtn.addEventListener("mouseover", function() {mainFuncLib.dropDownMenuOpen(document, 'MATEGASCRIPT_DOCTOR_LOAD')});
    newbtn.addEventListener("mouseout", function() {mainFuncLib.dropDownMenuButtonLeave(document, 'MATEGASCRIPT_DOCTOR_LOAD')});
    dropdiv.classList.add("dropdown-content");
    dropdiv.classList.add("cols1");
    newbtn.after(dropdiv);
    var droptable = document.createElement("table");
    droptable.classList.add("mategascript_droptable");
    dropdiv.appendChild(droptable);
    var pendingCounts = GM_getValue("pendingCounts");
    var docnames = Object.keys(pendingCounts);
    var triageCounts = GM_getValue("triageCounts");
    var tdocnames = Object.keys(triageCounts);
    for(i = 0; i < tdocnames.length; i++) {
      if(!docnames.includes(tdocnames[i])) {
        docnames[docnames.length] = tdocnames[i];
        pendingCounts[tdocnames[i]] = {count: 0, critical: 0, done: 0, triage: triageCounts[tdocnames[i]]["count"]};
      }
      else {
        pendingCounts[tdocnames[i]]["triage"] = triageCounts[tdocnames[i]]["count"];
      }
    }
    var row = document.createElement("tr");
    var td = document.createElement("th");
      td.innerText = "Név";
      row.appendChild(td);
      td = document.createElement("th");
      td.innerText = "Folyamatban";
      row.appendChild(td);
      td = document.createElement("th");
      td.innerText = "Triage";
      row.appendChild(td);
      /*td = document.createElement("td");
      td.innerText = "Krit";
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = "Kész";
      row.appendChild(td);*/
      droptable.appendChild(row);
    for(i = 0; i < docnames.length; i++) {
      var row = document.createElement("tr");
      var td = document.createElement("td");
      td.innerText = docnames[i];
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["count"];
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["triage"] ? pendingCounts[docnames[i]]["triage"] : 0;
      row.appendChild(td);
      /*td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["critical"];
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["done"];
      row.appendChild(td);*/
      droptable.appendChild(row);
    }
    addGlobalStyle(`
table.mategascript_droptable {
  min-width: inherit;
}
table.mategascript_droptable th {
  width: 33%;
}
    `);
  }

}

function getUnfilteredParameters() {
  var unfilteredParams = {
    "/sote/101315.do": [
      ["Q1_0_0", "value", "KSBA"],
      ["Q1_0_2", "value", "00:00"],
      ["Q1_0_3", "value", "23:59"],
      ["Q1_0_4", "value", ""],
      ["Q1_0_7", "value", ""],
      ["Q1_0_8", "checked", false],
      ["Q1_0_10", "value", ""],
      ["Q1_0_12", "value", ""],
      ["Q1_0_13", "value", ""],
      ["Q1_0_14", "value", ""]
    ],
    "/sote/101307.do": [
      ["Q1_0_0", "value", "KSBA"],
      ["Q1_0_2", "value", "00:00"],
      ["Q1_0_3", "value", "23:59"],
      ["Q1_0_4", "value", ""],
      ["Q1_0_10", "value", ""],
      ["Q1_0_7", "checked", false],
      ["Q1_0_9", "value", ""],
      ["Q1_0_11", "value", ""],
      ["Q1_0_12", "value", ""],
    ]
  }
  unfilteredParams = unfilteredParams[document.location.pathname];
  var d = new Date();
  var datestring = d.getFullYear() + "." + String(d.getMonth()+1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  unfilteredParams.push(["Q1_0_1", "value", datestring]);
  return unfilteredParams;
}

function checkUnfiltered() {
  var unfilteredParams = getUnfilteredParameters();
  for(var i = 0; i < unfilteredParams.length; i++) {
    try {
      var elem = document.getElementsByName(unfilteredParams[i][0])[0];
      if(elem[unfilteredParams[i][1]] != unfilteredParams[i][2]) {
        // console.log(elem, unfilteredParams[i]);
        return false;
      }
    } catch (e) {
      console.log(e, unfilteredParams[i]);
    }
  }
  return true
}


function mategascript_reset_query() {
  var unfilteredParams = getUnfilteredParameters();
  for(var i = 0; i < unfilteredParams.length; i++) {
    try {
      var elem = document.getElementsByName(unfilteredParams[i][0])[0];
      elem[unfilteredParams[i][1]] = unfilteredParams[i][2];
    } catch (e) {
      console.log(e, unfilteredParams[i]);
    }
  }
  console.log("aaaa");
  doRefresh();
  console.log("bbbb");
}

function user_map(user) {
  if(user == "BENCEE") return "BENCE";
  return user;
}

if(getUserPref("loadList")) loadList();

function triageButtonTame() {
  if("/sote/101315.do" == document.location.pathname) {
    var triageButton = document.getElementById("A_103201");
    triageButton.classList.remove("blinking");
    new MutationObserver(triageButtonTameCallback).observe(triageButton, {attributes: true, attributeFilter: ["class"]});
    addGlobalStyle(`
button.dropbtn.empty {
  background-color: darkgreen;
}
button.dropbtn.blinking {
  background-color: red;
  animation: none !important;
}
    `);
  }
}

function triageButtonTameCallback(e) {
  for(var i=0; i<e.length; i++) {
    if(e[i].target.classList.contains("dummy")) continue;
    e[i].target.classList.add("dummy");
    var triagedCount = (unsafeWindow.triageListButtonTooltip.match(/:/g) || []).length;
    var untriagedCount = (unsafeWindow.triageListButtonTooltip.match(/<br>/g) || []).length - triagedCount;
    if(triagedCount + untriagedCount) {
      e[i].target.classList.remove("empty");
      e[i].target.innerText = "Triage (" + untriagedCount + "|" + triagedCount + ")";
    } else {
      e[i].target.classList.add("empty");
      e[i].target.innerText = "Triage";
    }
  }
}

if(getUserPref("triageButtonTame")) triageButtonTame();

function hideKBA() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    var headerTable = document.querySelector("div#A1_3 > table");
    var headerCells = headerTable.querySelectorAll("th");
    var kbaCol = -1;
    for(var i=0; i<headerCells.length; i++) {
      if(headerCells[i].innerText == "kba-hide") {
        kbaCol = i;
        break;
      }
    }
    if(kbaCol == -1) return;
    var mergeCol = kbaCol == 0 ? kbaCol + 1 : kbaCol - 1;
    var cols = headerTable.querySelectorAll("colgroup > col");
    cols[kbaCol].setAttribute("width", "0");
    cols[mergeCol].setAttribute("width", parseInt(cols[mergeCol].getAttribute("width")) + 1 + "%*");
    var contentTable = document.querySelector("table#A1_4");
    if(contentTable == null) return;
    var cols = contentTable.querySelectorAll("colgroup > col");
    cols[kbaCol].setAttribute("width", "0");
    cols[mergeCol].setAttribute("width", parseInt(cols[mergeCol].getAttribute("width")) + 1 + "%*");
    var rows = document.querySelectorAll("table#A1_4 > tbody > tr");
    for(var i = 0; i < rows.length; i++) {
      rows[i].dataset.mategascriptKba = rows[i].children[kbaCol].innerText;
    }
  }
}


if(getUserPref("hideKBA")) hideKBA();

function showSettingsButton() {
  if("/sote/0.do" == document.location.pathname) {
    var holder = document.querySelector("td.buttonsright > div.holder");
    var settingsButton = document.createElement("a");
    settingsButton.classList.add("mategascript-settings-button");
    settingsButton.addEventListener("click", openSettingsWindow);
    settingsButton.setAttribute("href", "javascript:");
    settingsButton.setAttribute("onmouseover", "multilineTooltip.showTip(\"Medsol Plus beállítások\", event)");
    settingsButton.setAttribute("onmousemove", "multilineTooltip.showTip(\"Medsol Plus beállítások\", event)");
    settingsButton.setAttribute("onmouseout", "multilineTooltip.hideTip(event)");
    holder.prepend(settingsButton);
    //console.log(settingsButton);
    addGlobalStyle(`
td.buttonsright {
  width: 290px !important;
}
a.mategascript-settings-button {
  background-image: url("https://emedsol1.sote.hu:9444/sote/style/s4/img/i_settings.png");
  background-repeat: no-repeat;
  background-position: center;
}

    `);
  }
}

function openSettingsWindow() {
  settingsWindow = window.open("", "", "popup,width=600,height=600");
  settingsWindow.document.write(`
<html>
  <head>
    <title>
      Medsol Plus beállítások
    </title>
  </head>
  <body>
    <h1>
      Medsol Plus beállítások
    </h1>
    <div id="activateDiv">
      A beállítások építés alatt, az alábbi gomb minden funkciót aktivál.<br />
    </div>
    <div id="settingsDiv">
      A beállítások építés alatt, az alábbi gomb minden funkciót kikapcsol.<br />
    </div>
  </body>
</html>
  `);
  var activateDiv = settingsWindow.document.getElementById("activateDiv");
  var settingsDiv = settingsWindow.document.getElementById("settingsDiv");
  var userPrefs = GM_getValue("userPrefs", {});
  if(!(currentUser in userPrefs)) {
    var initButton = settingsWindow.document.createElement("button");
    initButton.innerText = "Medsol Plus aktiválása";
    initButton.addEventListener("click", copySkeleton);
    activateDiv.appendChild(initButton);
  } else {
    var resetButton = settingsWindow.document.createElement("button");
    resetButton.innerText = "Medsol Plus deaktiválása";
    resetButton.addEventListener("click", resetUser);
    settingsDiv.appendChild(resetButton);
  }
}

function copySkeleton(e) {
  var userPrefs = GM_getValue("userPrefs");
  userPrefs[currentUser] = settingsSkeleton;
  GM_setValue("userPrefs", userPrefs);
  e.target.setAttribute("disabled", "1");
  e.target.innerText = "Kész";
}

function resetUser(e) {
  var userPrefs = GM_getValue("userPrefs");
  userPrefs[currentUser] = undefined;
  GM_setValue("userPrefs", userPrefs);
  e.target.setAttribute("disabled", "1");
  e.target.innerText = "Kész";
}

function patientAccounting() {
  if(!(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname))) return;
  if(!checkUnfiltered()) return;
  var currentPage = (document.location.pathname == "/sote/101307.do") ? "triage" : "pending";
  var now = Date.now();
  var kbaPatientList = GM_getValue("kbaPatientList", {});

  var triagelabel = -1;
  var headers = document.querySelectorAll("table.clabel th");
  for(var i = 0; i<headers.length; i++) {
    if(headers[i].innerHTML == "Triage megjegyzés") {
      triagelabel = i;
      break;
    }
  }
  if(triagelabel != -1) {
    var notes = document.querySelectorAll("#A1_4_body > tr> td:nth-child("+ (triagelabel+1) +")");
    for(var i =  0 ; i<notes.length; i++) {
      var kba = notes[i].parentNode.dataset.mategascriptKba;
      //console.log(kba);
      var patient = {};
      if(!(kba in kbaPatientList)) {
        patient = {firstSeen: now, firstSeenState: currentPage, currentState: currentPage, stateChanges: [], lastSeen: now};
        kbaPatientList[kba] = patient;
      } else {
        patient = kbaPatientList[kba];
        if(patient["currentState"] != currentPage) {
          patient.stateChanges.push({
            from: patient["currentState"],
            to: currentPage,
            at: now
          });
          patient["currentState"] = currentPage;
        }
        patient["lastSeen"] = now;
      }
    }
    if(currentPage == "pending") {
      var kbas = Object.keys(kbaPatientList);
      for(var i=0; i<kbas.length; i++) {
        var patient = kbaPatientList[kbas[i]];
        if((patient.currentState == "pending") && (patient.lastSeen != now)) {
          patient.stateChanges.push({
            from: patient["currentState"],
            to: "removed",
            at: now
          });
          patient.currentState = "removed";
        }
      }
    }
    GM_setValue("kbaPatientList", kbaPatientList);
  }
}

function patientAccountingPrune() {
  var now = Date.now();
  var kbaPatientList = GM_getValue("kbaPatientList", {});
  var kbas = Object.keys(kbaPatientList);
  for(var i=0; i<kbas.length; i++) {
    var patient = kbaPatientList[kbas[i]];
    if(patient["lastSeen"] < now - 86400000) {
      delete kbaPatientList[kbas[i]];
    }
  }
  GM_setValue("kbaPatientList", kbaPatientList);
}

if(getUserPref("patientAccounting")) {
  patientAccounting();
  patientAccountingPrune();
}

function resetButton() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    if(!checkUnfiltered()) {
      submitbtns = document.querySelectorAll("#filterbutton");
      for(var i = 0; i < submitbtns.length; i++) {
        var resetbtndiv = document.createElement("div");
        var resetbtna = document.createElement("a");
        resetbtna.innerText = "Mindenki";
        resetbtna.href = "javascript:void(0);";
        resetbtndiv.setAttribute("class", "btn");
        resetbtndiv.setAttribute("style", "float: right;");
        resetbtna.setAttribute("class", "mategascript_reset_button");
        resetbtna.addEventListener("click", mategascript_reset_query);
        resetbtndiv.appendChild(resetbtna);
        addGlobalStyle(`
          div.btn a.mategascript_reset_button {
            margin: 0px;
            padding: 0px 15px;
            border: none;
            background-color: red;
            color: #ffffff;
            height: 27px;
            line-height: 27px;
            text-align: left;
            text-decoration: none;
            white-space: nowrap;
            vertical-align: text-middle;
            float: left;
            border-radius: 2px;
            -webkit-transition: all 0.3s ease 0s;
            -moz-transition: all 0.3s ease 0s;
            -o-transition: all 0.3s ease 0s;
            transition: all 0.3s ease 0s;
            cursor: pointer;
          }
        `);
        submitbtns[i].before(resetbtndiv);
      }
    }
  }
}

if(getUserPref("resetButton")) {
  resetButton();
}

showSettingsButton();
