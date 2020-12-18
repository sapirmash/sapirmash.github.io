				       
			import * as THREE from '/build/three.module.js';
			import { OrbitControls } from '/examples/jsm/controls/OrbitControls.js';
			import { Reflector } from '/examples/jsm/objects/Reflector.js';
			import { RGBELoader } from '/examples/jsm/loaders/RGBELoader.js';
			import { GUI } from '/examples/jsm/libs/dat.gui.module.js';
			import { RectAreaLightUniformsLib } from '/examples/jsm/lights/RectAreaLightUniformsLib.js';			


			// scene size
			var WIDTH = window.innerWidth;
			var HEIGHT = window.innerHeight;

			var SHADOW_MAP_WIDTH = WIDTH, SHADOW_MAP_HEIGHT = HEIGHT;

			// camera
			var VIEW_ANGLE = 35;
			var ASPECT = WIDTH / HEIGHT;
			var NEAR = 1;
			var FAR = 25000;

			var camera, scene, renderer, light1, cube, controls;

			var mouseX = 0, mouseY = 0;

  			var windowHalfX = window.innerWidth / 2;
      		var windowHalfY = window.innerHeight / 2;

			var material_new;
			var dirLight;

			//new code
			var cylinder5;
			var cylinderGeom5;
			// var material_number = 0;
			
			var update = false;
			var counter = 0;

			var array_of_functions = [
			   drawVase1,
			   drawVase2,
			   drawVase3,
			   drawVase4,
			   drawVase5,
			   drawVase6,
         drawVase7
			];

			var vases_names = [
			   'T-01',
			   'T-02',
			   'T-03',
			   'T-04',
			   'T-05',
			   'T-06',
         'T-07'
			];

			registerEventHandlers();
			init();

			drawVase1(); 
			update = true;
			showVal(0);
			animate();


			////////////



			function reset(){

			array_of_functions[counter%array_of_functions.length]();			
			update = true;
			cylinderGeom5.verticesNeedUpdate = true;
			trigger("change", "mouthOffset");

			}

			function save(){
				saveSTL( scene, vases_names[counter%vases_names.length] );
			}


			function showVal(val){
				if (!update){
					return;
				}
		     	var radiusTop = document.getElementById("radiusTopslider").value;
		     	var radiusBottom = document.getElementById("radiusBottom").value;
		     	var height = document.getElementById("height").value;

		     	var legTop = document.getElementById("legTop").value;
		     	var legCurve = document.getElementById("legCurve").value;
		     	var legWidth = document.getElementById("legWidth").value;
		     	var legOffset = document.getElementById("legOffset").value;

		     	var bellyTop = document.getElementById("bellyTop").value;
		     	var bellyWidth = document.getElementById("bellyWidth").value;
		     	var bellyOffset = document.getElementById("bellyOffset").value;
		     	var bellyCurve = document.getElementById("bellyCurve").value;

		     	var neckTop = document.getElementById("neckTop").value;
		     	var neckCurve = document.getElementById("neckCurve").value;
		     	var neckOffset = document.getElementById("neckOffset").value;
		     	var neckWidth = document.getElementById("neckWidth").value;

		     	var mouthCurve = document.getElementById("mouthCurve").value;
		     	var mouthOffset = document.getElementById("mouthOffset").value;
		     	var mouthWidth = document.getElementById("mouthWidth").value;

		     	var output = document.getElementById("out1");
		        output.value = radiusTop;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out2");
		        output.value = radiusBottom;
		        output.style.zIndex = "3";

				var output = document.getElementById("out3");
		        output.value = height;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out4");
		        output.value = legTop;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out5");
		        output.value = legCurve;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out6");
		        output.value = legWidth;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out7");
		        output.value = legOffset;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out8");
		        output.value = bellyTop;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out9");
		        output.value = bellyCurve;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out10");
		        output.value = bellyWidth;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out11");
		        output.value = bellyOffset;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out12");
		        output.value = neckTop;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out13");
		        output.value = neckCurve;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out14");
		        output.value = neckWidth;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out15");
		        output.value = neckOffset;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out16");
		        output.value = mouthCurve;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out17");
		        output.value = mouthWidth;
		        output.style.zIndex = "3";

		        var output = document.getElementById("out18");
		        output.value = mouthOffset;
		        output.style.zIndex = "3";

		        var materialId;
		        if ($('#glazed').hasClass('selected')) {
		        	materialId = 0;
		        }
		        else{
		        	materialId = 1;
		        }

		        var color;

		        // var brown = "#D18462";
		        // var pink = "#E3A091";
		        // var yellow = "#C79D85";
		        // var white = "#C7BFB4";

            var brown = "#C4654D";
            var pink = "#D08572";
            var yellow = "#CA9D85";
            var white = "#EBC5AA";

            

		        if ($('#brown').hasClass('selected')) {
		        	color= brown;
		        }
		        if ($('#pink').hasClass('selected')) {
		        	color= pink;
		        }
		        if ($('#yellow').hasClass('selected')) {
		        	color= yellow;
		        }
		        if ($('#white').hasClass('selected')) {
		        	color= white;
		        }
		       
		        drawVase(
		        	Number(radiusTop), 
		        	Number(radiusBottom),  
		        	Number(height), 
		        	Number(legTop), 
		        	Number(legCurve), 
		        	Number(legWidth),
		        	Number(legOffset),
		        	Number(bellyTop),
		        	Number(bellyCurve),
		        	Number(bellyWidth),
		        	Number(bellyOffset),
		        	Number(neckTop),
		        	Number(neckCurve),
		        	Number(neckWidth),
		        	Number(neckOffset),
		        	Number(mouthCurve),
		        	Number(mouthWidth),
		        	Number(mouthOffset),
		        	materialId,
		        	color	
		        	);
        	}


        	function registerEventHandlers(){
        		// set event handlers
				// document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	            // document.addEventListener( 'wheel', onDocumentWheel, false );
	            document.addEventListener('mousemove', onMouseMove, true);
	            document.getElementById('edit').addEventListener( 'click', myFunction);
	            document.getElementById('reset').addEventListener( 'click', reset);
	            document.getElementById('save').addEventListener( 'click', save);
              document.getElementById('image').addEventListener( 'click', createImage);

	            document.getElementById('glazed').addEventListener( 'click', glazed);
	            document.getElementById('clay').addEventListener('click', clay);
	            
      				var next = document.getElementById('next').addEventListener( 'click', onNextClick);
      				var pre = document.getElementById('pre').addEventListener( 'click', onPreClick);

      				var radiusTopslider = document.getElementById( 'radiusTopslider' ).addEventListener('change', showVal);
      				var radiusBottom = document.getElementById( 'radiusBottom' ).addEventListener('change', showVal);
      				var height = document.getElementById( 'height' ).addEventListener('change', showVal);

      				var legTop = document.getElementById( 'legTop' ).addEventListener('change', showVal);
      				var legCurve = document.getElementById( 'legCurve' ).addEventListener('change', showVal);
      				var legWidth = document.getElementById( 'legWidth' ).addEventListener('change', showVal);
      				var legOffset = document.getElementById( 'legOffset' ).addEventListener('change', showVal);

      				var bellyTop = document.getElementById( 'bellyTop' ).addEventListener('change', showVal);
      				var bellyWidth = document.getElementById( 'bellyWidth' ).addEventListener('change', showVal);
      				var bellyOffset = document.getElementById( 'bellyOffset' ).addEventListener('change', showVal);
      				var bellyCurve = document.getElementById( 'bellyCurve' ).addEventListener('change', showVal);

      				var neckTop = document.getElementById( 'neckTop' ).addEventListener('change', showVal);
      				var neckCurve = document.getElementById( 'neckCurve' ).addEventListener('change', showVal);
      				var neckWidth = document.getElementById( 'neckWidth' ).addEventListener('change', showVal);
      				var neckOffset = document.getElementById( 'neckOffset' ).addEventListener('change', showVal);

      				var mouthCurve = document.getElementById( 'mouthCurve' ).addEventListener('change', showVal);
      				var mouthWidth = document.getElementById( 'mouthWidth' ).addEventListener('change', showVal);
      				var mouthOffset = document.getElementById( 'mouthOffset' ).addEventListener('change', showVal);

				//about
				document.querySelector('#info').addEventListener('click', infoclick);

				//colors
				document.querySelector('#brown').addEventListener('click', colorbrown );
				document.querySelector('#pink').addEventListener('click', colorpink);
				document.querySelector('#yellow').addEventListener('click', coloryellow);
				document.querySelector('#white').addEventListener('click', colorwhite);

				//grid 
				document.querySelector('#vase1').addEventListener('click', click);
				document.querySelector('#vase2').addEventListener('click', click);
				document.querySelector('#vase3').addEventListener('click', click);
				$('.vase-wrapper').addClass("inactive");
        	}

        	function click(event){
        		if(event.currentTarget.id == 'vase1'){
        			drawVase1();	
        		}
        		if(event.currentTarget.id == 'vase2'){
        			drawVase2();	
        		}
        		if(event.currentTarget.id == 'vase3'){
        			drawVase3();	
        		}
        		$('#'+event.currentTarget.id).removeClass("inactive").addClass("active");
        		$('.inactive').fadeOut(600);
        		// $('.active').animate({ "left": "50%", "top": "50%" },"slow").delay(1000).fadeOut(1000);
        		// $('.active').fadeOut(200);
        		$("#container").delay(1500).fadeIn(500);
        		$(".header").fadeOut(600);
        		$("h1").fadeOut(600);       		
        	}

        	function infoclick(){
        		$("section").fadeOut(500); 		
        		$("#about").delay(500).fadeIn(100);
        		$("#info").css("display", "none");
        		$("#objects").css("display", "block");
        	}

        	function colorbrown(){
        		$('#brown').addClass('selected');
    				$('#white').removeClass('selected');
    				$('#yellow').removeClass('selected');
    				$('#pink').removeClass('selected');
    				update= true;
    				showVal(0);
        	}

          function colorwhite(){
            $('#white').addClass('selected');
    				$('#brown').removeClass('selected');
    				$('#yellow').removeClass('selected');
    				$('#pink').removeClass('selected');
    				update= true;
    				showVal(0);
          }

        	function coloryellow(){
        		$('#yellow').addClass('selected');
    				$('#white').removeClass('selected');
    				$('#brown').removeClass('selected');
    				$('#pink').removeClass('selected');
    				update= true;
    				showVal(0);
          	}

        	function colorpink(){
        		$('#pink').addClass('selected');
    				$('#white').removeClass('selected');
    				$('#yellow').removeClass('selected');
    				$('#brown').removeClass('selected');
    				update= true;
    				showVal(0);
        	}

        
			function init() {

    					var container = document.getElementById( 'container' );

    					// scene
    					scene = new THREE.Scene();

    					// renderer
    					renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
    					renderer.setPixelRatio( window.devicePixelRatio );
    					// renderer.setSize( WIDTH, HEIGHT );
    					renderer.setSize($(container).width(), $(container).height());
    					container.appendChild( renderer.domElement );
    					renderer.setClearColor('#E8DDDA');
    					renderer.shadowMap.enabled = true;
	        		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    					// camera
    					camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
    					camera.position.z = 2300;
	        		camera.position.y = 700;

	        		controls = new OrbitControls( camera, renderer.domElement );
	        		controls.minDistance = 2300;
    					controls.maxDistance = 200;
    					controls.maxPolarAngle = Math.PI/2;
    					controls.update();
              
			
        			//LIGHTS
        		 // 	light1 = new THREE.SpotLight( 0xffffff, 0.3, 0, Math.PI / 2 );
			        // light1.position.set( 2000, 4000, -3000 );
			        // light1.target.position.set( 1, 1, 1 );
			        // light1.castShadow = true;

			        // light1.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 20, 10, 100, 20000 ) );
			        // light1.shadow.bias = 0.0001;
			        // light1.shadow.camera.near = NEAR;
			        // light1.shadow.camera.far = FAR;
			        // light1.shadow.camera.fov = 15;

			        // light1.shadow.mapSize.width = SHADOW_MAP_WIDTH;
			        // light1.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

			        // light1.shadow.camera.right =  50000;
			        // light1.shadow.camera.left = -50000;
			        // light1.shadow.camera.top = 50000;
			        // light1.shadow.camera.bottom = -50000;

			        // hemiLight.position.set( 100, 600, 0 );
			        // dirLight.position.set( -3000, 4000, 3000 );

			        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.8 );
  				    hemiLight.position.set( 0, 500, 0 );
  				    scene.add( hemiLight );

				 //    const helper1 = new THREE.HemisphereLightHelper( hemiLight, 50 );
					// scene.add( helper1 );

				      dirLight = new THREE.DirectionalLight( 0xffffff, 0.4 );
			        dirLight.position.set( 0, 4000, 3000 );
			        scene.add( dirLight );

			  //       const helper = new THREE.DirectionalLightHelper( dirLight, 50 );
					// scene.add( helper );

			        dirLight.castShadow = true;
			        dirLight.shadow.mapSize.width = 3048;
			        dirLight.shadow.mapSize.height = 3048;

			        var d = 1500;

			        dirLight.shadow.camera.left = -d;
			        dirLight.shadow.camera.right = d;
			        dirLight.shadow.camera.top = d;
			        dirLight.shadow.camera.bottom = -d;
			        dirLight.shadow.camera.near = 40;
			        dirLight.shadow.camera.far = 10000;
			        dirLight.shadow.bias = 0.00001;
			        dirLight.shadow.darkness = 0.2;

				}

        function createImage() {

              var dataURL = renderer.domElement.toDataURL();
              var link = document.createElement("a");
              link.download = "Vase.png";
              link.href = dataURL;
              link.target = "_blank";
              link.click();

              }
		
	
	function drawVase(radiusTop,radiusBottom, height, legTop, legCurve, legWidth, legOffset,bellyTop,bellyCurve,bellyWidth,bellyOffset, neckTop,neckCurve,neckWidth,neckOffset, mouthCurve,mouthWidth, mouthOffset,materialId,color){

				// console.log('drawVase:' + radiusTop);
					// console.log('##############');
				 //    console.log('radiusTopslider'+ radiusTop);
		   //      	console.log('radiusBottom'+radiusBottom);
		   //      	console.log('height'+height);
		   //      	console.log('legTop'+legTop); 
		   //      	console.log('legCurve'+legCurve); 
		   //      	console.log('legWidth'+legWidth);
		   //      	console.log('legOffset'+legOffset);
		   //      	console.log('bellyTop'+bellyTop);
		   //      	console.log('bellyCurve'+bellyCurve);
		   //      	console.log('bellyWidth'+bellyWidth);
		   //      	console.log('bellyOffset'+bellyOffset);
		   //      	console.log('neckTop'+neckTop);
		   //      	console.log('neckCurve'+neckCurve);
		   //      	console.log('neckWidth'+neckWidth);
		   //      	console.log('neckOffset'+neckOffset);
		   //      	console.log('mouthCurve'+mouthCurve);
		   //      	console.log('mouthWidth'+mouthWidth);
		   //      	console.log('mouthOffset'+mouthOffset);  	

		   		// Cube_texture
			    	var path = "examples/textures/cube/skyboxsun25deg/";
		        	var format = '.jpg';
		        	var urls = [
		            path + 'px' + format, path + 'nx' + format,
		            path + 'py' + format, path + 'ny' + format,
		            path + 'pz' + format, path + 'nz' + format
		          	];


				   var reflectionCube = new THREE.CubeTextureLoader().load( urls );
				   var refractionCube = new THREE.CubeTextureLoader().load( urls );
			       refractionCube.mapping = THREE.SphericalReflectionMapping;
			       refractionCube.format = THREE.RGBFormat;
			 	
			 	//Vase
			 	var radialSegments = 100;
			 	var heightSegments = 90;
			 	var openEnded = false;		        

		  		if(cylinder5){
		  			scene.remove(cylinder5); 	
		  		}
		  		// if(!cylinder5){

	  			cylinderGeom5 = new THREE.CylinderGeometry(radiusTop, 
	  				radiusBottom, height, radialSegments, heightSegments, openEnded);
          var bufferGeometry = new THREE.BufferGeometry().fromGeometry( cylinderGeom5 );

	  			// var color = '#D18462';

		  		var materials = [
					new THREE.MeshPhysicalMaterial( {color: color, side: THREE.DoubleSide } ),
					new THREE.MeshPhysicalMaterial( {color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 } ),
					new THREE.MeshPhysicalMaterial( {color: color, side: THREE.DoubleSide } ),
						
				];

				var materials_shiny = [
					new THREE.MeshPhysicalMaterial( { color: color, clearcoat:1 , roughness: 0.8,
								clearcoatRoughness: 0.1, reflectivity: 0, side: THREE.DoubleSide, envMap: refractionCube, envMapIntensity: 0.4} ),
					new THREE.MeshPhysicalMaterial( {color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 } ),
					new THREE.MeshPhysicalMaterial( {color: color, side: THREE.DoubleSide } ),
						
				];

					// var cylinder5 = new THREE.Mesh( cylinderGeom5, materials );
					if (materialId == 0) {
					cylinder5 = new THREE.Mesh(cylinderGeom5, materials_shiny);
					}

					else{
					cylinder5 = new THREE.Mesh(cylinderGeom5, materials);
					}
					// 	new THREE.MeshPhysicalMaterial({
					//   color:'#D18462',
					//   side: THREE.DoubleSide
					// })
						
					scene.add(cylinder5);
					// }
					// var cylinderGeomClean = new THREE.CylinderGeometry(radiusTop, 
			  // 				radiusBottom, height, radialSegments, heightSegments, openEnded);
					// cylinderGeom5.vertices = [];

					cylinder5.position.x = 20;            
				    cylinder5.position.z = 160;
				    cylinder5.position.y = 50;
				    cylinder5.scale.set(70,70,70);
			  	
			  		
					// cylinderGeomClean.vertices.forEach(v => {
					cylinderGeom5.vertices.forEach(v => {
						var vertex = new THREE.Vector3(); // temp vector
						vertex.copy(v); // copy current vertex to the temp vector
						vertex.setY(0); // leave x and z (thus the vector is parallel to XZ plane)
						vertex.normalize(); // normalize
						
						//leg
						if (v.y <= legTop) {
							var tmp = new THREE.Vector3(); // temp vector
							tmp.copy(vertex);
							vertex.multiplyScalar(Math.sin(v.y/legCurve+legOffset) * legWidth); 
						  	vertex.add(tmp);
						}

						//belly
						if (v.y <= bellyTop && v.y > legTop ) {
							var tmp = new THREE.Vector3(); // temp vector
							tmp.copy(vertex);
						  	vertex.multiplyScalar(Math.sin(v.y/bellyCurve+bellyOffset) * bellyWidth); 
						  	vertex.add(tmp);
						}

						//neck
						if (v.y <= neckTop && v.y > bellyTop ) {
							
						  	var tmp = new THREE.Vector3(); // temp vector
						  	tmp.copy(vertex);
							vertex.multiplyScalar(Math.sin(v.y/neckCurve+neckOffset) * neckWidth) 
							vertex.add(tmp);
						}

						//mouth
						if (v.y > neckTop ) {
						
							var tmp = new THREE.Vector3(); // temp vector
							tmp.copy(vertex);
						  	vertex.multiplyScalar(Math.sin(v.y/mouthCurve+mouthOffset) * mouthWidth); 
						  	vertex.add(tmp);
						}
						
						v.add(vertex); // add the temp vector to the current vertex
						// cylinderGeom5.vertices.push(v);
					 
				})

				cylinderGeom5.computeVertexNormals();
				cylinderGeom5.verticesNeedUpdate = true;
		}
		
		
		function animate(){	
			// cylinder5.rotation.y += 0.1;
			// cylinder5.rotation.z += 0.1;
			requestAnimationFrame(animate);
			render();
			// controls.update();	
			cylinder5.verticesNeedUpdate = true;
			
		}

		function onMouseMove(event) {
		  var mousePosition = new THREE.Vector3(0, 0, 0.5);
		  mousePosition.x = 2 * (event.clientX / window.innerWidth) - 1;
		  mousePosition.y = 1 - 2 * (event.clientY / window.innerHeight);
		  mousePosition.unproject(camera);
		  var raycaster = new THREE.Raycaster(camera.position, mousePosition.sub(camera.position).normalize());
		  var intersects = raycaster.intersectObjects(scene.children);
			controls.enabled = intersects.length > 0;

			if(intersects.length > 0) {
		        $('html,body').css('cursor', 'move');
		    } else {
		        $('html,body').css('cursor', 'default');
		    }
  
		}



		function glazed(){
			$('#glazed').addClass('selected');
			$('#clay').removeClass('selected');
			update= true;
			showVal(0);
		}

		function clay(){
			$('#clay').addClass('selected');
			$('#glazed').removeClass('selected');
			update= true;
			showVal(0);
		}


		function trigger(eventName, elementName){
			var event = document.createEvent("Event");
			event.initEvent(eventName, false, true); 
			document.getElementById(elementName).dispatchEvent(event);
		}


		function myFunction(event) {
			  var x = document.getElementById("controls");
			  if (x.style.display === "block") {
			    x.style.display = "none";
			  } else {
			    x.style.display = "block";
			  }
			}


		function onNextClick( event ) {		
			cylinderGeom5.verticesNeedUpdate = false;
			update = false;

			counter += 1;
			array_of_functions[counter%array_of_functions.length]();
			document.getElementById("vasename").innerHTML = vases_names[counter%vases_names.length];
			
			update = true;
			cylinderGeom5.verticesNeedUpdate = true;
			trigger("change", "mouthOffset");

		}

		function onPreClick( event ) {
		
			cylinderGeom5.verticesNeedUpdate = false;
			update = false;

			counter += -1;
			if (counter==-1) {
				counter=array_of_functions.length-1;
			}
			array_of_functions[counter%array_of_functions.length]();
			document.getElementById("vasename").innerHTML = vases_names[counter%vases_names.length];
			
			update = true;
			cylinderGeom5.verticesNeedUpdate = true;
			trigger("change", "mouthOffset");

		}

		function drawVase1(){
			colorbrown();
		    glazed();

			document.getElementById("vasename").innerHTML = "T-01";

			document.getElementById("radiusTopslider").value = 0.4;
			trigger("change", "radiusTopslider");
			document.getElementById("radiusBottom").value = 2.2;
			trigger("change", "radiusBottom");
			document.getElementById("height").value = 11;
			trigger("change", "height");

			document.getElementById("legTop").value = -6;
			trigger("change", "legTop");
			document.getElementById("legCurve").value = 0.4;
			trigger("change", "legCurve");
			document.getElementById("legWidth").value = 0.2;
			trigger("change", "legWidth");
			document.getElementById("legOffset").value = 1;
			trigger("change", "legOffset");

			document.getElementById("bellyTop").value = 3.6;
			trigger("change", "bellyTop");
			document.getElementById("bellyCurve").value = 0.4;
			trigger("change", "bellyCurve");
			document.getElementById("bellyWidth").value = 0.2;
			trigger("change", "bellyWidth");
			document.getElementById("bellyOffset").value = 0.62;
			trigger("change", "bellyOffset");

			document.getElementById("neckTop").value = 7;
			trigger("change", "neckTop");
			document.getElementById("neckCurve").value = 0.72;
			trigger("change", "neckCurve");
			document.getElementById("neckWidth").value = 0.6;
			trigger("change", "neckWidth");
			document.getElementById("neckOffset").value = -1.8;
			trigger("change", "neckOffset");

			document.getElementById("mouthCurve").value = 2;
			trigger("change", "mouthCurve");
			document.getElementById("mouthWidth").value = 2;
			trigger("change", "mouthWidth");
			document.getElementById("mouthOffset").value = 0;
			trigger("change", "mouthOffset");
		}

		function drawVase2(){

			clay();
			colorpink();

			document.getElementById("vasename").innerHTML = "T-02";
			document.getElementById("radiusTopslider").value = 0.4;
			trigger("change", "radiusTopslider");
			document.getElementById("radiusBottom").value = 0.7;
			trigger("change", "radiusBottom");
			document.getElementById("height").value = 13;
			trigger("change", "height");

			document.getElementById("legTop").value = -7;
			trigger("change", "legTop");
			document.getElementById("legCurve").value = 0.3;
			trigger("change", "legCurve");
			document.getElementById("legWidth").value = 0.1;
			trigger("change", "legWidth");
			document.getElementById("legOffset").value = -3.8;
			trigger("change", "legOffset");

			document.getElementById("bellyTop").value = 3.4;
			trigger("change", "bellyTop");
			document.getElementById("bellyCurve").value = 3;
			trigger("change", "bellyCurve");
			document.getElementById("bellyWidth").value = 1.8;
			trigger("change", "bellyWidth");
			document.getElementById("bellyOffset").value = 2;
			trigger("change", "bellyOffset");

			document.getElementById("neckTop").value = 7;
			trigger("change", "neckTop");
			document.getElementById("neckCurve").value = 0.68;
			trigger("change", "neckCurve");
			document.getElementById("neckWidth").value = 0.4;
			trigger("change", "neckWidth");
			document.getElementById("neckOffset").value = 4.41;
			trigger("change", "neckOffset");

			document.getElementById("mouthCurve").value = 1;
			trigger("change", "mouthCurve");
			document.getElementById("mouthWidth").value = 2;
			trigger("change", "mouthWidth");
			document.getElementById("mouthOffset").value = 2;
			trigger("change", "mouthOffset");
		}

			
			function drawVase3(){

			coloryellow();
			document.getElementById("radiusTopslider").value = 0.6;
			trigger("change", "radiusTopslider");
			document.getElementById("radiusBottom").value = 0.4;
			trigger("change", "radiusBottom");
			document.getElementById("height").value = 10;
			trigger("change", "height");

			document.getElementById("legTop").value = -6;
			trigger("change", "legTop");
			document.getElementById("legCurve").value = 0.3;
			trigger("change", "legCurve");
			document.getElementById("legWidth").value = 0.1;
			trigger("change", "legWidth");
			document.getElementById("legOffset").value = -3.6;
			trigger("change", "legOffset");

			document.getElementById("bellyTop").value = 10;
			trigger("change", "bellyTop");
			document.getElementById("bellyCurve").value = 3;
			trigger("change", "bellyCurve");
			document.getElementById("bellyWidth").value = 1.7;
			trigger("change", "bellyWidth");
			document.getElementById("bellyOffset").value = 2;
			trigger("change", "bellyOffset");

			document.getElementById("neckTop").value = 4.8;
			trigger("change", "neckTop");
			document.getElementById("neckCurve").value = 1.5;
			trigger("change", "neckCurve");
			document.getElementById("neckWidth").value = 1;
			trigger("change", "neckWidth");
			document.getElementById("neckOffset").value = 3;
			trigger("change", "neckOffset");

			document.getElementById("mouthCurve").value = 1;
			trigger("change", "mouthCurve");
			document.getElementById("mouthWidth").value = 0;
			trigger("change", "mouthWidth");
			document.getElementById("mouthOffset").value = 4.6;
			trigger("change", "mouthOffset");

		}

			function drawVase4(){

			document.getElementById("radiusTopslider").value = 0.1;
			trigger("change", "radiusTopslider");
			document.getElementById("radiusBottom").value = 1.31151;
			trigger("change", "radiusBottom");
			document.getElementById("height").value = 9.7;
			trigger("change", "height");

			document.getElementById("legTop").value = -6;
			trigger("change", "legTop");
			document.getElementById("legCurve").value = 0.3;
			trigger("change", "legCurve");
			document.getElementById("legWidth").value = 0.1;
			trigger("change", "legWidth");
			document.getElementById("legOffset").value = -3.6;
			trigger("change", "legOffset");

			document.getElementById("bellyTop").value = 3.67;
			trigger("change", "bellyTop");
			document.getElementById("bellyCurve").value = 2.26;
			trigger("change", "bellyCurve");
			document.getElementById("bellyWidth").value = 1.97;
			trigger("change", "bellyWidth");
			document.getElementById("bellyOffset").value = 1.7;
			trigger("change", "bellyOffset");

			document.getElementById("neckTop").value = 8;
			trigger("change", "neckTop");
			document.getElementById("neckCurve").value = 0.71;
			trigger("change", "neckCurve");
			document.getElementById("neckWidth").value = 0.66;
			trigger("change", "neckWidth");
			document.getElementById("neckOffset").value = 4.8;
			trigger("change", "neckOffset");

			document.getElementById("mouthCurve").value = 1;
			trigger("change", "mouthCurve");
			document.getElementById("mouthWidth").value = 2; 
			trigger("change", "mouthWidth");
			document.getElementById("mouthOffset").value = 2; 
			trigger("change", "mouthOffset");

		}

		function drawVase5(){

			document.getElementById("radiusTopslider").value = 0.28009;
			trigger("change", "radiusTopslider");
			document.getElementById("radiusBottom").value = 1;
			trigger("change", "radiusBottom");
			document.getElementById("height").value = 14;
			trigger("change", "height");

			document.getElementById("legTop").value = -6.28;
			trigger("change", "legTop");
			document.getElementById("legCurve").value = 0.707;
			trigger("change", "legCurve");
			document.getElementById("legWidth").value = 0.1;
			trigger("change", "legWidth");
			document.getElementById("legOffset").value = -3.6;
			trigger("change", "legOffset");

			document.getElementById("bellyTop").value = 2.89;
			trigger("change", "bellyTop");
			document.getElementById("bellyCurve").value = 3.2;
			trigger("change", "bellyCurve");
			document.getElementById("bellyWidth").value = 2.6;
			trigger("change", "bellyWidth");
			document.getElementById("bellyOffset").value = 2.01;
			trigger("change", "bellyOffset");

			document.getElementById("neckTop").value = 7.25;
			trigger("change", "neckTop");
			document.getElementById("neckCurve").value = 1.04;
			trigger("change", "neckCurve");
			document.getElementById("neckWidth").value = 0.87;
			trigger("change", "neckWidth");
			document.getElementById("neckOffset").value = -0.35;
			trigger("change", "neckOffset");

			document.getElementById("mouthCurve").value = 2.81;
			trigger("change", "mouthCurve");
			document.getElementById("mouthWidth").value = 1.21; 
			trigger("change", "mouthWidth");
			document.getElementById("mouthOffset").value = 3.61; 
			trigger("change", "mouthOffset");

		}

		function drawVase6(){

			document.getElementById("radiusTopslider").value = 1.45;
			trigger("change", "radiusTopslider");
			document.getElementById("radiusBottom").value = 1.81;
			trigger("change", "radiusBottom");
			document.getElementById("height").value = 14;
			trigger("change", "height");

			document.getElementById("legTop").value = -7.2;
			trigger("change", "legTop");
			document.getElementById("legCurve").value = 0.3;
			trigger("change", "legCurve");
			document.getElementById("legWidth").value = 0.1;
			trigger("change", "legWidth");
			document.getElementById("legOffset").value = -3.8;
			trigger("change", "legOffset");

			document.getElementById("bellyTop").value = 3.62;
			trigger("change", "bellyTop");
			document.getElementById("bellyCurve").value = 3.2;
			trigger("change", "bellyCurve");
			document.getElementById("bellyWidth").value = 2.6;
			trigger("change", "bellyWidth");
			document.getElementById("bellyOffset").value = 1.99;
			trigger("change", "bellyOffset");

			document.getElementById("neckTop").value = 6.72;
			trigger("change", "neckTop");
			document.getElementById("neckCurve").value = 0.74;
			trigger("change", "neckCurve");
			document.getElementById("neckWidth").value = 0.42;
			trigger("change", "neckWidth");
			document.getElementById("neckOffset").value = 4.41;
			trigger("change", "neckOffset");

			document.getElementById("mouthCurve").value = 1.02;
			trigger("change", "mouthCurve");
			document.getElementById("mouthWidth").value = 0.49; 
			trigger("change", "mouthWidth");
			document.getElementById("mouthOffset").value = 1.08; 
			trigger("change", "mouthOffset");

		}


    function drawVase7(){

      document.getElementById("radiusTopslider").value = 1.45;
      trigger("change", "radiusTopslider");
      document.getElementById("radiusBottom").value = 1.81;
      trigger("change", "radiusBottom");
      document.getElementById("height").value = 14;
      trigger("change", "height");

      document.getElementById("legTop").value = -7.2;
      trigger("change", "legTop");
      document.getElementById("legCurve").value = 0.3;
      trigger("change", "legCurve");
      document.getElementById("legWidth").value = 0.1;
      trigger("change", "legWidth");
      document.getElementById("legOffset").value = -3.8;
      trigger("change", "legOffset");

      document.getElementById("bellyTop").value = 4.42;
      trigger("change", "bellyTop");
      document.getElementById("bellyCurve").value = 2.79;
      trigger("change", "bellyCurve");
      document.getElementById("bellyWidth").value = 0.94;
      trigger("change", "bellyWidth");
      document.getElementById("bellyOffset").value = 1.96;
      trigger("change", "bellyOffset");

      document.getElementById("neckTop").value = 4.47;
      trigger("change", "neckTop");
      document.getElementById("neckCurve").value = 0.64;
      trigger("change", "neckCurve");
      document.getElementById("neckWidth").value = 1.42;
      trigger("change", "neckWidth");
      document.getElementById("neckOffset").value = 2.86;
      trigger("change", "neckOffset");

      document.getElementById("mouthCurve").value = 1;
      trigger("change", "mouthCurve");
      document.getElementById("mouthWidth").value = 0.37; 
      trigger("change", "mouthWidth");
      document.getElementById("mouthOffset").value = 0.13; 
      trigger("change", "mouthOffset");

    }


       window.onresize = function(event) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize($(container).width(), $(container).height());
        // renderer.setSize( window.innerWidth, window.innerHeight );
        
      };


		// function onDocumentMouseMove(event) {

  //       mouseX = ( event.clientX - windowHalfX );
  //       mouseY = ( event.clientY - windowHalfY );

  //     }


  //     function onDocumentWheel(event) {
  //       event.preventDefault();
  //       //mag = event.deltaY * 0.0008;
  //     }

	function render(){
		// camera.position.x += ( mouseX - camera.position.x ) * .05;
        // camera.position.y = THREE.Math.clamp( camera.position.y + ( - ( mouseY - 600 ) - camera.position.y ) * .05, 50, 1000 );

        // dirLight.position.x += ( mouseX - dirLight.position.x - 1000 ) * .05;
    camera.lookAt( scene.position );
		renderer.render( scene, camera );
    // console.log(renderer);
	}





	// STL export
	var STLExporter = function () {};

	STLExporter.prototype = {

	constructor: STLExporter,

	parse: ( function () {

		var vector = new THREE.Vector3();
		var normalMatrixWorld = new THREE.Matrix3();

		return function ( scene ) {

			var output = '';

			output += 'solid exported\n';

			scene.traverse( function ( object ) {

				if ( object instanceof THREE.Mesh ) {

					var geometry = object.geometry;
					var matrixWorld = object.matrixWorld;
					var mesh = object;

					if ( geometry instanceof THREE.Geometry ) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;

						normalMatrixWorld.getNormalMatrix( matrixWorld );

						for ( var i = 0, l = faces.length; i < l; i ++ ) {
							var face = faces[ i ];

							vector.copy( face.normal ).applyMatrix3( normalMatrixWorld ).normalize();

							output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
							output += '\t\touter loop\n';

							var indices = [ face.a, face.b, face.c ];

							for ( var j = 0; j < 3; j ++ ) {
								var vertexIndex = indices[ j ];
								if (mesh.geometry.skinIndices.length == 0) {
									vector.copy( vertices[ vertexIndex ] ).applyMatrix4( matrixWorld );
									output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
								} else {
									vector.copy( vertices[ vertexIndex ] ); //.applyMatrix4( matrixWorld );
									
									// see https://github.com/mrdoob/three.js/issues/3187
									boneIndices = [];
									boneIndices[0] = mesh.geometry.skinIndices[vertexIndex].x;
									boneIndices[1] = mesh.geometry.skinIndices[vertexIndex].y;
									boneIndices[2] = mesh.geometry.skinIndices[vertexIndex].z;
									boneIndices[3] = mesh.geometry.skinIndices[vertexIndex].w;
									
									weights = [];
									weights[0] = mesh.geometry.skinWeights[vertexIndex].x;
									weights[1] = mesh.geometry.skinWeights[vertexIndex].y;
									weights[2] = mesh.geometry.skinWeights[vertexIndex].z;
									weights[3] = mesh.geometry.skinWeights[vertexIndex].w;
									
									inverses = [];
									inverses[0] = mesh.skeleton.boneInverses[ boneIndices[0] ];
									inverses[1] = mesh.skeleton.boneInverses[ boneIndices[1] ];
									inverses[2] = mesh.skeleton.boneInverses[ boneIndices[2] ];
									inverses[3] = mesh.skeleton.boneInverses[ boneIndices[3] ];

									skinMatrices = [];
									skinMatrices[0] = mesh.skeleton.bones[ boneIndices[0] ].matrixWorld;
									skinMatrices[1] = mesh.skeleton.bones[ boneIndices[1] ].matrixWorld;
									skinMatrices[2] = mesh.skeleton.bones[ boneIndices[2] ].matrixWorld;
									skinMatrices[3] = mesh.skeleton.bones[ boneIndices[3] ].matrixWorld;
									
									var finalVector = new THREE.Vector4();
									for(var k = 0; k<4; k++) {
										var tempVector = new THREE.Vector4(vector.x, vector.y, vector.z);
										tempVector.multiplyScalar(weights[k]);
										//the inverse takes the vector into local bone space
										tempVector.applyMatrix4(inverses[k])
										//which is then transformed to the appropriate world space
										.applyMatrix4(skinMatrices[k]);
										finalVector.add(tempVector);
									}
									output += '\t\t\tvertex ' + finalVector.x + ' ' + finalVector.y + ' ' + finalVector.z + '\n';
								}
							}
							output += '\t\tendloop\n';
							output += '\tendfacet\n';
						}
					}
				}

			} );

			output += 'endsolid exported\n';

			return output;
		};
	}() )
};

// Use FileSaver.js 'saveAs' function to save the string
function saveSTL( scene, name ){  
  var exporter = new STLExporter();
  var stlString = exporter.parse( scene );
  
  var blob = new Blob([stlString], {type: 'text/plain'});
  
  saveAs(blob, name + '.stl');
}