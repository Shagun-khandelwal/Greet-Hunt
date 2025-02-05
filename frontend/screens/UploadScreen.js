import React from 'react';
import { Text, View, StyleSheet,SafeAreaView } from 'react-native';

export default function UploadScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text>This is Upload Page of Greet Hunt</Text>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    }
})