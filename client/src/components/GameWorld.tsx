import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function GameWorld() {
  const grassTexture = useTexture("/textures/grass.png");
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Configure textures
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);
  
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(2, 2);

  return (
    <group>
      {/* Ground */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[30, 1, 30]} />
        <meshLambertMaterial map={grassTexture} />
      </mesh>
      
      {/* Back Wall */}
      <mesh position={[0, 5, -15]} receiveShadow>
        <boxGeometry args={[30, 10, 1]} />
        <meshLambertMaterial map={woodTexture} />
      </mesh>
      
      {/* Side Walls */}
      <mesh position={[-15, 5, 0]} receiveShadow>
        <boxGeometry args={[1, 10, 30]} />
        <meshLambertMaterial map={woodTexture} />
      </mesh>
      
      <mesh position={[15, 5, 0]} receiveShadow>
        <boxGeometry args={[1, 10, 30]} />
        <meshLambertMaterial map={woodTexture} />
      </mesh>
      
      {/* Decorative bathroom tiles on floor */}
      <mesh position={[0, -0.45, -8]} receiveShadow>
        <boxGeometry args={[6, 0.1, 6]} />
        <meshLambertMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Small decorative elements */}
      <mesh position={[-3, 0, -12]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      <mesh position={[3, 0, -12]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}
