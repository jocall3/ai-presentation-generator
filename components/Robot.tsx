// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RobotState } from '../types';
import { PaintBrushIcon } from './Icons';

interface RobotProps {
    robotState: RobotState;
    mousePosition: { x: number; y: number };
}

const Robot: React.FC<RobotProps> = ({ robotState, mousePosition }) => {
    const { x, y } = mousePosition;

    // Determine robot rotation based on mouse position from center
    const centerX = window.innerWidth / 2;
    const angle = Math.atan2(y - (window.innerHeight - 80), x - centerX) * (180 / Math.PI) + 90;
    const clampedAngle = Math.max(-45, Math.min(45, angle));
    
    const variants = {
        idle: { y: 0 },
        thinking: { y: -5, scale: 1.05 },
        writing: { y: 2, rotate: [0, 1, -1, 0] },
        illustrating: { y: 2, rotate: [0, 2, -2, 0] },
    };

    return (
        <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            style={{ x: x - window.innerWidth / 2, y: y - window.innerHeight }}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                animate={robotState}
                variants={variants}
                transition={{
                    y: { repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeInOut' },
                    rotate: { repeat: Infinity, repeatType: 'reverse', duration: 0.5 }
                }}
            >
                <svg width="120" height="120" viewBox="0 0 100 100">
                    {/* Shadow */}
                    <ellipse cx="50" cy="95" rx="30" ry="5" fill="black" opacity="0.2" />

                    {/* Body */}
                    <motion.g animate={{ rotate: clampedAngle }} style={{ transformOrigin: '50px 70px' }}>
                        <rect x="30" y="40" width="40" height="40" rx="10" fill="#4B5563" />
                        <rect x="25" y="45" width="50" height="30" rx="10" fill="#6B7280" />
                        
                        {/* Eye */}
                        <motion.circle cx="50" cy="55" r="12" fill="#1F2937" />
                        <motion.circle cx="50" cy="55" r="8" fill="#A78BFA"
                            animate={{ scale: robotState === 'thinking' ? [1, 1.2, 1] : 1 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />
                        <circle cx="52" cy="53" r="3" fill="white" />

                        {/* Antenna */}
                        <line x1="50" y1="40" x2="50" y2="25" stroke="#4B5563" strokeWidth="3" />
                        <motion.circle cx="50" cy="25" r="5" fill="#A78BFA"
                             animate={{
                                scale: robotState === 'thinking' ? [1, 1.5, 1] : 1,
                                boxShadow: robotState === 'thinking' ? '0 0 15px #A78BFA' : '0 0 0px #A78BFA',
                            }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                    </motion.g>

                     {/* Action Accessories */}
                    <AnimatePresence>
                    {robotState === 'writing' && (
                        <motion.g
                            key="writing"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                        >
                            <rect x="20" y="80" width="60" height="15" rx="3" fill="#374151" />
                            {/* Hands */}
                            <motion.circle cx="35" cy="80" r="5" fill="#6B7280" 
                                animate={{ y: [0, -3, 0]}}
                                transition={{ repeat: Infinity, duration: 0.3, delay: 0.1 }}
                            />
                             <motion.circle cx="65" cy="80" r="5" fill="#6B7280"
                                animate={{ y: [0, -3, 0]}}
                                transition={{ repeat: Infinity, duration: 0.3 }}
                            />
                        </motion.g>
                    )}
                     {robotState === 'illustrating' && (
                        <motion.g
                            key="illustrating"
                            initial={{ y: 10, opacity: 0, rotate: -20, x: 10 }}
                            animate={{ y: 0, opacity: 1, rotate: 10, x: 0 }}
                            exit={{ y: 10, opacity: 0, rotate: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                             {/* Hand */}
                            <circle cx="75" cy="75" r="6" fill="#6B7280" />
                            {/* Paintbrush */}
                            <g transform="translate(65, 55) rotate(45)">
                               <PaintBrushIcon className="w-8 h-8 text-purple-400" />
                            </g>
                        </motion.g>
                    )}
                    </AnimatePresence>
                </svg>
            </motion.div>
        </motion.div>
    );
};

export default Robot;