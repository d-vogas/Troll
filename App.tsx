import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity, StyleSheet, Appearance, Modal, StatusBar } from 'react-native';
import firestore, { firebase } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome'; // Choose an icon set, like Ionicons
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  colors: {
    primary: '#4CAF50', // Purple
    secondary: '#6ccf70', // Teal
    background: '#ffffff', // White
    surface: '#f5f5f5', // Light gray
    error: '#b00020', // Red
    onPrimary: '#ffffff', // White
    onSecondary: '#000000', // Black
    text: '#121212', // Black
    border: '#e0e0e0', // Light gray border
    button: '#4CAF50', // Button color
  },
  fonts: {
    regular: 'System',
    bold: 'System-Bold',
  },
};

const darkTheme = {
  colors: {
    primary: '#6ccf70', // Light Purple
    secondary: '#4CAF50', // Teal
    background: '#121212', // Dark gray
    surface: '#1e1e1e', // Darker gray
    error: '#cf6679', // Light red
    onPrimary: '#000000', // Black
    onSecondary: '#ffffff', // White
    text: '#ffffff', // White
    border: '#333333', // Dark gray border
    button: '#6ccf70', // Button color
  },
  fonts: {
    regular: 'System',
    bold: 'System-Bold',
  },
};

const App = () => {
  StatusBar.setHidden(true, 'none');
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    const colorScheme = Appearance.getColorScheme();
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
    });

    return () => subscription.remove();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      //backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContainer: {
      width: '80%',
      padding: 20,
      backgroundColor: theme.colors.surface, // Use surface color for modal background
      borderRadius: 10, // Optional for rounded corners
      shadowColor: '#000', // Adding some shadow for depth
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5, // Elevation for Android
    },
    text: {
      fontSize: 18,
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.button,
      borderRadius: 20
    },
    border: {
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    roundedButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    buttonText: {
      fontSize: 18,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    title: {
      fontSize: 48,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginTop: 80,
      marginBottom: 20,
      textAlign: 'center', // Center the title
    },
    messageText: (item, selectedMessage, allSelected) => ({
      fontSize: 18,
      padding: 10,
      backgroundColor: (allSelected && item.userId === 'correct') ? theme.colors.primary : 
                        (selectedMessage === item.id ? (allSelected ? theme.colors.error : theme.colors.secondary) : theme.colors.surface),
      color: theme.colors.text,
    }),
  });

  const RoundedButton = ({ title, onPress, color = theme.colors.button, disabled = false }) => (
    <TouchableOpacity 
      onPress={disabled ? null : onPress} // Disable only when necessary
      activeOpacity={0.7} // Add active opacity to show feedback on press
      style={[
        styles.roundedButton, 
        { backgroundColor: color, opacity: disabled ? 0.5 : 1 }
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  const ROUNDS = 7
  const QUESTIONS = 74

  const [tempNickname, setTempNickname] = useState('');
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState('');

  const [joiningSession, setJoiningSession] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [joinedSession, setJoinedSession] = useState(false)
  const [viewingInstructions, setViewingInstructions] = useState(false)

  const [code, setCode] = useState(''); //input text data at joining session
  const [sessionCode, setSessionCode] = useState('');
  const [sessionError, setSessionError] = useState(null);
  const [sessionCreator, setSessionCreator] = useState(false);

  const [sessionStarted, setSessionStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [prevRound, setPrevRound] = useState(1);

  const [message, setMessage] = useState(''); //input text message
  const [messages, setMessages] = useState([]);
  const [usersDetailed, setUsersDetailed] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [allSubmitted, setAllSubmitted] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState('');
  const [allSelected, setAllSelected] = useState(false);

  const [ready, setReady] = useState(false)
  const [allReady, setAllReady] = useState(false)
  const [readyUsers, setReadyUsers] = useState([]);
  
  const [connectedUsers, setConnectedUsers] = useState([]);

  const [viewingResults, setViewingResults] = useState(false);
  const [leavingSession, setLeavingSession] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState('');

  const [trollModal, setTrollModal] = useState(false);
  const [trollMessage, setTrollMessage] = useState('')

  const [utility, setUtility] = useState(false);

  const [qids, setQids] = useState([])

  useEffect(() => {
    
    const loadNickname = async () => {
      try {
        let storedNickname = await AsyncStorage.getItem('Nickname');
        if (!storedNickname) {
          setNickname('');
        } else {
          setNickname(storedNickname);
        }
      } catch (error) {
        console.error('Failed to load or save Nickname', error);
      }
    };

    loadNickname();
  }, []);

  useEffect(() => {
    const generateUserId = () => {
      return `user_${Math.random().toString(36).substring(2, 15)}`;
    };

    const loadUserId = async () => {
      try {
        let storedUserId = await AsyncStorage.getItem('temporaryUserId');
        if (!storedUserId) {
          const newUserId = generateUserId();
          await AsyncStorage.setItem('temporaryUserId', newUserId);
          setUserId(newUserId);
        } else {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Failed to load or save user ID', error);
      }
    };

    loadUserId();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('sessions')
      .doc(sessionCode)
      .onSnapshot(documentSnapshot => {
        const data = documentSnapshot.data();
        if (data) {
          setConnectedUsers(data.users || []);
        }
      });
    
    return () => unsubscribe();
  }, [creatingSession, joinedSession]);

  useEffect(() => {
    
    const loadQids = async () => {
      try {
        let jsonQids = await AsyncStorage.getItem('qids')
        let storedQids = jsonQids != null ? JSON.parse(jsonQids) : null;
        if (!storedQids) {
          setQids([]);
        } else {
          setQids(storedQids);
        }
      } catch (error) {
        console.error('Failed to load or save Nickname', error);
      }
    };

    loadQids();
  }, []);

  useEffect(() => {
    if (!sessionCode) {
      console.log("Session code is not available.");
      return; // Prevent running if sessionCode is not available
    }

    const unsubscribe = firestore()
      .collection('sessions')
      .doc(sessionCode)
      .onSnapshot(documentSnapshot => {
        const data = documentSnapshot.data();
        if (data) {
          setSessionStarted(data.sessionStarted || false);
          setRound(data.round || 1);
        }
      });

    return () => unsubscribe();
  }, [sessionCode]);

  useEffect(() => {
    if (!sessionCode) {
      console.log("Session code is not available.");
      return; // Prevent running if sessionCode is not available
    }

    if (sessionStarted) {
      const unsubscribeMessages = firestore()
        .collection('sessions')
        .doc(sessionCode)
        .collection('messages')
        .onSnapshot(querySnapshot => {
          const msgs = [];
          querySnapshot.forEach(documentSnapshot => {
            msgs.push({
              ...documentSnapshot.data(),
              id: documentSnapshot.id,
            });
          });
          setMessages(msgs);
        
          // Check if all users have submitted their messages
          if (msgs.length >= (connectedUsers.length + 1)) {
            setAllSubmitted(true);
          }
        });

      return () => unsubscribeMessages();
    }

  }, [round, sessionStarted, connectedUsers, sessionCode]);

  useEffect(() => {
    if (!sessionCode) {
      console.log("Session code is not available.");
      return; // Prevent running if sessionCode is not available
    }

    if (sessionStarted && allSubmitted) {
      const unsubscribeSelections = firestore()
        .collection('sessions')
        .doc(sessionCode)
        .collection('messages')
        .onSnapshot(querySnapshot => {
          var selections = 0;
          querySnapshot.forEach(documentSnapshot => {
            selections = selections + documentSnapshot.data().selected;
          });
          
          // Check if all users have selected a message
          if (selections >= connectedUsers.length) {
            setAllSelected(true);
          }
        });

      return () => unsubscribeSelections();
    }
  }, [allSubmitted, sessionStarted, connectedUsers, sessionCode]);

  useEffect(() => {
    if (!sessionCode) {
      console.log("Session code is not available.");
      return; // Prevent running if sessionCode is not available
    }

    if (sessionStarted && allSubmitted){
      const unsubscribe = firestore()
      .collection('sessions')
      .doc(sessionCode)
      .onSnapshot(documentSnapshot => {
        const data = documentSnapshot.data();
        if (data) {
          setReadyUsers(data.readyUsers || []);
        }
      });
      

      //console.log(userId, submitted, allSubmitted, allSelected, ready, readyUsers)
      if (readyUsers.length >= connectedUsers.length){
        setAllReady(true)
      }
    
    return () => unsubscribe();
    }
  }, [allSelected, sessionCode, ready, readyUsers, allSubmitted]);

  useEffect(() => {
    if (!sessionCode) {
      console.log("Session code is not available.");
      return; // Prevent running if sessionCode is not available
    }

    if (prevRound < round || viewingResults) {

      const unsubscribeMessages = firestore()
        .collection('sessions')
        .doc(sessionCode)
        .collection('usersDetailed')
        .orderBy('points', 'desc')
        .onSnapshot(querySnapshot => {
          const ud = [];
          querySnapshot.forEach(documentSnapshot => {
            ud.push({
              ...documentSnapshot.data(),
              id: documentSnapshot.id,
            });
          });
          setUsersDetailed(ud);
        
          // Check if all users have submitted their messages
          if (ud.length === connectedUsers.length) {
            setAllSubmitted(true);
          }
        });

      return () => unsubscribeMessages();
    }

  }, [round, sessionStarted, connectedUsers, sessionCode, viewingResults]);

  useEffect(() => {
    if (!sessionCode) {
      console.log("Session code is not available.");
      return; // Prevent running if sessionCode is not available
    }

    const unsubscribeMessages = firestore()
      .collection('sessions')
      .doc(sessionCode)
      .onSnapshot(documentSnapshot => {
        const data = documentSnapshot.data();
        if (data) {
          setCurrentQuestion(data.currentQuestion || '');
        }
      });

      return () => unsubscribeMessages();

  }, [round, sessionStarted, currentQuestion]);

  const submitNickname = async () => {
    await AsyncStorage.setItem('Nickname', tempNickname)
    setNickname(tempNickname)
  };

  const returnToStart = async () => {
    try {
      if (sessionCreator && sessionCode) {
        // Delete the session from Firebase if the user is the session creator
        await firestore().collection('sessions').doc(sessionCode).delete();
        console.log(`Session ${sessionCode} deleted successfully.`);
      } else if (joinedSession && sessionCode) {
        // Remove the user from the session if they have joined it
        await firestore().collection('sessions').doc(sessionCode).update({
          users: firestore.FieldValue.arrayRemove(userId)
        });
        console.log(`User ${userId} successfully removed from session ${sessionCode}.`);
      }
    } catch (error) {
      console.error("Error handling session: ", error);
      setSessionError("Failed to update session. Please try again.");
      return; // Exit the function if an error occurs
    } finally {
      // Reset all states
      setJoiningSession(false);
      setJoinedSession(false);
      setCreatingSession(false);
      setCode('');
      setSessionCode('');
      setSessionError(null);
      setSessionCreator(false);
      setPrevRound(1);
      setViewingResults(false);
      setViewingInstructions(false);
    }
  };

  const createSession = async () => {
    try {
      const newSessionCode = await generateSessionCode(4); // Generate a unique session code
      setSessionCode(newSessionCode);

      // Store the session in Firebase
      await firestore().collection('sessions').doc(newSessionCode).set({
        createdAt: firestore.FieldValue.serverTimestamp(),
        active: true,
        users: [userId],
        sessionStarted: false
      });
      
      await firestore().collection('sessions').doc(newSessionCode).collection('usersDetailed')
      .add(({
        userId: userId,
        nickname: nickname,
        points: 0
      }));

      setCreatingSession(true)
      setSessionCreator(true)
    } catch (error) {
      console.error("Error creating session: ", error);
      setSessionError("Failed to create session. Please try again.");
    }
  };

  const generateSessionCode = async (length) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  
    // Check if the generated code is unique
    const sessionDoc = await firestore().collection('sessions').doc(result).get();
    if (sessionDoc.exists) {
      // If code exists, generate a new one
      return generateSessionCode(length);
    }

    return result;
  };

  const joinSession = () => {
    setJoiningSession(true)
  };

  const submitCode = async () => {
    try {
      const sessionDoc = await firestore().collection('sessions').doc(code).get();

      if (sessionDoc.exists) {
        // The session exists, proceed to join
        firestore().collection('sessions').doc(code).update({
          users: firestore.FieldValue.arrayUnion(userId)
        });
        firestore().collection('sessions').doc(code).collection('usersDetailed')
        .add(({
          userId: userId,
          nickname: nickname,
          points: 0
        }));

        setSessionCode(code);
        setJoiningSession(false)
        setJoinedSession(true)
      } else {
        setSessionError("Invalid session code. Please try again.");
      }
    } catch (error) {
      console.error("Error joining session: ", error);
      setSessionError("Failed to join session. Please try again.");
    }
  };

  const clearName = () => {
    setNickname('')
  }

  const viewInstructions = () => {
    setViewingInstructions(!viewingInstructions)
  }

  const updateQuestion = async () => {
    try {
      var qid;
      if (qids.length >= QUESTIONS) {
        setQids([])
        console.log('All qids used. Starting over.')
        //await AsyncStorage.setItem('qids', JSON.stringify([]))
      }

      while (true) {
        // Generate a random qid
        qid = String(Math.floor(Math.random() * QUESTIONS));
        console.log(qid)
        
        // Check if the qid has already been retrieved
        if (!qids.includes(qid)) {
          setQids(prevQids => [...prevQids, qid]);  // Mark this qid as retrieved
          console.log(qids)
          break;  // Exit the loop once a new qid is found
        }
        else{
          console.log('qid', qid, 'already used. Picking a new one')
        }
      }
      await AsyncStorage.setItem('qids', JSON.stringify(qids))
      
      const questionDoc = await firestore()
      .collection('questions')
      .doc(qid)
      .get();

      // Check if the document exists
      if (questionDoc.exists) {
        // Extract the data from the document
        const questionAnswerPair = questionDoc.data();
        console.log(questionAnswerPair.question, questionAnswerPair.answer)

        await firestore().collection('sessions').doc(sessionCode).update({
          currentQuestion: questionAnswerPair.question,
          currentAnswer: questionAnswerPair.answer
        })

        await firestore()
        .collection('sessions')
        .doc(sessionCode)
        .collection('messages')
        .add(({
          text: questionAnswerPair.answer,
          userId: "correct",
          selected: 0,
          nickname: "correct"
        }));
      } else {
        console.error('No such document!');
      }
    } catch (error) {
    // Handle errors
    console.error('Error fetching question:', error);
    }
  }

  const startSession = async () => {
    try {
      await firestore()
      .collection('sessions')
      .doc(sessionCode)
      .update({
        sessionStarted: true,
        round: 1,
        readyUsers: []
      });

      await updateQuestion()
      
    } catch (error) {
      console.error("Error starting session: ", error)
      setSessionError("Failed to start session. Please try again.")
    }
  };

  const submitMessage = async () => {
    const tempMessage = message.trim().toLowerCase();
    if (tempMessage) {
        try {
            // Fetch all previous messages from Firestore for this session
            const messagesSnapshot = await firestore()
                .collection('sessions')
                .doc(sessionCode)
                .collection('messages')
                .get();
            
            // Convert the Firestore snapshot into an array of message texts
            const previousMessages = messagesSnapshot.docs.map(doc => doc.data().text.toLowerCase());

            // Check for duplicates or similar messages
            const isDuplicate = previousMessages.some(prevMessage => prevMessage === tempMessage);

            if (isDuplicate) {
                setMessage(''); // Clear input field
                alert('Duplicate message. Please try again with a different message.');
                return; // Stop the submission process
            }

            // If no duplicates or similar messages found, proceed with submission
            await firestore()
                .collection('sessions')
                .doc(sessionCode)
                .collection('messages')
                .add({
                    text: tempMessage,
                    userId: userId,
                    selected: 0,
                    nickname: nickname
                });

            setMessage(''); // Clear input field
            setSubmitted(true); // Disable further input

        } catch (error) {
            console.error('Error submitting message:', error);
        }
    }
  };

  const selectMessage = async (id: string, messageUserId: string, messageSubmitter: string) => {

    if (messageUserId === userId) {
      return; // Do nothing if the message was submitted by the current user
    }

    if (!selectedMessage) {
      setSelectedMessage(id);
      await firestore()
        .collection('sessions')
        .doc(sessionCode)
        .collection('messages')
        .doc(id)
        .update({
          selected: firestore.FieldValue.increment(1),
        });

         // Increment the points for the user who submitted the message
      const usersDetailedCollection = firestore()
        .collection('sessions')
        .doc(sessionCode)
        .collection('usersDetailed')
      
      if (messageUserId == 'correct'){
        const usersDetailedQuery = usersDetailedCollection.where('userId', '==', userId);

        const querySnapshot = await usersDetailedQuery.get();
        querySnapshot.forEach(async (doc) => {
          await doc.ref.update({
            points: firestore.FieldValue.increment(2),
          });
        });

        setTrollMessage('You are correct!')
      }
      else {
        const usersDetailedQuery = usersDetailedCollection.where('userId', '==', messageUserId);

        const querySnapshot = await usersDetailedQuery.get();
        querySnapshot.forEach(async (doc) => {
          await doc.ref.update({
            points: firestore.FieldValue.increment(1),
          });
        });

        setTrollMessage('You selected ' + messageSubmitter + '\'s answer!')
      }
      setTrollModal(true)
    }
  };

  const setReadyStatus = async () => {
    try {
      await firestore().collection('sessions').doc(sessionCode).update({
        readyUsers: firestore.FieldValue.arrayUnion(userId)
      });
      setReady(true)
    } catch (error){
      console.error('Error setting ready status: ', error);
    }
  }

  const resetState = () => {
    setSubmitted(false);
    setAllSubmitted(false);
    setSelectedMessage('');
    setAllSelected(false);
    setReady(false);
    setTrollMessage('');
  };

  const nextRound = async () => {
    setUtility(true)
    if (allSelected){
      try {
        
        if (sessionCreator){
          const snapshot = await firestore()
          .collection('sessions')
          .doc(sessionCode)
          .collection('messages')
          .get()
          // Check if there are any documents
          if (!snapshot.empty) {
            // Create an array of promises to delete each document
            const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
            
            // Wait for all delete operations to complete
            await Promise.all(deletePromises);
            
            console.log('All messages cleared.');
          } else {
            console.log('No messages to clear.');
          }
          console.log(`Messages for round ${round} of session ${sessionCode} cleared successfully.`);
          
          await updateQuestion()

          await firestore()
            .collection('sessions')
            .doc(sessionCode)
            .update({
              readyUsers: [],
              round: firestore.FieldValue.increment(1),
          });

        }
      } catch (error) {
        console.error('Error clearing messages: ', error);
      } 
      setUtility(false)
    }
  }

  const viewResults = () => {
    setViewingResults(true)
  }

  const leaveSession = () => {
    setLeavingSession(true)
    returnToStart()
  }
  
  const startFromLeaving = () => {
    setSessionStarted(false)
    resetState()
    setLeavingSession(false)
  }

  const endSession = () => {
    returnToStart()
    setSessionStarted(false)
    resetState()
  }

  const proceed = () => {
    resetState()
    setAllReady(false)
    setPrevRound(round)
  }

  const renderMessage = ({ item }) => (
    <TouchableOpacity 
      onPress={() => selectMessage(item.id, item.userId, item.nickname)} 
      disabled={!!selectedMessage}
    >
      <Text style={styles.messageText(item, selectedMessage, allSelected)}>
        {item.text} {allSelected && `- Selected: ${item.selected}`}
      </Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <View style={[styles.border, { padding: 10, borderBottomWidth: 1 }]}>
      <Text style={styles.text}>{item.nickname} - Points: {item.points}</Text>
    </View>
  );

  if (!nickname) {
    return (
      <View style={[styles.container, styles.centered]}>
        <TextInput
          placeholder="Enter your name"
          value={tempNickname}
          onChangeText={setTempNickname}
          style={[styles.border, { padding: 10, marginBottom: 10 }]}
        />
        <RoundedButton title="Save" onPress={submitNickname}/>
      </View>
    );
  }

  if (leavingSession) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>Leaving session {sessionCode}</Text>
        <RoundedButton title="Return" onPress={startFromLeaving} color={theme.colors.button}/>
      </View>
    );
  } 

  if (!sessionStarted) {
    return (
      <View style={styles.container, styles.centered}>
        <Text style={[styles.title]}>Troll</Text>
        {!joiningSession && !creatingSession && !joinedSession && (
          <View style={[styles.centered, { marginBottom: 20 }]}>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>Welcome {nickname}!</Text>
            <RoundedButton title="Join Session" onPress={joinSession}/>
            <RoundedButton title="Create Session" onPress={createSession}/>
            <RoundedButton title="Change Name" onPress={clearName}/>
            <RoundedButton title="Instructions" onPress={viewInstructions}/>
          </View>
        )}
        
        {(joiningSession || creatingSession || joinedSession) && (
          <TouchableOpacity 
            onPress={returnToStart} 
            style={{ position: 'absolute', top: 20, left: 20 }}
          >
            <Icon name="arrow-left" size={30} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        
        {joiningSession && (
          <View style={[styles.centered, { marginBottom: 20 }]}>
            <TextInput
              placeholder="Enter session code"
              value={code}
              onChangeText={setCode}
              style={[styles.border, { padding: 10, marginBottom: 10 }]}
            />
            <RoundedButton title="Submit Code" onPress={submitCode}/>
            {sessionError && (
              <Text style={{ color: theme.colors.error, marginTop: 10 }}>{sessionError}</Text>
            )}
          </View>
        )}
        
        {joinedSession && (
          <View style={[styles.centered]}>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>Joined Session</Text>
            <Text style={[styles.text, { fontSize: 16, marginBottom: 40 }]}>Session Code: {sessionCode}</Text>
            <Text style={[styles.text, { fontSize: 16, marginBottom: 40 }]}>Connected Users: {connectedUsers.length}</Text>
            <Text style={[styles.text, { fontSize: 16, marginBottom: 40 }]}>Waiting for creator to start session</Text>
          </View>
        )}
        
        {creatingSession && (
          <View style={[styles.centered]}>
            <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>Session Created!</Text>
            <Text style={[styles.text, { fontSize: 16, marginBottom: 40 }]}>Session Code: {sessionCode}</Text>
            <Text style={[styles.text, { fontSize: 16, marginBottom: 40 }]}>Connected Users: {connectedUsers.length}</Text>
            <RoundedButton title="Start Session" onPress={startSession} color={theme.colors.button} disabled={connectedUsers.length <= 1}/>
          </View>
        )}

        {viewingInstructions && (
          <View style={[styles.centered]}>
          <Text style={[styles.text, { fontSize: 20, marginBottom: 20 }]}>Instructions</Text>
          <Text style={[styles.text, { fontSize: 16, marginBottom: 40, marginHorizontal: 20, textAlign: 'justify'}]}>Troll is a game of 7 rounds.{"\n"}
            At the beginning of each round, a question is shown and you have to make up a fake answer for that question.{"\n"}
            After all users have submitted their answers, you select among all the users' answers and the correct one.{"\n"}
            You get 2 points every time you select the correct answer and 1 point every time your answer is selected.</Text>
          </View>
        )}
      </View>
    );
  } else {
    return (
      
      <View style={styles.container}>
         
         {allSelected && trollModal && trollMessage &&(
          <Modal
          animationType="slide"
          transparent={true}
          visible={trollModal}
          onRequestClose={() => setTrollModal(false)}
        >
          <View style={styles.centered}>
            <View style={[styles.modalContainer, styles.border]}>
              <Text style={styles.text}>{trollMessage}</Text>
              <Button title="Close" onPress={() => setTrollModal(false)} color={theme.colors.button}/>
            </View>
          </View>
        </Modal>
         )}
        
        <Text style={[styles.text, { fontSize: 24, textAlign: 'center' }]}>Round {round}/{ROUNDS}</Text>

        {!viewingResults && (round === prevRound) && !submitted && (
          <View style={{ marginVertical: 20 }}>
            <Text style={[styles.text, { fontSize: 24, textAlign: 'center' }]}>{currentQuestion}</Text>
            <TextInput
              placeholder="Enter your answer"
              value={message}
              onChangeText={setMessage}
              style={[styles.border, { padding: 10, marginBottom: 10 }]}
              editable={!submitted}
            />
            <RoundedButton title="Submit Answer" onPress={submitMessage} disabled={submitted || connectedUsers.length <= 1}/>
          </View>
        )}

        {!viewingResults && (round === prevRound) && submitted && !allSubmitted && (
          <Text style={[styles.text, { fontSize: 24, textAlign: 'center' }]}>Waiting for other users to submit...</Text>
        )}

        {!viewingResults && (round === prevRound) && submitted && allSubmitted && !utility && (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            extraData={selectedMessage}
          />
        )}

        {!viewingResults && (round === prevRound) && allSelected && round < ROUNDS && (
          <Button title="Ready" onPress={setReadyStatus} disabled={!allSelected || ready} color={theme.colors.button}/>
        )}
        
        {!viewingResults && (round === prevRound) && allSelected && round < ROUNDS && sessionCreator && (
          <Button title="Next Round" onPress={nextRound} disabled={!allReady} color={theme.colors.button}/>
        )}

        {!viewingResults && (round === prevRound) && allSelected && round >= ROUNDS && (
          <Button title="View Results" onPress={viewResults} color={theme.colors.button}/>
        )}

        {viewingResults && (
          <View style={{ marginVertical: 20 }}>
            <FlatList
              data={usersDetailed}
              renderItem={renderUser}
              keyExtractor={item => item.id}
            />
            {!sessionCreator && (
              <Button title="Leave Session" onPress={leaveSession} color={theme.colors.button}/>
            )}
            {sessionCreator && (
              <Button title="End Session" onPress={endSession} disabled={connectedUsers.length > 1} color={theme.colors.button}/>
            )}
          </View>
        )}

        {prevRound < round && (
          <View style={{ marginVertical: 20 }}>
            <FlatList
              data={usersDetailed}
              renderItem={renderUser}
              keyExtractor={item => item.id}
            />
            <Text style={[styles.text, { fontSize: 24, textAlign: 'center' }]}>Proceed to next round?</Text>
            <Button title="Proceed" onPress={proceed} color={theme.colors.button}/>
          </View>
        )}

        <TouchableOpacity 
            onPress={sessionCreator ? endSession : leaveSession} 
            style={{ position: 'absolute', top: 20, left: 20 }}
          >
            <Icon name="arrow-left" size={30} color={theme.colors.primary} />
          </TouchableOpacity>
      </View>
    );
  }
  

};

export default App;