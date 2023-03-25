
import http from 'http'
import express from "express"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import geckos from '@geckos.io/server'


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = 8080


const app = express()

const server = http.createServer(app)

const io = geckos()


//app.use(express.static('public'))
app.use('/css', express.static(__dirname + '/public/css'))
app.use('/js', express.static(__dirname + '/public/js'))
app.use('/texture', express.static(__dirname + '/public/texture'))
app.use('/cannon', express.static(__dirname + '/node_modules/cannon-es/dist'))
app.use('/three', express.static(__dirname + '/node_modules/three/build'))

app.get('*',(req,res)=>{
    res.sendFile(__dirname + '/index.html')
})

server.listen(port, () => {
    console.log(`Server listening on ${port}`);
})



let players = {}
let squashedPlayers = []
let boosts = {speed:[],jump:[],grow:[],stuck:[],shrink:[]}
let speedBoostCount = 0, jumpBoostCount = 0, growBoostCount = 0, stuckBoostCount = 0, shrinkBoostCount = 0


/*
 speed = green
 jump = yellow
 shield = blue
 grow = orange
 stuck = red
 shrink = brown
 */
let dd = {}


io.addServer(server)

io.onConnection( channel =>{

    console.log(`${channel.id} Connected`)

    channel.on('Arrival',data=>{
        channel.emit('ID',channel.id)

        players[channel.id] =  {
            id: channel.id,
            size: 5,
            texture: data.texture,
            position: data.position,
            prePosition: {},
            quat: {x:0,y:0,z:0,w:1},
            inputs: 0,
            velocity: {x:0,y:0,z:0},
            stuck: false,
            velocityFactor: 20
        }
        
    })

    channel.on('PlayerUpdate',data=>{
        
        if(players[channel.id]){

            players[channel.id].prePosition = players[channel.id].position
            players[channel.id].position = data.position

            if(players[channel.id].stuck){
                players[channel.id].inputs = 0
            }else{
                players[channel.id].inputs = data.inputs
            }
            
            players[channel.id].quat = data.quat
            players[channel.id].velocity = data.velocity


            

                const velMag = players[channel.id].velocity.x**2+
                    players[channel.id].velocity.y**2+
                    players[channel.id].velocity.z**2
                
                if(velMag > 1500){
                    
                    for(let i in data.intersect.players){
                        
                        
                        if(players[data.intersect.players[i]] && players[channel.id].size >= players[data.intersect.players[i]].size  ){
                            
                            let ipos = Math.sqrt(players[data.intersect.players[i]].position.x**2+
                            players[data.intersect.players[i]].position.y**2+
                            players[data.intersect.players[i]].position.z**2)
                            let ppos = Math.sqrt(players[channel.id].position.x**2+
                            players[channel.id].position.y**2+
                            players[channel.id].position.z**2)
                        
                            if(Math.abs(ppos-ipos) <10){
                                
                                players[channel.id].size += parseInt(players[data.intersect.players[i]].size/4,10)
                                players[channel.id].velocityFactor = 100/players[channel.id].size
                                squashedPlayers.push(data.intersect.players[i])
                                

                                delete players[data.intersect.players[i]]
                            }
                        }
                        
                    }
                }

                checkBoostInt(data.intersect.boosts,players[channel.id])


                    
            
        }
    })

    channel.on('chat message', data => {
        console.log(data)
    })


    channel.onDisconnect(reason =>{
        //delete players[channel.id]

    })

    channel.on('Disconnect',()=>{
        console.log(`Closing ${channel.id}`)
        channel.close()
    })

})

//game loop

const hrtimeMs = function() {
    let time = process.hrtime()
    return time[0] * 1000 + time[1] / 1000000
}

const TICK_RATE = 30  //saniyede kac update
let tick = 1
let previous = hrtimeMs()
let tickLengthMs = 1000 / TICK_RATE
let ti=0
let k =false
const loop = () => {
    setTimeout(loop, tickLengthMs)
    let now = hrtimeMs()
    let delta = (now - previous) / 1000
    // game.update(delta, tick) // game logic would go here
    ti = Date.now()



    io.emit('GameUpdate', {players: players,
                            squashedPlayers: squashedPlayers,
                            t:ti,
                            boosts: boosts }    )
    
    
    squashedPlayers = []
    previous = now

}

loop()

function generatePosition(){
    return {
        x: Math.floor(Math.random() * 3000 - 1500),
        y: 4,
        z: Math.floor(Math.random() * 3000 - 1500)
    }
}

function generateSpeed(){
    if(speedBoostCount>= 10){
        boosts.speed.shift()
        speedBoostCount--
    }

    boosts.speed.push({boostID:Date.now(),pos:generatePosition()})
    speedBoostCount++
}

function generateGrow(){
    if(growBoostCount>= 10){
        boosts.grow.shift()
        growBoostCount--
    }

    boosts.grow.push({boostID:Date.now(),pos:generatePosition()})
    growBoostCount++
}

function generateShrink(){
    if(shrinkBoostCount>= 10){
        boosts.shrink.shift()
        shrinkBoostCount--
    }

    boosts.shrink.push({boostID:Date.now(),pos:generatePosition()})
    shrinkBoostCount++
}

function generateJump(){
    if(jumpBoostCount>= 10){
        boosts.jump.shift()
        jumpBoostCount--
    }

    boosts.jump.push({boostID:Date.now(),pos:generatePosition()})
    jumpBoostCount++
}

function generateStuck(){
    if(stuckBoostCount>= 10){
        boosts.stuck.shift()
        stuckBoostCount--
    }

    boosts.stuck.push({boostID:Date.now(),pos:generatePosition()})
    stuckBoostCount++

}

function unStuck(player){
    setTimeout(() => {
        player.stuck = false
    }, 1500);
}

function checkBoostInt(intedBoosts,player){
    for(let i in intedBoosts){
        for(let j in intedBoosts[i]){
            if(boosts[i]){
                for(let k in boosts[i]){

                    if(boosts[i][k].boostID == intedBoosts[i][j] ){

                        if(i =='speed'){
                            player.inputs *= 100
                            boosts[i] = boosts[i].filter(e => e!= boosts[i][k])
                            console.log('Speed Taken')
                            speedBoostCount--
                            return
                        }else if(i == 'grow'){
                            player.size += 1
                            boosts[i] = boosts[i].filter(e => e!= boosts[i][k])
                            growBoostCount--
                            console.log('Grow Taken')
                            return
                        }else if(i == 'shrink'){
                            if(player.size > 1){
                                player.size -= 1
                            }
                            
                            boosts[i] = boosts[i].filter(e => e!= boosts[i][k])
                            console.log('Shrink Taken')
                            shrinkBoostCount--
                            return
                        }else if(i == 'stuck'){
                            player.stuck = true
                            unStuck(player)
                            boosts[i] = boosts[i].filter(e => e!= boosts[i][k])
                            stuckBoostCount--
                            console.log('Stuck Taken')
                            return
                        }

                    }

                }

            }
        }
    }
}


setInterval(() => {
    generateSpeed()
}, 1000);
setInterval(() => {
    generateGrow()
}, 1000);
setInterval(() => {
    generateShrink()
}, 1000);
setInterval(() => {
    generateStuck()
}, 1000);


