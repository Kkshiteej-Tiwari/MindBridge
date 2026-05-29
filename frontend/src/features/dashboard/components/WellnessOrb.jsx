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

    // Main sphere with dynamic color based on score
    const geometry = new THREE.SphereGeometry(1.3, 64, 64);
    const orbColor = lerpColor("#FF7A6A", "#2EC4B6", score || 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: orbColor,
      roughness: 0.15,
      metalness: 0.5,
      emissive: orbColor.clone().multiplyScalar(0.15),
      emissiveIntensity: 0.4,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Particle system around the orb
    const particleCount = 600;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.6 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const particleColor = lerpColor("#FF7A6A", "#2EC4B6", Math.random());
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;

      sizes[i] = 1.5 + Math.random() * 2.5;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: orbColor,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowSphere);

    let frameId;
    const animate = () => {
      const time = Date.now() * 0.001;

      // Orb rotation
      sphere.rotation.y += 0.003;
      sphere.rotation.x += 0.0015;

      // Breathing scale animation (inhale/exhale)
      const breathe = 1 + Math.sin(time * 0.8) * 0.04;
      sphere.scale.setScalar(breathe);
      glowSphere.scale.setScalar(breathe * 1.15);

      // Particle orbit animation
      particles.rotation.y += 0.001;
      particles.rotation.x = Math.sin(time * 0.3) * 0.05;

      // Glow pulse
      glowMaterial.opacity = 0.06 + Math.sin(time * 1.2) * 0.03;

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
      particleGeometry.dispose();
      particleMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [score]);

  return <div ref={containerRef} className="h-72 w-full" />;
}
