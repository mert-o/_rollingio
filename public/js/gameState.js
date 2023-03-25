



export const gameState = {
   player: {
      position: { x: Math.floor(Math.random() * 100), y: 50, z: Math.floor(Math.random() * 100) },
      texture: '',
      intersect: [],
      intersectedPlayers : [],
      velocity: {x: 0, y: 0, z: 0},
      quat: {x: 0, y: 0, z: 0, w: 1, _x: 0, _y: 0, _z: 0, _w: 1},
      inputs: {
      w: false,
      a: false,
      s: false,
      d: false,
      },
      id: '',
      AABB: 0,
      playerMesh: 0,
      playerRigidBody:0,
   },
   boosts:{
      speedBoosts : [],
      indexSpeedBoosts : [],
      meshedSpeedBoosts : [],
      growBoosts : [],
      indexGrowBoosts : [],
      meshedGrowBoosts : [],
      shrinkBoosts : [],
      indexShrinkBoosts : [],
      meshedShrinkBoosts : [],
      stuckBoosts : [],
      indexStuckBoosts : [],
      meshedStuckBoosts : [],
      intersectedBoosts : {
         speed: [],
         grow: [],
         shrink: [],
         stuck: []
      }},
   game:{
      impulseRate : 200,
      velocityRate : 1500,
      velocityFactor : 10,
      velocityMag : 0,
   },
   updates: [],
   serverTime: {
      start: 0,
      first: 0,
      current: 0,
      delay: 100
   },
   timeStep : 1 / 60,
   currentState : {},
}