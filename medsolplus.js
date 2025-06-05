// ==UserScript==
// @name        Medsol Plus
// @namespace   Violentmonkey Scripts
// @match       https://emedsol1.sote.hu:9444/sote/*
// @match       https://emedsol2.sote.hu:9444/sote/*
// @match       https://emedsol3.sote.hu:9444/sote/*
// @match       https://emedsol4.sote.hu:9444/sote/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM.xmlHttpRequest
// @version     1.30
// @downloadURL https://raw.githubusercontent.com/matega/medsolplus/master/medsolplus.js
// @author      Dr. Galambos Máté | galambos.mate@semmelweis.hu
// @description e-MedSolution extra funkciók a sürgősségi osztályon (KSBA)
// @require     https://cdn.jsdelivr.net/npm/jdenticon@3.2.0/dist/jdenticon.min.js
// ==/UserScript==

settingsSkeleton = {
  "colorOwnPatients": false,
  "fixHighlights": false,
  "autoExpandQuickButtons": true,
  "patientListIdenticons": false,
  "uFrameIdenticons": false,
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
  "hideevn": false,
  "triageName": "",
  "patientAccounting": false,
  "inlineNoteEdit": false,
  "popupsAreTabs": false,
  "patientInNewWindow": true,
  "resetButton": true,
  "inlineNoteEditNG": false
}

intMedAssign = {
  "Semmelweis Egyetem (BOK)": ["Dunaharaszti",
  "Dunavarsány",
  "Érd",
  "Halásztelek",
  "Majosháza",
  "Százhalombatta",
  "Szigethalom",
  "Taksony",
  "Tököl"],
  "Semmelweis Egyetem (BHK)": ["Apaj",
  "Áporka",
  "Biatorbágy",
  "Budaörs",
  "Délegyháza",
  "Diósd",
  "Dömsöd",
  "Herceghalom",
  "Kiskunlacháza",
  "Lórév",
  "Makád",
  "Pusztazámor",
  "Ráckeve",
  "Sóskút",
  "Szigetbecse",
  "Szigetcsép",
  "Szigetszentmárton",
  "Szigetszentmiklós",
  "Szigetújfalu",
  "Tárnok",
  "Törökbálint"]
}

function getUserPref(prefName) {
  var userPrefs = GM_getValue("userPrefs", {});
  if(currentUser in userPrefs) return userPrefs[currentUser][prefName];
  if("*" in userPrefs) return userPrefs["*"][prefName];
  if(!GM_getValue("noDefaults", false)) return settingsSkeleton[prefName];
  return false;
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
  var firstre = new RegExp("^(?:COVID\\W+|\\[[^\\]]+\\]\\W+)?" + userTriageName + "(?:\\W|$)");
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
  // background-color: lightgrey !important;
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
  if(!nameDiv) return;
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
      if(!cmatch) continue;
      var varos = cmatch[1] == "1"?("Budapest " + romai[parseInt(cmatch[2])-1] + ". kerület"):(cmatch[3]);
      var xtekrequest = {
        "url": "http://84.206.43.26:7080/ellatas/xtek/",
        "method": "GET",
        "context": {"stage": 0, "cim": cim, "varos": varos, "data": "id12_hf_0=&ac="+encodeURIComponent(varos)+"&tekszakmak%3Aszakmakform%3Atekszakmak=0&tekszakmak%3Aszakmakform%3Aord_szakma=on&elerhment.x=5&elerhment.y=5"},
        "onload": xtekcb,
        "onerror": autoTEKSequential,
        "headers": {
          //"Content-Type": "application/x-www-form-urlencoded",
          //"Origin": "http://84.206.43.26:7080",
          //"Referer": "http://84.206.43.26:7080/ellatas/xtek/"
        }
      }
      var result = GM.xmlHttpRequest(xtekrequest);

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
        if(prognum == "0100:1:a" && e.context.varos == "Budapest XVI. kerület") {
          hosp = "Semmelweis Egyetem";
        }
        if(prognum == "0100:1:a" && hosp == "Semmelweis Egyetem") {
          for(where in intMedAssign) {
            if(intMedAssign[where].includes(e.context.varos)) {
              hosp = where;
            }
          }
          if(hosp == "Semmelweis Egyetem") {
            hosp = "Semmelweis Egyetem (<a href=\"https://docs.google.com/spreadsheets/d/11w24ztMLm8ogPG9P4MBJcUkspSrtDpee3jlriTDBXLc/edit\" target=\"_blank\">táblázat alapján</a>)";
          }
        }
        hosps[prognum] = {hosp: hosp, spec: spectext};
      } catch(e) {
      }
    }
    var filteredHosps = [];
    var specfilter = getUserPref("autoTEKSpecList");
    for(i=0; i<specfilter.length; i++) {
      filteredHosps.push(hosps[specfilter[i]]);
    }
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
        hospCell.innerHTML = filteredHosps[i]["hosp"];
        hospRow.appendChild(hospCell);
        tekDropdown.appendChild(hospRow);
      } catch (e) {
        console.log(e);
      }
    }
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
    table.mategascript-tekdropdown a[target="_blank"]::after {
      content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
      margin: 0 3px 0 5px;
    }
    `);
    autoTEKSequential();
  }
}

autoTEKLabels = ["Lakcím", "Ideiglenes lakcím:"];
autoTEKStage = 0;

function autoTEKSequential(e) {
  if(e) console.log("Caught error in AutoTekSequential: ", e);
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
    birthdatenode.size = parseInt(birthdatenode.size) + 4;
  }
}

if(getUserPref("autoAge")) autoAge();

function loadList() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    var userre = new RegExp("^(?:(?:COVID|<(?:[5-9]|1[0-3]|JARO|VARO)>)\\W+)*((?!COVID)[A-ZÁÉÍÓÖŐÚÜŰ\\.\\-]{2,}|VaPe)(?:\\W|$)");
    var donere = /(?:>>|\W-{2,}>>?)/;
    var attnre = /!!/;

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
      console.log(notelabel);
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
     *      td.innerText = "Krit";
     *      row.appendChild(td);
     *      td = document.createElement("td");
     *      td.innerText = "Kész";
     *      row.appendChild(td);*/
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
       *      td.innerText = pendingCounts[docnames[i]]["critical"];
       *      row.appendChild(td);
       *      td = document.createElement("td");
       *      td.innerText = pendingCounts[docnames[i]]["done"];
       *      row.appendChild(td);*/
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
  //console.log("unfilteredParams running")
  var unfilteredParams = getUnfilteredParameters();
  for(var i = 0; i < unfilteredParams.length; i++) {
    try {
      var elem = document.getElementsByName(unfilteredParams[i][0])[0];
      //console.log("Checking " + unfilteredParams[i][1] + " of", elem, " to equal " + unfilteredParams[i][2]);
      if(elem[unfilteredParams[i][1]] != unfilteredParams[i][2]) {
        return false;
      }
    } catch (e) {
      console.log(e);
    }
  }
  //console.log("Returning true");
  return true
}


function mategascript_reset_query() {
  var unfilteredParams = getUnfilteredParameters();
  for(var i = 0; i < unfilteredParams.length; i++) {
    try {
      var elem = document.getElementsByName(unfilteredParams[i][0])[0];
      elem[unfilteredParams[i][1]] = unfilteredParams[i][2];
    } catch (e) {
    }
  }
  doRefresh();
}

function user_map(user) {
  if(user == "BENCEE") return "BENCE";
  return user;
}

if(getUserPref("loadList")) loadList();

function triageButtonTame() {
  if("/sote/101315.do" == document.location.pathname) {
    var triageButton = document.getElementById("A_103201");
    if(!triageButton) return;
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

function hideEvn() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    var headerTable = document.querySelector("div#A1_3 > table");
    if(!headerTable) return;
    var headerCells = headerTable.querySelectorAll("th");
    var evnCol = -1;
    for(var i=0; i<headerCells.length; i++) {
      if(headerCells[i].innerText == "evn-hide") {
        evnCol = i;
        break;
      }
    }
    if(evnCol == -1) return;
    var mergeCol = evnCol == 0 ? evnCol + 1 : evnCol - 1;
    var cols = headerTable.querySelectorAll("colgroup > col");
    cols[evnCol].setAttribute("width", "0");
    cols[mergeCol].setAttribute("width", parseInt(cols[mergeCol].getAttribute("width")) + 1 + "%*");
    var contentTable = document.querySelector("table#A1_4");
    if(contentTable == null) return;
    var cols = contentTable.querySelectorAll("colgroup > col");
    cols[evnCol].setAttribute("width", "0");
    cols[mergeCol].setAttribute("width", parseInt(cols[mergeCol].getAttribute("width")) + 1 + "%*");
    var rows = document.querySelectorAll("table#A1_4 > tbody > tr");
    for(var i = 0; i < rows.length; i++) {
      rows[i].dataset.mategascriptEvn = rows[i].children[evnCol].innerText;
    }
  }
}


if(getUserPref("hideEvn")) hideEvn();

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
  var userre = new RegExp("^(?:(?:COVID|<(?:[5-9]|1[0-3]|JARO|VARO)>)\\W+)*((?!COVID)[A-ZÁÉÍÓÖŐÚÜŰ\\.\\-]{2,}|VaPe)(?:\\W|$)");
  var currentPage = (document.location.pathname == "/sote/101307.do") ? "triage" : "pending";
  var now = Date.now();
  var evnPatientList = GM_getValue("evnPatientList", {});

  var triagelabel = -1;
  var headers = document.querySelectorAll("table.clabel th");
  for(var i = 0; i<headers.length; i++) {
    if(headers[i].innerHTML == "Triage megjegyzés") {
      triagelabel = i;
      break;
    }
  }
  var notes = document.querySelectorAll("#A1_4_body > tr> td:nth-child("+ (triagelabel+1) +")");
  for(var i =  0 ; i<notes.length; i++) {
    var evn = notes[i].parentNode.dataset.mategascriptEvn;
    var notelabel = htmlDecode(notes[i].innerHTML);
    console.log(notelabel);
    var result = userre.exec(notelabel);
    if(result) {
      var doctor = user_map(result[1]);
    } else {
      doctor = "";
    }
    var patient = {};
    var patientState = {at: now, state: currentPage, doctor: doctor};
    if(!(evn in evnPatientList)) {
      patient = {states: [patientState]};
      evnPatientList[evn] = patient;
    }
    patient = evnPatientList[evn];
    patient.lastSeen = now;
    patient.note = notelabel;
    var lastPatientState = patient.states[patient.states.length - 1];
    if(lastPatientState.state != patientState.state || lastPatientState.doctor != patientState.doctor) patient.states.push(patientState);
  }
  var evns = Object.keys(evnPatientList);
  for(var i=0; i < evns.length; i++) {
    if(evnPatientList[evns[i]].lastSeen == now) continue;
    var lastState = evnPatientList[evns[i]].states[evnPatientList[evns[i]].states.length - 1];
    if(lastState.state == currentPage) {
      var state = JSON.parse(JSON.stringify(lastState));
      state.at = now;
      if(currentPage == "triage") state.state = "pending";
      if(currentPage == "pending") state.state = "done";
      evnPatientList[evns[i]].states.push(state);
    }
  }
  GM_setValue("evnPatientList", evnPatientList);

  // Insert the dropdown list

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

  var docs = {}
  var evns = Object.keys(evnPatientList);
  for(var i = 0; i < evns.length; i++) {
    var patient = evnPatientList[evns[i]];
    var lastState = patient.states[patient.states.length - 1];
    if(lastState.doctor == "") continue;
    if(!(lastState.doctor in docs)) {
      docs[lastState.doctor] = {pending: 0, triage: 0, lastBegin: 0};
    }
    if(lastState.state == "triage") {
      docs[lastState.doctor]["triage"]++;
      continue;
    }
    if(lastState.state == "pending") {
      docs[lastState.doctor]["pending"]++;
      var beginTime = lastState.at;
      for(j = patient.states.length - 2; j > -1; j--) {
        if(patient.states[j].doctor != lastState.doctor || patient.states[j].state != "pending") {
          beginTime = patient.states[j+1].at;
          break;
        }
      }
      docs[lastState.doctor]["lastBegin"] = Math.max(beginTime, docs[lastState.doctor]["lastBegin"]);
      continue;
    }
  }

  var orderedDocs = [];

  while(Object.keys(docs) != 0) {
    var mostRested = null;
    var mostRest = -1;
    var docsKeys = Object.keys(docs);
    for(var i = 0; i < docsKeys.length; i++) {
      if(mostRest < (now - docs[docsKeys[i]].lastBegin)) {
        mostRested = docsKeys[i];
        mostRest = now - docs[docsKeys[i]].lastBegin;
      }
    }
    docs[mostRested]["name"] = mostRested;
    orderedDocs.push(docs[mostRested]);
    delete docs[mostRested];
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
  td = document.createElement("th");
  td.innerText = "Pihent";
  row.appendChild(td);
  /*td = document.createElement("td");
   *    td.innerText = "Kész";
   *    row.appendChild(td);*/
  droptable.appendChild(row);
  for(i = 0; i < orderedDocs.length; i++) {
    if(orderedDocs[i].pending == 0 && orderedDocs[i].triage==0) continue;
    var row = document.createElement("tr");
    var td = document.createElement("td");
    td.innerText = orderedDocs[i].name;
    row.appendChild(td);
    td = document.createElement("td");
    td.innerText = orderedDocs[i].pending;
    row.appendChild(td);
    td = document.createElement("td");
    td.innerText = orderedDocs[i].triage;
    row.appendChild(td);
    td = document.createElement("td");
    var pihent = Math.floor((now - orderedDocs[i].lastBegin) / 60000);
    if(pihent > 12*60) pihent = "∞";
    td.innerText = pihent + "'";
    row.appendChild(td);
    /*
     *    td = document.createElement("td");
     *    td.innerText = pendingCounts[docnames[i]]["done"];
     *    row.appendChild(td);*/
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

function patientAccountingPrune() {
  var now = Date.now();
  var evnPatientList = GM_getValue("evnPatientList", {});
  var evns = Object.keys(evnPatientList);
  for(var i=0; i<evns.length; i++) {
    var patient = evnPatientList[evns[i]];
    if(patient["lastSeen"] < now - 86400000) {
      delete evnPatientList[evns[i]];
    }
  }
  GM_setValue("evnPatientList", evnPatientList);
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

function ptLoc() {
  var locno = getUserPref("patientLocNo");
  var locw = getUserPref("patientLocWidth");
  if(locno === false || !locw) return;
  var locre = /\(([TVFŐS]\d{0,2})\)/;
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    var triagelabel = -1;
    var headers = document.querySelectorAll("table.clabel th");
    for(var i = 0; i<headers.length; i++) {
      if(headers[i].innerHTML == "Triage megjegyzés") {
        triagelabel = i;
        break;
      }
    }

    var cols = document.querySelectorAll("div#A1_3 > table > colgroup > col");
    var oldw = parseInt(cols[locno].getAttribute("width"));
    if(locw > oldw) return;
    cols[locno].setAttribute("width", (oldw - locw) + "%*");
    var newcol = document.createElement("col");
    newcol.setAttribute("width", locw + "%*");
    cols[locno].before(newcol);

    var newhead = document.createElement("th");
    newhead.innerText = "Hely";
    document.querySelector("div#A1_3 > table > tbody > tr").children[locno].before(newhead);

    cols = document.querySelectorAll("table#A1_4 > colgroup > col");
    oldw = parseInt(cols[locno].getAttribute("width"));
    if(locw > oldw) return;
    cols[locno].setAttribute("width", (oldw - locw) + "%*");
    newcol = document.createElement("col");
    newcol.setAttribute("width", locw + "%*");
    cols[locno].before(newcol);

    if(triagelabel != -1) {
      var rows = document.querySelectorAll("#A1_4_body > tr");
      for(var i = 0; i < rows.length; i++) {
        var triagetext = rows[i].children[triagelabel].innerText;
        var match = triagetext.match(locre);
        if(match) {
          rows[i].children[triagelabel].innerText = triagetext.replace(locre, " ");
          rows[i].children[triagelabel].dataset.mategascriptOriginalText = triagetext
        }

        var loctd = document.createElement("td");
        if(match) loctd.innerText = match[1]; else loctd.innerText = "??";
        rows[i].children[locno].before(loctd);
      }
    }
  }
}

if(getUserPref("patientLoc")) {
  ptLoc();
}

inlineNoteEditStatus = {
  currentNode: null,
  needFrame: false,
  outerFrame: null,
  innerFrame: null,
  submitFrame: null,
  needEditDescription: false,
  needSubmmit: false,
  inhibitRefresh: false
};

function inlineNoteEdit() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    var triagelabel = -1;
    var headers = document.querySelectorAll("table.clabel th");
    for(var i = 0; i<headers.length; i++) {
      if(headers[i].innerHTML == "Triage megjegyzés") {
        triagelabel = i;
        break;
      }
    }
    if(triagelabel == -1) return;
    var notetds = document.querySelectorAll("#A1_4_body>tr>td:nth-child("+(triagelabel+1)+")");
    for(var i=0; i<notetds.length; i++) {
      notetds[i].setAttribute("onClick", "");
      notetds[i].addEventListener("focus", inlineNoteEditFocusHandler);
      notetds[i].addEventListener("blur", inlineNoteEditBlurHandler);
      notetds[i].addEventListener("keydown", inlineNoteEditKeypressHandler);
      notetds[i].addEventListener("input", inlineNoteEditInputHandler);
      notetds[i].contentEditable = "true";
      notetds[i].spellcheck = false;
      notetds[i].classList.add("mategascript-inline-edit");
      notetds[i].dataset.mategascriptOriginalText = notetds[i].dataset.mategascriptOriginalText || notetds[i].innerText;
    }
    addGlobalStyle(`
    td.mategascript-inline-edit {
      cursor: text;
      background-color: rgba(255,255,255,0);
    }
    td.mategascript-inline-edit.changed {
      color: gray;
    }
    td.mategascript-inline-edit.success {
      animation: flashgreen 2s linear 0s 1;
    }
    td.mategascript-invalid {
      background-color: rgb(255,100,100) !important;
    }
    @keyframes flashgreen {
      from {background-color: lightgreen;}
      50% {background-color: lightgreen;}
      to {}
    }
    `);
    unsafeWindow.inlineNoteEditShim = inlineNoteEditShim;
    unsafeWindow.top.addEventListener("message", function(e) {
      if(e.data.message && e.data.message == "mategascript-note-success") {
        var origtd = document.getElementById("mategascript-inlinetd-" + e.data.callbacknumber);
        origtd.classList.remove("changed");
        origtd.classList.add("success");
        origtd.innerText = e.data.text;
        origtd.dataset.mategascriptOriginalText = e.data.text;
        inlineNoteEditStatus.inhibitRefresh = false;
      }
    });
    if(document.location.pathname == "/sote/101307.do") {
      var filterbutton = document.querySelectorAll("#filterbutton_a");
      for(var i = 0; i < filterbutton.length; i++) {
        filterbutton[i].removeAttribute("href");
        filterbutton[i].addEventListener("click", () => doRefresh(true));
      }
      doRefresh = ((dro) => {
        return function(force) {
          if(force || !inlineNoteEditStatus.inhibitRefresh) return dro();
        };
      })(doRefresh);
    }
  } else if(document.location.pathname == "/sote/UpdateFrame.fl") {
    var frameelement = window.parent.frameElement;
    if(!frameelement || !frameelement.dataset.mategascriptNewTriageNote) return;
    var inputelement = document.getElementsByName("U.DUMMY.20")[0];
    if(!inputelement) return;
    var text = frameelement.dataset.mategascriptNewTriageNote
    inputelement.value = text;
    init();
    var cbn = frameelement.dataset.mategascriptCallbackNumber;
    top.funcLib.doInvokeOpenerAtClose = function(cbn, text){return function(){
      window.top.postMessage({message: "mategascript-note-success", callbacknumber: cbn, text: text});
    }}(cbn, text);
    doOK();
  }
}

function inlineNoteEditFocusHandler(e) {
  e.target.spellcheck = true;
  inlineNoteEditStatus.inhibitRefresh = true;
}

function inlineNoteEditBlurHandler(e) {
  e.target.spellcheck = false;
  if(!e.target.classList.contains("changed")) e.target.innerText = e.target.dataset.mategascriptOriginalText;
  inlineNoteEditStatus.inhibitRefresh = false;
}

function inlineNoteEditKeypressHandler(e) {
  if(e.key == "Enter" || e.key == "F10") {
    e.stopPropagation();
    e.preventDefault();
    if(e.target.innerText.length > 200) return false;
    e.target.classList.remove("success");
    e.target.classList.add("changed");
    e.target.blur();
    inlineNoteEditStatus.currentNode = e.target;
    var fmb = mainFuncLib.flatMode;
    mainFuncLib.flatMode = true;
    var quickbuttons = e.target.parentNode.querySelectorAll("td>table>tbody>tr>td");
    for(var i = quickbuttons.length - 1; i >= 0; i--) {
      if(quickbuttons[i].getAttribute("onmouseover").includes("'Triage megjegyzés'")) {
        var origonclick = quickbuttons[i].getAttribute("onclick");
        var callbacknumber = ""+(1000000 + Math.floor(e.timeStamp % 1000000));
        e.target.setAttribute("id", "mategascript-inlinetd-" + callbacknumber);
        var newonclick = origonclick.replace(/javascript:(doAH1(?:_AcAuth)?)\(/, "inlineNoteEditShim(\"0\",\"" +callbacknumber+ "\",$1,");
        var mo = new MutationObserver(function(cbn, td){return function(recs, obs){inlineNoteEditMutationObserver(cbn, td, recs, obs)}}({callbacknumber: callbacknumber, framename: name}, e.target));
        mo.observe(window.top.document, {subtree: true, childList: true});
        unsafeWindow.eval(newonclick);
        break;
      }
    }
    mainFuncLib.flatMode = fmb;
  }
  else if(e.key == "Escape") {
    e.stopPropagation();
    e.target.blur();
    e.target.innerText = e.target.dataset.mategascriptOriginalText;
  }
}

function inlineNoteEditInputHandler(e) {
  if(e.target.innerText.length > 200) {
    e.target.classList.add("mategascript-invalid");
  } else {
    e.target.classList.remove("mategascript-invalid");
  }
}

function inlineNoteEditShim(width, height, handler, ...rest) {
  var r2c = rest[rest.length-1].slice();
  r2c[4] = width;
  r2c[5] = height;
  rest[rest.length-1] = r2c;
  handler(...rest);
}

function inlineNoteEditMutationObserver(cbn, td, recs, obs) {
  for(var i = 0; i < recs.length; i++) {
    for(var j = 0; j < recs[i].addedNodes.length; j++) {
      var curNode = recs[i].addedNodes[j];
      if(curNode.tagName != "IFRAME") continue;
      if(curNode.getAttribute("style").includes("opacity: 0.62")) {
        curNode.setAttribute("style", "display: none;");
        continue;
      }
      if(curNode.getAttribute("desiredheight") == cbn.callbacknumber) {
        obs.disconnect();
        curNode.dataset.mategascriptNewTriageNote = td.innerText;
        curNode.dataset.mategascriptFrameName = cbn.framename;
        curNode.dataset.mategascriptCallbackNumber = cbn.callbacknumber;
        curNode.setAttribute("style", "display: none;");
        console.log(curNode)
      }
    }
  }
}


function inlineNoteEditMutationObserverNG(cbn, td, recs, obs) {
  for(var i = 0; i < recs.length; i++) {
    for(var j = 0; j < recs[i].addedNodes.length; j++) {
      var curNode = recs[i].addedNodes[j];
      if(curNode.tagName != "IFRAME") continue;
      if(curNode.getAttribute("style").includes("opacity: 0.62")) {
        //curNode.setAttribute("style", "display: none;");
        continue;
      }
      if(curNode.getAttribute("desiredheight") == cbn.callbacknumber) {
        obs.disconnect();
        curNode.dataset.mategascriptNewTriageNote = td.innerText;
        curNode.dataset.mategascriptFrameName = cbn.framename;
        curNode.dataset.mategascriptCallbackNumber = cbn.callbacknumber;
        //curNode.setAttribute("style", "display: none;");
        console.log(curNode)
      }
    }
  }
}

if(getUserPref("inlineNoteEdit")) {
  inlineNoteEdit();
}

function inlineNoteEditNG() {
  if(["/sote/101315.do","/sote/101307.do"].includes(document.location.pathname)) {
    console.log("inlineNoteEditNG");
    unsafeWindow.inlineNoteEditShim = inlineNoteEditShim;
    let triagelabel = -1;
    const headers = document.querySelectorAll("table.clabel th");
    for(var i = 0; i<headers.length; i++) {
      if(headers[i].innerHTML == "Triage megjegyzés") {
        triagelabel = i;
        break;
      }
    }
    if(triagelabel == -1) return;
    const notetds = document.querySelectorAll("#A1_4_body>tr>td:nth-child("+(triagelabel+1)+")");
    for(var i=0; i<notetds.length; i++) {
      notetds[i].setAttribute("onClick", "");
      notetds[i].contentEditable = "true";
      notetds[i].spellcheck = false;
      notetds[i].classList.add("mategascript-inline-edit");
      notetds[i].dataset.mategascriptOriginalText = notetds[i].dataset.mategascriptOriginalText || notetds[i].innerText;
      notetds[i].addEventListener("click", (e) => {
        const quickbuttons = e.target.parentNode.querySelectorAll("td>table>tbody>tr>td");
        for(var i = quickbuttons.length - 1; i >= 0; i--) {
          if(quickbuttons[i].getAttribute("onmouseover").includes("Triage megjegyzés")) {
            const origonclick = quickbuttons[i].getAttribute("onclick");
            const callbacknumber = ""+(1000000 + Math.floor(e.timeStamp % 1000000));
            e.target.setAttribute("id", "mategascript-inlinetd-" + callbacknumber);
            const newonclick = origonclick.replace(/javascript:(doAH1(?:_AcAuth)?)\(/, "inlineNoteEditShim(\"0\",\"" +callbacknumber+ "\",$1,");
            var mo = new MutationObserver(function(cbn, td){return function(recs, obs){inlineNoteEditMutationObserverNG(cbn, td, recs, obs)}}({callbacknumber: callbacknumber, framename: name}, e.target));
            mo.observe(window.top.document, {subtree: true, childList: true});
            const fmb = mainFuncLib.flatMode;
            mainFuncLib.flatMode = true;
            unsafeWindow.eval(newonclick);
            mainFuncLib.flatMode = fmb;
            break;
          }
        }
      });
    }
    addGlobalStyle(`
    td.mategascript-inline-edit {
      cursor: text;
      background-color: rgba(255,255,255,0);
    }
    td.mategascript-inline-edit.changed {
      color: gray;
    }
    td.mategascript-inline-edit.success {
      animation: flashgreen 2s linear 0s 1;
    }
    td.mategascript-invalid {
      background-color: rgb(255,100,100) !important;
    }
    @keyframes flashgreen {
      from {background-color: lightgreen;}
      50% {background-color: lightgreen;}
      to {}
    }
    `);
  }
  else if(document.location.pathname == "/sote/UpdateFrame.fl") {
    var frameelement = window.parent.frameElement;
    if(!frameelement || !frameelement.dataset.mategascriptNewTriageNote) return;
    console.log(document);
    for(name of ["U.DUMMY.22", "U.DUMMY.24", "U.DUMMY.20", "U.DUMMY.21"]) {
      console.log(document.getElementsByName(name)[0].value);
    }
    return;
    var text = frameelement.dataset.mategascriptNewTriageNote
    inputelement.value = text;
    init();
    var cbn = frameelement.dataset.mategascriptCallbackNumber;
    top.funcLib.doInvokeOpenerAtClose = function(cbn, text){return function(){
      window.top.postMessage({message: "mategascript-note-ng-success", callbacknumber: cbn, text: text});
    }}(cbn, text);
    doOK();
  }
}

if(getUserPref("inlineNoteEditNG")) {
  inlineNoteEditNG();
}

function patientInNewWindow() {
  if(["/sote/101315.do"].includes(document.location.pathname)) {
    var clickabletds = document.querySelectorAll("#A1_4_body>tr>td");
    for(var i=0; i<clickabletds.length; i++) {
      var ctd = clickabletds[i];
      var ocl = ctd.getAttribute("onclick");
      if(typeof ocl == "string" && (ocl.includes("A300322") || ocl.includes("A300695"))) {
        ctd.setAttribute("onclick", ocl.replace("javascript:doAH1_AcAuth(", "javascript:patientInNewWindowClickHandler(event,"));
      }
    }
    unsafeWindow.patientInNewWindowClickHandler = patientInNewWindowClickHandler;
  }
}

function patientInNewWindowClickHandler(event, ...rest) {
  if(event.ctrlKey) {
    var r3c = rest[3].slice();
    r3c[2] = "new";
    r3c[4] = "1024";
    rest[3] = r3c;
  }
  var fmb = mainFuncLib.flatMode;
  mainFuncLib.flatMode = false;
  doAH1_AcAuth(...rest);
  mainFuncLib.flatMode = fmb;
}

if(getUserPref("patientInNewWindow")) {
  patientInNewWindow();
}

function popupsAreTabs() {
  unsafeWindow.open = function(open) {
    return function() {
      return open(...Array.prototype.slice.call(arguments, 0, 2));
    }
  }(unsafeWindow.open);
}

if(getUserPref("popupsAreTabs")) {
  popupsAreTabs();
}

showSettingsButton();
