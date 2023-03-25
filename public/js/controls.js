

let w = false
let a = false
let s = false
let d = false


let inputAbs = 0 
let playerQuat = {x: 0, y:0, z:0, w:1,_x: 0, _y:0, _z:0, _w:1}
let playerPosition = {}
let intersect = []
let velocity = {x:0,y:0,z:0}


export const keyListener = () => {
    window.addEventListener('keydown', (e) => {
        switch (e.code) {
            case "KeyA":
                a = true;
                break;
            case "KeyD":
                d = true;
                break;
            case "KeyS":
                s = true;
                break;
            case "KeyW":
                w = true;
                break;
            default:
                break;
        }
    })

    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case "KeyA":
                a = false;
                break;
            case "KeyD":
                d = false;
                break;
            case "KeyS":
                s = false;
                break;
            case "KeyW":
                w = false;
                break;
            default:
                break;
        }
    })
}

export function getKeys(quat,position,inters,vel){
    
    playerQuat.x = quat._x
    playerQuat.y = quat._y
    playerQuat.z = quat._z
    playerQuat.w = quat._w
    playerPosition = position

    intersect = inters 
    velocity = vel

    if(w && !s) inputAbs++
    if(s && !w) inputAbs--

    return {w:w,a:a,s:s,d:d}
}

export function getUpdates(){
    return {quat: playerQuat,
            inputs: inputAbs,
            position: playerPosition,
            intersect: intersect,
            velocity: velocity}
}

export function resetInputs(){
    inputAbs = 0
    intersect = []
}