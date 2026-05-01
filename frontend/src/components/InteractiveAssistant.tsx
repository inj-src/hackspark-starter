import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import Robot from "./Robot";
import ChatWindow from "./ChatWindow";

const InteractiveAssistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
      className="fixed bottom-[-30px] right-[-20px] md:bottom-[-5px] md:right-[-5px] z-50 flex flex-col items-end space-y-4 pointer-events-none"
    >
      {/* Chat Window Container */}
      <div className="pointer-events-auto origin-bottom-right">
        <AnimatePresence>
          {isChatOpen && <ChatWindow onClose={() => setIsChatOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* 3D Robot Canvas */}
      <motion.div
        className="w-28 h-32 md:w-32 md:h-40 pointer-events-auto cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <Environment preset="city" />

          <Robot onClick={() => setIsChatOpen((prev) => !prev)} />

          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={5}
            blur={2}
            far={4}
          />
        </Canvas>
      </motion.div>
    </motion.div>
  );
};

export default InteractiveAssistant;
