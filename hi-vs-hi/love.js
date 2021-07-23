$( document ).ready(function() {

// engine - computation and math behind this
// renderer - this draws the engine
const {Engine,Render, Bodies, World, MouseConstraint, Composites, Query, Mouse, Events} = Matter;


// where is matter being deployed
const sectionTag = document.querySelector("section.shapes");


const h = window.innerHeight;
const w = window.innerWidth;


const engine = Engine.create();
const renderer = Render.create({
	element:sectionTag,
	engine: engine,
	options: {
		height: h,
		width: w,
		wireframes: false,
		background: "#FEE2EA",
		pixelRatio: window.devicePixelRatio
	}
});


// create a shape 

const createShape = function(x,y){

	const randomNum = Math.random();


	if (randomNum > 0.5) {
	// Adding images

	return Bodies.rectangle(x, y, 38, 50 , {
		frictionAir: 0.01,		
		render: {
		
		sprite:{
			texture: "assets/redheart.svg",
			xScale: 0.5,
			yScale: 0.5
		 }
		}
	});

	}

	else if (randomNum > 0.2) {
		return Bodies.rectangle(x, y, 38, 50 , {
		frictionAir: 0.01,		
		render: {
		
		sprite:{
			texture: "assets/whiteheart.svg",
			xScale: 0.5,
			yScale: 0.5
		 }
		}
	});
	}

	else{

	return Bodies.rectangle(x, y, 38, 50 , {
		frictionAir: 0.01,		
		render: {
		
		sprite:{
			texture: "assets/pinkheart.svg",
			xScale: 0.5,
			yScale: 0.5
		 }
		}
	});

	}

	

	

	

}


const wallOptions = {
	isStatic: true,
	render: {
	 visible: false,
	 // fillStyle: "green"
	}
}

const ground = Bodies.rectangle(w/2, h + 20, w + 100, 100, wallOptions);
const ceiling = Bodies.rectangle(w/2, 0, w + 100, 50, wallOptions);
const leftWall = Bodies.rectangle(-20, h/2, 100, h + 100, wallOptions);
const rightWall = Bodies.rectangle( w + 20, h/2, 100, h + 100, wallOptions);


const canvasMouse = Mouse.create(renderer.sectionTag);
const mouseControl = MouseConstraint.create(engine, {
	element: sectionTag,
	mouse: canvasMouse,
	constraint: {
		// stiffness: 0.7,
		render:{
			visible: false
		}
	}
});


const initialShapes = Composites.stack(50,50, 15, 5, 40, 40, function(x, y){
	return createShape(x,y);

});

World.add(engine.world,[
	ground,
	ceiling,
	leftWall,
	rightWall,
	mouseControl,
	initialShapes
]);



// when we click the page add a new shape
document.addEventListener("click", function(event){
	 
	 const shape = createShape(event.pageX,event.pageY);
	 World.add(engine.world, shape);

});

// document.addEventListener("mousemove", function(event){
// 	let mousex = event.clientX; // Gets Mouse X
//   	let mousey = event.clientY; // Gets Mouse Y
//     console.log([mousex, mousey]); // Prints data

//     const hoverShapes = Query.point(initialShapes.bodies, mousex, mousey);

//     if (mousex<(w/2)){

//     	engine.world.gravity.x = -2;
//     }

//     else{

//     	engine.world.gravity.x = 2;
//     }

//      if (mousey<(h/2)){

//     	engine.world.gravity.y = -2;
//     }

//     else{

//     	engine.world.gravity.y = 2;
//     }
	
// });


window.addEventListener("deviceorientation", function(event){
	// engine.world.gravity.x = event.gamma /30;
	engine.world.gravity.y = event.beta/30;
});
  
Engine.run(engine);
Render.run(renderer);








});