
/** STRATEGY VERSION*/
function ShapeFactory(){
    var shareRenderers = [new TriangleRenderer(c), new CircleRenderer(c), new SquareRenderer(c)];
    this.getRandomShape = function(pCenter){
        return new Shape(pCenter,shareRenderers[Math.floor(Math.random()*shareRenderers.length)]);
    }    
}

function TriangleRenderer(context){
    var context=context;
    this.draw=function(pCenter){
        context.beginPath();
        context.moveTo(pCenter.x,pCenter.y-SHAPE_RADIUS);
        context.lineTo(pCenter.x+SHAPE_RADIUS,pCenter.y+SHAPE_RADIUS);
        context.lineTo(pCenter.x-SHAPE_RADIUS,pCenter.y+SHAPE_RADIUS);
        context.lineTo(pCenter.x,pCenter.y-SHAPE_RADIUS);
        context.strokeStyle = 'blue';
        context.fillStyle="#FF7260";
        context.fill();
        context.stroke();          
    };
}

function CircleRenderer(context){
    var context=context;
    this.draw=function(pCenter){
        context.beginPath();
        context.arc(pCenter.x,pCenter.y,SHAPE_RADIUS,0,Math.PI*2,false);
        context.strokeStyle = 'blue';
        context.fillStyle="#9BD7D5";
        context.fill();
        context.stroke();           
    };    
}

function SquareRenderer(context){
    var context=context;
    this.draw=function(pCenter){
        context.beginPath();
        context.fillStyle="#129793";
        context.rect(pCenter.x-SHAPE_RADIUS,pCenter.y-SHAPE_RADIUS,90,90);
        context.strokeStyle = 'blue';
        context.fill();
        context.stroke();        
    };    
}
 
function Shape(pCenter,renderer){
    this.pCenter = pCenter;  
    this.renderer = renderer;
}

Shape.prototype.draw = function(){
    this.renderer.draw(this.pCenter);
};
Shape.prototype.fall = function(yDelta){
    this.pCenter = this.pCenter.addDeltaY(yDelta);
    this.draw();        
}
Shape.prototype.isInPoint = function(point){
   return this.pCenter.isWithinRange(point,SHAPE_RADIUS);
};
Shape.prototype.isBelow = function(yCoord){
    if(this.pCenter.y>yCoord)
        return true;
    return false;
};

/*END OF STRATEGY VERSION*/


function Point(x,y){
    this.x=x;
    this.y=y;
    
    this.isWithinRange = function(point,range){
        if(point.x >= this.x - range && point.x <= this.x + range && point.y >= this.y - range && point.y <= this.y + range ){
            return true; 
        } 
        return false;
    }
    
    this.addDeltaY = function(delta){
        return new Point(this.x,this.y+delta);
    }
}

function SpeedRange(minSpeed,maxSpeed){
    var minSpeed = minSpeed;
    var maxSpeed = maxSpeed;
    
    this.getRandom = function(){
        var randomSpeed = Math.floor((Math.random() * (maxSpeed - minSpeed))+minSpeed);
        //console.log("speed " + randomSpeed);
        return randomSpeed;
    }
}

//controls lane speed and drops shapes
function Lane(position,shapeFactory,initialSpeedRange){
    var shapes=[];
    var laneStartX = position*LANE_WIDTH;
    var laneSpeed = initialSpeedRange.getRandom();
    var self=this;
    
    self.dropShape = function(){
        //console.log("lane dropping new shape");
        var shape = shapeFactory.getRandomShape(new Point(laneStartX+LANE_WIDTH/2,-SHAPE_RADIUS)); 
        shapes.push(shape);
    }

    self.removeShape = function(shape){
        shapes.splice(shapes.indexOf(shape),1);
    }
    
    self.newAllowableSpeedRange = function(range){
        laneSpeed = range.getRandom();
    }
    
    self.update = function(){
        shapes.forEach(function(shape){
            shape.fall(laneSpeed);        
            //testing only -- game should actually end if a shape drops below the bottom
            if(shape.isBelow(canvas.height+SHAPE_RADIUS)){
                self.removeShape(shape);
            }
        })    
    }
    
    self.getShapeCount = function(){
        return shapes.length;
    }
    
    self.getShapeAt = function(point){
        var shapeFound=null;
        
        shapes.forEach(function(shape){
            if(shape.isInPoint(point)) {
                shapeFound = shape;
            }
        });
        return shapeFound;
    }
    
    self.getShapes = function(){
        return shapes;
    }
    
    self.canDropWithoutOverlap = function(){
        if(shapes.length===0) return true;
        var lastDroppedShape = shapes[shapes.length-1];
        return lastDroppedShape.isBelow(SHAPE_RADIUS); //TODO: workout the math later
    }
}



function Game(){
    var shapeFactory = new ShapeFactory();    
    var difficultyLevel = (function(){
        var minSpeed=1;
        var maxSpeed=3;
        var maxShapes=10;
        var rewardPts = 1;
        
        function getSpeedRange(){
            return new SpeedRange(minSpeed,maxSpeed);
        }
        
        function requestIncrease(){
            if(minSpeed<10){
                minSpeed++;
                maxSpeed++;
            }
            if(maxShapes<30){
                maxShapes++;
            }
            rewardPts++;
        }       
        
        function canHandleMoreShapes(numOfShapes){
            return numOfShapes<= maxShapes;
        }
        
        function getRewardPts(){
            return rewardPts;
        }
        
        return {
            getRewardPts:getRewardPts,
            getSpeedRange:getSpeedRange,
            requestIncrease:requestIncrease,
            canHandleMoreShapes:canHandleMoreShapes
        };
    })();
    var score=0;
    var laneArray = [ 
        new Lane(0,shapeFactory,difficultyLevel.getSpeedRange()),
        new Lane(1,shapeFactory,difficultyLevel.getSpeedRange()),
        new Lane(2,shapeFactory,difficultyLevel.getSpeedRange()),
        new Lane(3,shapeFactory,difficultyLevel.getSpeedRange())
    ];
 
    
    this.handleClick = function(point){
        var shapeClicked=undefined;
        
        laneArray.forEach(function(lane){
            if(shapeClicked = lane.getShapeAt(point)){
                lane.removeShape(shapeClicked);
                score+=difficultyLevel.getRewardPts();
                scoreElement.innerHTML=score; //TODO: Need to revisit this if there's time
            }
        });
    }
    
    this.start = function(){
        window.setInterval(dropNewShape,100);
        window.setInterval(difficultyLevel.requestIncrease,10000);
        window.setInterval(assignNewLaneSpeeds,10000);
        
        this.animate();
    }
    
    
    this.animate=function animate(){
        requestAnimationFrame(animate);
        c.fillStyle="#505050";
        c.fillRect(0,0,canvas.width,canvas.height)
        
        laneArray.forEach(function(lane){
            lane.update();
        })
    }
    
    
    function getOnScreenShapeCount(){
        var count=0;
        laneArray.forEach(function(lane){
            count+= lane.getShapeCount();
        });
        
       // console.log("on scren shapes = " + count);
        return count;
    }
    
    //called by timer
    function assignNewLaneSpeeds(){
        laneArray.forEach(function(lane){
            lane.newAllowableSpeedRange(difficultyLevel.getSpeedRange());
        });
    }
    
    //called by timer
    function dropNewShape(){
       // console.log("dropNewShape called"); 
        var attempts = 0;
        if(difficultyLevel.canHandleMoreShapes(getOnScreenShapeCount())){
            for(;;){
                //considered while(!getRandomLane().dropShape()){}
                var lane =  getRandomLane();
                if(lane.canDropWithoutOverlap()) {
                    lane.dropShape();
                    break;
                }
                if(++attempts>10) break; //TODO: need to revisit -- keep track of which lanes have been attempted
                
            }             
        }
    }
    
    function getRandomLane(){
        return laneArray[Math.floor(Math.random()*laneArray.length)];
    }
}



var LANE_WIDTH = 100;
var NUMBER_OF_LANES = 4;
var SHAPE_RADIUS = 45;
var canvas = document.querySelector('canvas');
var scoreElement = document.querySelector('#idScore');

canvas.width = 400;
canvas.height =600; 

var c = canvas.getContext('2d');

var game = new Game();
game.start();


window.addEventListener('mousedown',function(event){
    game.handleClick(new Point(event.x,event.y));
});
