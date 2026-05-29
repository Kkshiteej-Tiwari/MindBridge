import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function WellnessOrb({ size = 220, color = "#6C63FF" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const point = new THREE.PointLight(0xffffff, 1.0);
    point.position.set(5, 5, 5);
    scene.add(point);

    const geometry = new THREE.SphereGeometry(0.9, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: 0.1,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // soft glow using sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: new THREE.TextureLoader().load("/glow.png"),
      color,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(3, 3, 1);
    scene.add(sprite);

    let frameId;
    const start = Date.now();

    function animate() {
      const t = (Date.now() - start) / 1000;
      sphere.rotation.y = t * 0.4;
      sphere.rotation.x = Math.sin(t * 0.3) * 0.05;
      // rotation is an Euler on Object3D; copy the y component instead of assigning the whole property
      if (sprite.rotation) sprite.rotation.y = sphere.rotation.y;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    animate();

    function onResize() {
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [size, color]);

  return <div ref={mountRef} style={{ width: size, height: size }} />;
}

export default WellnessOrb;
