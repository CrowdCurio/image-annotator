var $ = require('jquery');
var ImageMiniMap = require('./image-mini-map');
var TaskRouter = require('./task-router');

/*  simple implementation of a marker class strictly for storage */
function Marker(x, y, label, orientation) {
    this.name = "marker";
    this.x = x;
    this.y = y;
    this.label = label;
    this.orientation = orientation;
    this.created = Math.round(+new Date()/1000);
}

Marker.prototype.updatePoint = function(x, y, orientation){
    this.x = x;
    this.y = y;
    this.orientation = orientation;
};

Marker.prototype.updateLetter = function(letter){
    this.label = letter;
};


/*  implementation of the line class */
function Line() {
    this.name = "line";
    this.points = [];
}

Line.prototype.addPoint = function(newX, newY){
    this.points.push({
        x: newX,
        y: newY
    })
};


/*  implementation of the measurement class */
function Measurement(id, margin, x1,y1,x2, y2){
    this.name = "measurement";
    this.id = id;
    this.margin = margin;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.orientation = 0;

}


/*  implementation of the image annotator class */

/*  constructor */
function ImageAnnotator() {
    /*  external reference for the object */
    surface = this;

    this.router = new TaskRouter();

    /*  establish the data structures */
    this.markers = {};
    this.measurements = {};

    /*  internal members */
    this.map = new ImageMiniMap();

    /*  data collection variables */
    this.selection = null;
    var classificationCount = 0;
    this.rotationDegree = 0;
    var zoomAspect = 0;


    /* default settings */
    this.timeOfLastDrag = 0;
    this.timeout = 15000;
    this.mode = "issues";
    this.step = 0;
    this.hoveringOnMarker = false;

    this.movingMarker = false;
    this.shifting = false;
    this.intercepting = true;

    /* measure variables */
    this.dragmode = true;
    this.region = "";
    this.dragging = false;
    this.canvas = null;
    this.ctx = null;


    //Meaure column item pagination
    this.page_size = 1;
    this.fade_time = 200;
    this.slide_time = 0;
    this.max_pages = 10;
    this.animate1 = true;
    this.show_last = true;
    this.StartMilliseconds = 0;
    this.ElapsedMilliseconds = 0;

    // task ids
    this.task_id = -1;
    this.artifact_id = -1;
};

ImageAnnotator.prototype.startTimer = function()
{
    this.StartMilliseconds = new Date().getTime();
};

ImageAnnotator.prototype.stopTimer = function()
{
    this.ElapsedMilliseconds = new Date().getTime() - this.StartMilliseconds;
};

/*  initialization method */
ImageAnnotator.prototype.initialize = function () {
    /* render the elements before adding handlers */
    this.render();

    // define an image w/ load events
    global.oImg = new Image(); //$('.subject');
    var Img = $(".subject");
    oImg.onload = function () {
        /*  compute the thumbnail size */
        var width = oImg.naturalWidth, height = oImg.naturalHeight, maxWidth = 180, maxHeight = 240;

        /*  check if width or height is larger and modify appropriately */
        if (width > maxWidth) {
            height = Math.floor(maxWidth * height / width);
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = Math.floor(maxHeight * width / height);
            height = maxHeight;
        }

        /*  set the thumbnail size / height / src */
        $('#thumb').attr({width: width, height: height, src: oImg.src});

        /* show the map */
        $("#map").fadeIn();
    }

    /*  initialize the mini map */
    surface.map.initMap();

    /*  draggability for the fragment image */
    $("#fragment_container").draggable({
        disabled: false,
        distance: 3,    /* at least 3 pixels to trigger the drag */
        drag: function (e) {
            surface.map.updateMapLocation();
        },
        stop: function (e) {
            /*  update the last drag time */
            surface.timeOfLastDrag = new Date().getTime();
        }
    });

    /*  marker: add draggability */
    $('.marker').draggable();

    var valid =  [87, 69, 82, 84, 89, 85, 73, 79, 80, 20,
        65, 83, 68, 70, 71, 72, 74, 75, 76,
        90, 88, 67, 86, 66, 78, 77,
        32];

    // Keydown
    $('*').on("keydown", function(e) {
        /*  prevent the default backspace function */
        /*if(e.which == 8){
            e.preventDefault();
        }*/

        if (surface.intercepting) {
            surface.intercepting = false;
            var code = e.which;
            var modkey = (e.ctrlKey || e.altKey || e.metaKey);

            /*  prevent the default backspace function */
            /*if(e.which == 8){
                surface.deleteTool();
            }*/

            if (e.shiftKey) {
                surface.shifting = true;
            }

            var validkey = $.inArray(code, valid) != -1;
            if (!modkey && validkey) {
                var keytype = "ku";
                $("#"+keytype+"_"+code).trigger("click");
                $("#"+keytype+"_"+code).addClass("active");
            }
        }
    });

    // Keyup
    $('*').on("keyup", function(e) {
        /*  prevent the default backspace function */
        /*if(e.which == 8){
            e.preventDefault();
        }*/

        if (!surface.intercepting) {
            surface.intercepting = true;
            var code = e.which;
            surface.shifting = false;
            var modkey = (e.ctrlKey || e.altKey || e.metaKey);
            var validkey = $.inArray(code, valid) != -1;


            if (!modkey && validkey) {
                var keytype = "ku";
                $("#"+keytype+"_"+code).removeClass("active");
                return false;
            }
        }
    });

    /* handlers for adding markers */
    $('#fragment_container').on('click', function(e){
        // Verify a label has been selected
        if($(".task-option-toggle.success").length.length == 0){
            return;
        }

        // Create the new marker
        ms.addTool(e);
        $('.delete-marker-btn').hide();

        $('.counter').html("Click to Count: "+ms.countMarkers());
        clicking = false;
        move_count = 0;
        var dragged = false;

        // Add handlers
        $('.marker').on('mousedown', function(e){move_count=0; clicking=true; dragged=true; ms.selectTool(e);});
        $('.marker').on('mouseup', function(e){if(move_count > 5) dragged=true;});
        //$('.marker').on('mousedown', function(e){ms.deleteTool(e);});
        $('.marker').on('mouseenter', function(e){ms.hoverToolOn(e);});
        $('.marker').on('mouseleave', function(e){ms.hoverToolOff(e);});


        $('.marker').mousemove(function(){
            if(clicking === false) return;
                move_count++;
            });

        $('.marker, .character').click(function(e){

            if($(e.target).hasClass('marker')) {
                var delete_button = $(e.target.childNodes[1]);
                if(delete_button.is(":visible")){
                    delete_button.hide();
                }else {
                    $('.delete-marker-btn').hide();
                    if(move_count == 0) {
                        delete_button.show();
                    }
                    dragged = false;
                }
            } else {
                //$("#"+$(e.target.parentNode).children()[1].id).show();
                var delete_button = $("#"+$(e.target.parentNode).children()[1].id);
                if(delete_button.is(":visible")){
                    delete_button.hide();
                }else {
                    $('.delete-marker-btn').hide();
                    if(move_count == 0) {
                        delete_button.show();
                    }
                    dragged = false;
                }
            }
            e.stopImmediatePropagation();
            if(move_count == 0){
                ms.deleteTool(e);
            }
        });

        $('.delete-marker-btn').click(function(e){
            e.stopImmediatePropagation();
            ms.deleteToolWithButton(e.target.parentNode);
        });
    });

    /* handler for updating tool letter values */
    $(".key").click(function(e){
        ms.setToolValue(e);
    });

    /* handler for updating tool examples */
    $(".key-letter").mouseover(function(e){
        ms.updateKeypadExample(e);
    });

    /* zoom handlers */
    $("#zoom_in").click(function(event){ if($("#zoom").val() != "1.5") { ms.zoom_in(event); }});
    $("#zoom_out").click(function(event){if($("#zoom").val() != "0.5") {ms.zoom_out(event);}});

    /* fullscreen handlers */
    $("#fullscreen").click(function(event){ ms.toggleFullscreen(event); });

    /* mini map visibility handler */
    $("#toggle-mini-map").click(function(event){ ms.map.toggleMapVisibility(event); });

    ms.changeMode("somethingelse"); 

    // start the task router
    this.router.init();

    if (global.DEV){
        /* get the first item in the queue and it's class label */
        this.router.simulateFetchTasks();
        var task = this.router.simulateGetNextTask();
        oImg.src = task['url'];
        $(".subject").attr('src', task['url']);

        this.artifact_id = task['id'];

    } else {
        // use the task queue
        this.router.fetchTasks();
    }

    $("#next-button").click(function(e){
        if(!global.DEV){
            // 1. reformat the annotations
            var annotations = {};
            var i = 0;
            for (var key in ms.markers) {
            if (ms.markers.hasOwnProperty(key)) {
                var x = ms.markers[key].x;
                var y = ms.markers[key].y;
                var label = ms.markers[key].label;
                var created = ms.markers[key].created;

                /* append each marker to the next */
                annotations[i] = {'x': x, 'y': y, 'label': label, 'created': created};
                i += 1;
                }
            }

            // 2. validation
            if(i === 0){ alert('Error: You cannot submit without making annotations!'); return; }

            // 3. hide the map
            $("#map").fadeOut()

            // 4. create the payload data object
            var payload = {
                "data": {
                    "type": "Response",
                    "attributes": {"content": annotations},
                    "relationships": {
                        "owner": {"data": { "type": "User", "id": user_id }},
                        "data": {"data": { "type": "Data", "id": data_id }},
                        "task": {"data": { "type": "Task", "id": task_id }}
                    }
                },
                csrfmiddlewaretoken: csrftoken
            };

            /* 5. save the annotations */
            $.ajax({
                type: "POST",
                url: "/api/response/",
                contentType: "application/vnd.api+json",

                data: JSON.stringify(payload),
                success: function (response) {
                    /* reset the surface */
                    ms.resetSurface();
                }
            });
        } else {    // Simulation for Testing

            console.log("Simulating a save to the server .... Saved!");

            // clear annotations and reset the surface
            ms.resetSurface();

            // get the next task
            var task = ms.router.simulateGetNextTask();

            if(task.length !== 0){
                oImg.src = task['url'];
                $(".subject").attr('src', task['url']);
                this.artifact_id = task['id'];
            } else {
                alert("Hey! You're out of tasks, Bucko!")
            }
        }
    });
};

/* render */
ImageAnnotator.prototype.render = function() {
    // define templates for each component
    var stateVariables = '<input id="m_colour" type="hidden" value="20"/><input id="m_size" type="hidden" value="20"/><input id="zoom" type="hidden" value="1.00"/><input id="zoom_step" type="hidden" value="0.25"/>';
    var toggleControlTemplate = '<div id="zoom_view_toggles" class="side_buttons" style="float: left;margin-right: 10px;"><div id="controls"><div class="view-divider" style="border-top: 1px solid black; border-bottom: initial;height: 4px;width: 100%;"></div><div id="toggles"><div class="toggle-text">Zoom<hr/></div><div id="zoom_in"><div class="toggle-button waves-effect waves-light btn"><span id="zoom-in-btn-icon" class="fa fa-search-plus"></span></div><div class="action"></div></div><div id="zoom_out"><div class="toggle-button waves-effect waves-light btn"><span id="zoom-out-btn-icon" class="fa fa-search-minus"></span></div><div class="action"></div></div><div class="empty-space"></div><div class="toggle-text">View<hr/></div><div id="fullscreen"><div class="toggle-button waves-effect waves-light btn"><span id="fullscreen-btn-icon" class="fa fa-arrows-alt"></span></div><div class="action"></div></div><div id="toggle-mini-map"><div class="toggle-button waves-effect waves-light btn"><span id="toggle-mini-map-icon" class="fa fa-window-restore" style="left: 12px;"></span></div><div class="action"></div></div></div><div class="view-divider" style="border-top: 1px solid black; border-bottom: initial;height: 4px;width: 100%;"></div></div></div>';
    var annotationSurfaceTemplate = '<div id="main-interface"><div class="view-divider" style="height: 7px;"></div><div id="viewer"><div id="fragment_container"><div id="markers" class="s20 " style="position:absolute;"><div id="togetherjs-first-time-annotation" style="display: none;">Want some help? Ask your collaborators with the <i class="fa fa-users" aria-hidden="true"></i> button!</div><style>.marker {position: absolute;height: 20px;width: 20px;box-shadow: rgba(0,0,0,.496094) 0 2px 4px;-webkit-border-radius: 15px;border-radius: 15px;}.marker .character {font-size: 12px;line-height: 20px;font-weight: 600;}</style></div><div id="fragment"><img class="subject" src=""></div></div><div id="map" style="display: none; float: right;"><div class="map_container"><img id="thumb" /><div class="location" style="border: 1px solid black;"></div></div></div></div><div class="view-divider"></div><div id="bottom-controls"><div id="bottom-control-keypad" style="float: left;display: inline-block;"><div id="keypad" style="margin: 0 auto;"><div id="fullscreen_button"></div><div id="primary_keyboard" class="main"><div id="variations"><div class="example_label">Hover Over Characters<br/>Below for Examples</div><div class="key_label"></div><div class="details"><div class="examples"><div class="ex_1"></div><div class="ex_2"></div></div></div></div><div id="keypad-letter-container" style="width: 535px;float:left;margin-bottom: 15px;"><div class="upper_row standard" style="display: inline-block;width:100%;margin-left: 35px;"><div class="info"><h4 style="color: white;font-size: 18px;margin-top: 0;margin-bottom: 0;font-weight:600;">Greek Characters</h4><p></p></div><div id="ku_32" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0020;</span><span class="l">&nbsp;</span><span class="label"></span></div><div id="ku_87" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A3;</span><span class="l"></span><span class="label">Sigma</span></div><div id="ku_69" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0395;</span><span class="l">&#x03B5;</span><span class="label">Epsilon</span></div><div id="ku_82" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A1;</span><span class="l">&#x03C1;</span><span class="label">Rho</span></div><div id="ku_84" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A4;</span><span class="l">&#x03C4;</span><span class="label">Tau</span></div><div id="ku_89" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A5;</span><span class="l">&#x03C5;</span><span class="label">Upsilon</span></div><div id="ku_85" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0398;</span><span class="l">&#x03B8;</span><span class="label">Theta</span></div><div id="ku_73" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0399;</span><span class="l">&#x03B9;</span><span class="label">Iota</span></div><div id="ku_79" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x039F;</span><span class="l">&#x03BF;</span><span class="label">Omicron</span></div><div id="ku_80" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A0;</span><span class="l">&#x03C0;</span><span class="label">Pi</span></div></div><div class="middle_row standard" style="display: inline-block;width:100%;margin-left: 35px;"><div id="ku_65" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0391;</span><span class="l">&#x03B1;</span><span class="label">Alpha</span></div><div id="ku_83" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03F9;</span><span class="l">&#x03F2;</span><span class="label">Sigma</span></div><div id="ku_68" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0394;</span><span class="l">&#x03B4;</span><span class="label">Delta</span></div><div id="ku_70" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A6;</span><span class="l">&#x03C6;</span><span class="label">Phi</span></div><div id="ku_71" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0393;</span><span class="l">&#x03B3;</span><span class="label">Gamma</span></div><div id="ku_72" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0397;</span><span class="l">&#x03B7;</span><span class="label">Eta</span></div><div id="ku_74" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x039E;</span><span class="l">&#x03BE;</span><span class="label">Xi</span></div><div id="ku_75" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x039A;</span><span class="l">&#x03BA;</span><span class="label">Kappa</span></div><div id="ku_76" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x039B;</span><span class="l">&#x03BB;</span><span class="label">Lambda</span></div></div><div class="lower_row standard" style="display: inline-block;width:100%;margin-left: 65px;"><div id="ku_90" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0396;</span><span class="l">&#x03B6;</span><span class="label">Zeta</span></div><div id="ku_88" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A7;</span><span class="l">&#x03C7;</span><span class="label">Khi</span></div><div id="ku_67" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03A8;</span><span class="l">&#x03C8;</span><span class="label">Psi</span></div><div id="ku_86" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x03a9;</span><span class="l">&#x03C9;</span><span class="label">Omega</span></div><div id="ku_66" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x0392;</span><span class="l">&#x03B2;</span><span class="label">Beta</span></div><div id="ku_78" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x039D;</span><span class="l">&#x03BD;</span><span class="label">Nu</span></div><div id="ku_77" class=" key waves-effect waves-light btn key-letter"><span class="u">&#x039C;</span><span class="l">&#x03BC;</span><span class="label">Mu</span></div></div><div class="push"></div></div><div id="keypad-symbols-container" style="width: 200px;float:left;margin-left:27px;"><div class="standard symbol-container" style="display: inline-block;width:100%;"><div class="info"><h4 style="color: white;font-size: 18px;margin-top: 0;margin-bottom: 0;font-weight:600;">Greek Symbols</h4><p></p></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE646;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE662;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE674;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE6A3;</span></div></div><div class="standard symbol-container" style="display: inline-block;width:100%;"><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE68F;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE66A;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#x0370;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE616;</span></div></div><div class="standard symbol-container" style="display: inline-block;width:100%;"><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE629;</span><</div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#x03DB;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE648;</span></div><div class=" key waves-effect waves-light btn" style="font-family: Grec-Subset;font-size: 1.7em;padding-top: 3px;padding-left: 1px;"><span class="u">&#xE696;</span></div></div></div></div></div></div></div><div class="view-divider"></div></div>';
    var practiceWindowTemplate = '<div id="practice_toggles" class="practice side_buttons" style="float: left; width: 250px; min-height: 100px;"> <div id="controls"> <div class="view-divider" style="border-top: 1px solid black; border-bottom: initial;height: 4px;width: 100%;"></div> <div id="practice_toggles_inner"> <div class="toggle-text"> Practice Room <a class="modal-trigger" href="#practice-room-modal" style="color: white;"><i class="fa fa-question-circle" aria-hidden="true"></i></a> <hr/> </div> <div class="practice-task-text"> <div>You have</div> <div class="practice-tasks-number-remaining">5</div> <div>available practice tasks.</div> <hr/> </div> <div> <button id="practice-room-btn" class="waves-effect waves-light btn"> Start Practicing </button> </div> </div> <div class="view-divider" style="border-top: 1px solid black; border-bottom: initial;height: 4px;width: 100%;"></div> </div> </div>';
    var nextWindowTemplate = '<div id="submission_toggles" class="submission side_buttons" style="float: left; width: 250px; min-height: 100px;"> <div id="controls"> <div class="view-divider" style="border-top: 1px solid black; border-bottom: initial;height: 4px;width: 100%;"></div> <div id="submission_toggles_inner"> <div class="toggle-text"> Next Task <hr/> </div> <button id="next-button" class="waves-effect waves-light btn submit"> <i class="fa fa-arrow-right" aria-hidden="true"></i> </button> </div> <div class="view-divider" style="border-top: 1px solid black; border-bottom: initial;height: 4px;width: 100%;"></div> </div> </div>';


    var parent_container = $("#task-container");
    parent_container.append(stateVariables);
    parent_container.append(toggleControlTemplate);
    parent_container.append(annotationSurfaceTemplate);
    parent_container.append(practiceWindowTemplate);
    parent_container.append(nextWindowTemplate);
}

/*  operational functions for the surface */
ImageAnnotator.prototype.changeMode = function(mode, event){
    $("#issuepad").hide();
      if(mode == "transcribe"){
          /*    update the object's mode */
          ms.mode = "transcribe";

          /*    update the DOM elements */
          $("#measure_mode").removeClass();
          $("#transcribe_mode").addClass("current");

          /*  hide the measure instructions */
          $("#measurepad").fadeOut(100, function() { $("#keypad").fadeIn();});

          /*    toggle the visible buttons */
          $("#toggle_next").fadeIn();
          $("#toggle_solid").fadeIn();
          $("#delete").fadeIn();
          $('.colour_show').animate({ height: 36, opacity: 100 }, 'slow');

          /* show markers */
          if(!$("#toggle_solid").hasClass("on"))
          {
              $(".marker").removeClass("solid");
              $(".character",".marker").hide();
              //$(event.target).removeClass("on");
              $("#mode_tip").html("Show");
              $(".marker").css("opacity", $("#m_opacity").val());
          }
          else{
              $('.marker').each(function(i, m) {
                  console.log($(this).hasClass("solid"));
                  if($(this).hasClass("solid")){
                      $(".marker").fadeTo("slow", 1);
                  }
                  else{
                      $(".marker").fadeTo("slow", 0.3);
                  }
              });

          }

          $("#measurements").hide();
          $(".measurement").hide();

      }
      else if (mode == "measure"){ /*  mode == "measure" */
          /*    update the object's mode */
          ms.mode = "measure";

          /*    update the DOM elements */
          $("#transcribe_mode").removeClass();
          $("#measure_mode").addClass("current");

          /*    hide the keypad, show the measurepad */
          $("#keypad").fadeOut(100, function(){$("#measurepad").fadeIn();});

          /*    hide the colour menu if it was visible */
          surface.toggleColourMenu(event, true);

          /*    toggle the visible buttons */
          $("#toggle_next").fadeOut();
          $("#toggle_solid").fadeOut();
          $("#delete").fadeOut();
          $('.colour_show').animate({ height: 0, opacity: 0 }, 'slow');

          /* hide markers */
          $(".marker").fadeTo("slow", 0);

          $("#measurements").show();
          $(".measurement").show();

          surface.canvas = document.getElementById("measurements");
          surface.ctx = this.canvas.getContext('2d');
      }
    else{
          /* otherwise, set the mode to the passed parameter */
          ms.mode = mode;
      }
};

ImageAnnotator.prototype.getMode = function(){
    return ms.mode;
}

ImageAnnotator.prototype.resetSurface = function(){
    /* adjust map */
    $('#fragment_container').css("left", "0");
    $('#fragment_container').css("top", "0");
    $('#map .location').css("left", "0");
    $('#map .location').css("top", "0");

    /* exterminate the stored and rendered markers */
    $(".marker").remove();
    surface.markers = {};

    /* reset the label counters */
    $('.task-option-toggle.success').removeClass('success');
    $('.task-option-count').text("?");

    /* reset the examples */
    $('.detection-wrapright').html('<div id="detection_output_interface"></div>');

    /* set the surface mode to something arbitrary */
    surface.mode = "issues";
    surface.selection = null;
};

ImageAnnotator.prototype.toggleColourMenu = function(event, forceHide){
    if ($(".colours").css("display") == "block" || forceHide) {
        $('.colours').fadeOut(function(){$('#map').fadeIn()});
        $
    } else {
        $('.modal').hide();
        $('#map').fadeOut(function(){$('.colours').fadeIn()});
    }
    this.update_toggles();
    event.preventDefault();
};

ImageAnnotator.prototype.toggleKeypadExtras = function(event){
    if ($(event.target).hasClass("symbols_show")) {
        $(".diacritics").fadeOut("fast");
        $(".symbols").fadeIn("fast");
    }

    if ($(event.target).hasClass("diacritics_show")) {
        $(".symbols").fadeOut("fast");
        $(".diacritics").fadeIn("fast");
    }
    $('#pad_toggles div').removeClass("current");
    $(event.target).addClass("current");
    event.preventDefault();
};

ImageAnnotator.prototype.toggleKeypadAssist = function(event){
    if ($('#variations').css("display") == "none") {
        $("#variations .examples").hide();
        $('#variations').slideDown();
        $(event.target).addClass("on");
        $("#variations h2").show();
        $("#variations .key_label").html("");
    } else {
        $("#variations .examples").fadeOut(200, function() {
            $('#variations').slideUp();
        });
        $(event.target).removeClass("on");
    }

    event.preventDefault();
};

ImageAnnotator.prototype.changeToolProperties = function(event, option) {
    if(option == "colour") {
        $('.colours ul li').removeClass("current");

        $(event.target).addClass("current");

        var hex = $(event.target).css("background-color");

        $('.marker').css("background-color", hex);
        $("#m_colour").val(hex);
        $("#colour").css("background-color", hex);

        if ($(event.target).hasClass("negative")) {
            $("#markers").addClass("negative");
        } else {
            $("#markers").removeClass("negative");
        }

        if ($(event.target).hasClass("alternative")) {
            $("#markers").addClass("alternative");
        } else {
            $("#markers").removeClass("alternative");
        }
        event.preventDefault();
    }
    else if(option == "size"){
        $('.sizes div').removeClass("current");
        $(event.target).addClass("current");

        var old_size = parseInt($("#m_size").val(), 10);
        var new_size = parseInt($(event.target).attr("id").split("_")[1], 10);


        $("#m_size").val(new_size);
        $("#markers").removeClass("s"+old_size);
        $("#markers").addClass("s"+new_size);

        // Account for Zoom level
        var zoom = $("#zoom").val();
        new_size = zoom*new_size;

        // Ensure sizes are always even (to stop drifting when zooming in and out)
        new_size = Math.round(new_size);
        if (new_size % 2 != 0) {new_size++;}

        // Resize and shift
        if ($(".marker").length > 0) {
            var existing_size = $(".marker").css("height").replace(/px/ig, '');
            $(".marker").css("height", new_size+"px");
            $(".marker").css("width", new_size+"px");
            var shift = (existing_size-new_size)/2;
            $(".marker").animate({left: "+="+shift, top: "+="+shift}, 0);
            surface.resizeFont(zoom);
        }
    }
    else if(option == "opacity"){
        $('.opacity div').removeClass("current");
        $(event.target).addClass("current");
        var opacity = parseFloat($(event.target).attr("id").split("_")[1]);

        /*  update the opacity */
        $("#m_opacity").val(opacity);
        $(".marker").not(".solid").css("opacity", opacity);
    }

    /*  prevent the default event */
    event.preventDefault();
};

ImageAnnotator.prototype.resizeFont =  function(factor) {
    var marker_scale = $("#m_size").val()/$("#m_default_size").val();
    var scaled = marker_scale*$("#font_size").val();
    var fontsize = (scaled*factor);
    $(".character").css("font-size", fontsize+"px");
    $(".character").css("line-height", Math.round($("#m_size").val()*factor)+"px");
};

ImageAnnotator.prototype.toggle = function(element, show) {
    if (show) {
        $(element).addClass("on");
        $(element).removeClass("off");
    } else {
        $(element).addClass("off");
        $(element).removeClass("on");
    }
};

ImageAnnotator.prototype.update_toggles = function() {
    this.toggle(".translate_show", $('.result').is(":visible"));
    this.toggle(".shortcuts_show", $('.shortcuts').is(":visible"));
    this.toggle(".instructions_show", ($('.step:visible').size() > 0));
    this.toggle(".map_show", ($('#map:visible').size() > 0));
    this.toggle(".colour_show", $('.colours:visible').size() > 0);
};


/*  methods for placing objects on the surface */

ImageAnnotator.prototype.addTool = function(event) {
    if(surface.mode == "transcribe") {
        if (((new Date().getTime()) - surface.timeOfLastDrag) > 100 && !surface.hoveringOnMarker) {
            if (surface.shifting == false) {
                $('.marker').removeClass('selected');
            }

            /*  create a visual marker object */
            surface.selection = "TMP" + (new Date().getTime());
            var zoom = $("#zoom").val();
            var marker_size = parseInt($('#m_size').val(), 10) * zoom;
            var x = (event.pageX - $('#fragment').offset().left);
            var y = (event.pageY - $('#fragment').offset().top);

            /*  find the center of click */
            var mx = x - (marker_size / 2);
            var my = y - (marker_size / 2);

            /* get selected label */
            var mclass = "";
            var label;
            if($('.task-option-toggle.success').length) {
                mclass = $('.task-option-toggle.success').attr('lval');
                label = $('.task-option-toggle.success').attr('id').split('-')[0];
            } else {
                label = "";
            }

            /*  append the draggable element into html */
            var newMarker;
            if(typeof recording !== 'undefined'){
                $(".overlay.selected").hide();
                newMarker = "<div class='marker new selected unfinished "+mclass+"' id='m-" + surface.selection + "' style='left: " + mx + "px;top:" + my + "px;'><div class='character'></div><div id=\"m-"+surface.selection+"-overlay\" class=\"overlay selected\"><div class=\"txt\" contenteditable></div></div></div>";

            } else {
                newMarker = "<div class='marker new selected unfinished "+mclass+"' id='m-" + surface.selection + "' style='left: " + mx + "px;top:" + my + "px;background:" + $('#m_colour').val() + ";opacity:" + $('#m_opacity').val() + "'><div class='character'></div><div id='delete-marker-"+surface.selection+"' class='delete-marker-btn' style='display:none;'>Delete</div></div>";
            }
            $('#markers').append(newMarker);
            $('#m-' + surface.selection).draggable({
                  start: function(e){console.log('dragged');ms.dragTool(e);$('.delete-marker-btn').hide();},
                  stop: function(e){
                        console.log('dropped');
                        ms.dropTool(e);$('.delete-marker-btn').hide();
                  }});

            /* increment the label's counter */
            if($('.task-option-toggle.success').length) {
                if ($('.task-option-toggle.success div').attr('estimated') == 'true') {
                    $('.task-option-toggle.success div')[0].innerHTML = "1";
                    $('.task-option-toggle.success div').removeAttr('estimated')
                }
                else {
                    /* check if this is the default value */
                    if ($('.task-option-toggle.success div')[0].innerHTML == "?") {
                        $('.task-option-toggle.success div')[0].innerHTML = "1";
                    } else {
                        /* just increment */
                        $('.task-option-toggle.success div')[0].innerHTML = parseInt($('.task-option-toggle.success div')[0].innerHTML) + 1;

                    }
                }
            }

            /* current rotation */
            var rotation = $("#rotation").val();

            /*  add the marker to the storage unit */
            surface.markers[surface.selection] = new Marker(x.toPrecision(3)/zoom, y.toPrecision(3)/zoom, label, rotation);
        }
    }
    else if (surface.mode == "measure"){
        console.log('This should begin add measurement.');
    }
};

ImageAnnotator.prototype.deleteTool = function(e) {
    // return if this is the help-giving annotation
    if(e.target.id === 'help-giving-target') return;

    /* decrement the counter */
    var classList = $(e.currentTarget).attr('class');
    var className = classList.match(/\S*marker-n\d\S*/);
    if(className === null){
        return;
    }

    className = className[0];
    console.log(parseInt($("label[lval='"+className+"'] div")[0].innerHTML));
    $("label[lval='"+className+"'] div")[0].innerHTML = parseInt($("label[lval='"+className+"'] div")[0].innerHTML) - 1;

    $('#markers .selected').each(function (i, m) {
        var mid = $(this).attr('id').replace('m-', '');

        /*  remove the marker in storage and from the view */
        delete surface.markers[mid];
        $('#m-' + mid).remove();

    });

    /*  select the next marker, if there are any */
    if ($('.marker').size() > 0) {
        surface.select_next();
    }

    //event.preventDefault();
    $('.counter').html("Click to Count: "+ms.countMarkers());
    surface.hoveringOnMarker = false;
};

ImageAnnotator.prototype.deleteToolWithButton = function(ele) {
    var mid = ele.id.replace('m-', '');

    /*  remove the marker in storage and from the view */
    delete surface.markers[mid];
    $('#m-' + mid).remove();

    /*  select the next marker, if there are any */
    if ($('.marker').size() > 0) {
        surface.select_next();
    }

    surface.hoveringOnMarker = false;
};

ImageAnnotator.prototype.deleteToolsByLabel = function(label){
    /* store all ids to be deleted */
    var ids = [];

    /* iterate over the entire object */
    for (var key in ms.markers) {
        if (ms.markers.hasOwnProperty(key)) {
            var obj = ms.markers[key];
            if(obj.label == label){
                ids.push(key);
            }
        }
    }

    /* remove all of the collected ids */
    for(var i=0; i < ids.length; i++){
        delete ms.markers[ids[i]];
    }
};

ImageAnnotator.prototype.setToolValue = function(event){
    if(surface.selection == null || $("#help-giving-target").length > 0 || event.target.id == 'togetherjs-chat-input' ){
        return false;
    }

    // Get character or diacritic
    var item = $('.character', '#markers .selected');

    var character;
    var diacritic;
    var key = event.target;

    /*  Did we click a Span element instead of the intended DIV? */
    if(event.target.tagName == "SPAN"){
        key = event.target.parentNode;
    }

    // Diacritic
    if ($(key).parent().hasClass("diacritics")) {
        diacritic = $(key).html().split("&nbsp;")[0];
        $(item).html(diacritic+$(item).html().substr($(item).html().length-1));
        surface.markers[surface.selection].updateLetter(diacritic+$(item).html().substr($(item).html().length-1));
    }

    // Symbol
    if ($(key).parent().hasClass("symbol-container")) {
        console.log("Has class symbol-container");
        character = $(key).html();
        $(item).html(character);
        $(item).css('font-family', 'Grec-Subset');
        surface.markers[surface.selection].updateLetter(character);
    } else {
        $(item).css('font-family', '');
    }

    // Standard key
    if ($(key).parent().hasClass("standard")) {
        character = $(".u",key).html();
        //console.log("Attempting to add: &#"+character.charCodeAt(0)+";");
        $(item).html("&#"+character.charCodeAt(0)+";");
        surface.markers[surface.selection].updateLetter(character);
    }

    $('#markers .selected').each(function(i, m) {
        var mid = surface.selection;

        // Add custom class
        var custom = false;
        if ($(key).parent().hasClass("custom") || $(key).parent().hasClass("custom")) {
            $(item).addClass("custom");
            custom = true;
        } else {
            $(item).removeClass("custom");
        }
        //OXU.queue.process_character(mid);
        $("#m-"+mid).removeClass('unfinished');

        // Add solid class (but not for spaces or if hidden)
        if (escape(character) != "%20" && $("#toggle_solid").hasClass("on")) {
            $("#m-"+mid).addClass("solid");
            $("#m-"+mid).css("opacity", 1.0);
        } else {
            $("#m-"+mid).removeClass("solid");
        }

        // Characters are hidden (do fade in / fade out)
        if (!$("#toggle_solid").hasClass("on")) {
            $("#m-"+mid).show();
            $(".character", "#m-"+mid).show();
            $("#m-"+mid).css("opacity", 1.0);

            $(".character", "#m-"+mid).delay(50).fadeTo("fast", $("#m_opacity").val(), function(){
                $("#m-"+mid).fadeTo('fast', $("#m_opacity").val(), function() {
                    //$(".character", "#m-"+mid).hide();
                    $(".character", "#m-"+mid).css("opacity", 1.0);
                });
            });
        }
    });

    if ($('.marker').size() > 0) {
        if ($('#markers .selected').size() > 1) {
            $(".marker").removeClass("selected");
        } else {
            surface.select_next();
        }
    }

    /* show the help tooltip */
    if (typeof help_behavior !== 'undefined') {
        var first_time = localStorage.getItem('crowdcurio-agent-first-time') || 0;

        if(first_time === 0) {
            var cur_position = $("#m-" + surface.selection).position();
            var tooltip = $("#togetherjs-first-time-annotation");
            tooltip.css('top', (cur_position.top - 50) + "px");
            tooltip.css('left', (cur_position.left - 50) + "px");
            tooltip.animate({opacity: 1});

            localStorage.setItem('crowdcurio-agent-first-time', 1);

            setTimeout(function () {
                tooltip.animate({opacity: 0});
            }, 8000);
        }
    }

    surface.resizeFont($("#zoom").val());
    event.preventDefault();
};

ImageAnnotator.prototype.selectTool = function(event){
    //console.log('marker mousedown (selected)');
    var e = event.target;
    if (surface.shifting == false) {
        $('.marker').removeClass('selected');
    }

    /*   verify we clicked the right object */
    //console.log($(event.target).attr('class'));
    if($(event.target).attr('class').indexOf("character") > -1){
        e = event.target.parentNode;
    }

    if ($(e).hasClass('ui-draggable') && !surface.movingMarker) {
        $('.item').removeClass('selected');
        $(e).addClass('selected');
        surface.selection = $(e).attr('id').replace('m-','');
    }
};

ImageAnnotator.prototype.dragTool = function(e){
    /*  turn on the drag state */
    surface.movingMarker = true;
};

ImageAnnotator.prototype.dropTool = function(event){
    //console.log('marker dragstop!');
    var zoom = $("#zoom").val();
    var marker_size = parseInt($('#m_size').val(), 10) * zoom;

    // Account for markersize
    var x = $(event.target).position().left + (marker_size / 2);
    var y = $(event.target).position().top + (marker_size / 2);

    /*  This might still be necessary? */
    var point = surface.point_to_base(x, y);
    //debugger;

    /* update the marker */
    surface.markers[surface.selection].updatePoint(x.toPrecision(3)/zoom, y.toPrecision(3)/zoom, surface.rotationDegree);
    //console.log(surface.markers);
//    console.log('from:                     angle: ' + surface.rotationDegree);
//    console.log('x: ' + x + " y: " + y);
//    console.log('to: ')
//    console.log('x: ' + point.x + ' y: ' + point.y);

    /*  turn off the drag state */
    surface.movingMarker = false;
    event.stopPropagation();
};

ImageAnnotator.prototype.hoverToolOn = function(){
    this.hoveringOnMarker = true;

    /*  forcefully turn on draggability of the fragment image */
    $("#fragment_container").draggable("option", "disabled", true);

    if (!($("#toggle_solid").hasClass("on")) && $(".character", this).html() != "") {
        $(this).css("opacity", 0.9);
        $(".character", this).css("opacity", 1.0);
        $(".character", this).show();
    }
};

ImageAnnotator.prototype.hoverToolOff = function(){
    this.hoveringOnMarker = false;
    /*  forcefully turn off draggability of the fragment image */
    $("#fragment_container").draggable("option", "disabled", false);

    if (!($("#toggle_solid").hasClass("on")) && $(".character", this).html() != "") {
        $(this).css("opacity", $("#m_opacity").val());
        $(".character", this).hide();
    }
};

ImageAnnotator.prototype.toggleMarkerTransparency = function(event){
    // Show characters
    if ($(event.target).hasClass("on")) {
        $(".marker").removeClass("solid");
        $(".character",".marker").hide();
        $(event.target).removeClass("on");
        $("#mode_tip").html("Show");
        $(".marker").css("opacity", $("#m_opacity").val());
    } else {
        $(".marker, .character").stop();
        $(".marker").removeClass("solid");
        $(".marker").each(function(i, m){
            if ($(".character", m).html() != "" && (escape($(".character", m).html()) != "%20")) {
                $(m).addClass("solid");
            }
        });
        $(".solid").css("opacity", 0.9);
        $(".character").css("opacity", 1.0);
        $(".character").show();
        $(event.target).addClass("on");
        $("#mode_tip").html("Hide");
    }
    event.preventDefault();
};

ImageAnnotator.prototype.toggleAutoTraversal = function(event){
    var set = $(event.target).hasClass("on");
    if (set == true) {
        $(event.target).removeClass("on");
    } else {
        $(event.target).addClass("on");
    }
    event.preventDefault();
};

ImageAnnotator.prototype.select_next = function(force) {
    if ($('#toggle_next').hasClass('on') || force) {
        if ($("#markers .selected").size() < 1) {
            $(".marker").first().addClass("selected");
            surface.selection = $($(".marker").first()).attr('id').replace('m-','');
            console.log('updated selection');
        }
        var mid =$('#markers .selected').attr("id").split("-")[1];
        var items = surface.sortTools(true);
        var found = false;
        var nid;
        $(items).each(function(i, m) {
            if (found) {
                nid = m.id;
                return false;
            }
            if (!found && m.id == mid) {
                found = true;
                return true;
            }
        });

        if (nid != undefined) {
            $('.marker').removeClass("selected");
            $('#m-'+nid).addClass("selected");
            var x = $('#m-'+nid).position().left;
            var y = $('#m-'+nid).position().top;
            surface.map.repositionFragment(x,y);

            /* update the global selection */
            surface.selection = nid;
        }
    }
};

ImageAnnotator.prototype.sortTools = function(create) {
    var items = new Array();
    $('.marker').each(function(i, m) {
        var marker = new Object();
        marker.id = $(m).attr("id").split("-")[1];
        marker.x = $(m).position().left;
        marker.y = $(m).position().top;
        items.push(marker);
    });

    items.sort(surface.do_sort);
    if (create) {
        return items;
    }
};

ImageAnnotator.prototype.do_sort = function(a,b) {
    var line_size = 30*parseFloat($("#zoom").val());

    // Same position
    if ((a.y == b.y) && (a.x == b.x)) {
        return 0;
    }

    // Marker A and B are in line
    if ((a.y < b.y+line_size) && (a.y > b.y-line_size)) {

        // Marker A is first if left less than B
        if (a.x < b.x) {
            return -1;
        } else {
            return 1;
        }
    }

    // Marker A and B are different lines
    if (a.y < b.y) {
        return -1;
    } else {
        return 1;
    }
};

ImageAnnotator.prototype.updateKeypadExample = function(event){
    $(".example_label").hide();
    $("#variations h2:visible").hide();
    if ($(".u",event.target).html() != null) {
        $(".key_label").html($(".label",event.target).html());
        $("#variations").attr("class", "");
        $("#variations").addClass($(event.target).attr("id").toLowerCase());
        $(".examples").show();
    }
};


ImageAnnotator.prototype.rotate = function(pointX, pointY, angle, offsetX, offsetY) {
        // convert angle to radians
        angle = angle * Math.PI / 180.0;

        // rotate around origin
        var centerX = 0;
        var centerY = 0;

        // get coordinates relative to center
        var dx = pointX - centerX;
        var dy = pointY - centerY;

        // calculate angle and distance
        var a = Math.atan2(dy, dx);
        var dist = Math.sqrt(dx * dx + dy * dy);

        // calculate new angle
        var a2 = a + angle;

        // calculate new coordinates
        var dx2 = Math.cos(a2) * dist;
        var dy2 = Math.sin(a2) * dist;

        // return coordinates with offset
        return {x: dx2+offsetX, y:dy2+offsetY};

};

ImageAnnotator.prototype.zoom = function(current_factor, factor) {
    var  org_height = $("#fragment img").height();
    $("#fragment img").width(($("#fragment img").width()/current_factor)*factor);
    $("#fragment img").height((org_height/current_factor)*factor);

    //re calculate the margin when the imag rotate to 90 or 270
    var current = $("#rotation").val();
    if(current == 90 || current == 270) {
        var img = $("#fragment img");
        var d = $("#fragment img").width() - $("#fragment img").height();
        img.css('margin-left', -d / 2);
        img.css('margin-top', d / 2);
    }

    surface.scale_items(current_factor, factor);
    //surface.scale_items_measure(current_factor, factor);
    $("#zoom").val(factor);
    //console.log("Updating Zoom Factor to: "+factor);

    /*
    // Scale fragment container position
    var fc_top = $("#fragment_container").position().top;
    var fc_left = $("#fragment_container").position().left;
    fc_top = (fc_top/current_factor)*factor;
    fc_left = (fc_left/current_factor)*factor;
    $("#fragment_container").css("top", fc_top+"px");
    $("#fragment_container").css("left", fc_left+"px");
    */

    if ($("#map").is(":visible")) {
        surface.map.resize_map(true);
    }

    if ($("#zoom").val() == factor) {
        $("#fragment").append($("#fragment_id").html());
        $(this).remove();
        // Delay fade in by 10ms if rotated
        var delay = ($("#rotation").val() > 0)? 100 : 0;
        setTimeout(function() {
            $("#fragment img:not(:last)").fadeOut("slow", function() {
                $(this).remove();
            });},delay);
    }
};

ImageAnnotator.prototype.scale_items =  function(currentFactor, factor) {

    if ($('.marker').length > 0) {
        $('.marker').each(function (i, marker) {

            // Calculate base position
            var baseX = $(marker).position().left / currentFactor;
            var baseY = $(marker).position().top / currentFactor;

            // Scale
            var sx = Math.round(baseX * (factor));
            var sy = Math.round(baseY * (factor));

            $(marker).css("left", sx + "px");
            $(marker).css("top", sy + "px");

        });

        // Scale circles
        var markerSize = parseInt($("#m_size").val(), 10);
        $('.marker').css("width", markerSize*factor);
        $('.marker').css("height", markerSize*factor);
        surface.resizeFont(factor);
    }
};

ImageAnnotator.prototype.zoom_in = function(event) {
    //if (!$(event.target).hasClass("disabled") && ($("#status").attr("class") == "")) {
        var current_factor = $("#zoom").val();
        var factor = parseFloat(current_factor) + parseFloat($("#zoom_step").val());
        surface.zoom(current_factor, factor);

        // Reactivate zoom out
        if ($('.zoom_out').hasClass("disabled")) {
            $('.zoom_out').removeClass("disabled");
        }
        if (factor >= $("#maxzoom").val()) {
            $('.zoom_in').addClass("disabled");
        }
    //}
    event.preventDefault();
};

ImageAnnotator.prototype.zoom_out = function(event){
    //if (!$(event.target).hasClass("disabled") && ($("#status").attr("class") == "")) {
        var current_factor = $("#zoom").val();
        var factor = parseFloat(current_factor) - parseFloat($("#zoom_step").val());
        surface.zoom(current_factor, factor);

        // Reactivate zoom in
        if ($('.zoom_in').hasClass("disabled")) {$('.zoom_in').removeClass("disabled");}
        if (factor <= $("#minzoom").val()) {$('.zoom_out').addClass("disabled");}
    //}
    event.preventDefault();
};


/* measure methods */
// Add Measurement
ImageAnnotator.prototype.addMargin = function(event){
    if (surface.dragmode == false) {
        surface.cancel();
    } else {
        surface.dragmode = false;
        $("#fragment_container").draggable("option", "disabled", true);
        var region = $(event.target).parent().attr("id");
        //var region = 'top';   // just for test
        surface.region = region;
        $(".add").removeClass("active");
        $(this).addClass("active");
    }
    event.preventDefault();
};

ImageAnnotator.prototype.add = function(event){
    event.preventDefault();
};


ImageAnnotator.prototype.columnAdd = function(event){
    $(".add", $(event.target).parent().parent()).trigger("click");
      e.preventDefault();
};


// ----------------------------------------
// CLICK
// ----------------------------------------
ImageAnnotator.prototype.beginMeasure = function(e){
      /*    place initial marker for measure */
    if (!surface.dragmode) {
        var offset = $("#measurements").offset();
        m = new Object();
        x1 = e.pageX - offset.left;
        y1 = e.pageY - offset.top;

        m.x1 = x1;
        m.y1 = y1;
        m.region = surface.region;

        surface.dragging = true;
        e.stopPropagation();

        $("#fragment_container").append("<div id='current-mm' class='measurement' style='display:none;'></div>");
        m.id = "TMP"+(new Date().getTime());
        surface.add_result(m, true);
    }

};

//--------------------------------------
//DRAG
//--------------------------------------
ImageAnnotator.prototype.startMove = function(e){
    if (!surface.dragmode) {
        var offset = $("#viewer").offset();
        var mx = e.pageX - offset.left;
        var my = e.pageY - offset.top;

        if (surface.dragging) {
            surface.draw();
            offset = $("#measurements").offset();
            x = e.pageX - offset.left;
            y = e.pageY - offset.top;
            surface.ctx.beginPath();
            surface.ctx.moveTo(x1, y1);
            surface.ctx.lineTo(x, y);
            surface.ctx.strokeStyle = "red";
            surface.ctx.stroke();
            surface.ctx.beginPath();
            surface.ctx.moveTo(x1+1, y1+1);
            surface.ctx.lineTo(x+1, y+1);
            surface.ctx.strokeStyle = "#fff";
            surface.ctx.stroke();

            // Label
            if (!$("#current-mm").is(":visible")) {$("#current-mm").show();}
            $("#current-mm").css("left", (surface.label(x, y, x1, y1).x+"px"));
            $("#current-mm").css("top", (surface.label(x, y, x1, y1).y+"px"));
            $("#current-mm").html(surface.distance_coords(x, y, x1, y1)+"<span class='unit'>px</span>");
            surface.update_result(surface.distance_coords(x, y, x1, y1), m.id);

            // Auto scroll hot regions
            var v_offset = $("#viewer").offset();
            var vx = (e.pageX-v_offset.left);
            var vy = (e.pageY-v_offset.top);

           // if (vy > 280) {OXU.navigate.down(true);}
           // if (vy < 20) { OXU.navigate.up(true);}
           // if (vx > 863) { OXU.navigate.right(true);}
           // if (vx < 20) { OXU.navigate.left(true);}
        }
        e.stopPropagation();
    }
};

//--------------------------------------------
//RELEASE
//--------------------------------------------
ImageAnnotator.prototype.EndMeasure = function(e){
    console.log("mouseup on #viewer");
    if (surface.dragging) {
        var offset = $("#measurements").offset();
        m.x2 = e.pageX - offset.left;
        m.y2 = e.pageY - offset.top;

       //surface.measurements.push(m);
        surface.measurements[m.id] = new Measurement(m.id, surface.region, m.x1, m.y1, m.x2, m.y2);
        //surface.measurements[m.id] = new Measurement(m.id, surface.region, m.x1, m.y1, m.x2, m.y2);
       // console.log(surface.measurements);
       // OXU.queue.create(m);

        var label = surface.label(m.x1, m.y1, m.x2, m.y2);
        $("#fragment_container").append("<div id='mm-"+m.id+"' class='measurement' style='top:"+label.y+"px;left:"+label.x+"px;'>"+surface.distance(m)+"<span class='unit'>px</span></div>");

        //  Reset canvas
        surface.draw();
        surface.dragging = false;
        surface.dragmode = true;
        $("#fragment_container").draggable("option", "disabled", false);
        surface.region = "";
        $(".add").removeClass("active");
        $("#current-mm").remove();
    }

};

ImageAnnotator.prototype.OverMidpoint = function(e){
    $('.delete', e.target).css("opacity", 1.0);
    var mid = surface.id(e.target);
    surface.draw(mid);
};

ImageAnnotator.prototype.OutMidpoint = function(e){
    $('.delete', e.target).css("opacity", 0.5);
    surface.draw();
};

ImageAnnotator.prototype.id = function(element){
        return $(element).attr("id").split("-")[1];
};

ImageAnnotator.prototype.cancel = function() {
    surface.dragmode = true;
    $("#fragment_container").draggable("option", "disabled", false);
    surface.region = "";
    $(".add").removeClass("active");
};

ImageAnnotator.prototype.delete = function(e) {
    var mid = surface.id($(e.target).parent());
    //var reg = $(e.target).parent().parent().attr("id");

    // Special case for paginated column results
    var column = false;
   $(e.target).parents().map(function () { if ($(this).attr("id") == "column") column = true;});
   if (column) {
       surface.remove_item("#"+$(e.target).parent().attr("id"), $(".add:hidden", "#column"));
    } else {
        $(".add", $(e.target).parent().parent()).show();
        $(e.target).parent().remove();
    }

    //delete surface.measurements[reg];
    delete surface.measurements[mid];

   surface.draw();
    $("#mm-"+mid).remove();
};

ImageAnnotator.prototype.draw = function(currentID){
    surface.ctx.clearRect(0, 0, $("#measurements").width(), $("#measurements").height());
    var i;
    for (i in  surface.measurements) {

        var cm = surface.measurements[i];
        surface.ctx.beginPath();
        surface.ctx.moveTo(cm.x1, cm.y1);
        surface.ctx.lineTo(cm.x2, cm.y2);
        if (cm.id == currentID) {
            surface.ctx.strokeStyle = "#7FF6FF";
        } else {
            surface.ctx.strokeStyle = "#00C2FF";
        }
        surface.ctx.stroke();

        surface.ctx.beginPath();
        surface.ctx.moveTo(cm.x1+1, cm.y1+1);
        surface.ctx.lineTo(cm.x2+1, cm.y2+1);
        surface.ctx.strokeStyle = "#ffffff";
        surface.ctx.stroke();
    }
};


ImageAnnotator.prototype.add_result = function(m, saved){
    var classes = (saved)? "result" : "new result";
    var item = "<div class='"+classes+"' id='m-"+m.id+"'><div class='delete'>x</div><div class='number'>0<span class='unit'>px</span></div></div>";
   if (m.region == 'column') {
        surface.handle_new_item(item, $(".add:visible", "#column"));
   } else {
        $(".add", "#"+m.region).after(item);
        $(".add", "#"+m.region).hide();
   }

};


ImageAnnotator.prototype.update_result = function(distance, mid){
    $(".number", "#m-"+mid).html(distance+"<span class='unit'>px</span>");
};


ImageAnnotator.prototype.distance_coords = function(x1, y1, x2, y2){
        var m = new Object();
        m.x1 = x1;
        m.y1 = y1;
        m.x2 = x2;
        m.y2 = y2;
        return surface.distance(m);
};

ImageAnnotator.prototype.distance = function(m) {
    var startPoint = surface.point_to_base(m.x1, m.y1);
    var endPoint = surface.point_to_base(m.x2, m.y2);
    return Math.round(Math.sqrt(Math.pow((endPoint.x-startPoint.x), 2) + Math.pow((endPoint.y-startPoint.y), 2)));
};

ImageAnnotator.prototype.point_to_base = function(px,py) {

    // Create basepoint
    var basePoint = {x: px, y: py};

    // Current state
    var rotation = $("#rotation").val();
    var width =  $("#fragment img").width();
    var height =  $("#fragment img").height();

    if(rotation == 90 || 270)
        var temp = width;
        width = height;
        height = width;

    // Shift back to offset (quarter)
    if (rotation == 0) {basePoint.x = basePoint.x-width;}
    if (rotation == 180) {basePoint.x = basePoint.x-width;basePoint.y = basePoint.y-height;}
    if (rotation == 270) {basePoint.y = basePoint.y-height;}

    // Perform rotation
    if (rotation != 0) {
        basePoint = surface.rotate(basePoint.x, basePoint.y, 0-rotation, 0, 0);
    }

    // Rescale coordinates
    basePoint.x = basePoint.x/$("#zoom").val();
    basePoint.y = basePoint.y/$("#zoom").val();
    return basePoint;
};

ImageAnnotator.prototype.label = function(x1, y1, x2, y2){
    var l = new Object();
    l.x = ((x1+(x2-x1)/2)-20);
    l.y = ((y1+(y2-y1)/2)-10);
    return l;
};



//Pagination functions for measure column items

    ImageAnnotator.prototype.clickToPage = function(e){
      var page = parseInt(surface.id(e.target), 10);
      surface.to_page(page);
    };


   ImageAnnotator.prototype.handle_new_item = function(result, add_element){
     // Last page has space
     if ($(".page:last .result").length < surface.page_size) {
       $(".page:last").append(result);
     } else {
       surface.new_page(result);
     }

     if (surface.show_last) surface.to_page(surface.id(".page:last"));

     // Hide 'add' element if there is no more space and we were asked to
     if (add_element && !surface.spaces()) $(add_element).hide();
   };


   ImageAnnotator.prototype.new_page = function(result){
    var new_no = $(".page").length+1;
    $(".pages").append("<div class='page' id='pg-"+new_no+"'></div>");
    $(".page:last").append(result);
    $(".controls").append("<span class='item' id='pc-"+new_no+"'></span>");
    surface.resize_page_container();
  };


  ImageAnnotator.prototype.to_page = function(page){
     var current_page = parseInt(surface.id(".pages .current"), 10);
     var difference = (page - current_page);
     $(".controls .item").removeClass("current");
     $("#pc-"+page).addClass("current");

     if (surface.animate1) {
       $(".pages").animate({left: 1-((page-1)*$(".page").outerWidth(true))+"px"}, function() {
         $(".pages div").removeClass("current");
         $("#pg-"+page).addClass("current");
       });
      } else {
        $(".pages").css("left", 1-((page-1)*$(".page").outerWidth(true))+"px");
        $(".pages div").removeClass("current");
        $("#pg-"+page).addClass("current");
      }
  };


  ImageAnnotator.prototype.remove_item = function(item_id, add_element){
      var item = $(item_id);
      var current_page = parseInt(surface.id($(item).parent()), 10);
        $(".number", item).fadeOut(surface.fade_time, function() {
          $(item).slideUp(surface.slide_time, function(){
              $(item).remove();
              var total_pages = $(".page").length;

              // Shift elements
              var i;
              for (i = current_page; i < total_pages; i++) {
                $("#pg-"+(i+1)+" .result:first").appendTo("#pg-"+i);
              }

              // Last page is empty
              if ($(".page:last .result").length == 0 && total_pages > 1) {
                if (current_page == total_pages && total_pages > 1) surface.to_page(total_pages-1);
                surface.remove_page(total_pages);
              }

              // Show 'add' element if there is space and we were asked to
              if (add_element && surface.spaces()) $(add_element).show();
          });
        });
  };


  ImageAnnotator.prototype.resize_page_container = function(){
      $(".pages").width($(".page").outerWidth(true)*$(".page").length);
      if($(".page").length == 1) {
        $(".controls:visible").fadeOut();
      } else {
        $(".controls:hidden").fadeIn();
      }
    };

  ImageAnnotator.prototype.remove_page = function(page_no){
      $("#pg-"+page_no).remove();
      $("#pc-"+page_no).remove();
      surface.resize_page_container();
    };


  ImageAnnotator.prototype.spaces = function() {
      return (($(".page").length < surface.max_pages) || ($(".page").length == surface.max_pages && ($(".page:last .result").length < surface.page_size)));
  };

  ImageAnnotator.prototype.reset = function(animate1) {
      $('.pages').html("<div class='page current' id='pg-1'></div>");
      $('.controls').html("<span class='item current' id='pc-1'></div>");
      animate1? $('.controls:visible').fadeOut("fast") : $('.controls:visible').hide();
      surface.resize_page_container();
    };


/* Measure rotation  */

/* rotation */
ImageAnnotator.prototype.rotateMeasure = function(event) {
    if ($("#status").attr("class") == "") {
        $("#status").addClass("processing");
        var current = $("#rotation").val();
        var width_org = $("#fragment img").width();
        var height_org = $("#fragment img").height();

        var f_src = $("#fragment img").attr('src');

        var thumb_src   = $("#map img").attr('src');
        var thumb_h     = $("#map img").attr('height');
        var thumb_w     = $("#map img").attr('width');

        var degree_step = 90;
        var map_visible = $("#map").is(":visible");
        $("#map .location").hide();
        //$("#map").fadeOut(0, function() {
            //$("#map img").remove();
       // });

        surface.map.map_initalized = false;
        // Create new image and assign source
        var fragment_img = new Image(width_org, height_org);
        fragment_img.src = f_src;
        fragment_img.className = 'subject';

        //Create new thumbs image and assign width, height and src along with id
        var thumb_img = new Image(thumb_w, thumb_h);
        thumb_img.src = thumb_src;
        thumb_img.id = 'thumb';

        var new_rotation = parseInt(current,10) + parseInt(degree_step,10);

        if  ( new_rotation < 0)  {

            new_rotation = 360 +  new_rotation;

        }

        if ( new_rotation == 360) {
            new_rotation = 0;
        } else {
            new_rotation;
        }

        //width and height of the fragments on rotation
        if (new_rotation == 0 || new_rotation == 180) {
            width = height_org;
            new_thumb_w  = thumb_h;
        } else {
            width = width_org;
            new_thumb_w  = thumb_w;
        }

        if (new_rotation == 0 || new_rotation == 180) {
            height = width_org;
            new_thumb_h   = thumb_w;
        } else {
            height = height_org;
            new_thumb_h   = thumb_h;
        }


        $("#fragment_url").val(fragment_img.src);
        $("#thumb_url").val(thumb_img.src);
        $('#rotation').val(new_rotation);


        //surface.hide_items_measure();

        // Add fresh images
        //$("#fragment img").remove();
        //$("#fragment").append(fragment_img);
        //$("#map .map_container").prepend(thumb_img);

        //main fragment rotation
        surface.step += 1;
        var img = $("#fragment img");
        img.css('transform', 'rotate('+ new_rotation +'deg)');
        var d = width - height;
        img.css('margin-left', -d/2*(surface.step%2));
        img.css('margin-top',   d/2*(surface.step%2));

        // Thumb image roation
        var t_img = $("#map img");
        t_img.css('transform', 'rotate('+ new_rotation +'deg)');
        var td = new_thumb_w - new_thumb_h;
        t_img.css('margin-left', -td/2*(surface.step%2));
        t_img.css('margin-top',   td/2*(surface.step%2));

        $(".map_container").css('width', new_thumb_h);
        $(".map_container").css('height', new_thumb_w);


        // Thumb has loaded
        $("#thumb").one("load", function() {
            surface.map.map_check(thumb_img, fragment_img);
            if (map_visible) $("#map").show();
        }).each(function() {
            thumb_img.src = $("#thumb_url").val();
            if(event.target.complete) $(this).load();
        });

        // New fragment has loaded
        $("#fragment img").one('load', function() {
            surface.rotate_items_measure(degree_step, width, height);
            //surface.show_items_measure();
            surface.map.map_check(thumb_img, fragment_img);
            $("#status").removeClass("processing");
        }).each(function() {
            fragment_img.src = $("#fragment_url").val();
            if(this.complete) $(this).load();
        });

        surface.rotationDegree += 90;
        if(surface.rotationDegree == 360)
            surface.rotationDegree = 0;

    }
    event.preventDefault();
};

ImageAnnotator.prototype.resetImageAttributes = function()
{
    $('#fragment img').attr("style", '"transform: rotate(0deg); margin-top: 0px; margin-left: 0px;"');
    $('#map img').attr("style", '"transform: rotate(0deg); margin-top: 0px; margin-left: 0px;"');

    $("#fragment_url").val(" ");
    $("#thumb_url").val('');
    $('#rotation').val(0);
    surface.step = 0;

    $('.map_container').attr('style','');

    $('#zoom').val(1.00);
    $('#fragment_id').val('');
    $('#m_size').val(20);
    $('#m_colour').val('#0B93E2');
    $('#m_opacity').val(0.3);

    $('#maxzoom').val(1.50);
    $('#minzoom').val(0.50);
    $('#zoom_step').val(0.25);
    $('#save_interval').val(20000);
    $('#m_default_size').val(20);
    $('#font_size').val(8);
    $('#compact').val('false');
}


ImageAnnotator.prototype.scale_items_measure = function(currentFactor, factor){
    if(surface.measurements) {
        var i;
        for (i in surface.measurements) {
            var cm = surface.measurements[i];
            cm.x1 = (cm.x1 / currentFactor) * factor;
            cm.y1 = (cm.y1 / currentFactor) * factor;
            cm.x2 = (cm.x2 / currentFactor) * factor;
            cm.y2 = (cm.y2 / currentFactor) * factor;
            $("#mm-" + cm.id).css("left", surface.label(cm.x1, cm.y1, cm.x2, cm.y2).x + "px");
            $("#mm-" + cm.id).css("top", surface.label(cm.x1, cm.y1, cm.x2, cm.y2).y + "px");
        }
        surface.scale_canvas_measure(currentFactor, factor);
        surface.draw();

        // Reactiveate
        $("#fragment img").load(function () {
            $("#status").removeClass("processing");
        });
    }
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

ImageAnnotator.prototype.rotate_items_measure = function(amount, width, height){

    /*rotate the canvas of the measurement */
    surface.rotate_canvas_measure(amount);

    if(Object.size(surface.measurements)) {
        var i;
        for (i in surface.measurements) {
            var cm = surface.measurements[i];
            var startPoint = surface.rotate(cm.x1, cm.y1, amount, height, 0);
            var endPoint = surface.rotate(cm.x2, cm.y2, amount, height, 0);
            cm.x1 = startPoint.x;
            cm.y1 = startPoint.y;
            cm.x2 = endPoint.x;
            cm.y2 = endPoint.y;

            $("#mm-" + cm.id).css("left", surface.label(cm.x1, cm.y1, cm.x2, cm.y2).x + "px");
            $("#mm-" + cm.id).css("top", surface.label(cm.x1, cm.y1, cm.x2, cm.y2).y + "px");
        }

        surface.draw();

        // Reactiveate
        $("#status").removeClass("processing");
    }

    $('.marker').each(function(i, marker) {
        var mid = $(marker).attr("id").split("-")[1];
        var x = $(marker).position().left;
        var y = $(marker).position().top;
        var point = surface.rotate(x, y, amount, height, 0);
        $('#m-'+mid).css("left", (point.x-$(marker).width())+"px");
        $('#m-'+mid).css("top", point.y+"px");
    });

    // Reactivate
    $("#status").removeClass("Loading");
};

ImageAnnotator.prototype.scale_canvas_measure = function(currentFactor, factor){
    var c = document.getElementById('measurements');
    c.height = (c.height/currentFactor)*factor;
    c.width = (c.width/currentFactor)*factor;
};

ImageAnnotator.prototype.rotate_canvas_measure = function(amount){
    var c = document.getElementById('measurements');
    if (amount == 90 || amount == 270) {
        var oldHeight = c.height;
        c.height = c.width;
        c.width= oldHeight;
    }
};

ImageAnnotator.prototype.resize_canvas_measure = function(dim){
    canvas.height = isNaN(dim.height)? $("#fragment img").height() : dim.height;
    canvas.width =  isNaN(dim.width)? $("#fragment img").width(): dim.width;
};

ImageAnnotator.prototype.hide_items_measure = function(){
    $("#measurements").hide();
    $(".measurement").hide();
};

ImageAnnotator.prototype.show_items_measure = function(){
    $("#measurements").show();
    $(".measurement").show();
};

/* for markrs when roate */
ImageAnnotator.prototype.hide_items = function() {
    $(".marker").css("visibility", "hidden");
};

ImageAnnotator.prototype.show_items = function() {
    $(".marker").css("visibility", "visible");
};

ImageAnnotator.prototype.toggleFullscreen = function(e){
    var main_interface = $("#main-interface");
    var main = $("#main");
    var crowdcurio_nav_bar = $("#crowdcurio-nav-bar");
    var detection_ui = $("#detection_task_interface");
    var view_dividers = $(".view-divider");
    var viewer = $("#viewer");
    var bottom_controls = $("#bottom-controls");
    var bottom_controls_keypad = $("#bottom-control-keypad");
    var task_container = $("#task-container");
    var task_row_container = $("#task-row-container");
    var zoom_view_toggles = $("#zoom_view_toggles");
    var practice_toggles = $("#practice_toggles");
    var submission_toggles = $("#submission_toggles");
    var practice_toggles_inner = $("#practice_toggles_inner");
    var submission_toggles_inner = $("#submission_toggles_inner");

    if(main_interface.hasClass('fullscreen')){
        main_interface.removeClass('fullscreen');
        main.removeClass('fullscreen');
        detection_ui.removeClass('fullscreen');
        view_dividers.removeClass('fullscreen');
        viewer.removeClass('fullscreen');
        bottom_controls.removeClass('fullscreen');
        bottom_controls_keypad.removeClass('fullscreen');
        task_container.removeClass('fullscreen');
        zoom_view_toggles.removeClass('fullscreen');
        task_row_container.removeClass('fullscreen');
        practice_toggles.removeClass('fullscreen');
        submission_toggles.removeClass('fullscreen');
        practice_toggles_inner.removeClass('fullscreen');
        submission_toggles_inner.removeClass('fullscreen');
        crowdcurio_nav_bar.show();
    } else {
        main_interface.addClass('fullscreen');
        main.addClass('fullscreen');
        detection_ui.addClass('fullscreen');
        view_dividers.addClass('fullscreen');
        viewer.addClass('fullscreen');
        bottom_controls.addClass('fullscreen');
        bottom_controls_keypad.addClass('fullscreen');
        task_container.addClass('fullscreen');
        zoom_view_toggles.addClass('fullscreen');
        task_row_container.addClass('fullscreen');
        practice_toggles.addClass('fullscreen');
        submission_toggles.addClass('fullscreen');
        practice_toggles_inner.addClass('fullscreen');
        submission_toggles_inner.addClass('fullscreen');
        crowdcurio_nav_bar.hide();
    }

    // resize the map to reflect the visibility of what's visible in fullscreen
    ms.map.resize_map(true);
};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};



/* Curio-Specific Things */
ImageAnnotator.prototype.countMarkers = function() {
    return Object.size(surface.markers);
};

module.exports = ImageAnnotator;