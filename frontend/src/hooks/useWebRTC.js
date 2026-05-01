import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export function useWebRTC() {
  const [peerId, setPeerId] = useState('');
  const [remoteName, setRemoteName] = useState('Remote peer');
  const [isConnected, setIsConnected] = useState(false);
  const [faceStream, setFaceStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const initPeer = async () => {
      let iceServers = [{urls:'stun:stun.l.google.com:19302'}];
      try {
        const res = await fetch('/api/ice-config');
        const data = await res.json();
        if (data.iceServers) iceServers = data.iceServers;
      } catch(e) { console.warn('ICE fetch failed', e); }

      // We use localhost during dev, otherwise window location
      const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
      const port = window.location.hostname === 'localhost' ? 3000 : (window.location.port || (window.location.protocol === 'https:' ? 443 : 80));
      
      const peer = new Peer(undefined, {
        host: host,
        port: port,
        path: '/peerjs',
        secure: window.location.protocol === 'https:',
        config: { iceServers }
      });

      peer.on('open', id => setPeerId(id));
      peer.on('connection', conn => {
        conn.on('data', d => { if(d.name) setRemoteName(d.name); });
      });
      
      // Store peer reference
      peerRef.current = peer;
    };
    initPeer();
    
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  // Handle incoming calls
  useEffect(() => {
    if (!peerRef.current || !faceStream) return;
    
    const peer = peerRef.current;
    
    const onCall = (call) => {
      call.answer(faceStream);
      handleCall(call);
    };
    
    peer.on('call', onCall);
    return () => { peer.off('call', onCall); };
  }, [faceStream]);

  const handleCall = (call) => {
    callRef.current = call;
    call.on('stream', rs => {
      setRemoteStream(rs);      // store stream in state
      setIsConnected(true);     // trigger re-render — useEffect in CallView will attach
    });
    call.on('close', () => { setIsConnected(false); setRemoteStream(null); });
    call.on('error', () => { setIsConnected(false); setRemoteStream(null); });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setFaceStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch(e) {
      console.error('Camera error', e);
    }
  };

  const joinCall = (joinId, userName) => {
    if (!peerRef.current || !faceStream) return;
    const call = peerRef.current.call(joinId, faceStream);
    handleCall(call);
    const conn = peerRef.current.connect(joinId);
    conn.on('open', () => conn.send({name: userName}));
  };

  const endCall = () => {
    // Close the peer-to-peer call
    if (callRef.current) callRef.current.close();
    // Stop ALL camera & microphone tracks — turns off the camera light
    if (faceStream) {
      faceStream.getTracks().forEach(track => track.stop());
    }
    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setFaceStream(null);
    setIsConnected(false);
  };

  return { peerId, remoteName, isConnected, startCamera, joinCall, endCall, remoteVideoRef, localVideoRef, faceStream, remoteStream };
}
