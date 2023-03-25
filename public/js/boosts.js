import * as THREE from '../three/three.module.js'

const boostGeo = new THREE.BoxGeometry( 10, 10, 10 );
const speedBoostMat = new THREE.MeshBasicMaterial( {color: 0x5ec3ff} )
const growBoostMat = new THREE.MeshBasicMaterial( {color: 0x8bff90} )
const shrinkBoostMat = new THREE.MeshBasicMaterial( {color: 0xff6c6c} )
const stuckBoostMat = new THREE.MeshBasicMaterial( {color: 0x000000} )

export function handleBoosts(scene,gameState){

for (let sboost in gameState.boosts.speedBoosts) {
      if (gameState.boosts.indexSpeedBoosts.includes(gameState.boosts.speedBoosts[sboost].boostID)) {

         let spIndex = gameState.boosts.indexSpeedBoosts.indexOf(gameState.boosts.speedBoosts[sboost].boostID)

         gameState.boosts.meshedSpeedBoosts[spIndex].rotation.y += 0.01
      } else {

         generateSpeedBoost(scene,gameState,gameState.boosts.speedBoosts[sboost])
      }
   }

   for (let i in gameState.boosts.indexSpeedBoosts) {
      if (!gameState.boosts.speedBoosts.some(e => e.boostID == gameState.boosts.indexSpeedBoosts[i])) {
         gameState.boosts.indexSpeedBoosts = gameState.boosts.indexSpeedBoosts.filter(e => e != gameState.boosts.indexSpeedBoosts[i])
         scene.remove(gameState.boosts.meshedSpeedBoosts[i])
         gameState.boosts.meshedSpeedBoosts = gameState.boosts.meshedSpeedBoosts.filter(e => e != gameState.boosts.meshedSpeedBoosts[i])
      }
   }

   for (let gboost in gameState.boosts.growBoosts) {
      if (gameState.boosts.indexGrowBoosts.includes(gameState.boosts.growBoosts[gboost].boostID)) {

         let gpIndex = gameState.boosts.indexGrowBoosts.indexOf(gameState.boosts.growBoosts[gboost].boostID)

         gameState.boosts.meshedGrowBoosts[gpIndex].rotation.y += 0.01
      } else {
         generateGrowBoost(scene,gameState,gameState.boosts.growBoosts[gboost])
      }
   }

   for (let i in gameState.boosts.indexGrowBoosts) {
      if (!gameState.boosts.growBoosts.some(e => e.boostID == gameState.boosts.indexGrowBoosts[i])) {
         gameState.boosts.indexGrowBoosts = gameState.boosts.indexGrowBoosts.filter(e => e != gameState.boosts.indexGrowBoosts[i])
         scene.remove(gameState.boosts.meshedGrowBoosts[i])

         gameState.boosts.meshedGrowBoosts = gameState.boosts.meshedGrowBoosts.filter(e => e != gameState.boosts.meshedGrowBoosts[i])
      }
   }


   for (let shboost in gameState.boosts.shrinkBoosts) {
      if (gameState.boosts.indexShrinkBoosts.includes(gameState.boosts.shrinkBoosts[shboost].boostID)) {

         let shpIndex = gameState.boosts.indexShrinkBoosts.indexOf(gameState.boosts.shrinkBoosts[shboost].boostID)

         gameState.boosts.meshedShrinkBoosts[shpIndex].rotation.y += 0.01
      } else {
         generateShrinkBoost(scene,gameState,gameState.boosts.shrinkBoosts[shboost])
      }
   }

   for (let i in gameState.boosts.indexShrinkBoosts) {
      if (!gameState.boosts.shrinkBoosts.some(e => e.boostID == gameState.boosts.indexShrinkBoosts[i])) {
         gameState.boosts.indexShrinkBoosts = gameState.boosts.indexShrinkBoosts.filter(e => e != gameState.boosts.indexShrinkBoosts[i])
         scene.remove(gameState.boosts.meshedShrinkBoosts[i])
         gameState.boosts.meshedShrinkBoosts = gameState.boosts.meshedShrinkBoosts.filter(e => e != gameState.boosts.meshedShrinkBoosts[i])
      }
   }

   for (let stboost in gameState.boosts.stuckBoosts) {
      if (gameState.boosts.indexStuckBoosts.includes(gameState.boosts.stuckBoosts[stboost].boostID)) {

         let stpIndex = gameState.boosts.indexStuckBoosts.indexOf(gameState.boosts.stuckBoosts[stboost].boostID)

         gameState.boosts.meshedStuckBoosts[stpIndex].rotation.y += 0.01
      } else {
         generateStuckBoost(scene,gameState,gameState.boosts.stuckBoosts[stboost])
      }
   }

   for (let i in gameState.boosts.indexStuckBoosts) {
      if (!gameState.boosts.stuckBoosts.some(e => e.boostID == gameState.boosts.indexStuckBoosts[i])) {
         gameState.boosts.indexStuckBoosts = gameState.boosts.indexStuckBoosts.filter(e => e != gameState.boosts.indexStuckBoosts[i])
         scene.remove(gameState.boosts.meshedStuckBoosts[i])
         gameState.boosts.meshedStuckBoosts = gameState.boosts.meshedStuckBoosts.filter(e => e != gameState.boosts.meshedStuckBoosts[i])
      }
   }
}





function generateSpeedBoost(scene,gameState,boost){
   console.log(boost)
    const mesh = new THREE.Mesh( boostGeo,speedBoostMat )
    mesh.position.set(boost.pos.x,boost.pos.y,boost.pos.z)
    scene.add( mesh )
    mesh.layers.set(1)
    mesh.boostType = 'Speed'
    mesh.boostID = boost.boostID
    gameState.boosts.indexSpeedBoosts.push(boost.boostID)
    gameState.boosts.meshedSpeedBoosts.push(mesh)
}

function generateGrowBoost(scene,gameState,boost){
    const mesh = new THREE.Mesh( boostGeo,growBoostMat )
    mesh.position.set(boost.pos.x,boost.pos.y,boost.pos.z)
    scene.add( mesh )
    mesh.layers.set(1)
    mesh.boostType = 'Grow'
    mesh.boostID = boost.boostID
    gameState.boosts.indexGrowBoosts.push(boost.boostID)
    gameState.boosts.meshedGrowBoosts.push(mesh)

}

function generateShrinkBoost(scene,gameState,boost){
    const mesh = new THREE.Mesh( boostGeo,shrinkBoostMat )
    mesh.position.set(boost.pos.x,boost.pos.y,boost.pos.z)
    scene.add(mesh )
    mesh.layers.set(1)
    mesh.boostType = 'Shrink'
    mesh.boostID = boost.boostID
    gameState.boosts.indexShrinkBoosts.push(boost.boostID)
    gameState.boosts.meshedShrinkBoosts.push(mesh)
}

function generateStuckBoost(scene,gameState,boost){
    const mesh = new THREE.Mesh( boostGeo,stuckBoostMat )
    mesh.position.set(boost.pos.x,boost.pos.y,boost.pos.z)
    scene.add( mesh )
    mesh.layers.set(1)

    mesh.boostType = 'Stuck'
    mesh.boostID = boost.boostID

    gameState.boosts.indexStuckBoosts.push(boost.boostID)
    gameState.boosts.meshedStuckBoosts.push(mesh)

}