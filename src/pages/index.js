import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AudioLoader, TextureLoader } from "three";

const ThreeDScene = () => {
  const sceneRef = useRef();
  let width, height;
  let car,
    boxes,
    models = [];

  if (typeof window !== "undefined") {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  useEffect(() => {
    if (sceneRef.current.children.length > 0) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(10, 10, 10);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    sceneRef.current.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const roomGeometry = new THREE.BoxGeometry(100, 100, 100);
    const roomMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);
    scene.add(room);

    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);

    const loader = new GLTFLoader();

    loader.load("/forklift.glb", (gltf) => {
      const scaleFactor = 2;
      car = gltf.scene;
      const { x, y, z } = {
        x: -4,
        y: -0.5,
        z: -6,
      };
      car.scale.set(scaleFactor, scaleFactor, scaleFactor);
      car.position.set(x, y, z);
      scene.add(car);
    });

    loader.load("/cardboard_box.glb", (gltf) => {
      boxes = gltf.scene;
      const scaleFactor = 5;
      const { x, y, z } = {
        x: 10,
        y: -0.5,
        z: -6,
      };
      boxes.position.set(x, y, z);
      boxes.scale.set(scaleFactor, scaleFactor, scaleFactor);
      scene.add(boxes);
    });

    const numColumns = 6;
    const modelsToLoad = [
      { url: "/shelf.glb" },
      { url: "/shelf.glb" },
      { url: "/shelf.glb" },
      { url: "shelf.glb" },
    ];

    const scaleFactor = 0.2;

    for (let col = 0; col < numColumns; col++) {
      modelsToLoad.forEach((model, index) => {
        loader.load(model.url, function (gltf) {
          const modelObject = gltf.scene;
          const { x, y, z } = {
            x: col * 8,
            y: 0,
            z: index * 15,
          };
          modelObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
          modelObject.position.set(x, y, z);
          scene.add(modelObject);
          models.push(modelObject);
        });

        loader.load(model.url, function (gltf) {
          const modelObject = gltf.scene;
          const { x, y, z } = {
            x: col * 8,
            y: 0,
            z: -index * 15,
          };
          modelObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
          modelObject.position.set(x, y, z);
          scene.add(modelObject);
          models.push(modelObject);
        });
      });
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;

    const listener = new THREE.AudioListener();
    const audioLoader = new AudioLoader();
    const sound = new THREE.PositionalAudio(listener);

    audioLoader.load("/car_music.mp3", function (buffer) {
      sound.setBuffer(buffer);
      sound.setRefDistance(20);
      sound.setVolume(2);
    });

    window.addEventListener("keydown", function (event) {
      const moveDistance = 0.1;
      const rotateAngle = Math.PI / 90;

      const originalPosition = car.position.clone();
      const originalRotation = car.rotation.clone();

      switch (event.keyCode) {
        case 13:
          const offsetVector = new THREE.Vector3(1, 1, 8).applyQuaternion(
            car.quaternion
          );
          boxes.position.copy(car.position).add(offsetVector);
          break;
        case 37:
          car.rotation.y += rotateAngle;
          sound.play();
          break;
        case 40:
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
            car.quaternion
          );
          sound.play();
          car.position.add(forward.multiplyScalar(moveDistance));
          break;
        case 39:
          car.rotation.y -= rotateAngle;
          sound.play();
          break;
        case 38:
          const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(
            car.quaternion
          );
          sound.play();
          car.position.add(backward.multiplyScalar(moveDistance));
          break;
      }

      const carBox = new THREE.Box3().setFromObject(car);
      const boxesBox = new THREE.Box3().setFromObject(boxes);

      if (carBox.intersectsBox(boxesBox)) {
        const offsetVector = new THREE.Vector3(0, 0, 4).applyQuaternion(
          car.quaternion
        );
        boxes.position.copy(car.position).add(offsetVector);
      }

      for (const model of models) {
        const modelBox = new THREE.Box3().setFromObject(model);

        if (carBox.intersectsBox(modelBox)) {
          car.position.copy(originalPosition);
          car.rotation.copy(originalRotation);
        }
      }
    });

    const wallThickness = 2;

    // Texture loader
    const textureLoader = new TextureLoader();

    // Roof Texture
    const roofTexture = textureLoader.load("/wall2.png");
    const roofMaterial = new THREE.MeshStandardMaterial({ map: roofTexture });

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(100, wallThickness, 100),
      roofMaterial
    );
    roof.position.set(0, 50, 0);
    scene.add(roof);

    // Wall Texture
    const wallTexture = textureLoader.load("/wall2.png");
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
    const wallTexture2 = textureLoader.load("/door2.png");
    const wallMaterial2 = new THREE.MeshStandardMaterial({ map: wallTexture2 });

    // Back Wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, wallThickness),
      wallMaterial
    );
    backWall.position.set(0, 0, -50 + wallThickness / 2);
    scene.add(backWall);

    // Front Wall
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, wallThickness),
      wallMaterial
    );
    frontWall.position.set(0, 0, 50 - wallThickness / 2);
    scene.add(frontWall);

    // Right Wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, 100, 100),
      wallMaterial
    );

    rightWall.position.set(50 - wallThickness / 2, 0, 0);
    scene.add(rightWall);

    //left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, 100, 100),
      wallMaterial2
    );
    leftWall.position.set(-50 + wallThickness / 2, 0, 0);
    scene.add(leftWall);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (camera.position.y < 0) {
        camera.position.y = 0;
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
    };
  }, [width, height]);

  return <div ref={sceneRef} style={{ width: "100%", height: "100vh" }} />;
};

export default ThreeDScene;
