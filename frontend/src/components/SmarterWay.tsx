import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Animated Shape component
const AnimatedShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={2}>
        <MeshDistortMaterial
          color="#22c55e"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

const SmarterWay: React.FC = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Column - Mockup / Text */}
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
                "Verified local users for peace of mind",
                "Secure payment and deposit holding",
                "Flexible credit system for bartering",
                "Built-in chat and scheduling"
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

          {/* Right Column - 3D Canvas Element */}
          <div className="w-full lg:w-1/2 h-[400px] lg:h-[500px] relative rounded-3xl bg-slate-50 border border-gray-100 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-rentpi-green/5 to-transparent z-0" />
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="z-10">
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
              
              <AnimatedShape />
              
              {/* Add OrbitControls but disable zoom to not break page scrolling */}
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
            
            {/* Overlay badge */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 z-20 flex items-center gap-4">
              <div className="w-12 h-12 bg-rentpi-green rounded-full flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Powered by Agentic Tech</p>
                <p className="text-xs text-gray-500">Smart matching and dispute resolution</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default SmarterWay;
