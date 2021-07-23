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
		background: "#000000",
		pixelRatio: window.devicePixelRatio
	}
});


// create a shape 

const createShape = function(x,y){

	const randomNum = Math.random();

	if (randomNum > 0.5) {
	// Adding images

	// return Bodies.rectangle(x, y, 38, 50 , {
	// 	frictionAir: 0.01,		
	// 	render: {
	// 		// fillStyle: "pink"
	// 	sprite:{
	// 		texture: "assets/outline-2x.png",
	// 		xScale: 0.5,
	// 		yScale: 0.5
	// 	 }
	// 	}
	// });

	return Bodies.rectangle(x, y, 100*Math.random(), 200*Math.random() , {
		frictionAir: 0.01,		
		render: {
			fillStyle: "black",
			strokeStyle: 'white',
        	lineWidth: 2
		}
	});
	}

	else{
	//random circles
	return Bodies.circle(x, y, 30 + 20 * Math.random(), {
		frictionAir: 0.01,	
		// density: 0.5,	
		render: {
			fillStyle: "black",
			strokeStyle: 'white',
        	lineWidth: 2
		// sprite:{
		// 	texture: "assets/ball.png",
		// 	xScale: 0.5,
		// 	yScale: 0.5
		//  }
		}
	});
	}

}

const bigBall = Bodies.circle( w/2, h/2, Math.min(w/4,h/4), {
	isStatic: true,
	render: {
	 	fillStyle: "black",
	 	strokeStyle: 'white',
        lineWidth: 2
	}

});

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
	bigBall,
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

document.addEventListener("mousemove", function(event){
	let mousex = event.clientX; // Gets Mouse X
  	let mousey = event.clientY; // Gets Mouse Y
    console.log([mousex, mousey]); // Prints data

    const hoverShapes = Query.point(initialShapes.bodies, mousex, mousey);

    if (mousex<(w/2)){

    	engine.world.gravity.x = -2;
    }

    else{

    	engine.world.gravity.x = 2;
    }

     if (mousey<(h/2)){

    	engine.world.gravity.y = -2;
    }

    else{

    	engine.world.gravity.y = 2;
    }
	
});
  
Engine.run(engine);
Render.run(renderer);



window.addEventListener("deviceorientation", function(event){
	engine.world.gravity.x = event.gamma /30;
	engine.world.gravity.y = event.beta/30;
})





// let time = 0;
// document.addEventListener("mousemove", function(){
// 	// const vector = {x:event.mouse.x, y:event.mouse.Y};
// 	const x = mouse.position.x;
// 	const y = mouse.position.y;
// 	const hoverShapes = Query.point(initialShapes.bodies, vector);

// 	time = time + 0.5;

// 	engine.world.gravity.x = Math.sin(time +x);
// 	engine.world.gravity.y = Math.cos(time +y);

// });



// let time = 0;
// const changeGravity = function(event){
// 	time = time + 0.5;

// 	engine.world.gravity.x = Math.sin(time);
// 	engine.world.gravity.y = Math.cos(time);

// }


});