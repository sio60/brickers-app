import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';

// Maze configurations
// 0: Path, 1: Wall, 2: Start, 3: Goal
const LEVELS = [
    // Level 1: 5x5 (Easy)
    [
        [2, 0, 1, 0, 0],
        [0, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 0, 1, 0, 0],
        [1, 0, 1, 1, 3],
    ],
    // Level 2: 8x8 (Medium)
    [
        [2, 0, 0, 0, 1, 0, 0, 0],
        [1, 1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 1, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 1, 1, 3],
    ],
    // Level 3: 12x12 (Hard)
    [
        [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 3],
    ]
];

const CELL_SIZE_MAP = [60, 40, 28]; // Cell sizes for each level
const BALL_SIZE_MAP = [40, 26, 18]; // Ball sizes for each level

export default function MazeGame({ onComplete }: { onComplete?: () => void }) {
    const [level, setLevel] = useState(0);
    const [data, setData] = useState({ x: 0, y: 0, z: 0 });

    const maze = LEVELS[level];
    const rows = maze.length;
    const cols = maze[0].length;

    const width = Dimensions.get('window').width - 40; // Container padding
    const cellSize = Math.min(width / cols, CELL_SIZE_MAP[level]);
    const ballSize = BALL_SIZE_MAP[level];

    // Game state
    const ballX = useSharedValue(0);
    const ballY = useSharedValue(0);

    // Find start position
    useEffect(() => {
        let startR = 0, startC = 0;
        maze.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell === 2) {
                    startR = r;
                    startC = c;
                }
            });
        });

        // Initialize ball position (center of start cell)
        ballX.value = startC * cellSize + (cellSize - ballSize) / 2;
        ballY.value = startR * cellSize + (cellSize - ballSize) / 2;
    }, [level]);

    // Accelerometer handling
    useEffect(() => {
        Accelerometer.setUpdateInterval(16); // ~60fps

        const subscription = Accelerometer.addListener(accelerometerData => {
            setData(accelerometerData);

            const { x, y } = accelerometerData;
            // Invert X for natural feel, adjust sensitivity
            const sensitivity = 5;
            const dx = x * sensitivity; // x is left/right tilt
            const dy = -y * sensitivity; // y is forward/backward tilt (negative is forward)

            // Current logical position
            const currentX = ballX.value;
            const currentY = ballY.value;

            let nextX = currentX + dx;
            let nextY = currentY + dy;

            // Boundary checks & Wall collision
            // We check the center point of the ball
            const ballCenterX = nextX + ballSize / 2;
            const ballCenterY = nextY + ballSize / 2;

            const col = Math.floor(ballCenterX / cellSize);
            const row = Math.floor(ballCenterY / cellSize);

            // Basic boundary check
            if (ballCenterX < 0 || ballCenterX > cols * cellSize ||
                ballCenterY < 0 || ballCenterY > rows * cellSize) {
                return;
            }

            // Wall collision check
            // Check all 4 corners of the ball
            const corners = [
                { x: nextX, y: nextY },
                { x: nextX + ballSize, y: nextY },
                { x: nextX, y: nextY + ballSize },
                { x: nextX + ballSize, y: nextY + ballSize },
            ];

            let collision = false;
            for (const corner of corners) {
                const c = Math.floor(corner.x / cellSize);
                const r = Math.floor(corner.y / cellSize);

                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    if (maze[r][c] === 1) { // Wall
                        collision = true;
                        break;
                    }
                    if (maze[r][c] === 3) { // Goal
                        // Check if mostly inside goal
                        const centerX = nextX + ballSize / 2;
                        const centerY = nextY + ballSize / 2;
                        const goalC = Math.floor(centerX / cellSize);
                        const goalR = Math.floor(centerY / cellSize);

                        if (maze[goalR][goalC] === 3) {
                            handleWin();
                            return;
                        }
                    }
                }
            }

            if (!collision) {
                ballX.value = nextX;
                ballY.value = nextY;
            }
        });

        return () => subscription && subscription.remove();
    }, [level]); // Re-bind when level changes (maze map changes)

    function handleWin() {
        runOnJS(nextLevel)();
    }

    function nextLevel() {
        if (level < LEVELS.length - 1) {
            setLevel(level + 1);
        } else {
            // Game Complete
            if (onComplete) onComplete();
            // Reset to level 0 for infinite loop or stop
            setLevel(0);
        }
    }

    const ballStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: ballX.value },
                { translateY: ballY.value }
            ]
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.levelText}>Level {level + 1}/3</Text>
                <Text style={styles.instructText}>기기를 기울여 탈출하세요!</Text>
            </View>

            <View style={[styles.mazeContainer, { width: cols * cellSize, height: rows * cellSize }]}>
                {maze.map((row, r) => (
                    <View key={`row-${r}`} style={styles.row}>
                        {row.map((cell, c) => (
                            <View
                                key={`cell-${r}-${c}`}
                                style={[
                                    styles.cell,
                                    {
                                        width: cellSize,
                                        height: cellSize,
                                        backgroundColor:
                                            cell === 1 ? '#333' : // Wall
                                                cell === 2 ? '#E0E7FF' : // Start
                                                    cell === 3 ? '#ffe135' : // Goal
                                                        '#f9f9f9' // Path
                                    }
                                ]}
                            >
                                {cell === 3 && <Text style={{ fontSize: cellSize * 0.5 }}>🏁</Text>}
                            </View>
                        ))}
                    </View>
                ))}

                <Animated.View
                    style={[
                        styles.ball,
                        ballStyle,
                        { width: ballSize, height: ballSize, borderRadius: ballSize / 2 }
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    levelText: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'NotoSansKR_700Bold',
        color: '#333',
    },
    instructText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'NotoSansKR_400Regular',
        marginTop: 4,
    },
    mazeContainer: {
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#fff',
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#eee',
    },
    ball: {
        position: 'absolute',
        backgroundColor: '#fb5656',
        zIndex: 10,
        // Shadow for 3D effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 4,
    }
});
