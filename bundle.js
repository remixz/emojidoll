(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
;(function() {

function emoji(){}
    // settings
    emoji.img_path = '//d1973c4qjhao9m.cloudfront.net/unicode/';
    emoji.sheet_path = 'sheet_64.png';

    emoji.use_css_imgs = false;
    emoji.colons_mode = false;
    emoji.text_mode = false;
    emoji.include_title = false;
    emoji.allow_native = true;
    emoji.use_sheet = false;

    emoji.inits = {};
    emoji.map = {};

    emoji.replace_emoticons = function(str){
        emoji.init_emoticons();
        return str.replace(emoji.rx_emoticons, function(m, $1, $2){
            var val = emoji.map.emoticons[$2];
            return val ? $1+emoji.replacement(val, $2) : m;
        });
    };
    emoji.replace_emoticons_with_colons = function(str){
        emoji.init_emoticons();
        return str.replace(emoji.rx_emoticons, function(m, $1, $2){
            var val = emoji.data[emoji.map.emoticons[$2]][3][0];
            return val ? $1+':'+val+':' : m;
        });
    };
    emoji.replace_colons = function(str){
        emoji.init_colons();
        return str.replace(emoji.rx_colons, function(m){
            var idx = m.substr(1, m.length-2);
            var val = emoji.map.colons[idx];
            return val ? emoji.replacement(val, idx, ':') : m;
        });
    };
    emoji.replace_unified = function(str){
        emoji.init_unified();
        return str.replace(emoji.rx_unified, function(m){
            var val = emoji.map.unified[m];
            return val ? emoji.replacement(val) + ' ' : m + ' ';
        });
    };

    emoji.replacement = function(idx, actual, wrapper){
        wrapper = wrapper || '';
        if (emoji.colons_mode) return ':'+emoji.data[idx][3][0]+':';
        var text_name = (actual) ? wrapper+actual+wrapper : emoji.data[idx][6] || wrapper+emoji.data[idx][3][0]+wrapper;
        if (emoji.text_mode) return text_name;
        emoji.init_env();
        if (emoji.just_unified && emoji.data[idx][0][0]) return emoji.data[idx][0][0];
        if (emoji.replace_mode == 'unified'  && emoji.allow_native && emoji.data[idx][0][0]) return '<span class="emoji-sizer">' + emoji.data[idx][0][0] + '</span>';
        if (emoji.replace_mode == 'softbank' && emoji.allow_native && emoji.data[idx][1]) return '<span class="emoji-sizer">' + emoji.data[idx][1] + '</span>';
        if (emoji.replace_mode == 'google'   && emoji.allow_native && emoji.data[idx][2]) return '<span class="emoji-sizer">' + emoji.data[idx][2] + '</span>';
        var img = emoji.data[idx][7] || emoji.img_path+idx+'.png';
        var title = emoji.include_title ? ' title="'+(actual || emoji.data[idx][3][0])+'"' : '';
        var text  = emoji.include_text  ? wrapper+(actual || emoji.data[idx][3][0])+wrapper : '';
        if (emoji.supports_css) {
            var px = emoji.data[idx][4];
            var py = emoji.data[idx][5];
            if (emoji.use_sheet && px != null && py != null){
                var mul = 100 / (emoji.sheet_size - 1);
                var style = 'background: url('+emoji.sheet_path+');background-position:'+(mul*px)+'% '+(mul*py)+'%;background-size:'+emoji.sheet_size+'00%';
                return '<span class="emoji-outer emoji-sizer"><span class="emoji-inner" style="'+style+'"'+title+'>'+text+'</span></span>';
            }else if (emoji.use_css_imgs){
                return '<span class="emoji emoji-'+idx+'"'+title+'>'+text+'</span>';
            }else{
                return '<span class="emoji emoji-sizer" style="background-image:url('+img+')"'+title+'>'+text+'</span>';
            }
        }
        return '<img src="'+img+'" class="emoji" '+title+'/>';
    };

    emoji.init_emoticons = function(){
        if (emoji.inits.emoticons) return;
        emoji.init_colons(); // we require this for the emoticons map
        emoji.inits.emoticons = 1;
        
        var a = [];
        emoji.map.emoticons = {};
        for (var i in emoji.emoticons_data){
            // because we never see some characters in our text except as entities, we must do some replacing
            var emoticon = i.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
            
            if (!emoji.map.colons[emoji.emoticons_data[i]]) continue;

            emoji.map.emoticons[emoticon] = emoji.map.colons[emoji.emoticons_data[i]];
            a.push(emoji.escape_rx(emoticon));
        }
        emoji.rx_emoticons = new RegExp(('(^|\\s)('+a.join('|')+')(?=$|[\\s|\\?\\.,!])'), 'g');
    };
    emoji.init_colons = function(){
        if (emoji.inits.colons) return;
        emoji.inits.colons = 1;
        emoji.rx_colons = new RegExp('\:[^\\s:]+\:', 'g');
        emoji.map.colons = {};
        for (var i in emoji.data){
            for (var j=0; j<emoji.data[i][3].length; j++){
                emoji.map.colons[emoji.data[i][3][j]] = i;
            }
        }
    };
    emoji.init_unified = function(){
        if (emoji.inits.unified) return;
        emoji.inits.unified = 1;

        var a = [];
        emoji.map.unified = {};

        for (var i in emoji.data){
            for (var j=0; j<emoji.data[i][0].length; j++){
                a.push(emoji.data[i][0][j]);
                emoji.map.unified[emoji.data[i][0][j]] = i;
            }
        }

        emoji.rx_unified = new RegExp('('+a.join('|')+')', "g");
    };
    emoji.init_env = function(){
        if (emoji.inits.env) return;
        emoji.inits.env = 1;
        emoji.replace_mode = 'img';
        emoji.supports_css = false;
        var ua = navigator.userAgent;
        if (window.getComputedStyle){
            var st = window.getComputedStyle(document.body);
            if (st['background-size'] || st['backgroundSize']){
                emoji.supports_css = true;
            }
        }
        if (ua.match(/(iPhone|iPod|iPad|iPhone\s+Simulator)/i)){
            if (ua.match(/OS\s+[12345]/i)){
                emoji.replace_mode = 'softbank';
                return;
            }
            if (ua.match(/OS\s+[6789]/i)){
                emoji.replace_mode = 'unified';
                return;
            }
        }
        if (ua.match(/Mac OS X 10[._ ][789]/i)){
            if (!ua.match(/Chrome/i)){
                emoji.replace_mode = 'unified';
                return;
            }
        }
        // Need a better way to detect android devices that actually
        // support emoji.
        if (false && ua.match(/Android/i)){
            emoji.replace_mode = 'google';
            return;
        }
        if (emoji.supports_css){
            emoji.replace_mode = 'css';
        }
        // nothing fancy detected - use images
    };
    emoji.escape_rx = function(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };
    emoji.sheet_size = 30;
    emoji.data = {
        "00a9":[["\u00A9"],"\uE24E","\uDBBA\uDF29",["copyright"],0,0],
        "00ae":[["\u00AE"],"\uE24F","\uDBBA\uDF2D",["registered"],0,1],
        "203c":[["\u203C\uFE0F","\u203C"],"","\uDBBA\uDF06",["bangbang"],0,2],
        "2049":[["\u2049\uFE0F","\u2049"],"","\uDBBA\uDF05",["interrobang"],0,3],
        "2122":[["\u2122"],"\uE537","\uDBBA\uDF2A",["tm"],0,4],
        "2139":[["\u2139\uFE0F","\u2139"],"","\uDBBA\uDF47",["information_source"],0,5],
        "2194":[["\u2194\uFE0F","\u2194"],"","\uDBBA\uDEF6",["left_right_arrow"],0,6],
        "2195":[["\u2195\uFE0F","\u2195"],"","\uDBBA\uDEF7",["arrow_up_down"],0,7],
        "2196":[["\u2196\uFE0F","\u2196"],"\uE237","\uDBBA\uDEF2",["arrow_upper_left"],0,8],
        "2197":[["\u2197\uFE0F","\u2197"],"\uE236","\uDBBA\uDEF0",["arrow_upper_right"],0,9],
        "2198":[["\u2198\uFE0F","\u2198"],"\uE238","\uDBBA\uDEF1",["arrow_lower_right"],0,10],
        "2199":[["\u2199\uFE0F","\u2199"],"\uE239","\uDBBA\uDEF3",["arrow_lower_left"],0,11],
        "21a9":[["\u21A9\uFE0F","\u21A9"],"","\uDBBA\uDF83",["leftwards_arrow_with_hook"],0,12],
        "21aa":[["\u21AA\uFE0F","\u21AA"],"","\uDBBA\uDF88",["arrow_right_hook"],0,13],
        "231a":[["\u231A\uFE0F","\u231A"],"","\uDBB8\uDC1D",["watch"],0,14],
        "231b":[["\u231B\uFE0F","\u231B"],"","\uDBB8\uDC1C",["hourglass"],0,15],
        "23e9":[["\u23E9"],"\uE23C","\uDBBA\uDEFE",["fast_forward"],0,16],
        "23ea":[["\u23EA"],"\uE23D","\uDBBA\uDEFF",["rewind"],0,17],
        "23eb":[["\u23EB"],"","\uDBBA\uDF03",["arrow_double_up"],0,18],
        "23ec":[["\u23EC"],"","\uDBBA\uDF02",["arrow_double_down"],0,19],
        "23f0":[["\u23F0"],"\uE02D","\uDBB8\uDC2A",["alarm_clock"],0,20],
        "23f3":[["\u23F3"],"","\uDBB8\uDC1B",["hourglass_flowing_sand"],0,21],
        "24c2":[["\u24C2\uFE0F","\u24C2"],"\uE434","\uDBB9\uDFE1",["m"],0,22],
        "25aa":[["\u25AA\uFE0F","\u25AA"],"\uE21A","\uDBBA\uDF6E",["black_small_square"],0,23],
        "25ab":[["\u25AB\uFE0F","\u25AB"],"\uE21B","\uDBBA\uDF6D",["white_small_square"],0,24],
        "25b6":[["\u25B6\uFE0F","\u25B6"],"\uE23A","\uDBBA\uDEFC",["arrow_forward"],0,25],
        "25c0":[["\u25C0\uFE0F","\u25C0"],"\uE23B","\uDBBA\uDEFD",["arrow_backward"],0,26],
        "25fb":[["\u25FB\uFE0F","\u25FB"],"\uE21B","\uDBBA\uDF71",["white_medium_square"],0,27],
        "25fc":[["\u25FC\uFE0F","\u25FC"],"\uE21A","\uDBBA\uDF72",["black_medium_square"],0,28],
        "25fd":[["\u25FD\uFE0F","\u25FD"],"\uE21B","\uDBBA\uDF6F",["white_medium_small_square"],0,29],
        "25fe":[["\u25FE\uFE0F","\u25FE"],"\uE21A","\uDBBA\uDF70",["black_medium_small_square"],1,0],
        "2600":[["\u2600\uFE0F","\u2600"],"\uE04A","\uDBB8\uDC00",["sunny"],1,1],
        "2601":[["\u2601\uFE0F","\u2601"],"\uE049","\uDBB8\uDC01",["cloud"],1,2],
        "260e":[["\u260E\uFE0F","\u260E"],"\uE009","\uDBB9\uDD23",["phone","telephone"],1,3],
        "2611":[["\u2611\uFE0F","\u2611"],"","\uDBBA\uDF8B",["ballot_box_with_check"],1,4],
        "2614":[["\u2614\uFE0F","\u2614"],"\uE04B","\uDBB8\uDC02",["umbrella"],1,5],
        "2615":[["\u2615\uFE0F","\u2615"],"\uE045","\uDBBA\uDD81",["coffee"],1,6],
        "261d":[["\u261D\uFE0F","\u261D"],"\uE00F","\uDBBA\uDF98",["point_up"],1,7],
        "263a":[["\u263A\uFE0F","\u263A"],"\uE414","\uDBB8\uDF36",["relaxed"],1,8],
        "2648":[["\u2648\uFE0F","\u2648"],"\uE23F","\uDBB8\uDC2B",["aries"],1,9],
        "2649":[["\u2649\uFE0F","\u2649"],"\uE240","\uDBB8\uDC2C",["taurus"],1,10],
        "264a":[["\u264A\uFE0F","\u264A"],"\uE241","\uDBB8\uDC2D",["gemini"],1,11],
        "264b":[["\u264B\uFE0F","\u264B"],"\uE242","\uDBB8\uDC2E",["cancer"],1,12],
        "264c":[["\u264C\uFE0F","\u264C"],"\uE243","\uDBB8\uDC2F",["leo"],1,13],
        "264d":[["\u264D\uFE0F","\u264D"],"\uE244","\uDBB8\uDC30",["virgo"],1,14],
        "264e":[["\u264E\uFE0F","\u264E"],"\uE245","\uDBB8\uDC31",["libra"],1,15],
        "264f":[["\u264F\uFE0F","\u264F"],"\uE246","\uDBB8\uDC32",["scorpius"],1,16],
        "2650":[["\u2650\uFE0F","\u2650"],"\uE247","\uDBB8\uDC33",["sagittarius"],1,17],
        "2651":[["\u2651\uFE0F","\u2651"],"\uE248","\uDBB8\uDC34",["capricorn"],1,18],
        "2652":[["\u2652\uFE0F","\u2652"],"\uE249","\uDBB8\uDC35",["aquarius"],1,19],
        "2653":[["\u2653\uFE0F","\u2653"],"\uE24A","\uDBB8\uDC36",["pisces"],1,20],
        "2660":[["\u2660\uFE0F","\u2660"],"\uE20E","\uDBBA\uDF1B",["spades"],1,21],
        "2663":[["\u2663\uFE0F","\u2663"],"\uE20F","\uDBBA\uDF1D",["clubs"],1,22],
        "2665":[["\u2665\uFE0F","\u2665"],"\uE20C","\uDBBA\uDF1A",["hearts"],1,23],
        "2666":[["\u2666\uFE0F","\u2666"],"\uE20D","\uDBBA\uDF1C",["diamonds"],1,24],
        "2668":[["\u2668\uFE0F","\u2668"],"\uE123","\uDBB9\uDFFA",["hotsprings"],1,25],
        "267b":[["\u267B\uFE0F","\u267B"],"","\uDBBA\uDF2C",["recycle"],1,26],
        "267f":[["\u267F\uFE0F","\u267F"],"\uE20A","\uDBBA\uDF20",["wheelchair"],1,27],
        "2693":[["\u2693\uFE0F","\u2693"],"\uE202","\uDBB9\uDCC1",["anchor"],1,28],
        "26a0":[["\u26A0\uFE0F","\u26A0"],"\uE252","\uDBBA\uDF23",["warning"],1,29],
        "26a1":[["\u26A1\uFE0F","\u26A1"],"\uE13D","\uDBB8\uDC04",["zap"],2,0],
        "26aa":[["\u26AA\uFE0F","\u26AA"],"\uE219","\uDBBA\uDF65",["white_circle"],2,1],
        "26ab":[["\u26AB\uFE0F","\u26AB"],"\uE219","\uDBBA\uDF66",["black_circle"],2,2],
        "26bd":[["\u26BD\uFE0F","\u26BD"],"\uE018","\uDBB9\uDFD4",["soccer"],2,3],
        "26be":[["\u26BE\uFE0F","\u26BE"],"\uE016","\uDBB9\uDFD1",["baseball"],2,4],
        "26c4":[["\u26C4\uFE0F","\u26C4"],"\uE048","\uDBB8\uDC03",["snowman"],2,5],
        "26c5":[["\u26C5\uFE0F","\u26C5"],"\uE04A\uE049","\uDBB8\uDC0F",["partly_sunny"],2,6],
        "26ce":[["\u26CE"],"\uE24B","\uDBB8\uDC37",["ophiuchus"],2,7],
        "26d4":[["\u26D4\uFE0F","\u26D4"],"\uE137","\uDBBA\uDF26",["no_entry"],2,8],
        "26ea":[["\u26EA\uFE0F","\u26EA"],"\uE037","\uDBB9\uDCBB",["church"],2,9],
        "26f2":[["\u26F2\uFE0F","\u26F2"],"\uE121","\uDBB9\uDCBC",["fountain"],2,10],
        "26f3":[["\u26F3\uFE0F","\u26F3"],"\uE014","\uDBB9\uDFD2",["golf"],2,11],
        "26f5":[["\u26F5\uFE0F","\u26F5"],"\uE01C","\uDBB9\uDFEA",["boat","sailboat"],2,12],
        "26fa":[["\u26FA\uFE0F","\u26FA"],"\uE122","\uDBB9\uDFFB",["tent"],2,13],
        "26fd":[["\u26FD\uFE0F","\u26FD"],"\uE03A","\uDBB9\uDFF5",["fuelpump"],2,14],
        "2702":[["\u2702\uFE0F","\u2702"],"\uE313","\uDBB9\uDD3E",["scissors"],2,15],
        "2705":[["\u2705"],"","\uDBBA\uDF4A",["white_check_mark"],2,16],
        "2708":[["\u2708\uFE0F","\u2708"],"\uE01D","\uDBB9\uDFE9",["airplane"],2,17],
        "2709":[["\u2709\uFE0F","\u2709"],"\uE103","\uDBB9\uDD29",["email","envelope"],2,18],
        "270a":[["\u270A"],"\uE010","\uDBBA\uDF93",["fist"],2,19],
        "270b":[["\u270B"],"\uE012","\uDBBA\uDF95",["hand","raised_hand"],2,20],
        "270c":[["\u270C\uFE0F","\u270C"],"\uE011","\uDBBA\uDF94",["v"],2,21],
        "270f":[["\u270F\uFE0F","\u270F"],"\uE301","\uDBB9\uDD39",["pencil2"],2,22],
        "2712":[["\u2712\uFE0F","\u2712"],"","\uDBB9\uDD36",["black_nib"],2,23],
        "2714":[["\u2714\uFE0F","\u2714"],"","\uDBBA\uDF49",["heavy_check_mark"],2,24],
        "2716":[["\u2716\uFE0F","\u2716"],"\uE333","\uDBBA\uDF53",["heavy_multiplication_x"],2,25],
        "2728":[["\u2728"],"\uE32E","\uDBBA\uDF60",["sparkles"],2,26],
        "2733":[["\u2733\uFE0F","\u2733"],"\uE206","\uDBBA\uDF62",["eight_spoked_asterisk"],2,27],
        "2734":[["\u2734\uFE0F","\u2734"],"\uE205","\uDBBA\uDF61",["eight_pointed_black_star"],2,28],
        "2744":[["\u2744\uFE0F","\u2744"],"","\uDBB8\uDC0E",["snowflake"],2,29],
        "2747":[["\u2747\uFE0F","\u2747"],"\uE32E","\uDBBA\uDF77",["sparkle"],3,0],
        "274c":[["\u274C"],"\uE333","\uDBBA\uDF45",["x"],3,1],
        "274e":[["\u274E"],"\uE333","\uDBBA\uDF46",["negative_squared_cross_mark"],3,2],
        "2753":[["\u2753"],"\uE020","\uDBBA\uDF09",["question"],3,3],
        "2754":[["\u2754"],"\uE336","\uDBBA\uDF0A",["grey_question"],3,4],
        "2755":[["\u2755"],"\uE337","\uDBBA\uDF0B",["grey_exclamation"],3,5],
        "2757":[["\u2757\uFE0F","\u2757"],"\uE021","\uDBBA\uDF04",["exclamation","heavy_exclamation_mark"],3,6],
        "2764":[["\u2764\uFE0F","\u2764"],"\uE022","\uDBBA\uDF0C",["heart"],3,7,"<3"],
        "2795":[["\u2795"],"","\uDBBA\uDF51",["heavy_plus_sign"],3,8],
        "2796":[["\u2796"],"","\uDBBA\uDF52",["heavy_minus_sign"],3,9],
        "2797":[["\u2797"],"","\uDBBA\uDF54",["heavy_division_sign"],3,10],
        "27a1":[["\u27A1\uFE0F","\u27A1"],"\uE234","\uDBBA\uDEFA",["arrow_right"],3,11],
        "27b0":[["\u27B0"],"","\uDBBA\uDF08",["curly_loop"],3,12],
        "27bf":[["\u27BF"],"\uE211","\uDBBA\uDC2B",["loop"],3,13],
        "2934":[["\u2934\uFE0F","\u2934"],"\uE236","\uDBBA\uDEF4",["arrow_heading_up"],3,14],
        "2935":[["\u2935\uFE0F","\u2935"],"\uE238","\uDBBA\uDEF5",["arrow_heading_down"],3,15],
        "2b05":[["\u2B05\uFE0F","\u2B05"],"\uE235","\uDBBA\uDEFB",["arrow_left"],3,16],
        "2b06":[["\u2B06\uFE0F","\u2B06"],"\uE232","\uDBBA\uDEF8",["arrow_up"],3,17],
        "2b07":[["\u2B07\uFE0F","\u2B07"],"\uE233","\uDBBA\uDEF9",["arrow_down"],3,18],
        "2b1b":[["\u2B1B\uFE0F","\u2B1B"],"\uE21A","\uDBBA\uDF6C",["black_large_square"],3,19],
        "2b1c":[["\u2B1C\uFE0F","\u2B1C"],"\uE21B","\uDBBA\uDF6B",["white_large_square"],3,20],
        "2b50":[["\u2B50\uFE0F","\u2B50"],"\uE32F","\uDBBA\uDF68",["star"],3,21],
        "2b55":[["\u2B55\uFE0F","\u2B55"],"\uE332","\uDBBA\uDF44",["o"],3,22],
        "3030":[["\u3030"],"","\uDBBA\uDF07",["wavy_dash"],3,23],
        "303d":[["\u303D\uFE0F","\u303D"],"\uE12C","\uDBBA\uDC1B",["part_alternation_mark"],3,24],
        "3297":[["\u3297\uFE0F","\u3297"],"\uE30D","\uDBBA\uDF43",["congratulations"],3,25],
        "3299":[["\u3299\uFE0F","\u3299"],"\uE315","\uDBBA\uDF2B",["secret"],3,26],
        "1f004":[["\uD83C\uDC04\uFE0F","\uD83C\uDC04"],"\uE12D","\uDBBA\uDC0B",["mahjong"],3,27],
        "1f0cf":[["\uD83C\uDCCF"],"","\uDBBA\uDC12",["black_joker"],3,28],
        "1f170":[["\uD83C\uDD70"],"\uE532","\uDBB9\uDD0B",["a"],3,29],
        "1f171":[["\uD83C\uDD71"],"\uE533","\uDBB9\uDD0C",["b"],4,0],
        "1f17e":[["\uD83C\uDD7E"],"\uE535","\uDBB9\uDD0E",["o2"],4,1],
        "1f17f":[["\uD83C\uDD7F\uFE0F","\uD83C\uDD7F"],"\uE14F","\uDBB9\uDFF6",["parking"],4,2],
        "1f18e":[["\uD83C\uDD8E"],"\uE534","\uDBB9\uDD0D",["ab"],4,3],
        "1f191":[["\uD83C\uDD91"],"","\uDBBA\uDF84",["cl"],4,4],
        "1f192":[["\uD83C\uDD92"],"\uE214","\uDBBA\uDF38",["cool"],4,5],
        "1f193":[["\uD83C\uDD93"],"","\uDBBA\uDF21",["free"],4,6],
        "1f194":[["\uD83C\uDD94"],"\uE229","\uDBBA\uDF81",["id"],4,7],
        "1f195":[["\uD83C\uDD95"],"\uE212","\uDBBA\uDF36",["new"],4,8],
        "1f196":[["\uD83C\uDD96"],"","\uDBBA\uDF28",["ng"],4,9],
        "1f197":[["\uD83C\uDD97"],"\uE24D","\uDBBA\uDF27",["ok"],4,10],
        "1f198":[["\uD83C\uDD98"],"","\uDBBA\uDF4F",["sos"],4,11],
        "1f199":[["\uD83C\uDD99"],"\uE213","\uDBBA\uDF37",["up"],4,12],
        "1f19a":[["\uD83C\uDD9A"],"\uE12E","\uDBBA\uDF32",["vs"],4,13],
        "1f201":[["\uD83C\uDE01"],"\uE203","\uDBBA\uDF24",["koko"],4,14],
        "1f202":[["\uD83C\uDE02"],"\uE228","\uDBBA\uDF3F",["sa"],4,15],
        "1f21a":[["\uD83C\uDE1A\uFE0F","\uD83C\uDE1A"],"\uE216","\uDBBA\uDF3A",["u7121"],4,16],
        "1f22f":[["\uD83C\uDE2F\uFE0F","\uD83C\uDE2F"],"\uE22C","\uDBBA\uDF40",["u6307"],4,17],
        "1f232":[["\uD83C\uDE32"],"","\uDBBA\uDF2E",["u7981"],4,18],
        "1f233":[["\uD83C\uDE33"],"\uE22B","\uDBBA\uDF2F",["u7a7a"],4,19],
        "1f234":[["\uD83C\uDE34"],"","\uDBBA\uDF30",["u5408"],4,20],
        "1f235":[["\uD83C\uDE35"],"\uE22A","\uDBBA\uDF31",["u6e80"],4,21],
        "1f236":[["\uD83C\uDE36"],"\uE215","\uDBBA\uDF39",["u6709"],4,22],
        "1f237":[["\uD83C\uDE37"],"\uE217","\uDBBA\uDF3B",["u6708"],4,23],
        "1f238":[["\uD83C\uDE38"],"\uE218","\uDBBA\uDF3C",["u7533"],4,24],
        "1f239":[["\uD83C\uDE39"],"\uE227","\uDBBA\uDF3E",["u5272"],4,25],
        "1f23a":[["\uD83C\uDE3A"],"\uE22D","\uDBBA\uDF41",["u55b6"],4,26],
        "1f250":[["\uD83C\uDE50"],"\uE226","\uDBBA\uDF3D",["ideograph_advantage"],4,27],
        "1f251":[["\uD83C\uDE51"],"","\uDBBA\uDF50",["accept"],4,28],
        "1f300":[["\uD83C\uDF00"],"\uE443","\uDBB8\uDC05",["cyclone"],4,29],
        "1f301":[["\uD83C\uDF01"],"","\uDBB8\uDC06",["foggy"],5,0],
        "1f302":[["\uD83C\uDF02"],"\uE43C","\uDBB8\uDC07",["closed_umbrella"],5,1],
        "1f303":[["\uD83C\uDF03"],"\uE44B","\uDBB8\uDC08",["night_with_stars"],5,2],
        "1f304":[["\uD83C\uDF04"],"\uE04D","\uDBB8\uDC09",["sunrise_over_mountains"],5,3],
        "1f305":[["\uD83C\uDF05"],"\uE449","\uDBB8\uDC0A",["sunrise"],5,4],
        "1f306":[["\uD83C\uDF06"],"\uE146","\uDBB8\uDC0B",["city_sunset"],5,5],
        "1f307":[["\uD83C\uDF07"],"\uE44A","\uDBB8\uDC0C",["city_sunrise"],5,6],
        "1f308":[["\uD83C\uDF08"],"\uE44C","\uDBB8\uDC0D",["rainbow"],5,7],
        "1f309":[["\uD83C\uDF09"],"\uE44B","\uDBB8\uDC10",["bridge_at_night"],5,8],
        "1f30a":[["\uD83C\uDF0A"],"\uE43E","\uDBB8\uDC38",["ocean"],5,9],
        "1f30b":[["\uD83C\uDF0B"],"","\uDBB8\uDC3A",["volcano"],5,10],
        "1f30c":[["\uD83C\uDF0C"],"\uE44B","\uDBB8\uDC3B",["milky_way"],5,11],
        "1f30d":[["\uD83C\uDF0D"],"","",["earth_africa"],5,12],
        "1f30e":[["\uD83C\uDF0E"],"","",["earth_americas"],5,13],
        "1f30f":[["\uD83C\uDF0F"],"","\uDBB8\uDC39",["earth_asia"],5,14],
        "1f310":[["\uD83C\uDF10"],"","",["globe_with_meridians"],5,15],
        "1f311":[["\uD83C\uDF11"],"","\uDBB8\uDC11",["new_moon"],5,16],
        "1f312":[["\uD83C\uDF12"],"","",["waxing_crescent_moon"],5,17],
        "1f313":[["\uD83C\uDF13"],"\uE04C","\uDBB8\uDC13",["first_quarter_moon"],5,18],
        "1f314":[["\uD83C\uDF14"],"\uE04C","\uDBB8\uDC12",["moon","waxing_gibbous_moon"],5,19],
        "1f315":[["\uD83C\uDF15"],"","\uDBB8\uDC15",["full_moon"],5,20],
        "1f316":[["\uD83C\uDF16"],"","",["waning_gibbous_moon"],5,21],
        "1f317":[["\uD83C\uDF17"],"","",["last_quarter_moon"],5,22],
        "1f318":[["\uD83C\uDF18"],"","",["waning_crescent_moon"],5,23],
        "1f319":[["\uD83C\uDF19"],"\uE04C","\uDBB8\uDC14",["crescent_moon"],5,24],
        "1f31a":[["\uD83C\uDF1A"],"","",["new_moon_with_face"],5,25],
        "1f31b":[["\uD83C\uDF1B"],"\uE04C","\uDBB8\uDC16",["first_quarter_moon_with_face"],5,26],
        "1f31c":[["\uD83C\uDF1C"],"","",["last_quarter_moon_with_face"],5,27],
        "1f31d":[["\uD83C\uDF1D"],"","",["full_moon_with_face"],5,28],
        "1f31e":[["\uD83C\uDF1E"],"","",["sun_with_face"],5,29],
        "1f31f":[["\uD83C\uDF1F"],"\uE335","\uDBBA\uDF69",["star2"],6,0],
        "1f320":[["\uD83C\uDF20"],"","\uDBBA\uDF6A",["stars"],6,1],
        "1f330":[["\uD83C\uDF30"],"","\uDBB8\uDC4C",["chestnut"],6,2],
        "1f331":[["\uD83C\uDF31"],"\uE110","\uDBB8\uDC3E",["seedling"],6,3],
        "1f332":[["\uD83C\uDF32"],"","",["evergreen_tree"],6,4],
        "1f333":[["\uD83C\uDF33"],"","",["deciduous_tree"],6,5],
        "1f334":[["\uD83C\uDF34"],"\uE307","\uDBB8\uDC47",["palm_tree"],6,6],
        "1f335":[["\uD83C\uDF35"],"\uE308","\uDBB8\uDC48",["cactus"],6,7],
        "1f337":[["\uD83C\uDF37"],"\uE304","\uDBB8\uDC3D",["tulip"],6,8],
        "1f338":[["\uD83C\uDF38"],"\uE030","\uDBB8\uDC40",["cherry_blossom"],6,9],
        "1f339":[["\uD83C\uDF39"],"\uE032","\uDBB8\uDC41",["rose"],6,10],
        "1f33a":[["\uD83C\uDF3A"],"\uE303","\uDBB8\uDC45",["hibiscus"],6,11],
        "1f33b":[["\uD83C\uDF3B"],"\uE305","\uDBB8\uDC46",["sunflower"],6,12],
        "1f33c":[["\uD83C\uDF3C"],"\uE305","\uDBB8\uDC4D",["blossom"],6,13],
        "1f33d":[["\uD83C\uDF3D"],"","\uDBB8\uDC4A",["corn"],6,14],
        "1f33e":[["\uD83C\uDF3E"],"\uE444","\uDBB8\uDC49",["ear_of_rice"],6,15],
        "1f33f":[["\uD83C\uDF3F"],"\uE110","\uDBB8\uDC4E",["herb"],6,16],
        "1f340":[["\uD83C\uDF40"],"\uE110","\uDBB8\uDC3C",["four_leaf_clover"],6,17],
        "1f341":[["\uD83C\uDF41"],"\uE118","\uDBB8\uDC3F",["maple_leaf"],6,18],
        "1f342":[["\uD83C\uDF42"],"\uE119","\uDBB8\uDC42",["fallen_leaf"],6,19],
        "1f343":[["\uD83C\uDF43"],"\uE447","\uDBB8\uDC43",["leaves"],6,20],
        "1f344":[["\uD83C\uDF44"],"","\uDBB8\uDC4B",["mushroom"],6,21],
        "1f345":[["\uD83C\uDF45"],"\uE349","\uDBB8\uDC55",["tomato"],6,22],
        "1f346":[["\uD83C\uDF46"],"\uE34A","\uDBB8\uDC56",["eggplant"],6,23],
        "1f347":[["\uD83C\uDF47"],"","\uDBB8\uDC59",["grapes"],6,24],
        "1f348":[["\uD83C\uDF48"],"","\uDBB8\uDC57",["melon"],6,25],
        "1f349":[["\uD83C\uDF49"],"\uE348","\uDBB8\uDC54",["watermelon"],6,26],
        "1f34a":[["\uD83C\uDF4A"],"\uE346","\uDBB8\uDC52",["tangerine"],6,27],
        "1f34b":[["\uD83C\uDF4B"],"","",["lemon"],6,28],
        "1f34c":[["\uD83C\uDF4C"],"","\uDBB8\uDC50",["banana"],6,29],
        "1f34d":[["\uD83C\uDF4D"],"","\uDBB8\uDC58",["pineapple"],7,0],
        "1f34e":[["\uD83C\uDF4E"],"\uE345","\uDBB8\uDC51",["apple"],7,1],
        "1f34f":[["\uD83C\uDF4F"],"\uE345","\uDBB8\uDC5B",["green_apple"],7,2],
        "1f350":[["\uD83C\uDF50"],"","",["pear"],7,3],
        "1f351":[["\uD83C\uDF51"],"","\uDBB8\uDC5A",["peach"],7,4],
        "1f352":[["\uD83C\uDF52"],"","\uDBB8\uDC4F",["cherries"],7,5],
        "1f353":[["\uD83C\uDF53"],"\uE347","\uDBB8\uDC53",["strawberry"],7,6],
        "1f354":[["\uD83C\uDF54"],"\uE120","\uDBBA\uDD60",["hamburger"],7,7],
        "1f355":[["\uD83C\uDF55"],"","\uDBBA\uDD75",["pizza"],7,8],
        "1f356":[["\uD83C\uDF56"],"","\uDBBA\uDD72",["meat_on_bone"],7,9],
        "1f357":[["\uD83C\uDF57"],"","\uDBBA\uDD76",["poultry_leg"],7,10],
        "1f358":[["\uD83C\uDF58"],"\uE33D","\uDBBA\uDD69",["rice_cracker"],7,11],
        "1f359":[["\uD83C\uDF59"],"\uE342","\uDBBA\uDD61",["rice_ball"],7,12],
        "1f35a":[["\uD83C\uDF5A"],"\uE33E","\uDBBA\uDD6A",["rice"],7,13],
        "1f35b":[["\uD83C\uDF5B"],"\uE341","\uDBBA\uDD6C",["curry"],7,14],
        "1f35c":[["\uD83C\uDF5C"],"\uE340","\uDBBA\uDD63",["ramen"],7,15],
        "1f35d":[["\uD83C\uDF5D"],"\uE33F","\uDBBA\uDD6B",["spaghetti"],7,16],
        "1f35e":[["\uD83C\uDF5E"],"\uE339","\uDBBA\uDD64",["bread"],7,17],
        "1f35f":[["\uD83C\uDF5F"],"\uE33B","\uDBBA\uDD67",["fries"],7,18],
        "1f360":[["\uD83C\uDF60"],"","\uDBBA\uDD74",["sweet_potato"],7,19],
        "1f361":[["\uD83C\uDF61"],"\uE33C","\uDBBA\uDD68",["dango"],7,20],
        "1f362":[["\uD83C\uDF62"],"\uE343","\uDBBA\uDD6D",["oden"],7,21],
        "1f363":[["\uD83C\uDF63"],"\uE344","\uDBBA\uDD6E",["sushi"],7,22],
        "1f364":[["\uD83C\uDF64"],"","\uDBBA\uDD7F",["fried_shrimp"],7,23],
        "1f365":[["\uD83C\uDF65"],"","\uDBBA\uDD73",["fish_cake"],7,24],
        "1f366":[["\uD83C\uDF66"],"\uE33A","\uDBBA\uDD66",["icecream"],7,25],
        "1f367":[["\uD83C\uDF67"],"\uE43F","\uDBBA\uDD71",["shaved_ice"],7,26],
        "1f368":[["\uD83C\uDF68"],"","\uDBBA\uDD77",["ice_cream"],7,27],
        "1f369":[["\uD83C\uDF69"],"","\uDBBA\uDD78",["doughnut"],7,28],
        "1f36a":[["\uD83C\uDF6A"],"","\uDBBA\uDD79",["cookie"],7,29],
        "1f36b":[["\uD83C\uDF6B"],"","\uDBBA\uDD7A",["chocolate_bar"],8,0],
        "1f36c":[["\uD83C\uDF6C"],"","\uDBBA\uDD7B",["candy"],8,1],
        "1f36d":[["\uD83C\uDF6D"],"","\uDBBA\uDD7C",["lollipop"],8,2],
        "1f36e":[["\uD83C\uDF6E"],"","\uDBBA\uDD7D",["custard"],8,3],
        "1f36f":[["\uD83C\uDF6F"],"","\uDBBA\uDD7E",["honey_pot"],8,4],
        "1f370":[["\uD83C\uDF70"],"\uE046","\uDBBA\uDD62",["cake"],8,5],
        "1f371":[["\uD83C\uDF71"],"\uE34C","\uDBBA\uDD6F",["bento"],8,6],
        "1f372":[["\uD83C\uDF72"],"\uE34D","\uDBBA\uDD70",["stew"],8,7],
        "1f373":[["\uD83C\uDF73"],"\uE147","\uDBBA\uDD65",["egg"],8,8],
        "1f374":[["\uD83C\uDF74"],"\uE043","\uDBBA\uDD80",["fork_and_knife"],8,9],
        "1f375":[["\uD83C\uDF75"],"\uE338","\uDBBA\uDD84",["tea"],8,10],
        "1f376":[["\uD83C\uDF76"],"\uE30B","\uDBBA\uDD85",["sake"],8,11],
        "1f377":[["\uD83C\uDF77"],"\uE044","\uDBBA\uDD86",["wine_glass"],8,12],
        "1f378":[["\uD83C\uDF78"],"\uE044","\uDBBA\uDD82",["cocktail"],8,13],
        "1f379":[["\uD83C\uDF79"],"\uE044","\uDBBA\uDD88",["tropical_drink"],8,14],
        "1f37a":[["\uD83C\uDF7A"],"\uE047","\uDBBA\uDD83",["beer"],8,15],
        "1f37b":[["\uD83C\uDF7B"],"\uE30C","\uDBBA\uDD87",["beers"],8,16],
        "1f37c":[["\uD83C\uDF7C"],"","",["baby_bottle"],8,17],
        "1f380":[["\uD83C\uDF80"],"\uE314","\uDBB9\uDD0F",["ribbon"],8,18],
        "1f381":[["\uD83C\uDF81"],"\uE112","\uDBB9\uDD10",["gift"],8,19],
        "1f382":[["\uD83C\uDF82"],"\uE34B","\uDBB9\uDD11",["birthday"],8,20],
        "1f383":[["\uD83C\uDF83"],"\uE445","\uDBB9\uDD1F",["jack_o_lantern"],8,21],
        "1f384":[["\uD83C\uDF84"],"\uE033","\uDBB9\uDD12",["christmas_tree"],8,22],
        "1f385":[["\uD83C\uDF85"],"\uE448","\uDBB9\uDD13",["santa"],8,23],
        "1f386":[["\uD83C\uDF86"],"\uE117","\uDBB9\uDD15",["fireworks"],8,24],
        "1f387":[["\uD83C\uDF87"],"\uE440","\uDBB9\uDD1D",["sparkler"],8,25],
        "1f388":[["\uD83C\uDF88"],"\uE310","\uDBB9\uDD16",["balloon"],8,26],
        "1f389":[["\uD83C\uDF89"],"\uE312","\uDBB9\uDD17",["tada"],8,27],
        "1f38a":[["\uD83C\uDF8A"],"","\uDBB9\uDD20",["confetti_ball"],8,28],
        "1f38b":[["\uD83C\uDF8B"],"","\uDBB9\uDD21",["tanabata_tree"],8,29],
        "1f38c":[["\uD83C\uDF8C"],"\uE143","\uDBB9\uDD14",["crossed_flags"],9,0],
        "1f38d":[["\uD83C\uDF8D"],"\uE436","\uDBB9\uDD18",["bamboo"],9,1],
        "1f38e":[["\uD83C\uDF8E"],"\uE438","\uDBB9\uDD19",["dolls"],9,2],
        "1f38f":[["\uD83C\uDF8F"],"\uE43B","\uDBB9\uDD1C",["flags"],9,3],
        "1f390":[["\uD83C\uDF90"],"\uE442","\uDBB9\uDD1E",["wind_chime"],9,4],
        "1f391":[["\uD83C\uDF91"],"\uE446","\uDBB8\uDC17",["rice_scene"],9,5],
        "1f392":[["\uD83C\uDF92"],"\uE43A","\uDBB9\uDD1B",["school_satchel"],9,6],
        "1f393":[["\uD83C\uDF93"],"\uE439","\uDBB9\uDD1A",["mortar_board"],9,7],
        "1f3a0":[["\uD83C\uDFA0"],"","\uDBB9\uDFFC",["carousel_horse"],9,8],
        "1f3a1":[["\uD83C\uDFA1"],"\uE124","\uDBB9\uDFFD",["ferris_wheel"],9,9],
        "1f3a2":[["\uD83C\uDFA2"],"\uE433","\uDBB9\uDFFE",["roller_coaster"],9,10],
        "1f3a3":[["\uD83C\uDFA3"],"\uE019","\uDBB9\uDFFF",["fishing_pole_and_fish"],9,11],
        "1f3a4":[["\uD83C\uDFA4"],"\uE03C","\uDBBA\uDC00",["microphone"],9,12],
        "1f3a5":[["\uD83C\uDFA5"],"\uE03D","\uDBBA\uDC01",["movie_camera"],9,13],
        "1f3a6":[["\uD83C\uDFA6"],"\uE507","\uDBBA\uDC02",["cinema"],9,14],
        "1f3a7":[["\uD83C\uDFA7"],"\uE30A","\uDBBA\uDC03",["headphones"],9,15],
        "1f3a8":[["\uD83C\uDFA8"],"\uE502","\uDBBA\uDC04",["art"],9,16],
        "1f3a9":[["\uD83C\uDFA9"],"\uE503","\uDBBA\uDC05",["tophat"],9,17],
        "1f3aa":[["\uD83C\uDFAA"],"","\uDBBA\uDC06",["circus_tent"],9,18],
        "1f3ab":[["\uD83C\uDFAB"],"\uE125","\uDBBA\uDC07",["ticket"],9,19],
        "1f3ac":[["\uD83C\uDFAC"],"\uE324","\uDBBA\uDC08",["clapper"],9,20],
        "1f3ad":[["\uD83C\uDFAD"],"\uE503","\uDBBA\uDC09",["performing_arts"],9,21],
        "1f3ae":[["\uD83C\uDFAE"],"","\uDBBA\uDC0A",["video_game"],9,22],
        "1f3af":[["\uD83C\uDFAF"],"\uE130","\uDBBA\uDC0C",["dart"],9,23],
        "1f3b0":[["\uD83C\uDFB0"],"\uE133","\uDBBA\uDC0D",["slot_machine"],9,24],
        "1f3b1":[["\uD83C\uDFB1"],"\uE42C","\uDBBA\uDC0E",["8ball"],9,25],
        "1f3b2":[["\uD83C\uDFB2"],"","\uDBBA\uDC0F",["game_die"],9,26],
        "1f3b3":[["\uD83C\uDFB3"],"","\uDBBA\uDC10",["bowling"],9,27],
        "1f3b4":[["\uD83C\uDFB4"],"","\uDBBA\uDC11",["flower_playing_cards"],9,28],
        "1f3b5":[["\uD83C\uDFB5"],"\uE03E","\uDBBA\uDC13",["musical_note"],9,29],
        "1f3b6":[["\uD83C\uDFB6"],"\uE326","\uDBBA\uDC14",["notes"],10,0],
        "1f3b7":[["\uD83C\uDFB7"],"\uE040","\uDBBA\uDC15",["saxophone"],10,1],
        "1f3b8":[["\uD83C\uDFB8"],"\uE041","\uDBBA\uDC16",["guitar"],10,2],
        "1f3b9":[["\uD83C\uDFB9"],"","\uDBBA\uDC17",["musical_keyboard"],10,3],
        "1f3ba":[["\uD83C\uDFBA"],"\uE042","\uDBBA\uDC18",["trumpet"],10,4],
        "1f3bb":[["\uD83C\uDFBB"],"","\uDBBA\uDC19",["violin"],10,5],
        "1f3bc":[["\uD83C\uDFBC"],"\uE326","\uDBBA\uDC1A",["musical_score"],10,6],
        "1f3bd":[["\uD83C\uDFBD"],"","\uDBB9\uDFD0",["running_shirt_with_sash"],10,7],
        "1f3be":[["\uD83C\uDFBE"],"\uE015","\uDBB9\uDFD3",["tennis"],10,8],
        "1f3bf":[["\uD83C\uDFBF"],"\uE013","\uDBB9\uDFD5",["ski"],10,9],
        "1f3c0":[["\uD83C\uDFC0"],"\uE42A","\uDBB9\uDFD6",["basketball"],10,10],
        "1f3c1":[["\uD83C\uDFC1"],"\uE132","\uDBB9\uDFD7",["checkered_flag"],10,11],
        "1f3c2":[["\uD83C\uDFC2"],"","\uDBB9\uDFD8",["snowboarder"],10,12],
        "1f3c3":[["\uD83C\uDFC3"],"\uE115","\uDBB9\uDFD9",["runner","running"],10,13],
        "1f3c4":[["\uD83C\uDFC4"],"\uE017","\uDBB9\uDFDA",["surfer"],10,14],
        "1f3c6":[["\uD83C\uDFC6"],"\uE131","\uDBB9\uDFDB",["trophy"],10,15],
        "1f3c7":[["\uD83C\uDFC7"],"","",["horse_racing"],10,16],
        "1f3c8":[["\uD83C\uDFC8"],"\uE42B","\uDBB9\uDFDD",["football"],10,17],
        "1f3c9":[["\uD83C\uDFC9"],"","",["rugby_football"],10,18],
        "1f3ca":[["\uD83C\uDFCA"],"\uE42D","\uDBB9\uDFDE",["swimmer"],10,19],
        "1f3e0":[["\uD83C\uDFE0"],"\uE036","\uDBB9\uDCB0",["house"],10,20],
        "1f3e1":[["\uD83C\uDFE1"],"\uE036","\uDBB9\uDCB1",["house_with_garden"],10,21],
        "1f3e2":[["\uD83C\uDFE2"],"\uE038","\uDBB9\uDCB2",["office"],10,22],
        "1f3e3":[["\uD83C\uDFE3"],"\uE153","\uDBB9\uDCB3",["post_office"],10,23],
        "1f3e4":[["\uD83C\uDFE4"],"","",["european_post_office"],10,24],
        "1f3e5":[["\uD83C\uDFE5"],"\uE155","\uDBB9\uDCB4",["hospital"],10,25],
        "1f3e6":[["\uD83C\uDFE6"],"\uE14D","\uDBB9\uDCB5",["bank"],10,26],
        "1f3e7":[["\uD83C\uDFE7"],"\uE154","\uDBB9\uDCB6",["atm"],10,27],
        "1f3e8":[["\uD83C\uDFE8"],"\uE158","\uDBB9\uDCB7",["hotel"],10,28],
        "1f3e9":[["\uD83C\uDFE9"],"\uE501","\uDBB9\uDCB8",["love_hotel"],10,29],
        "1f3ea":[["\uD83C\uDFEA"],"\uE156","\uDBB9\uDCB9",["convenience_store"],11,0],
        "1f3eb":[["\uD83C\uDFEB"],"\uE157","\uDBB9\uDCBA",["school"],11,1],
        "1f3ec":[["\uD83C\uDFEC"],"\uE504","\uDBB9\uDCBD",["department_store"],11,2],
        "1f3ed":[["\uD83C\uDFED"],"\uE508","\uDBB9\uDCC0",["factory"],11,3],
        "1f3ee":[["\uD83C\uDFEE"],"\uE30B","\uDBB9\uDCC2",["izakaya_lantern","lantern"],11,4],
        "1f3ef":[["\uD83C\uDFEF"],"\uE505","\uDBB9\uDCBE",["japanese_castle"],11,5],
        "1f3f0":[["\uD83C\uDFF0"],"\uE506","\uDBB9\uDCBF",["european_castle"],11,6],
        "1f400":[["\uD83D\uDC00"],"","",["rat"],11,7],
        "1f401":[["\uD83D\uDC01"],"","",["mouse2"],11,8],
        "1f402":[["\uD83D\uDC02"],"","",["ox"],11,9],
        "1f403":[["\uD83D\uDC03"],"","",["water_buffalo"],11,10],
        "1f404":[["\uD83D\uDC04"],"","",["cow2"],11,11],
        "1f405":[["\uD83D\uDC05"],"","",["tiger2"],11,12],
        "1f406":[["\uD83D\uDC06"],"","",["leopard"],11,13],
        "1f407":[["\uD83D\uDC07"],"","",["rabbit2"],11,14],
        "1f408":[["\uD83D\uDC08"],"","",["cat2"],11,15],
        "1f409":[["\uD83D\uDC09"],"","",["dragon"],11,16],
        "1f40a":[["\uD83D\uDC0A"],"","",["crocodile"],11,17],
        "1f40b":[["\uD83D\uDC0B"],"","",["whale2"],11,18],
        "1f40c":[["\uD83D\uDC0C"],"","\uDBB8\uDDB9",["snail"],11,19],
        "1f40d":[["\uD83D\uDC0D"],"\uE52D","\uDBB8\uDDD3",["snake"],11,20],
        "1f40e":[["\uD83D\uDC0E"],"\uE134","\uDBB9\uDFDC",["racehorse"],11,21],
        "1f40f":[["\uD83D\uDC0F"],"","",["ram"],11,22],
        "1f410":[["\uD83D\uDC10"],"","",["goat"],11,23],
        "1f411":[["\uD83D\uDC11"],"\uE529","\uDBB8\uDDCF",["sheep"],11,24],
        "1f412":[["\uD83D\uDC12"],"\uE528","\uDBB8\uDDCE",["monkey"],11,25],
        "1f413":[["\uD83D\uDC13"],"","",["rooster"],11,26],
        "1f414":[["\uD83D\uDC14"],"\uE52E","\uDBB8\uDDD4",["chicken"],11,27],
        "1f415":[["\uD83D\uDC15"],"","",["dog2"],11,28],
        "1f416":[["\uD83D\uDC16"],"","",["pig2"],11,29],
        "1f417":[["\uD83D\uDC17"],"\uE52F","\uDBB8\uDDD5",["boar"],12,0],
        "1f418":[["\uD83D\uDC18"],"\uE526","\uDBB8\uDDCC",["elephant"],12,1],
        "1f419":[["\uD83D\uDC19"],"\uE10A","\uDBB8\uDDC5",["octopus"],12,2],
        "1f41a":[["\uD83D\uDC1A"],"\uE441","\uDBB8\uDDC6",["shell"],12,3],
        "1f41b":[["\uD83D\uDC1B"],"\uE525","\uDBB8\uDDCB",["bug"],12,4],
        "1f41c":[["\uD83D\uDC1C"],"","\uDBB8\uDDDA",["ant"],12,5],
        "1f41d":[["\uD83D\uDC1D"],"","\uDBB8\uDDE1",["bee","honeybee"],12,6],
        "1f41e":[["\uD83D\uDC1E"],"","\uDBB8\uDDE2",["beetle"],12,7],
        "1f41f":[["\uD83D\uDC1F"],"\uE019","\uDBB8\uDDBD",["fish"],12,8],
        "1f420":[["\uD83D\uDC20"],"\uE522","\uDBB8\uDDC9",["tropical_fish"],12,9],
        "1f421":[["\uD83D\uDC21"],"\uE019","\uDBB8\uDDD9",["blowfish"],12,10],
        "1f422":[["\uD83D\uDC22"],"","\uDBB8\uDDDC",["turtle"],12,11],
        "1f423":[["\uD83D\uDC23"],"\uE523","\uDBB8\uDDDD",["hatching_chick"],12,12],
        "1f424":[["\uD83D\uDC24"],"\uE523","\uDBB8\uDDBA",["baby_chick"],12,13],
        "1f425":[["\uD83D\uDC25"],"\uE523","\uDBB8\uDDBB",["hatched_chick"],12,14],
        "1f426":[["\uD83D\uDC26"],"\uE521","\uDBB8\uDDC8",["bird"],12,15],
        "1f427":[["\uD83D\uDC27"],"\uE055","\uDBB8\uDDBC",["penguin"],12,16],
        "1f428":[["\uD83D\uDC28"],"\uE527","\uDBB8\uDDCD",["koala"],12,17],
        "1f429":[["\uD83D\uDC29"],"\uE052","\uDBB8\uDDD8",["poodle"],12,18],
        "1f42a":[["\uD83D\uDC2A"],"","",["dromedary_camel"],12,19],
        "1f42b":[["\uD83D\uDC2B"],"\uE530","\uDBB8\uDDD6",["camel"],12,20],
        "1f42c":[["\uD83D\uDC2C"],"\uE520","\uDBB8\uDDC7",["dolphin","flipper"],12,21],
        "1f42d":[["\uD83D\uDC2D"],"\uE053","\uDBB8\uDDC2",["mouse"],12,22],
        "1f42e":[["\uD83D\uDC2E"],"\uE52B","\uDBB8\uDDD1",["cow"],12,23],
        "1f42f":[["\uD83D\uDC2F"],"\uE050","\uDBB8\uDDC0",["tiger"],12,24],
        "1f430":[["\uD83D\uDC30"],"\uE52C","\uDBB8\uDDD2",["rabbit"],12,25],
        "1f431":[["\uD83D\uDC31"],"\uE04F","\uDBB8\uDDB8",["cat"],12,26],
        "1f432":[["\uD83D\uDC32"],"","\uDBB8\uDDDE",["dragon_face"],12,27],
        "1f433":[["\uD83D\uDC33"],"\uE054","\uDBB8\uDDC3",["whale"],12,28],
        "1f434":[["\uD83D\uDC34"],"\uE01A","\uDBB8\uDDBE",["horse"],12,29],
        "1f435":[["\uD83D\uDC35"],"\uE109","\uDBB8\uDDC4",["monkey_face"],13,0],
        "1f436":[["\uD83D\uDC36"],"\uE052","\uDBB8\uDDB7",["dog"],13,1],
        "1f437":[["\uD83D\uDC37"],"\uE10B","\uDBB8\uDDBF",["pig"],13,2],
        "1f438":[["\uD83D\uDC38"],"\uE531","\uDBB8\uDDD7",["frog"],13,3],
        "1f439":[["\uD83D\uDC39"],"\uE524","\uDBB8\uDDCA",["hamster"],13,4],
        "1f43a":[["\uD83D\uDC3A"],"\uE52A","\uDBB8\uDDD0",["wolf"],13,5],
        "1f43b":[["\uD83D\uDC3B"],"\uE051","\uDBB8\uDDC1",["bear"],13,6],
        "1f43c":[["\uD83D\uDC3C"],"","\uDBB8\uDDDF",["panda_face"],13,7],
        "1f43d":[["\uD83D\uDC3D"],"\uE10B","\uDBB8\uDDE0",["pig_nose"],13,8],
        "1f43e":[["\uD83D\uDC3E"],"\uE536","\uDBB8\uDDDB",["feet","paw_prints"],13,9],
        "1f440":[["\uD83D\uDC40"],"\uE419","\uDBB8\uDD90",["eyes"],13,10],
        "1f442":[["\uD83D\uDC42"],"\uE41B","\uDBB8\uDD91",["ear"],13,11],
        "1f443":[["\uD83D\uDC43"],"\uE41A","\uDBB8\uDD92",["nose"],13,12],
        "1f444":[["\uD83D\uDC44"],"\uE41C","\uDBB8\uDD93",["lips"],13,13],
        "1f445":[["\uD83D\uDC45"],"\uE409","\uDBB8\uDD94",["tongue"],13,14],
        "1f446":[["\uD83D\uDC46"],"\uE22E","\uDBBA\uDF99",["point_up_2"],13,15],
        "1f447":[["\uD83D\uDC47"],"\uE22F","\uDBBA\uDF9A",["point_down"],13,16],
        "1f448":[["\uD83D\uDC48"],"\uE230","\uDBBA\uDF9B",["point_left"],13,17],
        "1f449":[["\uD83D\uDC49"],"\uE231","\uDBBA\uDF9C",["point_right"],13,18],
        "1f44a":[["\uD83D\uDC4A"],"\uE00D","\uDBBA\uDF96",["facepunch","punch"],13,19],
        "1f44b":[["\uD83D\uDC4B"],"\uE41E","\uDBBA\uDF9D",["wave"],13,20],
        "1f44c":[["\uD83D\uDC4C"],"\uE420","\uDBBA\uDF9F",["ok_hand"],13,21],
        "1f44d":[["\uD83D\uDC4D"],"\uE00E","\uDBBA\uDF97",["+1","thumbsup"],13,22],
        "1f44e":[["\uD83D\uDC4E"],"\uE421","\uDBBA\uDFA0",["-1","thumbsdown"],13,23],
        "1f44f":[["\uD83D\uDC4F"],"\uE41F","\uDBBA\uDF9E",["clap"],13,24],
        "1f450":[["\uD83D\uDC50"],"\uE422","\uDBBA\uDFA1",["open_hands"],13,25],
        "1f451":[["\uD83D\uDC51"],"\uE10E","\uDBB9\uDCD1",["crown"],13,26],
        "1f452":[["\uD83D\uDC52"],"\uE318","\uDBB9\uDCD4",["womans_hat"],13,27],
        "1f453":[["\uD83D\uDC53"],"","\uDBB9\uDCCE",["eyeglasses"],13,28],
        "1f454":[["\uD83D\uDC54"],"\uE302","\uDBB9\uDCD3",["necktie"],13,29],
        "1f455":[["\uD83D\uDC55"],"\uE006","\uDBB9\uDCCF",["shirt","tshirt"],14,0],
        "1f456":[["\uD83D\uDC56"],"","\uDBB9\uDCD0",["jeans"],14,1],
        "1f457":[["\uD83D\uDC57"],"\uE319","\uDBB9\uDCD5",["dress"],14,2],
        "1f458":[["\uD83D\uDC58"],"\uE321","\uDBB9\uDCD9",["kimono"],14,3],
        "1f459":[["\uD83D\uDC59"],"\uE322","\uDBB9\uDCDA",["bikini"],14,4],
        "1f45a":[["\uD83D\uDC5A"],"\uE006","\uDBB9\uDCDB",["womans_clothes"],14,5],
        "1f45b":[["\uD83D\uDC5B"],"","\uDBB9\uDCDC",["purse"],14,6],
        "1f45c":[["\uD83D\uDC5C"],"\uE323","\uDBB9\uDCF0",["handbag"],14,7],
        "1f45d":[["\uD83D\uDC5D"],"","\uDBB9\uDCF1",["pouch"],14,8],
        "1f45e":[["\uD83D\uDC5E"],"\uE007","\uDBB9\uDCCC",["mans_shoe","shoe"],14,9],
        "1f45f":[["\uD83D\uDC5F"],"\uE007","\uDBB9\uDCCD",["athletic_shoe"],14,10],
        "1f460":[["\uD83D\uDC60"],"\uE13E","\uDBB9\uDCD6",["high_heel"],14,11],
        "1f461":[["\uD83D\uDC61"],"\uE31A","\uDBB9\uDCD7",["sandal"],14,12],
        "1f462":[["\uD83D\uDC62"],"\uE31B","\uDBB9\uDCD8",["boot"],14,13],
        "1f463":[["\uD83D\uDC63"],"\uE536","\uDBB9\uDD53",["footprints"],14,14],
        "1f464":[["\uD83D\uDC64"],"","\uDBB8\uDD9A",["bust_in_silhouette"],14,15],
        "1f465":[["\uD83D\uDC65"],"","",["busts_in_silhouette"],14,16],
        "1f466":[["\uD83D\uDC66"],"\uE001","\uDBB8\uDD9B",["boy"],14,17],
        "1f467":[["\uD83D\uDC67"],"\uE002","\uDBB8\uDD9C",["girl"],14,18],
        "1f468":[["\uD83D\uDC68"],"\uE004","\uDBB8\uDD9D",["man"],14,19],
        "1f469":[["\uD83D\uDC69"],"\uE005","\uDBB8\uDD9E",["woman"],14,20],
        "1f46a":[["\uD83D\uDC6A"],"","\uDBB8\uDD9F",["family"],14,21],
        "1f46b":[["\uD83D\uDC6B"],"\uE428","\uDBB8\uDDA0",["couple"],14,22],
        "1f46c":[["\uD83D\uDC6C"],"","",["two_men_holding_hands"],14,23],
        "1f46d":[["\uD83D\uDC6D"],"","",["two_women_holding_hands"],14,24],
        "1f46e":[["\uD83D\uDC6E"],"\uE152","\uDBB8\uDDA1",["cop"],14,25],
        "1f46f":[["\uD83D\uDC6F"],"\uE429","\uDBB8\uDDA2",["dancers"],14,26],
        "1f470":[["\uD83D\uDC70"],"","\uDBB8\uDDA3",["bride_with_veil"],14,27],
        "1f471":[["\uD83D\uDC71"],"\uE515","\uDBB8\uDDA4",["person_with_blond_hair"],14,28],
        "1f472":[["\uD83D\uDC72"],"\uE516","\uDBB8\uDDA5",["man_with_gua_pi_mao"],14,29],
        "1f473":[["\uD83D\uDC73"],"\uE517","\uDBB8\uDDA6",["man_with_turban"],15,0],
        "1f474":[["\uD83D\uDC74"],"\uE518","\uDBB8\uDDA7",["older_man"],15,1],
        "1f475":[["\uD83D\uDC75"],"\uE519","\uDBB8\uDDA8",["older_woman"],15,2],
        "1f476":[["\uD83D\uDC76"],"\uE51A","\uDBB8\uDDA9",["baby"],15,3],
        "1f477":[["\uD83D\uDC77"],"\uE51B","\uDBB8\uDDAA",["construction_worker"],15,4],
        "1f478":[["\uD83D\uDC78"],"\uE51C","\uDBB8\uDDAB",["princess"],15,5],
        "1f479":[["\uD83D\uDC79"],"","\uDBB8\uDDAC",["japanese_ogre"],15,6],
        "1f47a":[["\uD83D\uDC7A"],"","\uDBB8\uDDAD",["japanese_goblin"],15,7],
        "1f47b":[["\uD83D\uDC7B"],"\uE11B","\uDBB8\uDDAE",["ghost"],15,8],
        "1f47c":[["\uD83D\uDC7C"],"\uE04E","\uDBB8\uDDAF",["angel"],15,9],
        "1f47d":[["\uD83D\uDC7D"],"\uE10C","\uDBB8\uDDB0",["alien"],15,10],
        "1f47e":[["\uD83D\uDC7E"],"\uE12B","\uDBB8\uDDB1",["space_invader"],15,11],
        "1f47f":[["\uD83D\uDC7F"],"\uE11A","\uDBB8\uDDB2",["imp"],15,12],
        "1f480":[["\uD83D\uDC80"],"\uE11C","\uDBB8\uDDB3",["skull"],15,13],
        "1f481":[["\uD83D\uDC81"],"\uE253","\uDBB8\uDDB4",["information_desk_person"],15,14],
        "1f482":[["\uD83D\uDC82"],"\uE51E","\uDBB8\uDDB5",["guardsman"],15,15],
        "1f483":[["\uD83D\uDC83"],"\uE51F","\uDBB8\uDDB6",["dancer"],15,16],
        "1f484":[["\uD83D\uDC84"],"\uE31C","\uDBB8\uDD95",["lipstick"],15,17],
        "1f485":[["\uD83D\uDC85"],"\uE31D","\uDBB8\uDD96",["nail_care"],15,18],
        "1f486":[["\uD83D\uDC86"],"\uE31E","\uDBB8\uDD97",["massage"],15,19],
        "1f487":[["\uD83D\uDC87"],"\uE31F","\uDBB8\uDD98",["haircut"],15,20],
        "1f488":[["\uD83D\uDC88"],"\uE320","\uDBB8\uDD99",["barber"],15,21],
        "1f489":[["\uD83D\uDC89"],"\uE13B","\uDBB9\uDD09",["syringe"],15,22],
        "1f48a":[["\uD83D\uDC8A"],"\uE30F","\uDBB9\uDD0A",["pill"],15,23],
        "1f48b":[["\uD83D\uDC8B"],"\uE003","\uDBBA\uDC23",["kiss"],15,24],
        "1f48c":[["\uD83D\uDC8C"],"\uE103\uE328","\uDBBA\uDC24",["love_letter"],15,25],
        "1f48d":[["\uD83D\uDC8D"],"\uE034","\uDBBA\uDC25",["ring"],15,26],
        "1f48e":[["\uD83D\uDC8E"],"\uE035","\uDBBA\uDC26",["gem"],15,27],
        "1f48f":[["\uD83D\uDC8F"],"\uE111","\uDBBA\uDC27",["couplekiss"],15,28],
        "1f490":[["\uD83D\uDC90"],"\uE306","\uDBBA\uDC28",["bouquet"],15,29],
        "1f491":[["\uD83D\uDC91"],"\uE425","\uDBBA\uDC29",["couple_with_heart"],16,0],
        "1f492":[["\uD83D\uDC92"],"\uE43D","\uDBBA\uDC2A",["wedding"],16,1],
        "1f493":[["\uD83D\uDC93"],"\uE327","\uDBBA\uDF0D",["heartbeat"],16,2],
        "1f494":[["\uD83D\uDC94"],"\uE023","\uDBBA\uDF0E",["broken_heart"],16,3,"<\/3"],
        "1f495":[["\uD83D\uDC95"],"\uE327","\uDBBA\uDF0F",["two_hearts"],16,4],
        "1f496":[["\uD83D\uDC96"],"\uE327","\uDBBA\uDF10",["sparkling_heart"],16,5],
        "1f497":[["\uD83D\uDC97"],"\uE328","\uDBBA\uDF11",["heartpulse"],16,6],
        "1f498":[["\uD83D\uDC98"],"\uE329","\uDBBA\uDF12",["cupid"],16,7],
        "1f499":[["\uD83D\uDC99"],"\uE32A","\uDBBA\uDF13",["blue_heart"],16,8,"<3"],
        "1f49a":[["\uD83D\uDC9A"],"\uE32B","\uDBBA\uDF14",["green_heart"],16,9,"<3"],
        "1f49b":[["\uD83D\uDC9B"],"\uE32C","\uDBBA\uDF15",["yellow_heart"],16,10,"<3"],
        "1f49c":[["\uD83D\uDC9C"],"\uE32D","\uDBBA\uDF16",["purple_heart"],16,11,"<3"],
        "1f49d":[["\uD83D\uDC9D"],"\uE437","\uDBBA\uDF17",["gift_heart"],16,12],
        "1f49e":[["\uD83D\uDC9E"],"\uE327","\uDBBA\uDF18",["revolving_hearts"],16,13],
        "1f49f":[["\uD83D\uDC9F"],"\uE204","\uDBBA\uDF19",["heart_decoration"],16,14],
        "1f4a0":[["\uD83D\uDCA0"],"","\uDBBA\uDF55",["diamond_shape_with_a_dot_inside"],16,15],
        "1f4a1":[["\uD83D\uDCA1"],"\uE10F","\uDBBA\uDF56",["bulb"],16,16],
        "1f4a2":[["\uD83D\uDCA2"],"\uE334","\uDBBA\uDF57",["anger"],16,17],
        "1f4a3":[["\uD83D\uDCA3"],"\uE311","\uDBBA\uDF58",["bomb"],16,18],
        "1f4a4":[["\uD83D\uDCA4"],"\uE13C","\uDBBA\uDF59",["zzz"],16,19],
        "1f4a5":[["\uD83D\uDCA5"],"","\uDBBA\uDF5A",["boom","collision"],16,20],
        "1f4a6":[["\uD83D\uDCA6"],"\uE331","\uDBBA\uDF5B",["sweat_drops"],16,21],
        "1f4a7":[["\uD83D\uDCA7"],"\uE331","\uDBBA\uDF5C",["droplet"],16,22],
        "1f4a8":[["\uD83D\uDCA8"],"\uE330","\uDBBA\uDF5D",["dash"],16,23],
        "1f4a9":[["\uD83D\uDCA9"],"\uE05A","\uDBB9\uDCF4",["hankey","poop","shit"],16,24],
        "1f4aa":[["\uD83D\uDCAA"],"\uE14C","\uDBBA\uDF5E",["muscle"],16,25],
        "1f4ab":[["\uD83D\uDCAB"],"\uE407","\uDBBA\uDF5F",["dizzy"],16,26],
        "1f4ac":[["\uD83D\uDCAC"],"","\uDBB9\uDD32",["speech_balloon"],16,27],
        "1f4ad":[["\uD83D\uDCAD"],"","",["thought_balloon"],16,28],
        "1f4ae":[["\uD83D\uDCAE"],"","\uDBBA\uDF7A",["white_flower"],16,29],
        "1f4af":[["\uD83D\uDCAF"],"","\uDBBA\uDF7B",["100"],17,0],
        "1f4b0":[["\uD83D\uDCB0"],"\uE12F","\uDBB9\uDCDD",["moneybag"],17,1],
        "1f4b1":[["\uD83D\uDCB1"],"\uE149","\uDBB9\uDCDE",["currency_exchange"],17,2],
        "1f4b2":[["\uD83D\uDCB2"],"\uE12F","\uDBB9\uDCE0",["heavy_dollar_sign"],17,3],
        "1f4b3":[["\uD83D\uDCB3"],"","\uDBB9\uDCE1",["credit_card"],17,4],
        "1f4b4":[["\uD83D\uDCB4"],"","\uDBB9\uDCE2",["yen"],17,5],
        "1f4b5":[["\uD83D\uDCB5"],"\uE12F","\uDBB9\uDCE3",["dollar"],17,6],
        "1f4b6":[["\uD83D\uDCB6"],"","",["euro"],17,7],
        "1f4b7":[["\uD83D\uDCB7"],"","",["pound"],17,8],
        "1f4b8":[["\uD83D\uDCB8"],"","\uDBB9\uDCE4",["money_with_wings"],17,9],
        "1f4b9":[["\uD83D\uDCB9"],"\uE14A","\uDBB9\uDCDF",["chart"],17,10],
        "1f4ba":[["\uD83D\uDCBA"],"\uE11F","\uDBB9\uDD37",["seat"],17,11],
        "1f4bb":[["\uD83D\uDCBB"],"\uE00C","\uDBB9\uDD38",["computer"],17,12],
        "1f4bc":[["\uD83D\uDCBC"],"\uE11E","\uDBB9\uDD3B",["briefcase"],17,13],
        "1f4bd":[["\uD83D\uDCBD"],"\uE316","\uDBB9\uDD3C",["minidisc"],17,14],
        "1f4be":[["\uD83D\uDCBE"],"\uE316","\uDBB9\uDD3D",["floppy_disk"],17,15],
        "1f4bf":[["\uD83D\uDCBF"],"\uE126","\uDBBA\uDC1D",["cd"],17,16],
        "1f4c0":[["\uD83D\uDCC0"],"\uE127","\uDBBA\uDC1E",["dvd"],17,17],
        "1f4c1":[["\uD83D\uDCC1"],"","\uDBB9\uDD43",["file_folder"],17,18],
        "1f4c2":[["\uD83D\uDCC2"],"","\uDBB9\uDD44",["open_file_folder"],17,19],
        "1f4c3":[["\uD83D\uDCC3"],"\uE301","\uDBB9\uDD40",["page_with_curl"],17,20],
        "1f4c4":[["\uD83D\uDCC4"],"\uE301","\uDBB9\uDD41",["page_facing_up"],17,21],
        "1f4c5":[["\uD83D\uDCC5"],"","\uDBB9\uDD42",["date"],17,22],
        "1f4c6":[["\uD83D\uDCC6"],"","\uDBB9\uDD49",["calendar"],17,23],
        "1f4c7":[["\uD83D\uDCC7"],"\uE148","\uDBB9\uDD4D",["card_index"],17,24],
        "1f4c8":[["\uD83D\uDCC8"],"\uE14A","\uDBB9\uDD4B",["chart_with_upwards_trend"],17,25],
        "1f4c9":[["\uD83D\uDCC9"],"","\uDBB9\uDD4C",["chart_with_downwards_trend"],17,26],
        "1f4ca":[["\uD83D\uDCCA"],"\uE14A","\uDBB9\uDD4A",["bar_chart"],17,27],
        "1f4cb":[["\uD83D\uDCCB"],"\uE301","\uDBB9\uDD48",["clipboard"],17,28],
        "1f4cc":[["\uD83D\uDCCC"],"","\uDBB9\uDD4E",["pushpin"],17,29],
        "1f4cd":[["\uD83D\uDCCD"],"","\uDBB9\uDD3F",["round_pushpin"],18,0],
        "1f4ce":[["\uD83D\uDCCE"],"","\uDBB9\uDD3A",["paperclip"],18,1],
        "1f4cf":[["\uD83D\uDCCF"],"","\uDBB9\uDD50",["straight_ruler"],18,2],
        "1f4d0":[["\uD83D\uDCD0"],"","\uDBB9\uDD51",["triangular_ruler"],18,3],
        "1f4d1":[["\uD83D\uDCD1"],"\uE301","\uDBB9\uDD52",["bookmark_tabs"],18,4],
        "1f4d2":[["\uD83D\uDCD2"],"\uE148","\uDBB9\uDD4F",["ledger"],18,5],
        "1f4d3":[["\uD83D\uDCD3"],"\uE148","\uDBB9\uDD45",["notebook"],18,6],
        "1f4d4":[["\uD83D\uDCD4"],"\uE148","\uDBB9\uDD47",["notebook_with_decorative_cover"],18,7],
        "1f4d5":[["\uD83D\uDCD5"],"\uE148","\uDBB9\uDD02",["closed_book"],18,8],
        "1f4d6":[["\uD83D\uDCD6"],"\uE148","\uDBB9\uDD46",["book","open_book"],18,9],
        "1f4d7":[["\uD83D\uDCD7"],"\uE148","\uDBB9\uDCFF",["green_book"],18,10],
        "1f4d8":[["\uD83D\uDCD8"],"\uE148","\uDBB9\uDD00",["blue_book"],18,11],
        "1f4d9":[["\uD83D\uDCD9"],"\uE148","\uDBB9\uDD01",["orange_book"],18,12],
        "1f4da":[["\uD83D\uDCDA"],"\uE148","\uDBB9\uDD03",["books"],18,13],
        "1f4db":[["\uD83D\uDCDB"],"","\uDBB9\uDD04",["name_badge"],18,14],
        "1f4dc":[["\uD83D\uDCDC"],"","\uDBB9\uDCFD",["scroll"],18,15],
        "1f4dd":[["\uD83D\uDCDD"],"\uE301","\uDBB9\uDD27",["memo","pencil"],18,16],
        "1f4de":[["\uD83D\uDCDE"],"\uE009","\uDBB9\uDD24",["telephone_receiver"],18,17],
        "1f4df":[["\uD83D\uDCDF"],"","\uDBB9\uDD22",["pager"],18,18],
        "1f4e0":[["\uD83D\uDCE0"],"\uE00B","\uDBB9\uDD28",["fax"],18,19],
        "1f4e1":[["\uD83D\uDCE1"],"\uE14B","\uDBB9\uDD31",["satellite"],18,20],
        "1f4e2":[["\uD83D\uDCE2"],"\uE142","\uDBB9\uDD2F",["loudspeaker"],18,21],
        "1f4e3":[["\uD83D\uDCE3"],"\uE317","\uDBB9\uDD30",["mega"],18,22],
        "1f4e4":[["\uD83D\uDCE4"],"","\uDBB9\uDD33",["outbox_tray"],18,23],
        "1f4e5":[["\uD83D\uDCE5"],"","\uDBB9\uDD34",["inbox_tray"],18,24],
        "1f4e6":[["\uD83D\uDCE6"],"\uE112","\uDBB9\uDD35",["package"],18,25],
        "1f4e7":[["\uD83D\uDCE7"],"\uE103","\uDBBA\uDF92",["e-mail"],18,26],
        "1f4e8":[["\uD83D\uDCE8"],"\uE103","\uDBB9\uDD2A",["incoming_envelope"],18,27],
        "1f4e9":[["\uD83D\uDCE9"],"\uE103","\uDBB9\uDD2B",["envelope_with_arrow"],18,28],
        "1f4ea":[["\uD83D\uDCEA"],"\uE101","\uDBB9\uDD2C",["mailbox_closed"],18,29],
        "1f4eb":[["\uD83D\uDCEB"],"\uE101","\uDBB9\uDD2D",["mailbox"],19,0],
        "1f4ec":[["\uD83D\uDCEC"],"","",["mailbox_with_mail"],19,1],
        "1f4ed":[["\uD83D\uDCED"],"","",["mailbox_with_no_mail"],19,2],
        "1f4ee":[["\uD83D\uDCEE"],"\uE102","\uDBB9\uDD2E",["postbox"],19,3],
        "1f4ef":[["\uD83D\uDCEF"],"","",["postal_horn"],19,4],
        "1f4f0":[["\uD83D\uDCF0"],"","\uDBBA\uDC22",["newspaper"],19,5],
        "1f4f1":[["\uD83D\uDCF1"],"\uE00A","\uDBB9\uDD25",["iphone"],19,6],
        "1f4f2":[["\uD83D\uDCF2"],"\uE104","\uDBB9\uDD26",["calling"],19,7],
        "1f4f3":[["\uD83D\uDCF3"],"\uE250","\uDBBA\uDC39",["vibration_mode"],19,8],
        "1f4f4":[["\uD83D\uDCF4"],"\uE251","\uDBBA\uDC3A",["mobile_phone_off"],19,9],
        "1f4f5":[["\uD83D\uDCF5"],"","",["no_mobile_phones"],19,10],
        "1f4f6":[["\uD83D\uDCF6"],"\uE20B","\uDBBA\uDC38",["signal_strength"],19,11],
        "1f4f7":[["\uD83D\uDCF7"],"\uE008","\uDBB9\uDCEF",["camera"],19,12],
        "1f4f9":[["\uD83D\uDCF9"],"\uE03D","\uDBB9\uDCF9",["video_camera"],19,13],
        "1f4fa":[["\uD83D\uDCFA"],"\uE12A","\uDBBA\uDC1C",["tv"],19,14],
        "1f4fb":[["\uD83D\uDCFB"],"\uE128","\uDBBA\uDC1F",["radio"],19,15],
        "1f4fc":[["\uD83D\uDCFC"],"\uE129","\uDBBA\uDC20",["vhs"],19,16],
        "1f500":[["\uD83D\uDD00"],"","",["twisted_rightwards_arrows"],19,17],
        "1f501":[["\uD83D\uDD01"],"","",["repeat"],19,18],
        "1f502":[["\uD83D\uDD02"],"","",["repeat_one"],19,19],
        "1f503":[["\uD83D\uDD03"],"","\uDBBA\uDF91",["arrows_clockwise"],19,20],
        "1f504":[["\uD83D\uDD04"],"","",["arrows_counterclockwise"],19,21],
        "1f505":[["\uD83D\uDD05"],"","",["low_brightness"],19,22],
        "1f506":[["\uD83D\uDD06"],"","",["high_brightness"],19,23],
        "1f507":[["\uD83D\uDD07"],"","",["mute"],19,24],
        "1f508":[["\uD83D\uDD08"],"","",["speaker"],19,25],
        "1f509":[["\uD83D\uDD09"],"","",["sound"],19,26],
        "1f50a":[["\uD83D\uDD0A"],"\uE141","\uDBBA\uDC21",["loud_sound"],19,27],
        "1f50b":[["\uD83D\uDD0B"],"","\uDBB9\uDCFC",["battery"],19,28],
        "1f50c":[["\uD83D\uDD0C"],"","\uDBB9\uDCFE",["electric_plug"],19,29],
        "1f50d":[["\uD83D\uDD0D"],"\uE114","\uDBBA\uDF85",["mag"],20,0],
        "1f50e":[["\uD83D\uDD0E"],"\uE114","\uDBBA\uDF8D",["mag_right"],20,1],
        "1f50f":[["\uD83D\uDD0F"],"\uE144","\uDBBA\uDF90",["lock_with_ink_pen"],20,2],
        "1f510":[["\uD83D\uDD10"],"\uE144","\uDBBA\uDF8A",["closed_lock_with_key"],20,3],
        "1f511":[["\uD83D\uDD11"],"\uE03F","\uDBBA\uDF82",["key"],20,4],
        "1f512":[["\uD83D\uDD12"],"\uE144","\uDBBA\uDF86",["lock"],20,5],
        "1f513":[["\uD83D\uDD13"],"\uE145","\uDBBA\uDF87",["unlock"],20,6],
        "1f514":[["\uD83D\uDD14"],"\uE325","\uDBB9\uDCF2",["bell"],20,7],
        "1f515":[["\uD83D\uDD15"],"","",["no_bell"],20,8],
        "1f516":[["\uD83D\uDD16"],"","\uDBBA\uDF8F",["bookmark"],20,9],
        "1f517":[["\uD83D\uDD17"],"","\uDBBA\uDF4B",["link"],20,10],
        "1f518":[["\uD83D\uDD18"],"","\uDBBA\uDF8C",["radio_button"],20,11],
        "1f519":[["\uD83D\uDD19"],"\uE235","\uDBBA\uDF8E",["back"],20,12],
        "1f51a":[["\uD83D\uDD1A"],"","\uDBB8\uDC1A",["end"],20,13],
        "1f51b":[["\uD83D\uDD1B"],"","\uDBB8\uDC19",["on"],20,14],
        "1f51c":[["\uD83D\uDD1C"],"","\uDBB8\uDC18",["soon"],20,15],
        "1f51d":[["\uD83D\uDD1D"],"\uE24C","\uDBBA\uDF42",["top"],20,16],
        "1f51e":[["\uD83D\uDD1E"],"\uE207","\uDBBA\uDF25",["underage"],20,17],
        "1f51f":[["\uD83D\uDD1F"],"","\uDBBA\uDC3B",["keycap_ten"],20,18],
        "1f520":[["\uD83D\uDD20"],"","\uDBBA\uDF7C",["capital_abcd"],20,19],
        "1f521":[["\uD83D\uDD21"],"","\uDBBA\uDF7D",["abcd"],20,20],
        "1f522":[["\uD83D\uDD22"],"","\uDBBA\uDF7E",["1234"],20,21],
        "1f523":[["\uD83D\uDD23"],"","\uDBBA\uDF7F",["symbols"],20,22],
        "1f524":[["\uD83D\uDD24"],"","\uDBBA\uDF80",["abc"],20,23],
        "1f525":[["\uD83D\uDD25"],"\uE11D","\uDBB9\uDCF6",["fire"],20,24],
        "1f526":[["\uD83D\uDD26"],"","\uDBB9\uDCFB",["flashlight"],20,25],
        "1f527":[["\uD83D\uDD27"],"","\uDBB9\uDCC9",["wrench"],20,26],
        "1f528":[["\uD83D\uDD28"],"\uE116","\uDBB9\uDCCA",["hammer"],20,27],
        "1f529":[["\uD83D\uDD29"],"","\uDBB9\uDCCB",["nut_and_bolt"],20,28],
        "1f52a":[["\uD83D\uDD2A"],"","\uDBB9\uDCFA",["hocho","knife"],20,29],
        "1f52b":[["\uD83D\uDD2B"],"\uE113","\uDBB9\uDCF5",["gun"],21,0],
        "1f52c":[["\uD83D\uDD2C"],"","",["microscope"],21,1],
        "1f52d":[["\uD83D\uDD2D"],"","",["telescope"],21,2],
        "1f52e":[["\uD83D\uDD2E"],"\uE23E","\uDBB9\uDCF7",["crystal_ball"],21,3],
        "1f52f":[["\uD83D\uDD2F"],"\uE23E","\uDBB9\uDCF8",["six_pointed_star"],21,4],
        "1f530":[["\uD83D\uDD30"],"\uE209","\uDBB8\uDC44",["beginner"],21,5],
        "1f531":[["\uD83D\uDD31"],"\uE031","\uDBB9\uDCD2",["trident"],21,6],
        "1f532":[["\uD83D\uDD32"],"\uE21A","\uDBBA\uDF64",["black_square_button"],21,7],
        "1f533":[["\uD83D\uDD33"],"\uE21B","\uDBBA\uDF67",["white_square_button"],21,8],
        "1f534":[["\uD83D\uDD34"],"\uE219","\uDBBA\uDF63",["red_circle"],21,9],
        "1f535":[["\uD83D\uDD35"],"\uE21A","\uDBBA\uDF64",["large_blue_circle"],21,10],
        "1f536":[["\uD83D\uDD36"],"\uE21B","\uDBBA\uDF73",["large_orange_diamond"],21,11],
        "1f537":[["\uD83D\uDD37"],"\uE21B","\uDBBA\uDF74",["large_blue_diamond"],21,12],
        "1f538":[["\uD83D\uDD38"],"\uE21B","\uDBBA\uDF75",["small_orange_diamond"],21,13],
        "1f539":[["\uD83D\uDD39"],"\uE21B","\uDBBA\uDF76",["small_blue_diamond"],21,14],
        "1f53a":[["\uD83D\uDD3A"],"","\uDBBA\uDF78",["small_red_triangle"],21,15],
        "1f53b":[["\uD83D\uDD3B"],"","\uDBBA\uDF79",["small_red_triangle_down"],21,16],
        "1f53c":[["\uD83D\uDD3C"],"","\uDBBA\uDF01",["arrow_up_small"],21,17],
        "1f53d":[["\uD83D\uDD3D"],"","\uDBBA\uDF00",["arrow_down_small"],21,18],
        "1f550":[["\uD83D\uDD50"],"\uE024","\uDBB8\uDC1E",["clock1"],21,19],
        "1f551":[["\uD83D\uDD51"],"\uE025","\uDBB8\uDC1F",["clock2"],21,20],
        "1f552":[["\uD83D\uDD52"],"\uE026","\uDBB8\uDC20",["clock3"],21,21],
        "1f553":[["\uD83D\uDD53"],"\uE027","\uDBB8\uDC21",["clock4"],21,22],
        "1f554":[["\uD83D\uDD54"],"\uE028","\uDBB8\uDC22",["clock5"],21,23],
        "1f555":[["\uD83D\uDD55"],"\uE029","\uDBB8\uDC23",["clock6"],21,24],
        "1f556":[["\uD83D\uDD56"],"\uE02A","\uDBB8\uDC24",["clock7"],21,25],
        "1f557":[["\uD83D\uDD57"],"\uE02B","\uDBB8\uDC25",["clock8"],21,26],
        "1f558":[["\uD83D\uDD58"],"\uE02C","\uDBB8\uDC26",["clock9"],21,27],
        "1f559":[["\uD83D\uDD59"],"\uE02D","\uDBB8\uDC27",["clock10"],21,28],
        "1f55a":[["\uD83D\uDD5A"],"\uE02E","\uDBB8\uDC28",["clock11"],21,29],
        "1f55b":[["\uD83D\uDD5B"],"\uE02F","\uDBB8\uDC29",["clock12"],22,0],
        "1f55c":[["\uD83D\uDD5C"],"","",["clock130"],22,1],
        "1f55d":[["\uD83D\uDD5D"],"","",["clock230"],22,2],
        "1f55e":[["\uD83D\uDD5E"],"","",["clock330"],22,3],
        "1f55f":[["\uD83D\uDD5F"],"","",["clock430"],22,4],
        "1f560":[["\uD83D\uDD60"],"","",["clock530"],22,5],
        "1f561":[["\uD83D\uDD61"],"","",["clock630"],22,6],
        "1f562":[["\uD83D\uDD62"],"","",["clock730"],22,7],
        "1f563":[["\uD83D\uDD63"],"","",["clock830"],22,8],
        "1f564":[["\uD83D\uDD64"],"","",["clock930"],22,9],
        "1f565":[["\uD83D\uDD65"],"","",["clock1030"],22,10],
        "1f566":[["\uD83D\uDD66"],"","",["clock1130"],22,11],
        "1f567":[["\uD83D\uDD67"],"","",["clock1230"],22,12],
        "1f5fb":[["\uD83D\uDDFB"],"\uE03B","\uDBB9\uDCC3",["mount_fuji"],22,13],
        "1f5fc":[["\uD83D\uDDFC"],"\uE509","\uDBB9\uDCC4",["tokyo_tower"],22,14],
        "1f5fd":[["\uD83D\uDDFD"],"\uE51D","\uDBB9\uDCC6",["statue_of_liberty"],22,15],
        "1f5fe":[["\uD83D\uDDFE"],"","\uDBB9\uDCC7",["japan"],22,16],
        "1f5ff":[["\uD83D\uDDFF"],"","\uDBB9\uDCC8",["moyai"],22,17],
        "1f600":[["\uD83D\uDE00"],"","",["grinning"],22,18,":D"],
        "1f601":[["\uD83D\uDE01"],"\uE404","\uDBB8\uDF33",["grin"],22,19],
        "1f602":[["\uD83D\uDE02"],"\uE412","\uDBB8\uDF34",["joy"],22,20],
        "1f603":[["\uD83D\uDE03"],"\uE057","\uDBB8\uDF30",["smiley"],22,21,":)"],
        "1f604":[["\uD83D\uDE04"],"\uE415","\uDBB8\uDF38",["smile"],22,22,":)"],
        "1f605":[["\uD83D\uDE05"],"\uE415\uE331","\uDBB8\uDF31",["sweat_smile"],22,23],
        "1f606":[["\uD83D\uDE06"],"\uE40A","\uDBB8\uDF32",["laughing","satisfied"],22,24],
        "1f607":[["\uD83D\uDE07"],"","",["innocent"],22,25],
        "1f608":[["\uD83D\uDE08"],"","",["smiling_imp"],22,26],
        "1f609":[["\uD83D\uDE09"],"\uE405","\uDBB8\uDF47",["wink"],22,27,";)"],
        "1f60a":[["\uD83D\uDE0A"],"\uE056","\uDBB8\uDF35",["blush"],22,28],
        "1f60b":[["\uD83D\uDE0B"],"\uE056","\uDBB8\uDF2B",["yum"],22,29],
        "1f60c":[["\uD83D\uDE0C"],"\uE40A","\uDBB8\uDF3E",["relieved"],23,0],
        "1f60d":[["\uD83D\uDE0D"],"\uE106","\uDBB8\uDF27",["heart_eyes"],23,1],
        "1f60e":[["\uD83D\uDE0E"],"","",["sunglasses"],23,2],
        "1f60f":[["\uD83D\uDE0F"],"\uE402","\uDBB8\uDF43",["smirk"],23,3],
        "1f610":[["\uD83D\uDE10"],"","",["neutral_face"],23,4],
        "1f611":[["\uD83D\uDE11"],"","",["expressionless"],23,5],
        "1f612":[["\uD83D\uDE12"],"\uE40E","\uDBB8\uDF26",["unamused"],23,6],
        "1f613":[["\uD83D\uDE13"],"\uE108","\uDBB8\uDF44",["sweat"],23,7],
        "1f614":[["\uD83D\uDE14"],"\uE403","\uDBB8\uDF40",["pensive"],23,8],
        "1f615":[["\uD83D\uDE15"],"","",["confused"],23,9],
        "1f616":[["\uD83D\uDE16"],"\uE407","\uDBB8\uDF3F",["confounded"],23,10],
        "1f617":[["\uD83D\uDE17"],"","",["kissing"],23,11],
        "1f618":[["\uD83D\uDE18"],"\uE418","\uDBB8\uDF2C",["kissing_heart"],23,12],
        "1f619":[["\uD83D\uDE19"],"","",["kissing_smiling_eyes"],23,13],
        "1f61a":[["\uD83D\uDE1A"],"\uE417","\uDBB8\uDF2D",["kissing_closed_eyes"],23,14],
        "1f61b":[["\uD83D\uDE1B"],"","",["stuck_out_tongue"],23,15,":p"],
        "1f61c":[["\uD83D\uDE1C"],"\uE105","\uDBB8\uDF29",["stuck_out_tongue_winking_eye"],23,16,";p"],
        "1f61d":[["\uD83D\uDE1D"],"\uE409","\uDBB8\uDF2A",["stuck_out_tongue_closed_eyes"],23,17],
        "1f61e":[["\uD83D\uDE1E"],"\uE058","\uDBB8\uDF23",["disappointed"],23,18,":("],
        "1f61f":[["\uD83D\uDE1F"],"","",["worried"],23,19],
        "1f620":[["\uD83D\uDE20"],"\uE059","\uDBB8\uDF20",["angry"],23,20],
        "1f621":[["\uD83D\uDE21"],"\uE416","\uDBB8\uDF3D",["rage"],23,21],
        "1f622":[["\uD83D\uDE22"],"\uE413","\uDBB8\uDF39",["cry"],23,22,":'("],
        "1f623":[["\uD83D\uDE23"],"\uE406","\uDBB8\uDF3C",["persevere"],23,23],
        "1f624":[["\uD83D\uDE24"],"\uE404","\uDBB8\uDF28",["triumph"],23,24],
        "1f625":[["\uD83D\uDE25"],"\uE401","\uDBB8\uDF45",["disappointed_relieved"],23,25],
        "1f626":[["\uD83D\uDE26"],"","",["frowning"],23,26],
        "1f627":[["\uD83D\uDE27"],"","",["anguished"],23,27],
        "1f628":[["\uD83D\uDE28"],"\uE40B","\uDBB8\uDF3B",["fearful"],23,28],
        "1f629":[["\uD83D\uDE29"],"\uE403","\uDBB8\uDF21",["weary"],23,29],
        "1f62a":[["\uD83D\uDE2A"],"\uE408","\uDBB8\uDF42",["sleepy"],24,0],
        "1f62b":[["\uD83D\uDE2B"],"\uE406","\uDBB8\uDF46",["tired_face"],24,1],
        "1f62c":[["\uD83D\uDE2C"],"","",["grimacing"],24,2],
        "1f62d":[["\uD83D\uDE2D"],"\uE411","\uDBB8\uDF3A",["sob"],24,3,":'("],
        "1f62e":[["\uD83D\uDE2E"],"","",["open_mouth"],24,4],
        "1f62f":[["\uD83D\uDE2F"],"","",["hushed"],24,5],
        "1f630":[["\uD83D\uDE30"],"\uE40F","\uDBB8\uDF25",["cold_sweat"],24,6],
        "1f631":[["\uD83D\uDE31"],"\uE107","\uDBB8\uDF41",["scream"],24,7],
        "1f632":[["\uD83D\uDE32"],"\uE410","\uDBB8\uDF22",["astonished"],24,8],
        "1f633":[["\uD83D\uDE33"],"\uE40D","\uDBB8\uDF2F",["flushed"],24,9],
        "1f634":[["\uD83D\uDE34"],"","",["sleeping"],24,10],
        "1f635":[["\uD83D\uDE35"],"\uE406","\uDBB8\uDF24",["dizzy_face"],24,11],
        "1f636":[["\uD83D\uDE36"],"","",["no_mouth"],24,12],
        "1f637":[["\uD83D\uDE37"],"\uE40C","\uDBB8\uDF2E",["mask"],24,13],
        "1f638":[["\uD83D\uDE38"],"\uE404","\uDBB8\uDF49",["smile_cat"],24,14],
        "1f639":[["\uD83D\uDE39"],"\uE412","\uDBB8\uDF4A",["joy_cat"],24,15],
        "1f63a":[["\uD83D\uDE3A"],"\uE057","\uDBB8\uDF48",["smiley_cat"],24,16],
        "1f63b":[["\uD83D\uDE3B"],"\uE106","\uDBB8\uDF4C",["heart_eyes_cat"],24,17],
        "1f63c":[["\uD83D\uDE3C"],"\uE404","\uDBB8\uDF4F",["smirk_cat"],24,18],
        "1f63d":[["\uD83D\uDE3D"],"\uE418","\uDBB8\uDF4B",["kissing_cat"],24,19],
        "1f63e":[["\uD83D\uDE3E"],"\uE416","\uDBB8\uDF4E",["pouting_cat"],24,20],
        "1f63f":[["\uD83D\uDE3F"],"\uE413","\uDBB8\uDF4D",["crying_cat_face"],24,21],
        "1f640":[["\uD83D\uDE40"],"\uE403","\uDBB8\uDF50",["scream_cat"],24,22],
        "1f645":[["\uD83D\uDE45"],"\uE423","\uDBB8\uDF51",["no_good"],24,23],
        "1f646":[["\uD83D\uDE46"],"\uE424","\uDBB8\uDF52",["ok_woman"],24,24],
        "1f647":[["\uD83D\uDE47"],"\uE426","\uDBB8\uDF53",["bow"],24,25],
        "1f648":[["\uD83D\uDE48"],"","\uDBB8\uDF54",["see_no_evil"],24,26],
        "1f649":[["\uD83D\uDE49"],"","\uDBB8\uDF56",["hear_no_evil"],24,27],
        "1f64a":[["\uD83D\uDE4A"],"","\uDBB8\uDF55",["speak_no_evil"],24,28],
        "1f64b":[["\uD83D\uDE4B"],"\uE012","\uDBB8\uDF57",["raising_hand"],24,29],
        "1f64c":[["\uD83D\uDE4C"],"\uE427","\uDBB8\uDF58",["raised_hands"],25,0],
        "1f64d":[["\uD83D\uDE4D"],"\uE403","\uDBB8\uDF59",["person_frowning"],25,1],
        "1f64e":[["\uD83D\uDE4E"],"\uE416","\uDBB8\uDF5A",["person_with_pouting_face"],25,2],
        "1f64f":[["\uD83D\uDE4F"],"\uE41D","\uDBB8\uDF5B",["pray"],25,3],
        "1f680":[["\uD83D\uDE80"],"\uE10D","\uDBB9\uDFED",["rocket"],25,4],
        "1f681":[["\uD83D\uDE81"],"","",["helicopter"],25,5],
        "1f682":[["\uD83D\uDE82"],"","",["steam_locomotive"],25,6],
        "1f683":[["\uD83D\uDE83"],"\uE01E","\uDBB9\uDFDF",["railway_car"],25,7],
        "1f684":[["\uD83D\uDE84"],"\uE435","\uDBB9\uDFE2",["bullettrain_side"],25,8],
        "1f685":[["\uD83D\uDE85"],"\uE01F","\uDBB9\uDFE3",["bullettrain_front"],25,9],
        "1f686":[["\uD83D\uDE86"],"","",["train2"],25,10],
        "1f687":[["\uD83D\uDE87"],"\uE434","\uDBB9\uDFE0",["metro"],25,11],
        "1f688":[["\uD83D\uDE88"],"","",["light_rail"],25,12],
        "1f689":[["\uD83D\uDE89"],"\uE039","\uDBB9\uDFEC",["station"],25,13],
        "1f68a":[["\uD83D\uDE8A"],"","",["tram"],25,14],
        "1f68b":[["\uD83D\uDE8B"],"","",["train"],25,15],
        "1f68c":[["\uD83D\uDE8C"],"\uE159","\uDBB9\uDFE6",["bus"],25,16],
        "1f68d":[["\uD83D\uDE8D"],"","",["oncoming_bus"],25,17],
        "1f68e":[["\uD83D\uDE8E"],"","",["trolleybus"],25,18],
        "1f68f":[["\uD83D\uDE8F"],"\uE150","\uDBB9\uDFE7",["busstop"],25,19],
        "1f690":[["\uD83D\uDE90"],"","",["minibus"],25,20],
        "1f691":[["\uD83D\uDE91"],"\uE431","\uDBB9\uDFF3",["ambulance"],25,21],
        "1f692":[["\uD83D\uDE92"],"\uE430","\uDBB9\uDFF2",["fire_engine"],25,22],
        "1f693":[["\uD83D\uDE93"],"\uE432","\uDBB9\uDFF4",["police_car"],25,23],
        "1f694":[["\uD83D\uDE94"],"","",["oncoming_police_car"],25,24],
        "1f695":[["\uD83D\uDE95"],"\uE15A","\uDBB9\uDFEF",["taxi"],25,25],
        "1f696":[["\uD83D\uDE96"],"","",["oncoming_taxi"],25,26],
        "1f697":[["\uD83D\uDE97"],"\uE01B","\uDBB9\uDFE4",["car","red_car"],25,27],
        "1f698":[["\uD83D\uDE98"],"","",["oncoming_automobile"],25,28],
        "1f699":[["\uD83D\uDE99"],"\uE42E","\uDBB9\uDFE5",["blue_car"],25,29],
        "1f69a":[["\uD83D\uDE9A"],"\uE42F","\uDBB9\uDFF1",["truck"],26,0],
        "1f69b":[["\uD83D\uDE9B"],"","",["articulated_lorry"],26,1],
        "1f69c":[["\uD83D\uDE9C"],"","",["tractor"],26,2],
        "1f69d":[["\uD83D\uDE9D"],"","",["monorail"],26,3],
        "1f69e":[["\uD83D\uDE9E"],"","",["mountain_railway"],26,4],
        "1f69f":[["\uD83D\uDE9F"],"","",["suspension_railway"],26,5],
        "1f6a0":[["\uD83D\uDEA0"],"","",["mountain_cableway"],26,6],
        "1f6a1":[["\uD83D\uDEA1"],"","",["aerial_tramway"],26,7],
        "1f6a2":[["\uD83D\uDEA2"],"\uE202","\uDBB9\uDFE8",["ship"],26,8],
        "1f6a3":[["\uD83D\uDEA3"],"","",["rowboat"],26,9],
        "1f6a4":[["\uD83D\uDEA4"],"\uE135","\uDBB9\uDFEE",["speedboat"],26,10],
        "1f6a5":[["\uD83D\uDEA5"],"\uE14E","\uDBB9\uDFF7",["traffic_light"],26,11],
        "1f6a6":[["\uD83D\uDEA6"],"","",["vertical_traffic_light"],26,12],
        "1f6a7":[["\uD83D\uDEA7"],"\uE137","\uDBB9\uDFF8",["construction"],26,13],
        "1f6a8":[["\uD83D\uDEA8"],"\uE432","\uDBB9\uDFF9",["rotating_light"],26,14],
        "1f6a9":[["\uD83D\uDEA9"],"","\uDBBA\uDF22",["triangular_flag_on_post"],26,15],
        "1f6aa":[["\uD83D\uDEAA"],"","\uDBB9\uDCF3",["door"],26,16],
        "1f6ab":[["\uD83D\uDEAB"],"","\uDBBA\uDF48",["no_entry_sign"],26,17],
        "1f6ac":[["\uD83D\uDEAC"],"\uE30E","\uDBBA\uDF1E",["smoking"],26,18],
        "1f6ad":[["\uD83D\uDEAD"],"\uE208","\uDBBA\uDF1F",["no_smoking"],26,19],
        "1f6ae":[["\uD83D\uDEAE"],"","",["put_litter_in_its_place"],26,20],
        "1f6af":[["\uD83D\uDEAF"],"","",["do_not_litter"],26,21],
        "1f6b0":[["\uD83D\uDEB0"],"","",["potable_water"],26,22],
        "1f6b1":[["\uD83D\uDEB1"],"","",["non-potable_water"],26,23],
        "1f6b2":[["\uD83D\uDEB2"],"\uE136","\uDBB9\uDFEB",["bike"],26,24],
        "1f6b3":[["\uD83D\uDEB3"],"","",["no_bicycles"],26,25],
        "1f6b4":[["\uD83D\uDEB4"],"","",["bicyclist"],26,26],
        "1f6b5":[["\uD83D\uDEB5"],"","",["mountain_bicyclist"],26,27],
        "1f6b6":[["\uD83D\uDEB6"],"\uE201","\uDBB9\uDFF0",["walking"],26,28],
        "1f6b7":[["\uD83D\uDEB7"],"","",["no_pedestrians"],26,29],
        "1f6b8":[["\uD83D\uDEB8"],"","",["children_crossing"],27,0],
        "1f6b9":[["\uD83D\uDEB9"],"\uE138","\uDBBA\uDF33",["mens"],27,1],
        "1f6ba":[["\uD83D\uDEBA"],"\uE139","\uDBBA\uDF34",["womens"],27,2],
        "1f6bb":[["\uD83D\uDEBB"],"\uE151","\uDBB9\uDD06",["restroom"],27,3],
        "1f6bc":[["\uD83D\uDEBC"],"\uE13A","\uDBBA\uDF35",["baby_symbol"],27,4],
        "1f6bd":[["\uD83D\uDEBD"],"\uE140","\uDBB9\uDD07",["toilet"],27,5],
        "1f6be":[["\uD83D\uDEBE"],"\uE309","\uDBB9\uDD08",["wc"],27,6],
        "1f6bf":[["\uD83D\uDEBF"],"","",["shower"],27,7],
        "1f6c0":[["\uD83D\uDEC0"],"\uE13F","\uDBB9\uDD05",["bath"],27,8],
        "1f6c1":[["\uD83D\uDEC1"],"","",["bathtub"],27,9],
        "1f6c2":[["\uD83D\uDEC2"],"","",["passport_control"],27,10],
        "1f6c3":[["\uD83D\uDEC3"],"","",["customs"],27,11],
        "1f6c4":[["\uD83D\uDEC4"],"","",["baggage_claim"],27,12],
        "1f6c5":[["\uD83D\uDEC5"],"","",["left_luggage"],27,13],
        "0023-20e3":[["\u0023\uFE0F\u20E3","\u0023\u20E3"],"\uE210","\uDBBA\uDC2C",["hash"],27,14],
        "0030-20e3":[["\u0030\uFE0F\u20E3","\u0030\u20E3"],"\uE225","\uDBBA\uDC37",["zero"],27,15],
        "0031-20e3":[["\u0031\uFE0F\u20E3","\u0031\u20E3"],"\uE21C","\uDBBA\uDC2E",["one"],27,16],
        "0032-20e3":[["\u0032\uFE0F\u20E3","\u0032\u20E3"],"\uE21D","\uDBBA\uDC2F",["two"],27,17],
        "0033-20e3":[["\u0033\uFE0F\u20E3","\u0033\u20E3"],"\uE21E","\uDBBA\uDC30",["three"],27,18],
        "0034-20e3":[["\u0034\uFE0F\u20E3","\u0034\u20E3"],"\uE21F","\uDBBA\uDC31",["four"],27,19],
        "0035-20e3":[["\u0035\uFE0F\u20E3","\u0035\u20E3"],"\uE220","\uDBBA\uDC32",["five"],27,20],
        "0036-20e3":[["\u0036\uFE0F\u20E3","\u0036\u20E3"],"\uE221","\uDBBA\uDC33",["six"],27,21],
        "0037-20e3":[["\u0037\uFE0F\u20E3","\u0037\u20E3"],"\uE222","\uDBBA\uDC34",["seven"],27,22],
        "0038-20e3":[["\u0038\uFE0F\u20E3","\u0038\u20E3"],"\uE223","\uDBBA\uDC35",["eight"],27,23],
        "0039-20e3":[["\u0039\uFE0F\u20E3","\u0039\u20E3"],"\uE224","\uDBBA\uDC36",["nine"],27,24],
        "1f1e8-1f1f3":[["\uD83C\uDDE8\uD83C\uDDF3"],"\uE513","\uDBB9\uDCED",["cn"],27,25],
        "1f1e9-1f1ea":[["\uD83C\uDDE9\uD83C\uDDEA"],"\uE50E","\uDBB9\uDCE8",["de"],27,26],
        "1f1ea-1f1f8":[["\uD83C\uDDEA\uD83C\uDDF8"],"\uE511","\uDBB9\uDCEB",["es"],27,27],
        "1f1eb-1f1f7":[["\uD83C\uDDEB\uD83C\uDDF7"],"\uE50D","\uDBB9\uDCE7",["fr"],27,28],
        "1f1ec-1f1e7":[["\uD83C\uDDEC\uD83C\uDDE7"],"\uE510","\uDBB9\uDCEA",["gb","uk"],27,29],
        "1f1ee-1f1f9":[["\uD83C\uDDEE\uD83C\uDDF9"],"\uE50F","\uDBB9\uDCE9",["it"],28,0],
        "1f1ef-1f1f5":[["\uD83C\uDDEF\uD83C\uDDF5"],"\uE50B","\uDBB9\uDCE5",["jp"],28,1],
        "1f1f0-1f1f7":[["\uD83C\uDDF0\uD83C\uDDF7"],"\uE514","\uDBB9\uDCEE",["kr"],28,2],
        "1f1f7-1f1fa":[["\uD83C\uDDF7\uD83C\uDDFA"],"\uE512","\uDBB9\uDCEC",["ru"],28,3],
        "1f1fa-1f1f8":[["\uD83C\uDDFA\uD83C\uDDF8"],"\uE50C","\uDBB9\uDCE6",["us"],28,4]
    };
    emoji.emoticons_data = {
        "<3":"heart",
        "<\/3":"broken_heart",
        ":)":"blush",
        "(:":"blush",
        ":-)":"blush",
        "C:":"smile",
        "c:":"smile",
        ":D":"smile",
        ":-D":"smile",
        ";)":"wink",
        ";-)":"wink",
        "):":"disappointed",
        ":(":"disappointed",
        ":-(":"disappointed",
        ":'(":"cry",
        "=)":"smiley",
        "=-)":"smiley",
        ":*":"kiss",
        ":-*":"kiss",
        ":>":"laughing",
        ":->":"laughing",
        "8)":"sunglasses",
        ":\\\\":"confused",
        ":-\\\\":"confused",
        ":\/":"confused",
        ":-\/":"confused",
        ":|":"neutral_face",
        ":-|":"neutral_face",
        ":o":"open_mouth",
        ":-o":"open_mouth",
        ">:(":"angry",
        ">:-(":"angry",
        ":p":"stuck_out_tongue",
        ":-p":"stuck_out_tongue",
        ":P":"stuck_out_tongue",
        ":-P":"stuck_out_tongue",
        ":b":"stuck_out_tongue",
        ":-b":"stuck_out_tongue",
        ";p":"stuck_out_tongue_winking_eye",
        ";-p":"stuck_out_tongue_winking_eye",
        ";b":"stuck_out_tongue_winking_eye",
        ";-b":"stuck_out_tongue_winking_eye",
        ";P":"stuck_out_tongue_winking_eye",
        ";-P":"stuck_out_tongue_winking_eye",
        ":o)":"monkey_face",
        "D:":"anguished"
    };

if (typeof exports === 'object') {
  module.exports = emoji;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return emoji; });
} else {
  this.emoji = emoji;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
var sprintf = require('util').format;
var emoji = require('./emoji/emoji.js');
emoji.allow_native = false;

var fastclick = require('fastclick');
fastclick(document.body);

var parts = {
    head: ['dog', 'cat', 'mouse', 'hamster', 'rabbit', 'tiger', 'frog', 'koala', 'bear', 'pig', 'cow', 'monkey_face', 'panda_face', 'japanese_ogre', 'skull', 'alien', 'hankey', 'jack_o_lantern', 'santa', 'sun_with_face', 'full_moon_with_face', 'smiley_cat', 'smile_cat', 'heart_eyes_cat', 'kissing_cat', 'smirk_cat', 'scream_cat', 'crying_cat_face', 'joy_cat', 'pouting_cat', 'man_with_gua_pi_mao', 'man_with_turban', 'cop', 'construction_worker', 'guardsman', 'baby', 'boy', 'girl', 'man', 'woman', 'older_man', 'older_woman', 'person_with_blond_hair', 'angel', 'princess'],
    hat: ['tophat', 'ribbon', 'crown', 'womans_hat', 'mortar_board'],
    body: ['shirt', 'womans_clothes', 'dress', 'bikini', 'kimono', 'running_shirt_with_sash'],
    shoes: ['athletic_shoe', 'mans_shoe', 'sandal', 'high_heel', 'boot'],
    left_arm: ['iphone', 'wine_glass', 'cocktail', 'handbag', 'briefcase', 'icecream', 'cookie', 'basketball', 'moneybag', 'video_game', 'balloon', 'movie_camera', 'loudspeaker', 'mega', 'gun', 'smoking', 'microphone', 'saxophone', 'trumpet', 'fishing_pole_and_fish', 'tropical_drink', 'lollipop', 'ok_hand', 'wave', 'fist', 'facepunch', 'hand', 'point_left', 'muscle', 'chocolate_bar', 'spaghetti', 'banana', 'oden', 'dango', 'egg', 'hammer', 'baby_bottle'],
    right_arm: ['iphone', 'wine_glass', 'cocktail', 'handbag', 'briefcase', 'icecream', 'cookie', 'basketball', 'moneybag', 'video_game', 'telephone_receiver', 'tada', 'hocho', 'syringe', 'violin', 'guitar', 'closed_umbrella', '+1', '-1', 'point_right', 'pizza', 'poultry_leg', 'meat_on_bone', 'notebook', 'ledger', 'notebook_with_decorative_cover', 'postal_horn', 'art', 'clapper', 'football', 'rugby_football']
}
var template = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;%s<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;%s<br>%s%s%s<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;%s%s<br>'
var tweetTemplate = '    %s \n    %s \n  %s%s%s\n   %s%s\n';

var holder = document.querySelector('.holder');

var tweetBtn = document.querySelector('.tweet');
var generate = function (username) {
    var dude = {};
    Object.keys(parts).forEach(function (part) {
        var arr = parts[part];

        dude[part] = sprintf(':%s:', arr[Math.floor(Math.random() * arr.length)]); 
    });

    var html = sprintf(template, dude.hat, dude.head, dude.left_arm, dude.body, dude.right_arm, dude.shoes, dude.shoes);
    holder.innerHTML = emoji.replace_colons(html);

    emoji.just_unified = true;
    var tweet = emoji.replace_colons(sprintf(tweetTemplate, dude.hat, dude.head, dude.left_arm, dude.body, dude.right_arm, dude.shoes, dude.shoes));
    emoji.just_unified = false;

    tweetBtn.href = sprintf('https://twitter.com/share?text=%s&url=%s&related=%s', encodeURI(tweet), encodeURI('https://zachbruggeman.me/emojidoll'), encodeURI('emojidoll,mroth,zachbruggeman'));
    return html;
}

var genBtn = document.querySelector('.generate');
genBtn.addEventListener('click', generate);

generate();

},{"./emoji/emoji.js":1,"fastclick":3,"util":7}],3:[function(require,module,exports){
/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 1.0.2
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
function FastClick(layer, options) {
	'use strict';
	var oldOnClick;

	options = options || {};

	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
	this.touchBoundary = options.touchBoundary || 10;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	/**
	 * The minimum time between tap(touchstart and touchend) events
	 *
	 * @type number
	 */
	this.tapDelay = options.tapDelay || 200;

	if (FastClick.notNeeded(layer)) {
		return;
	}

	// Some old versions of Android don't have Function.prototype.bind
	function bind(method, context) {
		return function() { return method.apply(context, arguments); };
	}


	var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
	var context = this;
	for (var i = 0, l = methods.length; i < l; i++) {
		context[methods[i]] = bind(context[methods[i]], context);
	}

	// Set up event handlers as required
	if (deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchmove', this.onTouchMove, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {

	// Don't send a synthetic click to disabled inputs (issue #62)
	case 'button':
	case 'select':
	case 'textarea':
		if (target.disabled) {
			return true;
		}

		break;
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if ((deviceIsIOS && target.type === 'file') || target.disabled) {
			return true;
		}

		break;
	case 'label':
	case 'video':
		return true;
	}

	return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
		return true;
	case 'select':
		return !deviceIsAndroid;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled && !target.readOnly;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
	'use strict';

	//Issue #159: Android Chrome Select Box does not open with a synthetic click event
	if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
		return 'mousedown';
	}

	return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	// Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
	if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
	if (event.targetTouches.length > 1) {
		return true;
	}

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			if (touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}

			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0], boundary = this.touchBoundary;

	if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
		return true;
	}

	return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
	'use strict';
	if (!this.trackingClick) {
		return true;
	}

	// If the touch has moved, cancel the click tracking
	if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
		this.cancelNextClick = true;
		return true;
	}

	// Reset to prevent wrong click cancel on input (issue #156).
	this.cancelNextClick = false;

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];

		// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
		targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);
		this.sendClick(targetElement, event);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
		if (!deviceIsIOS || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (deviceIsIOS && !deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		this.sendClick(targetElement, event);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchmove', this.onTouchMove, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
	'use strict';
	var metaViewport;
	var chromeVersion;

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return true;
	}

	// Chrome version - zero for other browsers
	chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

	if (chromeVersion) {

		if (deviceIsAndroid) {
			metaViewport = document.querySelector('meta[name=viewport]');

			if (metaViewport) {
				// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
				if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
					return true;
				}
				// Chrome 32 and above with width=device-width or less don't need FastClick
				if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
					return true;
				}
			}

		// Chrome desktop doesn't need FastClick (issue #15)
		} else {
			return true;
		}
	}

	// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
	if (layer.style.msTouchAction === 'none') {
		return true;
	}

	return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
FastClick.attach = function(layer, options) {
	'use strict';
	return new FastClick(layer, options);
};


if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {

	// AMD. Register as an anonymous module.
	define(function() {
		'use strict';
		return FastClick;
	});
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = FastClick.attach;
	module.exports.FastClick = FastClick;
} else {
	window.FastClick = FastClick;
}

},{}],4:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],7:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("lppjwH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":6,"inherits":4,"lppjwH":5}]},{},[2])