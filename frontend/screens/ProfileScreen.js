import React from 'react';
import { Text, View, StyleSheet,SafeAreaView } from 'react-native';

export default function ProfileScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text>This is Profile Page of Greet Hunt</Text>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    }
})