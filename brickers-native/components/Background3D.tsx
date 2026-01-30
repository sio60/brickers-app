import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

// 웹에서는 DeviceMotion 사용 불가
let DeviceMotion: any = null;
if (Platform.OS !== "web") {
    DeviceMotion = require("expo-sensors").DeviceMotion;
}

// Random utility functions
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const randomColor = () => {
    const colors = ["#ef4444", "#3b82f6", "#eab308", "#22c55e", "#a855f7", "#ec4899", "#f97316"];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Physics constants
const FRICTION = 0.98;
const IMPULSE_STRENGTH = 0.15;
const GRAVITY = 0.015;
const FLOOR_Y = -15;
const BOUNCE_DAMPING = 0.6;

// Sensitivity for gyro
const TILT_SENSITIVITY = 0.005;

type ShapeType = "standard" | "long" | "cylinder" | "circle";

type BrickProps = {
    position: [number, number, number];
    color: string;
    rotation: [number, number, number];
    scale: number;
    shape: ShapeType;
    entryDirection?: "top" | "sides" | "float";
    sensorData: React.MutableRefObject<{ x: number, y: number }>;
};

type BrickSeed = Omit<BrickProps, "entryDirection" | "sensorData"> & { id: number };

// Stud geometry helpers
const Stud = ({ position, color }: { position: [number, number, number]; color: string }) => (
    <mesh position={position}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
        <meshStandardMaterial color={color} />
    </mesh>
);

function Brick({
    position: initialPos,
    color,
    rotation: initialRot,
    scale,
    shape,
    entryDirection = "top",
    sensorData,
}: BrickProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    const isSides = entryDirection === "sides";
    const isFloat = entryDirection === "float";

    // Initialize position based on entry direction
    const position = useRef(
        useMemo(() => {
            if (isSides) {
                const side = Math.random() > 0.5 ? 1 : -1;
                return new THREE.Vector3(side * 20, randomRange(-5, 15), initialPos[2]);
            }
            if (isFloat) {
                return new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2]);
            }
            return new THREE.Vector3(initialPos[0], initialPos[1] + 25, initialPos[2]);
        }, [initialPos, isSides, isFloat])
    );

    const velocity = useRef(
        useMemo(() => {
            if (isSides) {
                const xDir = position.current.x > 0 ? -1 : 1;
                return new THREE.Vector3(xDir * randomRange(0.2, 0.5), randomRange(0.2, 0.5), 0);
            }
            if (isFloat) {
                return new THREE.Vector3(
                    randomRange(-0.02, 0.02),
                    randomRange(0.01, 0.05),
                    randomRange(-0.02, 0.02)
                );
            }
            return new THREE.Vector3(0, -randomRange(0.1, 0.3), 0);
        }, [isSides, isFloat])
    );

    const angularVelocity = useRef(
        new THREE.Vector3(randomRange(-0.1, 0.1), randomRange(-0.1, 0.1), randomRange(-0.1, 0.1))
    );

    // If float mode, start floating immediately
    const isFalling = useRef(!isFloat);

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        const pos = position.current;
        const vel = velocity.current;
        const rot = meshRef.current.rotation;
        const angVel = angularVelocity.current;

        if (isFalling.current) {
            vel.y -= GRAVITY; // gravity
            pos.add(vel); // move

            // rotate while falling
            rot.x += angVel.x;
            rot.y += angVel.y;
            rot.z += angVel.z;

            // floor collision
            if (pos.y < FLOOR_Y) {
                pos.y = FLOOR_Y;
                vel.y = -vel.y * BOUNCE_DAMPING;

                vel.x += randomRange(-0.05, 0.05);
                vel.z += randomRange(-0.05, 0.05);

                angVel.x = randomRange(-0.2, 0.2);
                angVel.z = randomRange(-0.2, 0.2);

                if (Math.abs(vel.y) < 0.1 && Math.abs(vel.x) < 0.1) {
                    isFalling.current = false;
                    vel.set(randomRange(-0.02, 0.02), randomRange(0.01, 0.05), randomRange(-0.02, 0.02));
                }
            }
        } else {
            // floating with sensor influence
            const { x: tiltX, y: tiltY } = sensorData.current;

            // X tilt rotates Z axis (roll), Y tilt rotates X axis (pitch) mostly.
            // Simplified: tiltX affects velocity X, tiltY affects velocity Y or Z.
            // DeviceMotion.rotation gamma/beta might be better but checking docs, 'rotation' object has alpha, beta, gamma.
            // But we used a simple x/y ref from the parent. Let's see how we populate it.
            // Assuming we pass gamma to x and beta to y.

            vel.x += tiltX * TILT_SENSITIVITY;
            vel.y -= tiltY * TILT_SENSITIVITY; // Negative because tilting 'up' (screen to face) usually means positive beta? Need to calibrate.
            // Actually, let's just make it floaty.

            pos.add(vel);

            rot.x += angVel.x + delta * 0.2;
            rot.y += angVel.y + delta * 0.3;

            vel.multiplyScalar(FRICTION);
            angVel.multiplyScalar(FRICTION);

            // bounds
            if (pos.y > 15 || pos.y < -15) vel.y *= -1;
            if (pos.x > 10 || pos.x < -10) vel.x *= -1;
            if (pos.z > 5 || pos.z < -20) vel.z *= -1;
        }

        meshRef.current.position.copy(pos);
    });

    const onHover = () => {
        velocity.current.set(
            randomRange(-IMPULSE_STRENGTH, IMPULSE_STRENGTH),
            randomRange(IMPULSE_STRENGTH * 0.5, IMPULSE_STRENGTH),
            randomRange(-IMPULSE_STRENGTH, IMPULSE_STRENGTH)
        );
        angularVelocity.current.set(
            randomRange(-0.1, 0.1),
            randomRange(-0.1, 0.1),
            randomRange(-0.1, 0.1)
        );
        isFalling.current = false;
    };

    const renderGeometry = () => {
        switch (shape) {
            case "long":
                return (
                    <>
                        <boxGeometry args={[2, 1, 1]} />
                        <Stud position={[0.5, 0.6, 0.25]} color={color} />
                        <Stud position={[-0.5, 0.6, 0.25]} color={color} />
                        <Stud position={[0.5, 0.6, -0.25]} color={color} />
                        <Stud position={[-0.5, 0.6, -0.25]} color={color} />
                    </>
                );

            case "cylinder":
                return (
                    <>
                        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
                        <Stud position={[0, 0.6, 0]} color={color} />
                    </>
                );

            case "circle":
                return (
                    <>
                        <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
                        <Stud position={[0, 0.3, 0]} color={color} />
                    </>
                );

            case "standard":
            default:
                return (
                    <>
                        <boxGeometry args={[1, 1, 1]} />
                        <Stud position={[0.25, 0.6, 0.25]} color={color} />
                        <Stud position={[-0.25, 0.6, 0.25]} color={color} />
                        <Stud position={[0.25, 0.6, -0.25]} color={color} />
                        <Stud position={[-0.25, 0.6, -0.25]} color={color} />
                    </>
                );
        }
    };

    return (
        <mesh
            ref={meshRef}
            rotation={initialRot}
            scale={scale}
            onClick={onHover}
        >
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            {renderGeometry()}
        </mesh>
    );
}

export function Background3D({
    entryDirection = "top",
}: {
    entryDirection?: "top" | "sides" | "float";
}) {
    const brickCount = 30;
    const shapes: ShapeType[] = ["standard", "long", "cylinder", "circle"];
    const randomShape = () => shapes[Math.floor(Math.random() * shapes.length)];

    const bricks = useMemo<BrickSeed[]>(() => {
        return Array.from({ length: brickCount }).map((_, i) => ({
            id: i,
            position: [randomRange(-8, 8), randomRange(-10, 10), randomRange(-5, -15)],
            rotation: [randomRange(0, Math.PI), randomRange(0, Math.PI), 0],
            color: randomColor(),
            scale: randomRange(0.6, 1.2),
            shape: randomShape(),
        }));
    }, []);

    // Sensor logic
    const sensorData = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // 웹에서는 DeviceMotion 사용 불가 - 센서 없이 작동
        if (!DeviceMotion) {
            return;
        }

        const subscription = DeviceMotion.addListener((result: any) => {
            // rotation alpha beta gamma
            // beta is front-back, gamma is left-right
            if (result.rotation) {
                // Adjust sensitivity and direction as needed
                sensorData.current = {
                    x: result.rotation.gamma || 0,
                    y: result.rotation.beta || 0
                };
            }
        });

        DeviceMotion.setUpdateInterval(50); // 20fps for sensor is usually enough

        return () => subscription.remove();
    }, []);

    return (
        <View style={StyleSheet.absoluteFill}>
            <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <directionalLight position={[-5, 5, 5]} intensity={1} />

                {bricks.map(({ id, ...props }) => (
                    <Brick
                        key={id}
                        {...props}
                        entryDirection={entryDirection}
                        sensorData={sensorData}
                    />
                ))}
            </Canvas>
        </View>
    );
}
