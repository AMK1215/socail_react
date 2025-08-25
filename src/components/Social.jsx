import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Main Social component
const Social = () => {
  // --- State Hooks ---
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [callId, setCallId] = useState('');
  const [remoteCallId, setRemoteCallId] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [appId, setAppId] = useState(null);

  // --- Ref Hooks ---
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callDocRef = useRef(null);
  const chatContainerRef = useRef(null);

  // --- Firebase and WebRTC Config ---
  const [app, setApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const servers = {
    iceServers: [
      { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    ],
    iceCandidatePoolSize: 10,
  };

  // --- Utility Functions ---
  const showCustomModal = (title, msg) => {
    setModalTitle(title);
    setModalMessage(msg);
    setShowModal(true);
  };
  
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // --- Firebase Initialization and Auth ---
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const initializedApp = initializeApp(firebaseConfig);
        const initializedAuth = getAuth(initializedApp);
        const initializedDb = getFirestore(initializedApp);
        setApp(initializedApp);
        setAuth(initializedAuth);
        setDb(initializedDb);
        const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        setAppId(canvasAppId);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(initializedAuth, __initial_auth_token);
        } else {
          await signInAnonymously(initializedAuth);
        }
        setLoading(false);
      } catch (error) {
        console.error("Firebase Init Error:", error);
        setIsError(true);
        setMessage("App initialization failed. Check your Firebase configuration.");
        setLoading(false);
      }
    };
    initializeFirebase();
  }, []);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          setUserId(null);
          setIsAuthReady(true);
        }
      });
      return () => unsubscribe();
    }
  }, [auth]);

  // --- Chat and Call Listeners ---
  useEffect(() => {
    if (isAuthReady && db && appId) {
      // Chat Listener
      const chatPath = `/artifacts/${appId}/public/data/chat`;
      const chatCollection = collection(db, chatPath);
      const chatQuery = query(chatCollection, orderBy('timestamp'));
      
      const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(messages);
        scrollToBottom();
      }, (error) => {
        console.error("Firestore Chat Error:", error);
        showCustomModal("Error", "Failed to load messages.");
      });

      // Call Listener (to handle incoming calls)
      const callsPath = `/artifacts/${appId}/public/data/calls`;
      const callsCollection = collection(db, callsPath);
      
      const unsubscribeCalls = onSnapshot(callsCollection, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' && change.doc.data().isEstablished && change.doc.data().answer) {
            // This is a new call, but we don't handle it here to prevent conflicts.
            // The "Join Call" button handles the offer/answer flow.
          }
        });
      }, (error) => {
        console.error("Firestore Call Listener Error:", error);
        showCustomModal("Error", "Failed to listen for calls.");
      });

      return () => {
        unsubscribeChat();
        unsubscribeCalls();
      };
    }
  }, [isAuthReady, db, appId]);

  // --- Messaging Functions ---
  const sendMessage = async (type = 'text', content = '') => {
    if (!userId || !db || !appId) {
      showCustomModal("Error", "Authentication not ready. Please wait.");
      return;
    }
    try {
      const chatPath = `/artifacts/${appId}/public/data/chat`;
      await addDoc(collection(db, chatPath), {
        authorId: userId,
        content: content,
        type: type,
        timestamp: Date.now(),
        // Placeholder for real names
        authorName: userId
      });
      setMessage('');
    } catch (e) {
      console.error("Error sending message:", e);
      showCustomModal("Error", "Failed to send message.");
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      sendMessage('text', message);
    }
  };

  // --- Media Upload Simulation (IMPORTANT) ---
  const handleMediaUpload = (type) => {
    // This is a simulation. A real app would need a backend to upload files to a storage bucket.
    // This code only demonstrates how the Firestore document would be structured.
    const mediaUrl = `https://placehold.co/400x300.png?text=${type}`;
    sendMessage(type, mediaUrl);
    showCustomModal("Media Upload Simulated", `A placeholder ${type} has been sent. In a real app, this would trigger an upload to Firebase Storage.`);
  };

  // --- Video/Audio Call Functions ---
  const createCall = async () => {
    if (!isAuthReady || !db) {
      showCustomModal("Error", "Authentication not ready. Please wait.");
      return;
    }
    setLoading(true);
    setMessage('Starting call...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(servers);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      const callsPath = `/artifacts/${appId}/public/data/calls`;
      const callDoc = doc(collection(db, callsPath));
      callDocRef.current = callDoc;
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');
      setCallId(callDoc.id);

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON());
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      await setDoc(callDoc, { offer: offerDescription.toJSON() });

      setMessage('Call started. Share this ID with your partner.');
      setIsCalling(true);
      setIsCallActive(true);
      setLoading(false);
    } catch (error) {
      console.error("Error creating call:", error);
      showCustomModal("Error", "Failed to create call. Ensure camera/mic permissions are granted.");
      setLoading(false);
    }
  };

  const joinCall = async () => {
    if (!isAuthReady || !db || !remoteCallId) {
      showCustomModal("Error", "Authentication not ready or invalid ID.");
      return;
    }
    setLoading(true);
    setMessage('Joining call...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(servers);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      const callsPath = `/artifacts/${appId}/public/data/calls`;
      const callDoc = doc(db, callsPath, remoteCallId);
      callDocRef.current = callDoc;
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      const callSnapshot = await getDoc(callDoc);
      const offerDescription = callSnapshot.data().offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);
      await setDoc(callDoc, { answer: answerDescription.toJSON(), isEstablished: true }, { merge: true });

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        });
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON());
      };

      setMessage('Call joined. Connection established.');
      setIsReceivingCall(true);
      setIsCallActive(true);
      setLoading(false);
    } catch (error) {
      console.error("Error joining call:", error);
      showCustomModal("Error", "Failed to join call. Check the ID or try again.");
      setLoading(false);
    }
  };

  const hangUp = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setCallId('');
    setRemoteCallId('');
    setIsCalling(false);
    setIsReceivingCall(false);
    setIsCallActive(false);
    
    showCustomModal("Call Ended", "The call has been disconnected.");
  };

  // --- JSX for the Custom Modal ---
  const Modal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center">
        <h3 className="text-xl font-bold mb-4">{modalTitle}</h3>
        <p className="text-gray-700">{modalMessage}</p>
        <button
          onClick={() => setShowModal(false)}
          className="mt-6 px-4 py-2 bg-pink-500 text-white rounded-lg shadow-md hover:bg-pink-600 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  // --- Render ---
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-inter text-gray-800">
      {showModal && <Modal />}

      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-pink-600 drop-shadow-md">
          Our All-in-One App
        </h1>
        <p className="mt-2 text-lg sm:text-xl text-gray-600">
          Chat, call, and share with your lover.
        </p>
      </header>
      
      {/* Main App Container */}
      <main className="w-full max-w-6xl bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-4">

        {/* Chat Panel */}
        <div className="lg:w-1/2 flex flex-col h-[70vh] lg:h-[80vh] bg-gray-50 rounded-xl p-4 shadow-inner">
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-2 space-y-4">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg, index) => (
                <div key={index} className={`flex items-start ${msg.authorId === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-[80%] break-words ${msg.authorId === userId ? 'bg-pink-300 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.type === 'text' && <p>{msg.content}</p>}
                    {(msg.type === 'photo' || msg.type === 'video') && (
                      <img src={msg.content} alt="Shared content" className="w-full h-auto rounded-lg" />
                    )}
                    {msg.type === 'audio' && (
                      <p>Audio Note: {msg.content}</p>
                    )}
                    <span className={`block text-xs mt-1 ${msg.authorId === userId ? 'text-white' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 italic mt-8">Start a conversation!</div>
            )}
          </div>

          <form onSubmit={handleMessageSubmit} className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a loving message..."
              className="flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors duration-200"
            />
            <button type="submit" className="p-3 bg-pink-500 text-white rounded-xl shadow-md hover:bg-pink-600 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 01.087 1.254l5.373 5.373A1.25 1.25 0 0010.5 8.25h.25a1.25 1.25 0 011.25 1.25v.25a1.25 1.25 0 00.904 1.216l4.478.932A2.25 2.25 0 0121.75 14.5l-2.432 4.142a1.25 1.25 0 01-1.803.355l-2.813-2.813a1.25 1.25 0 00-1.25-.333l-.25.042a1.25 1.25 0 01-1.077-.424L6.96 6.84a.75.75 0 01.087-1.254l14.25-8.527z" /></svg>
            </button>
            <div className="relative">
              <input type="file" onChange={(e) => handleMediaUpload('photo')} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer p-3 bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-1.94l-2.69-2.69a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
              </label>
            </div>
            <div className="relative">
              <input type="file" onChange={(e) => handleMediaUpload('video')} className="hidden" id="video-upload" />
              <label htmlFor="video-upload" className="cursor-pointer p-3 bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M16.5 6v.75m-4.5-2.5h-2.25a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25h-2.25z" /><path fillRule="evenodd" d="M12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9z" clipRule="evenodd" /></svg>
              </label>
            </div>
            <div className="relative">
              <button type="button" onClick={() => handleMediaUpload('audio')} className="p-3 bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-600 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8.25 4.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.231l-3 1.011V4.5zm5.75-.75h1.5a.75.75 0 01.75.75v.231l-3 1.011V4.5a.75.75 0 01.75-.75z" /><path fillRule="evenodd" d="M12 18a6 6 0 100-12 6 6 0 000 12zm3.375-7.875a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V15a.75.75 0 001.5 0V11.25h.75a.75.75 0 00.75-.75z" clipRule="evenodd" /><path d="M20.25 4.5a.75.75 0 00-1.5 0V7.25h-.25a.75.75 0 00-.75.75v1.5a.75.75 0 00.75.75h.25v2.25a.75.75 0 001.5 0V4.5zM3.75 4.5a.75.75 0 011.5 0V7.25h.25a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-.25v2.25a.75.75 0 01-1.5 0V4.5z" /></svg>
              </button>
            </div>
          </form>
        </div>

        {/* Video Call Panel */}
        <div className="lg:w-1/2 flex flex-col bg-gray-50 rounded-xl p-4 shadow-inner">
          <div className="flex-grow flex flex-col items-center justify-center relative">
            <div className="w-full aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-lg border border-gray-300">
              <video ref={remoteVideoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline></video>
              <video ref={localVideoRef} className="absolute bottom-4 right-4 w-1/4 h-auto aspect-video rounded-lg border-2 border-white shadow-lg z-10" autoPlay muted playsInline></video>
            </div>
          </div>
          
          <div className="mt-4 w-full">
            {!isCallActive ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={createCall}
                  disabled={loading || isCalling}
                  className={`flex-grow p-4 text-white rounded-xl shadow-md transition-colors duration-200 ${loading || isCalling ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
                >
                  {loading ? 'Starting...' : 'Start a New Call'}
                </button>
                <div className="flex-grow flex gap-2">
                  <input
                    type="text"
                    value={remoteCallId}
                    onChange={(e) => setRemoteCallId(e.target.value)}
                    placeholder="Enter Call ID"
                    className="flex-grow p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors duration-200"
                  />
                  <button
                    onClick={joinCall}
                    disabled={loading || isReceivingCall || !remoteCallId}
                    className={`p-4 text-white rounded-xl shadow-md transition-colors duration-200 ${loading || isReceivingCall || !remoteCallId ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                  >
                    Join
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={hangUp}
                  className="p-4 bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200"
                >
                  End Call
                </button>
              </div>
            )}
            <div className="mt-4 text-center text-sm">
              {message && <p className="text-gray-700">{message}</p>}
              {callId && (
                <p className="mt-2 text-pink-600 break-words">
                  Your Call ID: <span className="font-semibold">{callId}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Built for a perfect connection.</p>
      </footer>
    </div>
  );
};

export default Socail;
