import { useEffect, useRef } from "react";
import * as THREE from "three";

function lerpColor(start, end, t) {
  const s = new THREE.Color(start);
  const e = new THREE.Color(end);
  return s.lerp(e, t);
}

export function WellnessOrb({ score }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 5, 5);
    scene.add(directional);

    const geometry = new THREE.SphereGeometry(1.3, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: lerpColor("#FF7A6A", "#2EC4B6", score || 0.5),
      roughness: 0.2,
      metalness: 0.4,
      emissive: "#111111",
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    let frameId;
    const animate = () => {
      sphere.rotation.y += 0.003;
      sphere.rotation.x += 0.0015;
      sphere.scale.setScalar(1 + Math.sin(Date.now() * 0.0015) * 0.02);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [score]);

  return <div ref={containerRef} className="h-72 w-full" />;
}
