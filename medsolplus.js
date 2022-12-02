 
// ==UserScript==
// @name        e-MedSolution unified script
// @namespace   Violentmonkey Scripts
// @match       https://emedsol1.sote.hu:9444/sote/*
// @match       https://emedsol2.sote.hu:9444/sote/*
// @match       https://emedsol3.sote.hu:9444/sote/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM.xmlHttpRequest
// @version     0.1
// @author      -
// @description 9/18/2022, 1:24:08 PM
// @require     https://cdn.jsdelivr.net/npm/jdenticon@3.2.0/dist/jdenticon.min.js
// ==/UserScript==

function checkUserPref(modName) {
  userPrefs = GM_getValue("userPrefs", {});
  if(!(currentUser in userPrefs)) return false;
  return userPrefs[currentUser].includes(modName);
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
  expand = document.querySelectorAll("#A1_4_body td > div > div:nth-child(8)");
  retract = document.querySelectorAll("#A1_4_body td > div > div:nth-child(9)");
  for(var i=0; i<expand.length; i++) expand[i].click();
  for(var i=0; i<retract.length; i++) retract[i].setAttribute("style","display: none");
}

if(checkUserPref("autoExpandQuickButtons")) autoExpandQuickButtons();

function colorOwnPatients() {
  if(!(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname))) return;
  userTriageName = GM_getValue("userTriageNames", {})[GM_getValue("currentUsers")[document.location.host]];
  if(!userTriageName) return;
  firstre = new RegExp("^(?:COVID\\W+)?" + userTriageName + "(?:\\W|$)");
  otherre = new RegExp("\\W" + userTriageName + "(?:\\W|$)");
  donere = /(?:>>|\W-{2,}>>?)/;
  attnre = /!!/;

  triagelabel = -1;
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
      notelabel = htmlDecode(notes[i].innerHTML);
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

if(checkUserPref("colorOwnPatients")) colorOwnPatients();

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

if(checkUserPref("fixHighlights")) fixHighlights();

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

if(checkUserPref("patientListIdenticons")) patientListIdenticons();

if(checkUserPref("uFrameIdenticons")) uFrameIdenticons();

if(checkUserPref("windowHeaderIdenticons")) windowHeaderIdenticons();

function autoTEK() {
  cimre = /^(\d)(\d{2})\d\W+([\wöÖüÜóÓőŐúÚűŰéÉáÁíÍ]+)\W/;
  romai = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XI', 'XII', 'XIII'];
  wards = GM_getValue("wards", ["0100"]);
  extendNode = null;
  if("/sote/UpdateFrame.fl" != document.location.pathname) return;
  var nodes = document.querySelectorAll("#report_table>tbody>tr>td:first-child");
  for(var i=0; i<nodes.length; i++) {
    if(nodes[i].innerText == "Lakcím") {
      var parent = nodes[i].parentNode;
      var cim = parent.querySelector("td:nth-child(3) div");
      extendNode = parent.querySelector("td:nth-child(2)");
      if(cim.lentgh<1) continue;
      var cimtext = cim.innerText;
      var cmatch = cimtext.match(cimre);
      if(!cmatch) continue;
      var varos = cmatch[1] == "1"?("Budapest " + romai[parseInt(cmatch[2])-1] + ". kerület"):(cmatch[3]);
      GM.xmlHttpRequest(
        {
          "url": "http://84.206.43.26:7080/ellatas/xtek/",
          "method": "GET",
          "context": {"stage": 0, "data": "id12_hf_0=&ac="+encodeURIComponent(varos)+"&tekszakmak%3Aszakmakform%3Atekszakmak=0&tekszakmak%3Aszakmakform%3Aord_szakma=on&elerhment.x=5&elerhment.y=5"},
          "onload": xtekcb,
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "http://84.206.43.26:7080",
            "Referer": "http://84.206.43.26:7080/ellatas/xtek/"
          }
        }
      );
    }
  }
}

function xtekcb(e) {
  if(e.context.stage == 0) {
    var url = new URL(new DOMParser().parseFromString(e.responseText, "text/html").querySelectorAll("form")[0].getAttribute("action"), "http://84.206.43.26:7080/ellatas/xtek/").href;
    GM.xmlHttpRequest(
        {
          "url": url,
          "method": "POST",
          "data": e.context.data,
          "context": {"stage": 1},
          "onload": xtekcb,
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "http://84.206.43.26:7080",
            "Referer": "http://84.206.43.26:7080/ellatas/xtek/"
          }
        }
    );
  } else {
    var responseDocument = new DOMParser().parseFromString(e.responseText, "text/html");
    var responseRows = responseDocument.querySelectorAll("table tr");
    for(var i=0; i<responseRows.length; i++) {
      console.log(responseRows[i]);
    }
    console.log(wards);
    extendNode.innerHTML="o";
  }
}

if(checkUserPref("autoTEK")) autoTEK();

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
    birthdate = new Date(e[i].target.value);
    birthyear = birthdate.getFullYear();
    curryear = new Date().getFullYear();
    birthdate.setFullYear(curryear);
    yearDiff = curryear - birthyear;
    if(birthdate > new Date()) yearDiff--;
    birthdatenode = e[i].target.parentNode.querySelector("input#FH0_birthdate");
    birthdatenode.value = birthdatenode.value + " (" + yearDiff + ")";
  }
}

if(checkUserPref("autoAge")) autoAge();

function loadList() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    userTriageName = GM_getValue("userTriageNames", {})[GM_getValue("currentUsers")[document.location.host]];
    if(!userTriageName) return;
    var userre = new RegExp("^(?:COVID\\W+)?((?!COVID)[A-ZÁÉÍÓÖŐÚÜŰ\\.]{2,}|VaPe)(?:\\W|$)");
    var donere = /(?:>>|\W-{2,}>>?)/;
    var attnre = /!!/;

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
        if(!(result[1] in doctors)) doctors[result[1]] = {count: 0, critical: 0, done: 0};
        doctors[result[1]]["count"]++;
        if(attnre.exec(notelabel)) doctors[result[1]]["critical"]++;
        if(donere.exec(notelabel)) doctors[result[1]]["done"]++;
      }
    }
    GM_setValue(document.location.pathname == "/sote/101315.do"?"pendingCounts":"triageCounts", doctors);


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
    console.log(pendingCounts);
    var row = document.createElement("tr");
    var td = document.createElement("td");
      td.innerText = "Név";
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = "Triage";
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = "Foly";
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = "Krit";
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = "Kész";
      row.appendChild(td);
      dropdiv.appendChild(row);
    for(i = 0; i < docnames.length; i++) {
      var row = document.createElement("tr");
      var td = document.createElement("td");
      td.innerText = docnames[i];
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["triage"] ? pendingCounts[docnames[i]]["triage"] : 0;
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["count"] - pendingCounts[docnames[i]]["done"];
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["critical"];
      row.appendChild(td);
      td = document.createElement("td");
      td.innerText = pendingCounts[docnames[i]]["done"];
      row.appendChild(td);
      dropdiv.appendChild(row);
    }
  }
}

if(checkUserPref("loadList")) loadList();

function triageButtonTame() {
  if("/sote/101315.do" == document.location.pathname) {
    var triageButton = document.getElementById("A_103201");
    triageButton.classList.remove("blinking");
    new MutationObserver(triageButtonTameCallback).observe(triageButton, {attributes: true});
  }
}

function triageButtonTameCallback(e) {
  for(var i=0; i<e.length; i++) {
    if(e[i].target.classList.contains("blinking")) e[i].target.classList.remove("blinking");
    var triageCount = (unsafeWindow.triageListButtonTooltip.match(/<br>/g) || []).length;
    e[i].target.innerText = "Triage" + (triageCount?" (" + triageCount + (triageCount==10?"+":"") + ")" : "");
  }
}

if(checkUserPref("triageButtonTame")) triageButtonTame();
