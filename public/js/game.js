import * as THREE from '../three/three.module.js'
import * as CANNON from '../cannon/cannon-es.js'
import Stats from './stats.module.js'
import { getKeys, keyListener } from './controls.js'
import { connnection, initState, getCurrentState, sendUpdates, getID, getIntDec } from './networking.js'
import {gameState} from './gameState.js'
import {handleBoosts} from './boosts.js'


const scene = new THREE.Scene();
let camera, renderer
const stats = new Stats();
const textureLoader = new THREE.TextureLoader()

const players = {}
const playerPhyMat = new CANNON.Material('playerPhyMat')


//game
const yawObject = new THREE.Object3D()
const directionObject = new THREE.Object3D()
const directionVector = new THREE.Vector3()
const inputVelocity = new THREE.Vector3(0, 0, 0);
const clock = new THREE.Clock()
let raycaster
const phase = new CANNON.NaiveBroadphase()
phase.useBoundingBoxes = true

let phyWorld,delta,lastCallTime = 0
let gameOver = false


const initGameConnectionPromise = new Promise(resolve =>{
    connnection(gameState.player.position.x,gameState.player.position.y)
    resolve()
   }).then(()=>{
      setupScene()
      keyListener()
      setInterval(() => {
        sendUpdates()
      }, 30);
   })


function setupScene() {
   phyWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -360, 0),
   })

   
   let rigidBody = new CANNON.Body({
      mass: 5,
      shape: new CANNON.Sphere(5),
      material: playerPhyMat
   })

   rigidBody.position.set(gameState.player.position.x, gameState.player.position.y, gameState.player.position.z)
   rigidBody.linearDamping = 0.3
   gameState.player.rigidBody = rigidBody

   phyWorld.addBody(gameState.player.rigidBody)

   camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
   camera.layers.enable(0);
   camera.layers.enable(1);

   renderer = new THREE.WebGLRenderer({
   antialias: true,
  pixelRatio: window.devicePixelRatio
      });
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.shadowMap.type = THREE.BasicShadowMap
   renderer.shadowMap.enabled = true
   renderer.setClearColor(0xf0f0f0, 1);
   document.getElementById("Webgl-output").appendChild(renderer.domElement);
   document.getElementById("Webgl-output").appendChild(stats.dom);

   raycaster = new THREE.Raycaster();
   raycaster.setFromCamera(new THREE.Vector3(), camera)
   raycaster.layers.set(1);

   const ambientlight = new THREE.AmbientLight(0xfafafa)
   scene.add(ambientlight)

   const playerGeo = new THREE.SphereGeometry(5, 64, 32);


   const playerMat = new THREE.MeshLambertMaterial({ map: textureLoader.load('../texture/pt1.png') });
   let playerMesh = new THREE.Mesh(playerGeo, playerMat);
   playerMesh.quaternion.identity()
   playerMesh.castShadow = true
   playerMesh.receiveShadow = false
   playerMesh.layers.set(1)

   gameState.player.mesh = playerMesh

   gameState.player.mesh.geometry.computeBoundingBox()
   gameState.player.AABB = new THREE.Box3()


   

   yawObject.add(directionObject)
   yawObject.add(gameState.player.mesh)
   yawObject.add(camera)

   directionObject.position.set(0, 0, 10)

   camera.position.x = 0
   camera.position.y = 25
   camera.position.z = 120

   scene.add(yawObject)

   const plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000)
      , new THREE.MeshLambertMaterial())
   plane.rotateX(-Math.PI / 2)
   plane.position.set(0, 0, 0)
   scene.add(plane);

   const gHelp = new THREE.GridHelper(10000, 100)
   gHelp.position.y = 0.2
   scene.add(gHelp)

   const fog_color = new THREE.Color(0xe0e0e0)
   const fog = new THREE.Fog(fog_color, 150, 1000)
   scene.background = fog_color
   //scene.fog = fog

   const planeShape = new CANNON.Plane()
   const planeBody = new CANNON.Body({ mass: 0, shape: planeShape })
   planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
   planeBody.position.set(0, 0, 0)
   phyWorld.addBody(planeBody)

   const planeBody1 = new CANNON.Body({ mass: 0, shape: planeShape })
   planeBody1.quaternion.setFromEuler(0, Math.PI / 2, 0)
   planeBody1.position.set(-5000, 0, 0)
   phyWorld.addBody(planeBody1)

   const plane1 = new THREE.Mesh(new THREE.PlaneGeometry(2000, 50)
      , new THREE.MeshLambertMaterial({ color: 0xaa0000, side: THREE.DoubleSide }))
   plane1.rotateY(-Math.PI / 2)
   plane1.position.set(-5000, 0, 0)
   scene.add(plane1);

   const planeBody2 = new CANNON.Body({ mass: 0, shape: planeShape })
   planeBody2.position.set(0, 0, -5000)
   phyWorld.addBody(planeBody2)

   const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(2000, 50)
      , new THREE.MeshLambertMaterial({ color: 0x0000aa, side: THREE.DoubleSide }))
   plane2.position.set(0, 0, -5000)
   scene.add(plane2);

   const planeBody3 = new CANNON.Body({ mass: 0, shape: planeShape })
   planeBody3.quaternion.setFromEuler(0, Math.PI, 0) // make it face up
   planeBody3.position.set(0, 0, 5000)
   phyWorld.addBody(planeBody3)

   const plane3 = new THREE.Mesh(new THREE.PlaneGeometry(50, 2000)
      , new THREE.MeshLambertMaterial({ color: 0x00aa00, side: THREE.DoubleSide }))
   plane3.rotateZ(-Math.PI / 2)
   plane3.position.set(0, 0, 5000)
   scene.add(plane3);

   const planeBody4 = new CANNON.Body({ mass: 0, shape: planeShape })
   planeBody4.quaternion.setFromEuler(0, -Math.PI / 2, 0) // make it face up
   planeBody4.position.set(5000, 0, 0)
   phyWorld.addBody(planeBody4)

   const plane4 = new THREE.Mesh(new THREE.PlaneGeometry(2000, 50)
      , new THREE.MeshLambertMaterial({ color: 0x000000, side: THREE.DoubleSide }))
   plane4.rotateY(-Math.PI / 2)
   plane4.position.set(5000, 0, 0)
   scene.add(plane4);

   render()
}

function render() {


   delta = clock.getDelta()

   inputVelocity.set(0, 0, 0);
   if (!gameState.player.id) gameState.player.id = getID()

   if (!gameOver) {
      gameState.player.inputs = getKeys(gameState.player.mesh.quaternion, gameState.player.rigidBody.position, 
               { players: gameState.player.intersectedPlayers, boosts: gameState.boosts.intersectedBoosts },
                gameState.player.rigidBody.velocity)
   } else {
      gameState.player.inputs.a = false
      gameState.player.inputs.d = false
      if (camera.position.y < gameState.player.mesh.geometry.parameters.radius * 30) camera.position.y += 1
      camera.lookAt(yawObject.position)
   }

   if (gameState.player.inputs.a) {
      yawObject.rotation.y += 0.05
   }
   if (gameState.player.inputs.d) {
      yawObject.rotation.y -= 0.05
   }

   const currentState = getCurrentState()
   if (currentState) {

      if (currentState.next) {
         handleUpdate(currentState.next.players,currentState.baseUpdate.players)
         handleSquash(currentState.next.squashedPlayers)
         gameState.boosts.speedBoosts = currentState.next.boosts.speed
         gameState.boosts.growBoosts = currentState.next.boosts.grow
         gameState.boosts.jumpBoosts = currentState.next.boosts.jump
         gameState.boosts.shrinkBoosts = currentState.next.boosts.shrink
         gameState.boosts.stuckBoosts = currentState.next.boosts.stuck
      } else {
         handleUpdate(currentState.baseUpdate.players)
         handleSquash(currentState.baseUpdate.squashedPlayers)
         gameState.boosts.speedBoosts = currentState.baseUpdate.boosts.speed
         gameState.boosts.growBoosts = currentState.baseUpdate.boosts.grow
         gameState.boosts.jumpBoosts = currentState.baseUpdate.boosts.jump
         gameState.boosts.shrinkBoosts = currentState.baseUpdate.boosts.shrink
         gameState.boosts.stuckBoosts = currentState.baseUpdate.boosts.stuck
         
      }
   }
   if (!isNaN(inputVelocity.z)) {
      yawObject.getWorldDirection(directionVector)
      directionVector.multiplyScalar(inputVelocity.z * 10)
      gameState.player.rigidBody.velocity.x += directionVector.x
      gameState.player.rigidBody.velocity.y += directionVector.y
      gameState.player.rigidBody.velocity.z += directionVector.z

      phyWorld.broadphase.dirty = true
   }
   
   yawObject.position.copy(gameState.player.rigidBody.position)
   gameState.player.AABB.copy(gameState.player.mesh.geometry.boundingBox).applyMatrix4(gameState.player.mesh.matrixWorld)
   gameState.player.mesh.quaternion.copy(gameState.player.rigidBody.quaternion)

   let lav = new THREE.Vector3()
   directionObject.getWorldPosition(lav)
   camera.lookAt(lav)

   const rayStart = new THREE.Vector3().copy(yawObject.position)
   handleRaycast(rayStart)

   handleBoosts(scene,gameState)


   //////////////////////////////////////////////////////
   const time = performance.now() / 1000 // seconds
   if (!lastCallTime) {
      phyWorld.step(gameState.timeStep)
   } else {
      const dt = time - lastCallTime
      phyWorld.step(gameState.timeStep, dt)
   }
   lastCallTime = time
   stats.update() 
   requestAnimationFrame(render)
   renderer.render(scene, camera)
}



function handleSquash(squashedPlayers) {
   for (let squashed in squashedPlayers) {

      //if server sent squash list contains the ones I have squashed
      if (gameState.player.intersectedPlayers.includes(squashedPlayers[squashed])) {
         //update squash list
         gameState.player.intersectedPlayers = gameState.player.intersectedPlayers.filter(e => e !== squashedPlayers[squashed])
         console.log('Inter arr changed')
         //handle the players I squashed 
         players[squashedPlayers[squashed]].mesh.quaternion.set(0, 0, 0, 1)
         players[squashedPlayers[squashed]].mesh.position.y -= players[squashedPlayers[squashed]].mesh.geometry.parameters.radius
         phyWorld.removeBody(players[squashedPlayers[squashed]].gameState.player.rigidBody)
         delete players[squashedPlayers[squashed]]
      }
      else if (squashedPlayers[squashed] in players) {
         //handle the squashed players
         phyWorld.removeBody(players[squashedPlayers[squashed]].gameState.player.rigidBody)
         players[squashedPlayers[squashed]].mesh.position.y -= players[squashedPlayers[squashed]].mesh.geometry.parameters.radius
         players[squashedPlayers[squashed]].mesh.quaternion.set(0, 0, 0, 1)
         players[squashedPlayers[squashed]].mesh.scale.set(1.5, 0.1, 1.5)
         players[squashedPlayers[squashed]].mesh.layers.set(0)

         console.log('Squashed: ', squashedPlayers[squashed])
         delete players[squashedPlayers[squashed]]

         console.log(players)
      } else if (squashedPlayers[squashed] == gameState.player.id) {
         //If I am squashed
         console.log('squashed')
         phyWorld.removeBody(gameState.player.rigidBody)
         gameState.player.mesh.scale.set(1.5, 0, 1.5)
         gameState.player.mesh.position.y -= gameState.player.mesh.geometry.parameters.radius
         gameState.player.mesh.quaternion.set(0, 0, 0, 1)
         gameOver = true
      }
   }
}

function handleUpdate(update,preUpdate = 0) {
//currentState.next,players

   for (let player in update) {

      if (player == gameState.player.id && !gameState.gameOver) {
         //if a change in player's size
         if (update[player].size != gameState.player.mesh.geometry.parameters.radius) {
            gameState.player.rigidBody.removeShape(gameState.player.rigidBody.shapes[0])
            gameState.player.rigidBody.addShape(new CANNON.Sphere(update[player].size))
            gameState.player.rigidBody.shapes[0].updateBoundingSphereRadius()

            gameState.player.rigidBody.mass = update[player].size
            gameState.player.rigidBody.updateMassProperties()

            //adjust the camera 
            if (update[player].size > gameState.player.mesh.geometry.parameters.radius) {
               const diff = update[player].size - gameState.player.mesh.geometry.parameters.radius
               camera.position.y += diff * 4
               camera.position.z += diff * 4
               if (directionObject.position.z + diff <= 0) {
                  directionObject.position.z += diff
               }
            } else {
               const diff = gameState.player.mesh.geometry.parameters.radius - update[player].size
               if (camera.position.y - diff * 4 > 10) {
                  camera.position.y -= diff * 4
               }

               if (camera.position.z - diff * 4 > 40) {
                  camera.position.z -= diff * 4
               }

               if (directionObject.position.z - diff >= -40) {
                  directionObject.position.z -= diff

               }
            }

            gameState.player.mesh.geometry = new THREE.SphereGeometry(update[player].size, 64, 32)
            gameState.player.mesh.geometry.computeBoundingBox()
         }

         //adjust the player velocity
         gameState.game.velocityFactor = update[player].velocityFactor
         if (update[player].inputs > 0) {
            inputVelocity.z = -update[player].inputs * gameState.game.velocityFactor * delta
         } else {
            inputVelocity.z = -update[player].inputs * gameState.game.velocityFactor * delta
         }
      } else {
         if (player in players) {


            let next_bpos = new CANNON.Vec3().copy(update[player].position)
            let bpos

            if(preUpdate){
            bpos = new CANNON.Vec3().copy(preUpdate[player].position)
            bpos.lerp(next_bpos, gameState.currentState.ratio, bpos)
            }
            else{bpos = next_bpos}

            players[player].rigidBody.position.x = bpos.x
players[player].rigidBody.position.y = bpos.y
            players[player].mesh.position.copy(players[player].rigidBody.position)


            let nextQuat = new THREE.Quaternion().copy(update[player].quat)
            let quat
            if(preUpdate){
            quat = new THREE.Quaternion().copy(preUpdate[player].quat)
            quat.slerp(nextQuat, gameState.currentState.ratio)
            }else{
            quat = nextQuat
            }

            players[player].mesh.quaternion.copy(quat)
            //players[player].AABB.copy( players[player].mesh.geometry.boundingBox ).applyMatrix4( players[player].mesh.matrixWorld )

            if (update[player].size != players[player].mesh.geometry.parameters.radius && !gameState.gameOver) {
               players[player].rigidBody.removeShape(gameState.player.rigidBody.shapes[0])
               players[player].rigidBody.addShape(new CANNON.Sphere(update[player].size))
               //players[player].gameState.player.rigidBody.shapes[0].updateBoundingSphereRadius()

               players[player].rigidBody.mass = update[player].size * 10
               players[player].rigidBody.updateMassProperties()

               players[player].mesh.geometry = new THREE.SphereGeometry(update[player].size, 64, 32)
               players[player].mesh.geometry.computeBoundingBox()
            }

            phyWorld.broadphase.dirty = true
         } else if (!players[player] && !gameState.gameOver) {
            //generate player
            players[player] = {
               rigidBody: generateRigidBody(update[player]),
               mesh: generateMesh(update[player]),
            }
            players[player].mesh.playerID = player
         }
      }
   }

}

function handleRaycast(rayStart){

rayStart.y -= gameState.player.mesh.geometry.parameters.radius

const dirVec = new THREE.Vector3().copy(gameState.player.rigidBody.velocity)
dirVec.normalize()
dirVec.y = 0.2

let dirVecR = new THREE.Vector3().copy(dirVec)
dirVecR.normalize()
dirVecR.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.4)

let dirVecL = new THREE.Vector3().copy(dirVec)
dirVecL.normalize()
dirVecL.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.4)

raycaster.far = gameState.player.mesh.geometry.parameters.radius + (gameState.player.mesh.geometry.parameters.radius / 2)

gameState.game.velocityMag = gameState.player.rigidBody.velocity.lengthSquared()

raycaster.set(rayStart, dirVec)
let intersects = raycaster.intersectObjects(scene.children);

if (intersects.length > 0 && !gameState.gameOver) {

      for (let i in intersects) {
         if (intersects[i].object != gameState.player.mesh && !intersects[i].object.boostType && gameState.game.velocityMag > gameState.game.velocityRate && intersects[i].object.isMesh && gameState.player.mesh.geometry.parameters.radius >= intersects[i].object.geometry.parameters.radius) {
            if (players[intersects[i].object.playerID]) {
               players[intersects[i].object.playerID].gameState.player.rigidBody.collisionFilterMask = 2
               players[intersects[i].object.playerID].mesh.position.y -= players[intersects[i].object.playerID].mesh.geometry.parameters.radius
               players[intersects[i].object.playerID].mesh.quaternion.set(0, 0, 0, 1)
               players[intersects[i].object.playerID].mesh.scale.set(1.5, 0.1, 1.5)

               players[intersects[i].object.playerID].mesh.layers.set(0)

               gameState.player.rigidBody.applyImpulse(new CANNON.Vec3(0, gameState.game.impulseRate, 0), new CANNON.Vec3(0, 1, 0))

               if (!(gameState.player.intersectedPlayers.includes(intersects[i].object.playerID))) {
                  gameState.player.intersectedPlayers.push(intersects[i].object.playerID)
                  console.log('intersect')
               }
            }
         } else if (intersects[i].object.boostType) {
            if (intersects[i].object.boostType == 'Speed') {
               if (!gameState.boosts.intersectedBoosts.speed.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.speed.push(intersects[i].object.boostID)
               }
               console.log('Speed')
            }
            else if (intersects[i].object.boostType == 'Grow') {
               if (!gameState.boosts.intersectedBoosts.grow.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.grow.push(intersects[i].object.boostID)
               }

            }
            else if (intersects[i].object.boostType == 'Jump') {
               console.log('Jump')
            }
            else if (intersects[i].object.boostType == 'Shrink') {
               if (!gameState.boosts.intersectedBoosts.shrink.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.shrink.push(intersects[i].object.boostID)
               }
               console.log('Shrink')
            }
            else if (intersects[i].object.boostType == 'Stuck') {
               if (!gameState.boosts.intersectedBoosts.stuck.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.stuck.push(intersects[i].object.boostID)
               }
               console.log('Stuck')
            }
         }
      }
   }

   raycaster.set(rayStart, dirVecR)
   intersects = raycaster.intersectObjects(scene.children);
   if (intersects.length > 0 && !gameState.gameOver) {
      for (let i in intersects) {
         if (intersects[i].object != gameState.player.mesh && gameState.player.mesh.geometry.parameters.radius >= intersects[i].object.geometry.parameters.radius && !intersects[i].object.boostType && gameState.game.velocityMag > gameState.game.velocityRate && intersects[i].object.isMesh) {
            if (players[intersects[i].object.playerID]) {
               players[intersects[i].object.playerID].gameState.player.rigidBody.collisionFilterMask = 2
               players[intersects[i].object.playerID].mesh.position.y -= players[intersects[i].object.playerID].mesh.geometry.parameters.radius
               players[intersects[i].object.playerID].mesh.quaternion.set(0, 0, 0, 1)
               players[intersects[i].object.playerID].mesh.scale.set(1.5, 0.1, 1.5)

               players[intersects[i].object.playerID].mesh.layers.set(0)

               gameState.player.rigidBody.applyImpulse(new CANNON.Vec3(0, gameState.game.impulseRate, 0), new CANNON.Vec3(0, 1, 0))

               if (!(gameState.player.intersectedPlayers.includes(intersects[i].object.playerID))) {
                  gameState.player.intersectedPlayers.push(intersects[i].object.playerID)
                  console.log('intersect L')
               }
            }


         } else if (intersects[i].object.boostType) {
            if (intersects[i].object.boostType == 'Speed') {
               if (!gameState.boosts.intersectedBoosts.speed.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.speed.push(intersects[i].object.boostID)
               }
               console.log('Speed')
            }
            else if (intersects[i].object.boostType == 'Grow') {
               if (!gameState.boosts.intersectedBoosts.grow.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.grow.push(intersects[i].object.boostID)
               }

            }
            else if (intersects[i].object.boostType == 'Jump') {
               console.log('Jump')
            }
            else if (intersects[i].object.boostType == 'Shrink') {
               if (!gameState.boosts.intersectedBoosts.shrink.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.shrink.push(intersects[i].object.boostID)
               }
               console.log('Shrink')
            }
            else if (intersects[i].object.boostType == 'Stuck') {
               if (!gameState.boosts.intersectedBoosts.stuck.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.stuck.push(intersects[i].object.boostID)
               }
               console.log('Stuck')
            }
         }
      }
   }

   raycaster.set(rayStart, dirVecL)
   intersects = raycaster.intersectObjects(scene.children);
   if (intersects.length > 0 && !gameState.gameOver) {
      for (let i in intersects) {
         if (intersects[i].object != gameState.player.mesh && gameState.player.mesh.geometry.parameters.radius >= intersects[i].object.geometry.parameters.radius && !intersects[i].object.boostType && gameState.game.velocityMag > gameState.game.velocityRate && intersects[i].object.isMesh) {
            if (players[intersects[i].object.playerID]) {
               players[intersects[i].object.playerID].gameState.player.rigidBody.collisionFilterMask = 2
               players[intersects[i].object.playerID].mesh.position.y -= players[intersects[i].object.playerID].mesh.geometry.parameters.radius
               players[intersects[i].object.playerID].mesh.quaternion.set(0, 0, 0, 1)
               players[intersects[i].object.playerID].mesh.scale.set(1.5, 0.1, 1.5)

               players[intersects[i].object.playerID].mesh.layers.set(0)

               gameState.player.rigidBody.applyImpulse(new CANNON.Vec3(0, gameState.game.impulseRate, 0), new CANNON.Vec3(0, 1, 0))

               if (!(gameState.player.intersectedPlayers.includes(intersects[i].object.playerID))) {
                  gameState.player.intersectedPlayers.push(intersects[i].object.playerID)
                  console.log('intersect R')
               }
            }


         } else if (intersects[i].object.boostType) {
            if (intersects[i].object.boostType == 'Speed') {
               if (!gameState.boosts.intersectedBoosts.speed.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.speed.push(intersects[i].object.boostID)
               }
               console.log('Speed')
            }
            else if (intersects[i].object.boostType == 'Grow') {
               if (!gameState.boosts.intersectedBoosts.grow.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.grow.push(intersects[i].object.boostID)
               }

            }
            else if (intersects[i].object.boostType == 'Jump') {
               console.log('Jump')
            }
            else if (intersects[i].object.boostType == 'Shrink') {
               if (!gameState.boosts.intersectedBoosts.shrink.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.shrink.push(intersects[i].object.boostID)
               }
               console.log('Shrink')
            }
            else if (intersects[i].object.boostType == 'Stuck') {
               if (!gameState.boosts.intersectedBoosts.stuck.includes(intersects[i].object.boostID)) {
                  gameState.boosts.intersectedBoosts.stuck.push(intersects[i].object.boostID)
               }
               console.log('Stuck')
            }
         }
      }
   }


}


function generateRigidBody(player) {
   let rigidBody = new CANNON.Body({
      mass: 5,
      shape: new CANNON.Sphere(5),
      material: playerPhyMat
   })
   rigidBody.position.set(player.position.x, player.position.y, player.position.z)
   rigidBody.linearDamping = 0.3
   phyWorld.addBody(rigidBody)

   return rigidBody
}

function generateMesh(rigidBody) {

   const playerGeo = new THREE.SphereGeometry(5, 64, 32);
   const playerMat = new THREE.MeshLambertMaterial({ map: textureLoader.load('../texture/pt1.png') });
   const mesh = new THREE.Mesh(playerGeo, playerMat);
   mesh.castShadow = true
   mesh.receiveShadow = false

   //const wireframe = new THREE.WireframeGeometry( playerGeo );
   //mesh.add( wireframe );
   mesh.position.copy(rigidBody.position)
   mesh.geometry.computeBoundingBox()
   mesh.layers.set(1)
   scene.add(mesh)
   return mesh
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize, false);