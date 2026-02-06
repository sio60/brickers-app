import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useLanguage } from '@/lib/LanguageContext';

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
// const TARGET_COUNT = 6; // Dynamic based on level
const SHOW_DURATION = 5000; // 5 seconds

const GAME_TRANSLATIONS = {
    ko: {
        ready: "기억하세요!",
        show: "초록색 위치를 기억하세요!",
        play: "초록색이 어디였을까요?",
        success: "완벽해요!",
        fail: "아쉬워요! 다시 해봐요",
        hint: "AI 브릭 생성 중... 잠시만 기다려주세요"
    },
    en: {
        ready: "Get Ready!",
        show: "Remember the green tiles!",
        play: "Where were the green tiles?",
        success: "Perfect!",
        fail: "Close! Try again",
        hint: "AI is generating... please wait"
    },
    ja: {
        ready: "準備してください！",
        show: "緑色の場所を覚えてください！",
        play: "緑色はどこでしたか？",
        success: "完璧です！",
        fail: "残念！もう一度やってみましょう",
        hint: "AIが生成中です... 少々お待ちください"
    }
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_WIDTH = SCREEN_WIDTH - 60;
const TILE_SIZE = (GRID_WIDTH - (GRID_SIZE - 1) * 8) / GRID_SIZE;

type GameState = 'COUNTDOWN' | 'SHOW' | 'PLAY' | 'RESULT';

export default function MemoryGame() {
    const { language } = useLanguage();
    const t = GAME_TRANSLATIONS[(language as 'ko' | 'en' | 'ja') || 'ko'];

    const [gameState, setGameState] = useState<GameState>('COUNTDOWN');
    const [countdown, setCountdown] = useState(3);
    const [targets, setTargets] = useState<number[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [wrong, setWrong] = useState<number[]>([]);
    const [message, setMessage] = useState(t.ready);

    // New Game States
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);

    useEffect(() => {
        setMessage(t.ready);
    }, [language]);

    const startNewRound = useCallback((nextLevel: number) => {
        setGameState('COUNTDOWN');
        setCountdown(3);
        setSelected([]);
        setWrong([]);
        setMessage(t.ready);

        // Difficulty: Initial 3 targets, +1 every level, max 15
        const targetCount = Math.min(3 + (nextLevel - 1), 15);

        // Pick random targets
        const newTargets: number[] = [];
        while (newTargets.length < targetCount) {
            const idx = Math.floor(Math.random() * TOTAL_TILES);
            if (!newTargets.includes(idx)) {
                newTargets.push(idx);
            }
        }
        setTargets(newTargets);
    }, [t.ready]);

    useEffect(() => {
        startNewRound(1);
    }, [startNewRound]);

    useEffect(() => {
        if (gameState === 'COUNTDOWN') {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                setGameState('SHOW');
                setMessage(t.show);
            }
        }
    }, [gameState, countdown, t.show]);

    useEffect(() => {
        if (gameState === 'SHOW') {
            const timer = setTimeout(() => {
                setGameState('PLAY');
                setMessage(t.play);
            }, SHOW_DURATION);
            return () => clearTimeout(timer);
        }
    }, [gameState, t.play]);

    const handleTilePress = (index: number) => {
        if (gameState !== 'PLAY') return;
        if (selected.includes(index) || wrong.includes(index)) return;

        if (targets.includes(index)) {
            const newSelected = [...selected, index];
            setSelected(newSelected);

            if (newSelected.length === targets.length) {
                setGameState('RESULT');
                setMessage(t.success);

                // Success: Increase Score & Level
                const bonus = level * 10;
                setScore(prev => prev + 100 + bonus);
                setLevel(prev => prev + 1);

                setTimeout(() => startNewRound(level + 1), 2000);
            }
        } else {
            setWrong([...wrong, index]);
            setGameState('RESULT');
            setMessage(t.fail);

            // Fail: Reset Score & Level
            setScore(0);
            setLevel(1);

            // Show all targets upon failure
            setTimeout(() => startNewRound(1), 2500);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.scoreBoard}>
                    <Text style={styles.scoreText}>Lv.{level}</Text>
                    <Text style={styles.scoreText}>Score: {score}</Text>
                </View>
                <Text style={styles.message}>{message}</Text>
            </View>

            <View style={styles.grid}>
                {Array.from({ length: TOTAL_TILES }).map((_, i) => {
                    let tileStyle: any = styles.tile;

                    if (gameState === 'SHOW') {
                        if (targets.includes(i)) tileStyle = [styles.tile, styles.target];
                    } else if (gameState === 'PLAY') {
                        if (selected.includes(i)) tileStyle = [styles.tile, styles.target];
                        if (wrong.includes(i)) tileStyle = [styles.tile, styles.wrong];
                    } else if (gameState === 'RESULT') {
                        if (targets.includes(i)) tileStyle = [styles.tile, styles.target];
                        if (wrong.includes(i)) tileStyle = [styles.tile, styles.wrong];
                    } else if (gameState === 'COUNTDOWN') {
                        // Default grey
                    }

                    return (
                        <TouchableOpacity
                            key={i}
                            activeOpacity={0.8}
                            style={tileStyle}
                            onPress={() => handleTilePress(i)}
                        >
                            {gameState === 'COUNTDOWN' && (
                                <Text style={styles.countdownText}>{countdown}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <Text style={styles.hint}>{t.hint}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 20,
    },
    header: {
        marginBottom: 30,
        height: 40,
        justifyContent: 'center',
    },
    message: {
        fontSize: 18,
        fontWeight: '800',
        color: '#333',
        textAlign: 'center',
        fontFamily: 'NotoSansKR_700Bold',
    },
    grid: {
        width: GRID_WIDTH,
        height: GRID_WIDTH,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: '#D1D1D1',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    target: {
        backgroundColor: '#4CD964', // Green
    },
    wrong: {
        backgroundColor: '#FF3B30', // Red
    },
    countdownText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
    },
    footer: {
        marginTop: 40,
    },
    hint: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'NotoSansKR_400Regular',
    },
    scoreBoard: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 20,
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CD964',
        fontFamily: 'NotoSansKR_700Bold',
    }
});
