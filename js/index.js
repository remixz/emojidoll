var sprintf = require('util').format;
var emoji = require('../emoji/emoji.js');
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
var tweetTemplate = 'My emojidoll.js doll!\n    %s \n    %s \n%s%s%s\n   %s%s\n';

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
