import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import ThreeDPreview from './preview/ThreeDPreview';

interface ModelCardProps {
    title: string;
    creator: string;
    modelUrl: string;
    onPress?: () => void;
}

export function ModelCard({ title, creator, modelUrl, onPress }: ModelCardProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <View style={styles.previewContainer}>
                <ThreeDPreview url={modelUrl} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.creator} numberOfLines={1}>BY {creator}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 300,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        marginHorizontal: 10,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#000000',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1.5,
        borderBottomColor: '#000000',
    },
    infoContainer: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000000',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    creator: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666666',
        textTransform: 'uppercase',
    },
});
