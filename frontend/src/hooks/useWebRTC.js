import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export function useWebRTC(onRemoteEnd, localName) {
  const [peerId, setPeerId] = useState('');
  const [remoteName, setRemoteName] = useState('Remote peer');
  const [isConnected, setIsConnected] = useState(false);
  const [faceStream, setFaceStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerTranscripts, setPeerTranscripts] = useState([]);
  const [recordConsentReq, setRecordConsentReq] = useState(false);
  const [recordAllowed, setRecordAllowed] = useState(false);
  
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const connRef = useRef(null); // Keep track of data connection
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const onRemoteEndRef = useRef(onRemoteEnd);
  const localNameRef = useRef(localName);

  useEffect(() => {
    onRemoteEndRef.current = onRemoteEnd;
    localNameRef.current = localName;
  }, [onRemoteEnd, localName]);

  useEffect(() => {
    if (peerRef.current && !peerRef.current.destroyed) return; // Already initialized

    const initPeer = async () => {
      console.log('[WebRTC] Initializing Peer...');
      let iceServers = [{urls:['stun:stun.l.google.com:19302']}];
      try {
        const res = await fetch('/api/ice-config');
        const data = await res.json();
        if (data.iceServers) iceServers = data.iceServers;
      } catch(e) { console.warn('ICE fetch failed', e); }

      const isProd = window.location.hostname.includes('render.com') || window.location.hostname.includes('vercel.app');
      const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
      const port = window.location.hostname === 'localhost' ? 3000 : (window.location.port || (window.location.protocol === 'https:' ? 443 : 80));

      // Use PeerJS public cloud in production for flawless global NAT traversal (free STUN/TURN relays)
      const peerOpts = isProd ? {
        // Passing undefined config lets PeerJS inject its own reliable cloud TURN servers
      } : {
        host: host,
        port: port,
        path: '/peerjs',
        secure: window.location.protocol === 'https:',
        config: { iceServers }
      };

      const peer = new Peer(undefined, peerOpts);

      peer.on('open', id => {
        console.log('[WebRTC] Peer opened with ID:', id);
        setPeerId(id);
      });
      const handleData = (d) => {
        if(d.name) setRemoteName(d.name); 
        if(d.type === 'END_SESSION') {
          console.log('[WebRTC] Remote peer ended session');
          if (onRemoteEndRef.current) onRemoteEndRef.current();
        }
        if(d.type === 'transcript') setPeerTranscripts(prev => [...prev, d]);
        if(d.type === 'record_request') setRecordConsentReq(true);
        if(d.type === 'record_allow') setRecordAllowed(true);
      };

      peer.on('connection', conn => {
        connRef.current = conn;
        conn.on('data', handleData);
        conn.on('open', () => {
          if (localNameRef.current) {
            conn.send({ name: localNameRef.current });
          }
        });
      });
      
      peerRef.current = peer;
    };
    initPeer();
    
    return () => {
      // Don't destroy on every minor re-render, only on unmount
      // if (peerRef.current) peerRef.current.destroy();
    };
  }, [onRemoteEnd]);

  // Handle incoming calls
  useEffect(() => {
    if (!peerRef.current || !faceStream) return;
    
    const peer = peerRef.current;
    console.log('[WebRTC] Registering incoming call listener for Peer:', peer.id);
    
    const onCall = (call) => {
      console.log('[WebRTC] Incoming call from:', call.peer);
      call.answer(faceStream);
      handleCall(call);
    };
    
    peer.on('call', onCall);
    return () => { 
      console.log('[WebRTC] Removing incoming call listener');
      peer.off('call', onCall); 
    };
  }, [faceStream, peerId]);

  const handleCall = (call) => {
    callRef.current = call;

    const pc = call.peerConnection;
    if (pc) {
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE State: ${pc.iceConnectionState}`);
      };
    }

    call.on('stream', rs => {
      console.log('[WebRTC] Received remote stream');
      setRemoteStream(rs);
      setIsConnected(true);
    });
    call.on('close', () => { setIsConnected(false); setRemoteStream(null); });
    call.on('error', (err) => { 
      console.error('[WebRTC] Call error:', err);
      setIsConnected(false); 
      setRemoteStream(null); 
    });
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
    connRef.current = conn;
    conn.on('open', () => conn.send({ name: userName }));
    
    const handleData = (d) => {
      if(d.name) setRemoteName(d.name); 
      if(d.type === 'END_SESSION') {
        console.log('[WebRTC] Remote peer ended session');
        if (onRemoteEndRef.current) onRemoteEndRef.current();
      }
      if(d.type === 'transcript') setPeerTranscripts(prev => [...prev, d]);
      if(d.type === 'record_request') setRecordConsentReq(true);
      if(d.type === 'record_allow') setRecordAllowed(true);
    };
    conn.on('data', handleData);
  };

  const sendData = (dataObj) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(dataObj);
    }
  };

  const endCall = () => {
    // Send signal to remote peer first
    if (connRef.current && connRef.current.open) {
      console.log('[WebRTC] Signaling remote peer to end session');
      connRef.current.send({ type: 'END_SESSION' });
    }

    if (callRef.current) callRef.current.close();
    if (faceStream) {
      faceStream.getTracks().forEach(track => track.stop());
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setFaceStream(null);
    setIsConnected(false);
  };

  return { peerId, remoteName, isConnected, startCamera, joinCall, endCall, remoteVideoRef, localVideoRef, faceStream, remoteStream, sendData, peerTranscripts, recordConsentReq, setRecordConsentReq, recordAllowed };
}
