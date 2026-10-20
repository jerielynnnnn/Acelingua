/** Capture a local playback clip; release the microphone on finish, cancel or error. */
export function startVoiceRecording(stream: MediaStream, callbacks: {
  onReady: (clip: Blob) => void; onError: () => void;
}, Recorder: typeof MediaRecorder = MediaRecorder) {
  let discard = false; let finished = false; const chunks: Blob[] = [];
  const release = () => stream.getTracks().forEach(track => track.stop());
  let recorder: MediaRecorder;
  try { recorder = new Recorder(stream); }
  catch { release(); throw new Error("Your browser could not create a microphone recording."); }
  const timer = setTimeout(() => stop(false), 30000);
  recorder.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data); };
  recorder.onstop = () => {
    clearTimeout(timer); release();
    if (!discard) {
      const clip = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || "audio/webm" });
      if (clip.size > 0) callbacks.onReady(clip); else callbacks.onError();
    }
    chunks.length = 0;
  };
  recorder.onerror = () => { if (!discard) callbacks.onError(); discard = true; stop(true); };
  function stop(cancel: boolean) {
    discard ||= cancel;
    if (finished) return;
    finished = true; clearTimeout(timer);
    try { if (recorder.state !== "inactive") recorder.stop(); }
    catch { if (!discard) callbacks.onError(); discard = true; }
    finally { release(); }
  }
  try { recorder.start(); } catch { clearTimeout(timer); release(); throw new Error("Microphone recording could not start."); }
  return { finish: () => stop(false), cancel: () => stop(true) };
}
