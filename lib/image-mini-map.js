/*      file:       papyri-mini-map.js
        author:     alex c. williams
        description:
        the implementation of the papyri mini map class.
 */
var $ = require('jquery');
var jQuery = require('jquery');
var jq = require('jquery');
require('jquery-ui-browserify');

function ImageMiniMap() {
    thisMap = this;

    this.mapInitialized = false;
};

ImageMiniMap.prototype.initMap = function() {
    /*  default settings for the mini map */
    $("#thumb").on("load", function() {
        surface.map.resize_map();
        surface.map.updateMapLocation();
        surface.map.mapInitialized = true;
    });

    /*  draggability for the mini map overlay */
    $("#map .location").draggable({
        drag: function(event, ui){
            surface.map.updateFragmentPosition();
        }
    });

    $("#map").click(function(e){
        thisMap.onClickImageReposition(e);
    });
};

ImageMiniMap.prototype.onClickImageReposition = function(event){
    var mx = event.pageX - $('#map').offset().left;
    var my = event.pageY - $('#map').offset().top;
    this.map_move_to(mx, my);
    event.preventDefault();
};

ImageMiniMap.prototype.updateFragmentPosition = function() {
    var factor = $('#fragment img:visible').last().width()/$('#map img').width();
    var left = (1-$('#map .location').position().left)*factor;
    var top = (1-$('#map .location').position().top)*factor;
    $('#fragment_container').css("top", top);
    $('#fragment_container').css("left", left);
};

ImageMiniMap.prototype.resize_map = function(animate, factor) {
    factor = isNaN(factor)? $('#map #thumb').width()/$('#fragment img:visible').last().width() : factor;
    if (!isNaN(factor)) {
        var location_width = $("#viewer").width()*factor;
        var location_height = $("#viewer").height()*factor;

        if($('#main-interface').hasClass('fullscreen')){
            location_height = location_height - (241*factor);
        }

        if (animate) {
            $('#map .location').animate({
                width: location_width,
                height: location_height
            }, 100, function() {});
        } else {
            var map = $('#map .location');
            map.css("width", location_width);
            map.css("height", location_height);
            map.css("border", "1px solid black");
        }
    }
};

ImageMiniMap.prototype.updateMapLocation =  function(factor) {
    factor = isNaN(factor)? $('#map #thumb').width()/$('#fragment img:visible').last().width() : factor;
    var left = (1-$('#fragment_container').position().left)*factor;
    var top = (1-$('#fragment_container').position().top)*factor;
    var map = $('#map .location');
    if(top < 1 && left < 1){
        map.css("top", "5px");
        map.css("left", "5px");
    } else {
        map.css("top", top);
        map.css("left", left);
    }
};

ImageMiniMap.prototype.map_move_to = function(mx, my){
    var factor = $('#fragment img:visible').last().width()/$('#map #thumb').width();
    var x = mx*factor;
    var y = my*factor;
    this.repositionFragment(x,y);
};

ImageMiniMap.prototype.repositionFragment = function(x,y) {
    var v_top = 0-$("#fragment_container").position().top;
    var v_bottom = v_top + $("#viewer").height();
    var v_left = 0-$("#fragment_container").position().left;
    var v_right = v_left + $("#viewer").width();

    var v_trans = "+=0";
    var h_trans = "+=0";
    var distance = 0;
    var padding = 100;

    v_right = v_right-padding;
    v_left = v_left+padding;
    v_top = v_top+padding;
    v_bottom = v_bottom-padding;

    if (y < v_top) {
        distance = v_top - y;
        v_trans = "+="+distance;
    }

    if (y > v_bottom) {
        distance = y - v_bottom;
        v_trans = "-="+distance;
    }

    if (x < v_left) {
        distance = v_left - x;
        h_trans = "+="+distance;
    }

    if (x > v_right) {
        distance =  x - v_right;
        h_trans = "-="+distance;
    }

    if ((typeof(h_trans) == "string") || (typeof(v_trans) == "string")) {
        $("#fragment_container").stop().animate({
            top: v_trans,
            left: h_trans
        }, 500);

        this.repositionMap(h_trans, v_trans);
    }
};

ImageMiniMap.prototype.repositionMap =  function(left_trans, top_trans) {
    var factor = $('#map #thumb').width()/$('#fragment img:visible').last().width();

    var scaled_left = left_trans;
    var scaled_top = top_trans;
    var sign = "";

    if (left_trans.split) {
        if (left_trans.split("=")[0] == "+") {
            sign = "-";
        }
        if (left_trans.split("=")[0] == "-") {
            sign = "+";
        }
        scaled_left = sign+"="+(left_trans.split("=")[1])*factor;
    }  else {
        scaled_left = -(left_trans*factor);
    }

    if (top_trans.split) {
        if (top_trans.split("=")[0] == "+") {
            sign = "-";
        }
        if (top_trans.split("=")[0] == "-") {
            sign = "+";
        }
        scaled_top = sign+"="+(top_trans.split("=")[1])*factor;
    } else {
        scaled_top = -(top_trans*factor);
    }

    $('#map .location').stop().animate({
        top: scaled_top,
        left: scaled_left
    }, 350);
}

ImageMiniMap.prototype.toggleMapVisibility = function(event){
    if ($('#map').css("display") == "none") {
        $('.modal').hide();
        $('.colours').fadeOut(function(){$('#map').fadeIn()});
        $('#map').css("display", "block");
        surface.map.resize_map(true);
        surface.map.updateMapLocation();
    } else {
        $('#map').css("display", "none");
        $('#map').fadeOut();
    }
    surface.update_toggles();
    event.preventDefault();
};

ImageMiniMap.prototype.fadeMapOut = function(fadeVal){
    fadeVal = (typeof fadeVal === "undefined") ? 0 : fadeVal;

    $("#map").fadeOut(fadeVal, function() {
        //$("#map img").remove();
    });
};

ImageMiniMap.prototype.fadeMapIn = function(thumb_width, fragment_width, force) {
    /*  force is a bypass-variable that tells us if we just need to fadein the map */
    force = (typeof force === "undefined") ? 0 : force;

    if(!force) {
        var factor = thumb_width / fragment_width;
        this.updateMapLocation(factor);
        this.resize_map(false, factor);

        /* wait for the image to load */
        $("#thumb").one("load", function () {
            $("#map").fadeIn(500)
        });
    }
    else{
        $("#map").fadeIn(500)
    }
};

ImageMiniMap.prototype.map_check = function(thumb_img, fragment_img) {
    var t_size = thumb_img;
    var f_size = fragment_img;
    if (t_size.width > 0 && f_size.width > 0 && !surface.map.map_initalized) {
        var factor = t_size.width / f_size.width;
        surface.map.updateMapLocation(factor);
        surface.map.resize_map(false, factor);
        $("#map .location").fadeIn(500);
        surface.map.map_initalized = true;
    }
};

module.exports = ImageMiniMap;