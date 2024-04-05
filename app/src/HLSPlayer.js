import React from 'react';

import Hls from 'hls.js';
import { v4 as uuidv4 } from 'uuid';

export default class HlsVideoPlayer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      id: uuidv4()
    }

    this.hlsInstance = null;
    this.manifestParsed = false;
    this.retryTimer = null;
    this.retryDelay = 5000;
    this.video = document.createElement('video');
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.url !== this.props.url
      || nextProps.retry !== this.props.retry;
  }

  componentDidMount() {
    this.configureHLS();
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.hlsInstance?.stopLoad();
    this.hlsInstance?.destroy();
    this.video?.remove();
  }

  configureHLS() {
    console.debug('[HLSPLAYER] Configuring HLS')
    this.hlsInstance = new Hls(
      {
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = true;
        },
        liveMaxLatencyDuration: 5,
        liveSyncDuration: 1,
      }
    );

    this.hlsInstance.loadSource(this.props.url);
    this.hlsInstance.attachMedia(this.video);

    const container = document.getElementById(this.state.id);
    container.appendChild(this.video);

    this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, async () => {
      console.debug('[HLSPLAYER] Loaded manifest!')
      try {
        this.video.muted = true;
        await this.video.play();
        console.debug('[HLSPLAYER] Automatic playback started!');
      } catch (error) {
        console.warn('[HLSPLAYER] Playback failed!', error);
        this.props.onError(error);
      }
    });

    this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      // only report/handle errors if they are fatal
      // hlsjs should automatically handle non fatal errors
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // playlist file 404'd (probably)
            // try to recover by start/restart playlist/fragment loading
            // this is only effective if MANIFEST_PARSED event has been triggered and video element has been attached to hls object.
            // if the manifest has not been loaded, then destroy reconfigure the hls instance until a manifest is parsed.
            clearTimeout(this.retryTimer);
            if (!this.manifestParsed) {
              console.debug('[HLSPLAYER] Restart on manifest not found');
              this.retryTimer = setTimeout(() => {
                this.hlsInstance?.stopLoad();
                this.hlsInstance?.destroy();
                delete this.hlsInstance;
                this.configureHLS();
              }, this.retryDelay);
            } else {
              console.debug('[HLSPLAYER] Restart on network error')
              this.retryTimer = setTimeout(() => this.hlsInstance?.startLoad(), this.retryDelay);
            }

            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.debug('[HLSPLAYER] Fatal media error encountered, try to recover');
            this.hlsInstance.recoverMediaError();
            break;
          default:
            // cannot recover
            console.error('[HLSPLAYER] Cannot recover!');
            break;
        }
      }

    });
  }

  render() {
    return (
      <div id={this.state.id} style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        touchAction: 'none',
        justifyContent: 'center',
      }}>
      </div>
    )
  }
};