/*
global
	get_collection_export,
	get_collection_stats,
	collectionSortSet,
	collectionSortName,
	collectionSortCmc,
	collectionSortRarity,
	cardsNew,
	cardsDb,
	cards,
	setsList,
	cardSize,
	cardQuality,
	addCardHover,
	shell,
	get_set_scryfall,
	selectAdd
*/
let collectionPage = 0;
let sortingAlgorithm = "Set";
let filteredSets = [];
let filteredMana = [];

let orderedSets;

//
function openCollectionTab() {
  orderedSets = [];
  for (let set in setsList) {
    orderedSets.push(set);
  }

  orderedSets.sort((a, b) => {
    if (setsList[a].release < setsList[b].release) {
      return -1;
    }
    if (setsList[a].release > setsList[b].release) {
      return 1;
    }
    return 0;
  });

  $("#ux_0").html("");
  $("#ux_1").html("");
  $("#ux_0").removeClass("flex_item");
  var div = $('<div class="inventory"></div>');

  var basicFilters = $('<div class="inventory_filters_basic"></div>');
  var fll = $('<div class="inventory_flex_half"></div>');
  var flr = $('<div class="inventory_flex_half"></div>');

  var fllt = $('<div class="inventory_flex"></div>');
  var fllb = $('<div class="inventory_flex"></div>');
  var flrt = $('<div class="inventory_flex"></div>');
  var flrb = $('<div class="inventory_flex"></div>');

  var icd = $('<div class="input_container_inventory"></div>');
  var label = $('<label style="display: table">Search</label>');
  label.appendTo(icd);
  var input = $('<input type="search" id="query_name" autocomplete="off" />');
  input.appendTo(icd);
  icd.appendTo(fllt);

  input.keypress(function(e) {
    if (e.which == 13) {
      printCards();
    }
  });

  var searchButton = $('<div class="button_simple button_thin">Search</div>');
  searchButton.appendTo(flrt);
  var advancedButton = $(
    '<div class="button_simple button_thin">Advanced Filters</div>'
  );
  advancedButton.appendTo(flrt);

  searchButton.click(() => {
    printCards();
  });

  advancedButton.click(() => {
    expandFilters();
  });

  var select = $('<select id="query_select">' + sortingAlgorithm + "</select>");
  var sortby = ["Set", "Name", "Rarity", "CMC"];
  for (var i = 0; i < sortby.length; i++) {
    select.append(
      '<option value="' + sortby[i] + '">Sort by: ' + sortby[i] + "</option>"
    );
  }
  select.appendTo(fllb);
  selectAdd(select, sortCollection);

  var exp = $('<div class="button_simple button_thin">Export Collection</div>');
  exp.appendTo(fllb);
  var reset = $('<div class="button_simple button_thin">Reset</div>');
  reset.appendTo(flrb);
  var stats = $(
    '<div class="button_simple button_thin stats_button">Collection Stats</div>'
  );
  stats.appendTo(flrb);

  exp.click(() => {
    exportCollection();
  });

  reset.click(() => {
    resetFilters();
  });

  stats.click(() => {
    printStats();
  });

  fllt.appendTo(fll);
  fllb.appendTo(fll);
  flrt.appendTo(flr);
  flrb.appendTo(flr);
  fll.appendTo(basicFilters);
  flr.appendTo(basicFilters);

  // "ADVANCED" FILTERS
  var filters = $('<div class="inventory_filters"></div>');

  let flex = $('<div class="inventory_flex_half"></div>');

  icd = $(
    '<div style="padding-bottom: 8px;" class="input_container_inventory"></div>'
  );
  label = $('<label style="display: table">Type line</label>');
  label.appendTo(icd);
  var typeInput = $(
    '<input type="search" id="query_type" autocomplete="off" />'
  );
  typeInput.appendTo(icd);
  icd.appendTo(flex);
  flex.appendTo(filters);

  var sets = $('<div class="sets_container"></div>');
  orderedSets.forEach(set => {
    let setbutton = $(
      '<div class="set_filter set_filter_on" style="background-image: url(../images/sets/' +
        setsList[set].code +
        '.png)" title="' +
        set +
        '"></div>'
    );
    setbutton.appendTo(sets);
    setbutton.click(function() {
      if (setbutton.hasClass("set_filter_on")) {
        setbutton.removeClass("set_filter_on");
        filteredSets.push(set);
      } else {
        setbutton.addClass("set_filter_on");
        let n = filteredSets.indexOf(set);
        if (n > -1) {
          filteredSets.splice(n, 1);
        }
      }
    });
  });
  sets.appendTo(filters);

  var manas = $('<div class="sets_container"></div>');
  var ms = ["w", "u", "b", "r", "g"];
  ms.forEach(function(s, i) {
    var mi = [1, 2, 3, 4, 5];
    var manabutton = $(
      '<div class="mana_filter_search mana_filter_on" style="background-image: url(../images/' +
        s +
        '64.png)"></div>'
    );
    manabutton.appendTo(manas);
    manabutton.click(function() {
      if (manabutton.hasClass("mana_filter_on")) {
        manabutton.removeClass("mana_filter_on");
        filteredMana.push(mi[i]);
      } else {
        manabutton.addClass("mana_filter_on");
        let n = filteredMana.indexOf(mi[i]);
        if (n > -1) {
          filteredMana.splice(n, 1);
        }
      }
    });
  });
  manas.appendTo(filters);

  let main_but_cont = $('<div class="main_buttons_container"></div>');

  var cont = $('<div class="buttons_container"></div>');
  addCheckboxSearch(
    cont,
    '<div class="icon_search_unowned"></div>Show unowned',
    "query_unown",
    false
  );
  addCheckboxSearch(
    cont,
    '<div class="icon_search_new"></div>Newly acquired only',
    "query_new",
    false
  );
  addCheckboxSearch(
    cont,
    '<div class="icon_search_multi"></div>Require multicolored',
    "query_multicolor",
    false
  );
  addCheckboxSearch(cont, "Exclude unselected colors", "query_exclude", false);
  cont.appendTo(main_but_cont);

  cont = $('<div class="buttons_container"></div>');
  addCheckboxSearch(
    cont,
    '<div class="wc_common wc_search_icon"></div>Common',
    "query_common",
    true
  );
  addCheckboxSearch(
    cont,
    '<div class="wc_uncommon wc_search_icon"></div>Uncommon',
    "query_uncommon",
    true
  );
  addCheckboxSearch(
    cont,
    '<div class="wc_rare wc_search_icon"></div>Rare',
    "query_rare",
    true
  );
  addCheckboxSearch(
    cont,
    '<div class="wc_mythic wc_search_icon"></div>Mythic Rare',
    "query_mythic",
    true
  );
  cont.appendTo(main_but_cont);

  cont = $('<div class="buttons_container"></div>');

  icd = $('<div class="input_container_inventory auto_width"></div>');
  label = $('<label style="display: table">CMC:</label>');
  label.appendTo(icd);
  input = $(
    '<input style="max-width: 80px;" type="number" id="query_cmc" autocomplete="off" />'
  );
  input.appendTo(icd);
  icd.appendTo(cont);

  addCheckboxSearch(cont, "Higher than", "query_cmchigher", false, true);
  addCheckboxSearch(cont, "Equal to", "query_cmcequal", true);
  addCheckboxSearch(cont, "Lower than", "query_cmclower", false, true);

  cont.appendTo(main_but_cont);
  main_but_cont.appendTo(filters);

  searchButton = $(
    '<div style="margin: 24px auto !important;" class="button_simple button_thin">Search</div>'
  );
  searchButton.appendTo(filters);

  searchButton.click(() => {
    printCards();
  });

  $("#ux_0").append(basicFilters);
  $("#ux_0").append(filters);
  $("#ux_0").append(div);

  $("#query_cmclower").change(function() {
    if (document.getElementById("query_cmclower").checked == true) {
      document.getElementById("query_cmchigher").checked = false;
    }
  });

  $("#query_cmchigher").change(function() {
    if (document.getElementById("query_cmchigher").checked == true) {
      document.getElementById("query_cmclower").checked = false;
    }
  });

  //let filterCmcLower 	= document.getElementById("query_cmclower");
  //let filterCmcEqual 	= document.getElementById("query_cmcequal");
  //let filterCmcHigher = document.getElementById("query_cmchigher");

  printCards();
}

//
function addCheckboxSearch(div, label, iid, def, toggle = false) {
  label = $('<label class="check_container hover_label">' + label + "</label>");
  var check_new = $('<input type="checkbox" id="' + iid + '" />');
  check_new.appendTo(label);
  check_new.prop("checked", def);

  var span = $('<span class="checkmark"></span>');
  if (toggle) span.css("border-radius", "100%");
  span.appendTo(label);
  label.appendTo(div);
}

function expandFilters() {
  var div = $(".inventory_filters");
  if (div.css("opacity") == 1) {
    div.css("height", "0px");
    div.css("opacity", 0);
    $(".inventory").show();
  } else {
    div.css("height", "calc(100% - 122px)");
    div.css("opacity", 1);
    setTimeout(function() {
      $(".inventory").hide();
    }, 200);
  }
}

function resetFilters() {
  filteredSets = [];
  filteredMana = [];

  $(".set_filter").each(function() {
    $(this).removeClass("set_filter_on");
    $(this).addClass("set_filter_on");
  });
  $(".mana_filter").each(function() {
    $(this).removeClass("mana_filter_on");
    $(this).addClass("mana_filter_on");
  });

  document.getElementById("query_name").value = "";
  document.getElementById("query_type").value = "";
  document.getElementById("query_unown").checked = false;
  document.getElementById("query_new").checked = false;
  document.getElementById("query_multicolor").checked = false;
  document.getElementById("query_exclude").checked = false;

  document.getElementById("query_common").checked = true;
  document.getElementById("query_uncommon").checked = true;
  document.getElementById("query_rare").checked = true;
  document.getElementById("query_mythic").checked = true;

  document.getElementById("query_cmc").value = "";
  document.getElementById("query_cmclower").checked = false;
  document.getElementById("query_cmcequal").checked = true;
  document.getElementById("query_cmchigher").checked = false;

  printCards();
}

//
/* eslint-disable */
function exportCollection() {
  var list = get_collection_export();
  ipc_send("export_csvtxt", { str: list, name: "collection" });
}

//
function printStats() {
  $(".moving_ux").animate({ left: "-100%" }, 250, "easeInOutCubic");
  $("#ux_1").html("");
  const stats = get_collection_stats();

  const top = $(
    '<div class="decklist_top"><div class="button back"></div><div class="deck_name">Collection Statistics</div><div class="deck_top_colors"></div></div>'
  );
  change_background("", 67574);

  const flex = $('<div class="flex_item"></div>');
  const mainstats = $('<div class="main_stats"></div>');

  $("<label>Sets Completion</label>").appendTo(mainstats);

  // each set stats
  orderedSets.forEach(set => {
    renderSetStats(stats[set], setsList[set].code, set).appendTo(mainstats);
  });

  // Complete collection sats
  renderSetStats(stats.complete, "PW", "Complete collection").appendTo(
    mainstats
  );

  // Singleton collection sats
  renderSetStats(stats.singles, "PW", "Singles").appendTo(mainstats);

  const substats = $('<div class="main_stats sub_stats"></div>');

  flex.append(mainstats);
  flex.append(substats);

  $("#ux_1").append(top);
  $("#ux_1").append(flex);
  //
  $(".back").click(function() {
    change_background("default");
    $(".moving_ux").animate({ left: "0px" }, 250, "easeInOutCubic");
  });
}
/* eslint-enable */

//
function renderSetStats(setStats, setIconCode, setName) {
  const setDiv = renderCompletionDiv(
    setStats.all,
    "sets/" + setIconCode + ".png",
    setName
  );

  setDiv.click(function() {
    const substats = $(".sub_stats");
    substats.html("");
    $("<label>" + setName + " completion</label>").appendTo(substats);
    ["common", "uncommon", "rare", "mythic"].forEach(rarity => {
      const countStats = setStats[rarity];
      if (countStats.total > 0) {
        const capitalizedRarity =
          rarity[0].toUpperCase() + rarity.slice(1) + "s";
        renderCompletionDiv(
          countStats,
          "wc_" + rarity + ".png",
          capitalizedRarity
        ).appendTo(substats);
      }
    });
  });

  return setDiv;
}

//
function renderCompletionDiv(countStats, image, title) {
  const completionDiv = $('<div class="stats_set_completion"></div>');
  $(
    '<div class="stats_set_icon" style="background-image: url(../images/' +
      image +
      ')"><span>' +
      title +
      " <i>(" +
      countStats.owned +
      "/" +
      countStats.total +
      ", " +
      Math.round(countStats.percentage) +
      "%)</i></span></div>"
  ).appendTo(completionDiv);
  $(
    '<div class="stats_set_bar" style="width: ' +
      countStats.percentage +
      '%"></div>'
  ).appendTo(completionDiv);
  return completionDiv;
}

function sortCollection(alg) {
  sortingAlgorithm = alg;
  printCards();
}

//
function printCards() {
  var div = $(".inventory_filters");
  div.css("height", "0px");
  div.css("opacity", 0);
  $(".inventory").show();

  div = $(".inventory");
  div.html("");

  var paging = $('<div class="paging_container"></div>');
  div.append(paging);

  let filterName = document.getElementById("query_name").value.toLowerCase();
  let filterType = document.getElementById("query_type").value.toLowerCase();
  let filterUnown = document.getElementById("query_unown").checked;
  let filterNew = document.getElementById("query_new");
  let filterMulti = document.getElementById("query_multicolor");
  let filterExclude = document.getElementById("query_exclude");

  let filterCommon = document.getElementById("query_common");
  let filterUncommon = document.getElementById("query_uncommon");
  let filterRare = document.getElementById("query_rare");
  let filterMythic = document.getElementById("query_mythic");

  let filterCMC = document.getElementById("query_cmc").value;
  let filterCmcLower = document.getElementById("query_cmclower").checked;
  let filterCmcEqual = document.getElementById("query_cmcequal").checked;
  let filterCmcHigher = document.getElementById("query_cmchigher").checked;

  var totalCards = 0;
  var list;
  if (filterUnown) {
    list = cardsDb.getAll();
    delete list.abilities;
    delete list.events;
    delete list.events_format;
    delete list.sets;
    delete list.ranked_events;
    delete list.ok;
  } else {
    list = cards;
  }

  var keysSorted;
  if (sortingAlgorithm == "Set")
    keysSorted = Object.keys(list).sort(collectionSortSet);
  if (sortingAlgorithm == "Name")
    keysSorted = Object.keys(list).sort(collectionSortName);
  if (sortingAlgorithm == "Rarity")
    keysSorted = Object.keys(list).sort(collectionSortRarity);
  if (sortingAlgorithm == "CMC")
    keysSorted = Object.keys(list).sort(collectionSortCmc);

  for (n = 0; n < keysSorted.length; n++) {
    let key = keysSorted[n];

    let grpId = key;
    let card = cardsDb.get(grpId);
    let doDraw = true;

    let name = card.name.toLowerCase();
    let type = card.type.toLowerCase();
    let rarity = card.rarity;
    let cost = card.cost;
    let cmc = card.cmc;
    let set = card.set;

    if (card.images == undefined) continue;
    if (!card.collectible) continue;

    // Filter name
    var arr;
    arr = filterName.split(" ");
    arr.forEach(function(s) {
      if (name.indexOf(s) == -1) {
        doDraw = false;
      }
    });

    // filter type
    arr = filterType.split(" ");
    arr.forEach(function(s) {
      if (type.indexOf(s) == -1) {
        doDraw = false;
      }
    });

    if (filterNew.checked && cardsNew[key] == undefined) {
      doDraw = false;
    }

    if (filteredSets.length > 0) {
      if (!filteredSets.includes(set)) {
        doDraw = false;
      }
    }

    if (filterCMC && doDraw) {
      if (filterCmcLower && filterCmcEqual) {
        if (cmc > filterCMC) {
          doDraw = false;
        }
      } else if (filterCmcHigher && filterCmcEqual) {
        if (cmc < filterCMC) {
          doDraw = false;
        }
      } else if (filterCmcLower && !filterCmcEqual) {
        if (cmc >= filterCMC) {
          doDraw = false;
        }
      } else if (filterCmcHigher && !filterCmcEqual) {
        if (cmc <= filterCMC) {
          doDraw = false;
        }
      } else if (!filterCmcHigher && !filterCmcLower && filterCmcEqual) {
        if (cmc != filterCMC) {
          doDraw = false;
        }
      }
    }

    switch (rarity) {
      case "land":
        if (!filterCommon.checked) doDraw = false;
        break;
      case "common":
        if (!filterCommon.checked) doDraw = false;
        break;
      case "uncommon":
        if (!filterUncommon.checked) doDraw = false;
        break;
      case "rare":
        if (!filterRare.checked) doDraw = false;
        break;
      case "mythic":
        if (!filterMythic.checked) doDraw = false;
        break;
      default:
        doDraw = false;
        break;
    }

    if (filterExclude.checked && cost.length == 0) {
      doDraw = false;
    } else {
      let s = [];
      let generic = false;
      cost.forEach(function(m) {
        if (m.indexOf("w") !== -1) {
          if (filterExclude.checked && !filteredMana.includes(1)) {
            doDraw = false;
          }
          s[1] = 1;
        }
        if (m.indexOf("u") !== -1) {
          if (filterExclude.checked && !filteredMana.includes(2)) {
            doDraw = false;
          }
          s[2] = 1;
        }
        if (m.indexOf("b") !== -1) {
          if (filterExclude.checked && !filteredMana.includes(3)) {
            doDraw = false;
          }
          s[3] = 1;
        }
        if (m.indexOf("r") !== -1) {
          if (filterExclude.checked && !filteredMana.includes(4)) {
            doDraw = false;
          }
          s[4] = 1;
        }
        if (m.indexOf("g") !== -1) {
          if (filterExclude.checked && !filteredMana.includes(5)) {
            doDraw = false;
          }
          s[5] = 1;
        }
        if (parseInt(m) > 0) {
          generic = true;
        }
        /*
				if (m.color < 6 && m.color > 0) {
					s[m.color] = 1;
					if (filterExclude.checked && !filteredMana.includes(m.color)) {
						doDraw = false;
					}
				}
				if (m.color > 6) {
					generic = true;
				}
				*/
      });
      let ms = s.reduce((a, b) => a + b, 0);
      if (generic && ms == 0 && filterExclude.checked) {
        doDraw = false;
      }
      if (filteredMana.length > 0) {
        let su = 0;
        filteredMana.forEach(function(m) {
          if (s[m] == 1) {
            su++;
          }
        });
        if (su == 0) {
          doDraw = false;
        }
      }
      if (filterMulti.checked && ms < 2) {
        doDraw = false;
      }
    }

    if (doDraw) {
      totalCards++;
    }

    if (
      totalCards < collectionPage * 100 ||
      totalCards > collectionPage * 100 + 99
    ) {
      doDraw = false;
    }

    let dfc = "";
    /*
		if (card.dfc == 'DFC_Back')	 dfc = 'a';
		if (card.dfc == 'DFC_Front') dfc = 'b';
		if (card.dfc == 'SplitHalf') {
			dfc = 'a';
			if (card.dfcId != 0)	dfc = 'b';
		}
		if (dfc == 'b') {
			doDraw = false;
		}
		*/

    if (doDraw) {
      var d = $(
        '<div style="width: ' +
          cardSize +
          'px !important;" class="inventory_card"></div>'
      );

      //if (i < owned) color = "green";
      //if () color = "orange";

      let owned = cards[card.id];
      let aquired = cardsNew[card.id];
      for (let i = 0; i < 4; i++) {
        if (aquired && i >= owned - aquired && i < owned) {
          $(
            '<div style="width: ' +
              cardSize / 4 +
              'px;" class="inventory_card_quantity_orange"></div>'
          ).appendTo(d);
        } else if (i < owned) {
          $(
            '<div style="width: ' +
              cardSize / 4 +
              'px;" class="inventory_card_quantity_green"></div>'
          ).appendTo(d);
        } else {
          $(
            '<div style="width: ' +
              cardSize / 4 +
              'px;" class="inventory_card_quantity_gray"></div>'
          ).appendTo(d);
        }
      }

      var img = $(
        '<img style="width: ' +
          cardSize +
          'px !important;" class="inventory_card_img"></img>'
      );
      img.attr("src", get_card_image(card));
      img.appendTo(d);

      addCardHover(img, card);

      img.on("click", function() {
        if (cardsDb.get(grpId).dfc == "SplitHalf") {
          card = cardsDb.get(card.dfcId);
        }
        //let newname = card.name.split(' ').join('-');
        shell.openExternal(
          "https://scryfall.com/card/" +
            get_set_scryfall(card.set) +
            "/" +
            card.cid +
            "/" +
            card.name
        );
      });

      d.appendTo(div);
    }
  }

  var paging_bottom = $('<div class="paging_container"></div>');
  div.append(paging_bottom);
  var but;
  if (collectionPage <= 0) {
    but = $('<div class="paging_button_disabled"> < </div>');
  } else {
    but = $('<div class="paging_button"> < </div>');

    but.click(() => {
      setCollectionPage(collectionPage - 1);
    });
  }

  paging.append(but);
  paging_bottom.append(but.clone(true));

  var totalPages = Math.ceil(totalCards / 100);
  for (var n = 0; n < totalPages; n++) {
    but = $('<div class="paging_button">' + n + "</div>");
    if (collectionPage == n) {
      but.addClass("paging_active");
    }

    but.click({ n: n }, e => {
      setCollectionPage(e.data.n);
    });

    paging.append(but);
    paging_bottom.append(but.clone(true));
  }
  if (collectionPage >= totalPages - 1) {
    but = $('<div class="paging_button_disabled"> > </div>');
  } else {
    but = $('<div class="paging_button"> > </div>');
    but.click(() => {
      setCollectionPage(collectionPage + 1);
    });
  }
  paging.append(but);
  paging_bottom.append(but.clone(true));
}

//
/* eslint-disable */
function setCollectionPage(page) {
  collectionPage = page;
  printCards();
}
/* eslint-enable */

module.exports = {
  openCollectionTab: openCollectionTab
};
