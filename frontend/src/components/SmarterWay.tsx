import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type ModelProps = {
  url: string;
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];
};

const SceneModel: React.FC<ModelProps> = ({ url, position, scale, rotation = [0, 0, 0] }) => {
  const { scene } = useGLTF(url);
  const model = React.useMemo(() => scene.clone(true), [scene]);

  React.useEffect(() => {
    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [model]);

  return <primitive object={model} position={position} scale={scale} rotation={rotation} />;
};

const MODEL_SEQUENCE = [
  {
    label: 'Digital Camera',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cameras/glTF/Cameras.gltf',
    scale: 1.6,
    rotation: [0, 0.65, 0] as [number, number, number],
  },
  {
    label: 'Cycle',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
    scale: 1.1,
    rotation: [0, 0.45, 0] as [number, number, number],
  },
  {
    label: 'Laptop',
    url: 'https://raw.githubusercontent.com/Smit-Prajapati/prajapatismit/b5f434ae4d45d10fe1664d5606ad28e4d9c739af/images/laptop.glb',
    scale: 1.45,
    rotation: [0, -0.55, 0] as [number, number, number],
  },
  {
    label: 'Table Fan',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/LightsPunctualLamp/glTF-Binary/LightsPunctualLamp.glb',
    scale: 1.9,
    rotation: [0, -0.9, 0] as [number, number, number],
  },
];

const SmarterWay: React.FC = () => {
  const [modelIndex, setModelIndex] = useState(0);
  const activeModel = MODEL_SEQUENCE[modelIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setModelIndex((prev) => (prev + 1) % MODEL_SEQUENCE.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              A Smarter Way to <span className="text-rentpi-green">Share & Earn</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              RentPi connects you with people in your community to safely rent and lend items.
              Instead of buying something you'll only use once, rent it for a fraction of the cost.
              Have items gathering dust? List them on RentPi and start earning passive income or barter credits today.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                'Verified local users for peace of mind',
                'Secure payment and deposit holding',
                'Flexible credit system for bartering',
                'Built-in chat and scheduling',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-rentpi-green mr-3 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="text-rentpi-green font-semibold hover:text-green-700 flex items-center transition-colors">
              Learn more about our Trust & Safety policy
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>

          <div className="w-full lg:w-1/2 h-[400px] lg:h-[500px] relative rounded-3xl bg-slate-50 border border-gray-100 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rentpi-green/5 to-transparent z-0" />
            <Canvas camera={{ position: [0, 2, 10], fov: 45 }} className="z-10">
              <Suspense fallback={null}>
                <Stage intensity={0.4} environment="city" shadows={false} adjustCamera={false}>
                  <SceneModel
                    key={activeModel.url}
                    url={activeModel.url}
                    position={[0, -1, 0]}
                    scale={activeModel.scale}
                    rotation={activeModel.rotation}
                  />
                </Stage>
              </Suspense>
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.45} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 3} />
            </Canvas>

          </div>
        </div>
      </div>
    </section>
  );
};

MODEL_SEQUENCE.forEach((item) => useGLTF.preload(item.url));

export default SmarterWay;
