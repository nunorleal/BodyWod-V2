function speak(text, force = false, after = null) {
 clearTimeout(speechTimer);
 if ((!state.isVoiceEnabled && !force) || !('speechSynthesis' in window)) {after?.();return;}
 try {
  if (!guideVoice) loadGuideVoice();
  if (!guideVoice) {after?.();return;}
  const synth=window.speechSynthesis;
  speak.current?.finish();synth.cancel();synth.resume?.();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='pt-PT';utterance.voice=guideVoice;utterance.rate=1.05;utterance.pitch=1;
  let done=false,started=false,timer,poll;
  const finish=()=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);if(speak.current?.utterance===utterance)speak.current=null;after?.()};
  speak.current={utterance,finish};
  const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>{if(done)return;synth.cancel();finish()},ms)};
  utterance.onend=finish;utterance.onerror=finish;
  utterance.onstart=()=>{if(done)return;started=true;arm(Math.max(1800,Math.min(10000,text.split(/\s+/).length*550+1000)))};
  poll=setInterval(()=>{if(started&&synth.speaking===false&&synth.pending===false)finish()},100);
  arm(1200);synth.speak(utterance);
 } catch(e) {speak.current?.finish();console.log('Síntese de voz indisponível',e);after?.();}
}
