import { getUpdates,resetInputs } from "./controls.js";

// eslint-disable-next-line no-undef
const channel = geckos({port:8080})
let ID = 0

//network
const RENDER_DELAY = 100;
const gameUpdates = [];
let gameStart = 0;
let firstServerTimestamp = 0;
let intDec = []
let upTime = 0

const initConnection = new Promise(resolve =>{
    channel.onConnect(error =>{
        if(error) console.error(error.message)
        console.log('Connected')
        resolve()
    })
})

export const connnection = (pos,tex) => {
    initConnection.then(() =>{
        channel.emit('Arrival',{position: pos,texture: tex})
        
        channel.on('ID', data=>{
            ID = data
        })
    
        channel.on('GameUpdate',data=>{
            processGameUpdate(data)
            upTime = Date.now()
        })

        channel.on('IntDec',data =>{
            intDec.push(data)
        })
    
    })
}

export function getID(){
    return ID
}

export function getIntDec(){
    let copyInt = [...intDec]
    intDec = []
    return copyInt
}

export function initState() {
    gameStart = 0;
    firstServerTimestamp = 0;
}

function processGameUpdate(update) {
    if (!firstServerTimestamp) {
      firstServerTimestamp = update.t;
      gameStart = Date.now();
    }
    gameUpdates.push(update);
  
  
    // Keep only one game update before the current server time
    const base = getBaseUpdate();
    if (base > 0) {
      gameUpdates.splice(0, base);
    }
}

function currentServerTime() {
    return firstServerTimestamp + (Date.now() - gameStart) - RENDER_DELAY;
}

function getBaseUpdate() {
    const serverTime = currentServerTime();
    for (let i = gameUpdates.length - 1; i >= 0; i--) {
      if (gameUpdates[i].t <= serverTime) {
        return i;
      }
    }
    return -1;
}

export function getCurrentState() {
    if (!firstServerTimestamp || gameUpdates.length==0) {
      return 0;
    }

    const base = getBaseUpdate();
    const serverTime = currentServerTime();
  
    // If base is the most recent update we have, use its state.
    // Otherwise, interpolate between its state and the state of (base + 1).
    if (base < 0 || base === gameUpdates.length - 1) {

        return {baseUpdate: gameUpdates[gameUpdates.length - 1],
            next:0,
            ratio:0,upTime: upTime}
    } else {
        const baseUpdate = gameUpdates[base];
        const next = gameUpdates[base + 1];
        const ratio = (serverTime - baseUpdate.t) / (next.t - baseUpdate.t);

        return { baseUpdate: baseUpdate, next: next, ratio:ratio,upTime: upTime };
    }
}

export function sendUpdates(){
    channel.emit('PlayerUpdate',getUpdates())
    resetInputs()
}




