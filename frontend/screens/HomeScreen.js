import React, { useEffect, useState } from 'react';
import {
    Text,
    View,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    Modal,
    TouchableOpacity
} from 'react-native';
import axios from 'axios';


function getGreeting() {
    const currentHour = new Date().getHours(); // Get the current hour (0-23)

    let greeting;

    if (currentHour >= 5 && currentHour < 12) {
        greeting = "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
        greeting = "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
        greeting = "Good Evening";
    } else {
        greeting = "Good Night";
    }

    return greeting;
}

//shuffling the array for special wishes
function shuffleArray(array) {
    // Create a copy of the original array to avoid modifying it
    const shuffledArray = [...array];

    for (let i = shuffledArray.length - 1; i > 0; i--) {
        // Generate a random index from 0 to i
        const randomIndex = Math.floor(Math.random() * (i + 1));

        // Swap the current element with the random element
        [shuffledArray[i], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[i]];
    }

    return shuffledArray; // Return the shuffled array
}
// Call the function to print the greeting

export default function HomeScreen() {

    const [timeOfDayImages, setTimeOfDayImages] = useState([]);
    const [todayCelebrationCornerImages, setTodayCelebrationCornerImages] = useState([]);
    const [specialDayWishesImages, setSpecialDayWishesImages] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const timeofday = getGreeting();

    const fetchImages = async () => {
        try {
            const response1 = await axios.get(`https://greet-hunt.vercel.app/upload/images/query?festive=${timeofday}`);
            setTimeOfDayImages(response1.data.data);
            const response2 = await axios.get(`https://greet-hunt.vercel.app/upload/images/query?festive=diwali`);
            setTodayCelebrationCornerImages(response2.data.data);
            const response3 = await axios.get(`https://greet-hunt.vercel.app/upload/images`);
            setSpecialDayWishesImages(shuffleArray(response3.data.data));
        } catch (error) {
            console.error('Error fetching Images: ', error);
        }
    }

    useEffect(() => {
        fetchImages();
    }, []);

    const openImage = (image) => {
        setSelectedImage(image.greet_image);
        setModalVisible(true);
    };

    const closeImage = (imageURL) => {
        setModalVisible(false);
        setSelectedImage(null);
    };

    const downloadImage = (imageURL) => {
        console.log(`download image ${imageURL}`);
    };

    const LikeImage = (imageURL) => {
        console.log(`Like image ${imageURL}`);
    };

    return (
        <SafeAreaView >
            <View style={styles.header}>
                <Text style={styles.headerText} >GreetHunt</Text>
            </View>
            <ScrollView style={styles.ScrollView} contentContainerStyle={styles.container}>
                <View style={styles.container}>
                    <Text style={styles.sectionHeading}>Time-of-Day Wishes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                        {timeOfDayImages.map((element, index) => {
                            return (
                                <TouchableOpacity key={index} onPress={() => openImage(element)} >
                                    <Image
                                        source={{ uri: element.greet_image }}
                                        style={styles.image}
                                        resizeMode='contain' />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <Text style={styles.sectionHeading}>Today's Celebration Corner</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                        {todayCelebrationCornerImages.map((element, index) => {
                            return (<TouchableOpacity key={index} onPress={() => openImage(element)}>
                                <Image
                                    source={{ uri: element.greet_image }}
                                    style={styles.image}
                                    resizeMode='contain' />
                            </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <Text style={styles.sectionHeading}>Special Day Wishes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                        {specialDayWishesImages.map((element, index) => {
                            return (<TouchableOpacity key={index} onPress={() => openImage(element)}>
                                <Image
                                    source={{ uri: element.greet_image }}
                                    style={styles.image}
                                    resizeMode='contain' />
                            </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <Text style={styles.sectionHeading}>Your Recently Viewed</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                        {specialDayWishesImages.map((element, index) => {
                            return (<TouchableOpacity key={index} onPress={() => openImage(element)}>
                                <Image
                                    source={{ uri: element.greet_image }}
                                    style={styles.image}
                                    resizeMode='contain' />
                            </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
                {/* Full Screen modal */}
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType='slide'
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity onPress={closeImage} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullScreenImage}
                            resizeMode='contain'
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={() => downloadImage(selectedImage)} style={styles.button}>
                                <Text style={styles.buttonText}>Download</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => LikeImage(selectedImage)} style={styles.button}>
                                <Text style={styles.buttonText}>Like</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: 'purple',
        padding: 15,
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionHeading: {
        marginLeft: 5,
        marginTop: 10,
        marginBottom: 10,
        fontSize: 20,
        color: 'black',
    },
    ScrollView: {
        flexGrow: 1,
        paddingBottom: 20,
        marginBottom: 60
    },
    container: {

    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1
    },
    closeButtonText: {
        fontSize: 30,
        color: 'white'
    },
    fullScreenImage: {
        width: '100%',
        height: '80%'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20
    },
    button: {
        backgroundColor: 'purple',
        padding: 10,
        borderRadius: 5
    },
    buttonText: {
        color: 'white',
        fontSize: 16
    },
    imageRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginLeft: 5
    },
    image: {
        width: 200,
        height: 200,
        marginRight: 10
    }
});